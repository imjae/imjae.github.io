import test from 'node:test';
import assert from 'node:assert/strict';
import { OwnerPosts, parsePost, composePost, renderPostBody } from '../server/owner-posts.mjs';
import { handleAuthorRequest } from '../server/author-auth.mjs';
import { migrationLink } from '../server/owner-post-api.mjs';

class Storage {
  data = new Map(); queue = Promise.resolve();
  async get(key) { return structuredClone(this.data.get(key)); }
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) { this.data.delete(key); }
  async list({ prefix = '' } = {}) { return new Map([...this.data].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key, structuredClone(value)])); }
  transaction(fn) { const result = this.queue.then(fn); this.queue = result.catch(() => {}); return result; }
}
const fields = (slug = 'private-test') => ({ title: '비공개 시험 제목', description: '나만 보는 기록', slug, date: '2026-10-29', topic: 'notes', tags: ['비공개'], body: '## 본문\n\nOWNER_ONLY_SENTINEL\n\n| 항목 | 내용 |\n| --- | --- |\n| 하나 | 둘 |' });
const source = slug => composePost(fields(slug));
function fixture() {
  const storage = new Storage(), object = new OwnerPosts({ storage });
  let publicManaged = [], localManaged = [], redirectReady = false, assetCalls = 0;
  const env = {
    GITHUB_CLIENT_ID: 'fixture-client', GITHUB_CLIENT_SECRET: 'fixture-secret', ALLOWED_GITHUB_ID: '37284282',
    AUTHOR_SESSIONS: { idFromName: name => name, get: () => ({ fetch: async (_url, init) => {
      const { key } = JSON.parse(init.body);
      return Response.json(key === 'session:' + 'a'.repeat(43) ? { id: '37284282', expiresAt: Date.now() + 100000 } : key === 'session:' + 'b'.repeat(43) ? { id: '123', expiresAt: Date.now() + 100000 } : null);
    } }) },
    OWNER_POSTS: { idFromName: name => name, get: () => ({ fetch: request => object.fetch(request) }) },
    ASSETS: { fetch: async request => { assetCalls++; return new URL(request.url).pathname === '/publish-manifest.json' ? Response.json({ revision: 'c'.repeat(40), managedPosts: localManaged, articles: { 'content/articles/notes/existing.md': { url: '/writing/existing/', title: '기존 글' } } }) : new Response('protected assets'); } },
  };
  const fetcher = async address => address.endsWith('/publish-manifest.json') ? Response.json({ managedPosts: publicManaged }) : address.includes('/writing/') ? new Response(redirectReady ? '<meta http-equiv="refresh" content="0;url=https://author.test/notes/existing/">' : 'old public body') : address.includes('/main/') ? new Response(null, { status: 404 }) : new Response(source('existing'));
  const call = (path, { body, owner = true, method = body === undefined ? 'GET' : 'POST', origin = 'https://author.test', headers = {} } = {}) => handleAuthorRequest(new Request('https://author.test' + path, { method, headers: { ...(owner ? { Cookie: '__Host-imjae_author=' + (owner === 'other' ? 'b' : 'a').repeat(43) } : {}), Origin: origin, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) }), env, { fetcher });
  const create = async (slug = 'private-test') => { const response = await call('/api/notes/' + slug, { body: { action: 'save', version: 0, fields: fields(slug) } }); assert.equal(response.status, 201); return response.json(); };
  return { call, create, storage, env, assetCalls: () => assetCalls, migrate: (publicSlugs, localSlugs, ready = true) => { publicManaged = publicSlugs; localManaged = localSlugs; redirectReady = ready; } };
}

test('새 글은 원문의 draft 값이나 요청 visibility와 무관하게 비공개로 시작한다', async () => {
  const f = fixture();
  const response = await f.call('/api/notes/private-test', { body: { action: 'save', version: 0, source: source().replace('draft: true', 'draft: false'), visibility: 'public' } });
  assert.equal(response.status, 201); assert.equal((await response.json()).visibility, 'private');
  const list = await f.call('/api/notes/public', { owner: false });
  assert.deepEqual((await list.json()).posts, []);
  assert.match(list.headers.get('Cache-Control'), /no-store/);
});

test('로그인 없음·다른 계정·직접 API·HEAD·직접 글 주소에서 비공개 제목과 본문을 내보내지 않는다', async () => {
  const f = fixture(); await f.create();
  for (const owner of [false, 'other']) for (const path of ['/api/notes', '/api/notes/private-test', '/notes/private-test/', '/notes/edit/']) {
    const response = await f.call(path, { owner });
    assert.equal(response.status, 401, path); assert.match(response.headers.get('Cache-Control'), /no-store/);
    assert.doesNotMatch(await response.text(), /OWNER_ONLY_SENTINEL|비공개 시험 제목/);
  }
  assert.equal((await f.call('/notes/private-test/', { owner: false, method: 'HEAD' })).status, 401);
  const html = await f.call('/notes/private-test/', { owner: false, headers: { Accept: 'text/html' } });
  assert.equal(html.status, 303); assert.match(html.headers.get('Location'), /^\/auth\/login/);
  const ownerView = await f.call('/notes/private-test/');
  assert.match(await ownerView.text(), /OWNER_ONLY_SENTINEL/);
  assert.match(ownerView.headers.get('Cache-Control'), /private, no-store/);
  assert.equal(f.assetCalls(), 2, '새 글 충돌과 인증된 글의 표시 도구만 정적 자산을 읽는다');
});

test('공개 토글은 원자적으로 목록·검색·본문을 열고 비공개 전환 즉시 차단한다', async () => {
  const f = fixture(), post = await f.create();
  const published = await (await f.call('/api/notes/private-test', { body: { action: 'visibility', version: post.version, visibility: 'public' } })).json();
  assert.equal(published.visibility, 'public');
  assert.match(await (await f.call('/notes/private-test/', { owner: false })).text(), /OWNER_ONLY_SENTINEL/);
  const result = await f.call('/api/notes/public?q=OWNER_ONLY_SENTINEL&topic=notes', { owner: false, origin: 'https://imjae.github.io' });
  const publicBody = await result.json(); assert.equal(publicBody.posts.length, 1); assert.equal(publicBody.posts[0].body, undefined); assert.equal(publicBody.posts[0].source, undefined);
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), 'https://imjae.github.io');
  assert.equal((await (await f.call('/api/notes/public?q=없는검색어', { owner: false })).json()).posts.length, 0);
  assert.equal((await f.call('/api/notes/public', { owner: false, origin: 'https://attacker.example' })).headers.get('Access-Control-Allow-Origin'), null);
  const hidden = await f.call('/api/notes/private-test', { body: { action: 'visibility', version: published.version, visibility: 'private' } }); assert.equal(hidden.status, 200);
  assert.equal((await f.call('/notes/private-test/', { owner: false })).status, 401);
  assert.deepEqual((await (await f.call('/api/notes/public', { owner: false })).json()).posts, []);
});

test('cross-origin 저장·공개 변경·삭제는 소유자 세션으로도 거부한다', async () => {
  const f = fixture(), post = await f.create();
  for (const origin of ['https://attacker.example', 'null', '']) for (const action of ['save', 'visibility', 'delete']) {
    assert.equal((await f.call('/api/notes/private-test', { origin, body: { action, version: post.version, source: source(), visibility: 'public' } })).status, 403);
  }
  assert.equal((await (await f.call('/api/notes/private-test')).json()).version, 1);
});

test('동시 저장과 오래된 탭의 공개 토글이 최신 글을 덮어쓰지 않는다', async () => {
  const f = fixture(); await f.create();
  const responses = await Promise.all([1, 2].map(n => f.call('/api/notes/private-test', { body: { action: 'save', version: 1, fields: { ...fields(), body: 'new-' + n } } })));
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.equal((await f.call('/api/notes/private-test', { body: { action: 'visibility', version: 1, visibility: 'public' } })).status, 409);
  assert.equal((await (await f.call('/api/notes/private-test')).json()).visibility, 'private');
});

test('저장 오류와 잘못된 입력에서는 공개 상태를 만들지 않는다', async () => {
  const f = fixture();
  for (const changed of [{ slug: '../bad' }, { slug: 'edit' }, { date: '2026-02-30' }, { title: '' }, { topic: 'anything' }, { tags: [42] }, { body: '' }]) {
    assert.throws(() => parsePost(composePost({ ...fields(), ...changed })));
  }
  assert.throws(() => parsePost('---\ntitle: one\ntitle: two\n---\nbody'));
  assert.throws(() => parsePost(source() + '가'.repeat(200000)));
  f.storage.put = async () => { throw new Error('storage failed'); };
  const result = await f.call('/api/notes/private-test', { body: { action: 'save', version: 0, fields: fields() } });
  assert.equal(result.status, 503); assert.equal(f.storage.data.size, 0);
});

test('Markdown HTML·스크립트·javascript URL·DOM 이름 주입을 제거하고 표·코드·링크를 렌더링한다', async () => {
  const html = await renderPostBody('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29)\n\n[ok](https://example.com)\n\n## 제목\n\n| A | B |\n|---|---|\n|1|2|\n\n```js\n<script>alert(2)</script>\n```');
  assert.doesNotMatch(html, /<script|onerror=|href="javascript:/); assert.match(html, /<table>/); assert.match(html, /href="https:\/\/example.com"/); assert.match(html, /(?:&lt;|&#x3C;)script/);
});

test('기존 글 이전은 양쪽 manifest와 실제 이전 주소를 확인하기 전 비공개 완료로 표시하지 않는다', async () => {
  const f = fixture();
  const imported = await f.call('/api/notes/import', { body: { path: 'content/articles/notes/existing.md' } });
  assert.equal(imported.status, 200); const result = await imported.json(); assert.equal(result.post.migration.pending, true);
  const url = new URL(result.url); assert.equal(url.searchParams.get('filename'), 'content/managed-posts/existing.json');
  assert.doesNotMatch(url.href, /OWNER_ONLY_SENTINEL/);
  assert.equal((await f.call('/api/notes/existing', { body: { action: 'visibility', version: 1, visibility: 'public' } })).status, 409);
  for (const [remote, local, ready] of [[[], [], false], [['existing'], [], true], [[], ['existing'], true], [['existing'], ['existing'], false]]) {
    f.migrate(remote, local, ready); const state = await (await f.call('/api/notes/migration', { body: { slug: 'existing' } })).json(); assert.equal(state.migration.pending, true);
  }
  f.migrate(['existing'], ['existing']); const complete = await (await f.call('/api/notes/migration', { body: { slug: 'existing' } })).json();
  assert.equal(complete.migration.pending, false); assert.equal(complete.visibility, 'private');
});

test('기존 글 주소 충돌과 임의 외부 원문 가져오기를 차단한다', async () => {
  const f = fixture();
  assert.equal((await f.call('/api/notes/existing', { body: { action: 'save', version: 0, fields: fields('existing') } })).status, 409);
  for (const path of ['https://attacker.example/', 'content/articles/notes/../../secret.md', 'content/articles/notes/not-in-manifest.md']) assert.equal((await f.call('/api/notes/import', { body: { path } })).status, 400);
  const link = new URL(migrationLink('existing')); assert.deepEqual(JSON.parse(link.searchParams.get('value')), { version: 1, slug: 'existing' });
});

test('저장소 재시작에도 글이 보존되고 버전이 일치하는 삭제만 허용된다', async () => {
  const f = fixture(), post = await f.create();
  const reloaded = new OwnerPosts({ storage: f.storage });
  const response = await reloaded.fetch(new Request('https://internal/', { method: 'POST', body: JSON.stringify({ operation: 'get', slug: post.slug }) }));
  assert.match((await response.json()).body, /OWNER_ONLY_SENTINEL/);
  assert.equal((await f.call('/api/notes/private-test', { body: { action: 'delete', version: 0 } })).status, 409);
  assert.equal((await f.call('/api/notes/private-test', { body: { action: 'delete', version: 1 } })).status, 200);
  assert.equal((await f.call('/api/notes/private-test')).status, 404);
});

test('기존 수식·Mermaid·공개 자산 경로를 유지하고 임의 iframe은 제외한다', async () => {
  const html = await renderPostBody('$$x^2 + y^2$$\n\n```mermaid\ngraph TD\nA --> B\n```\n\n![예시](/media/example.png)\n\n[이전 글](/writing/existing/)\n\n<iframe src="https://attacker.example/" srcdoc="bad"></iframe><iframe src="https://www.youtube-nocookie.com/embed/abcdefghijk" title="동영상"></iframe>');
  assert.match(html, /class="katex/); assert.match(html, /language-mermaid/);
  assert.match(html, /https:\/\/imjae.github.io\/media\/example.png/); assert.match(html, /https:\/\/imjae.github.io\/writing\/existing\//);
  assert.doesNotMatch(html, /attacker.example|srcdoc/); assert.match(html, /youtube-nocookie.com\/embed\/abcdefghijk/);
});
