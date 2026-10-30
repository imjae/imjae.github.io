import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { gamePlansFixture } from './helpers/game-plans-fixture.mjs';
const base = '/api/project-documents/dcb/plans/items';
const record = (extra = {}) => ({ title: '공격 규칙', folder: '게임플레이/전투', body: '## 판정\n\nPRIVATE_DOCUMENT', version: 0, ...extra });

test('Worker 번들 후에도 기획서와 리소스 화면을 초기화하고 세션 만료 시 숨긴다', async () => {
  const { build } = createRequire(import.meta.resolve('wrangler'))('esbuild');
  const bundle = await build({ entryPoints: [fileURLToPath(new URL('../server/game-plan-ui.mjs', import.meta.url))], bundle: true, keepNames: true, write: false, format: 'cjs', platform: 'node' });
  const bundledModule = { exports: {} };
  runInNewContext(bundle.outputFiles[0].text, { module: bundledModule, exports: bundledModule.exports, require: createRequire(import.meta.url), crypto, Response, URL, TextEncoder, TextDecoder }, { timeout: 1000 });
  const { gamePlanPage } = bundledModule.exports;
  for (const section of ['plans', 'resources']) {
    const html = await (await gamePlanPage({ id: 'dcb', title: 'DCB' }, { id: 'main', title: '', folder: '', body: '', imageUrl: '', caption: '' }, false, { id: section, title: section }, [])).text();
    const script = html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(script);
    const events = {}, body = { style: { visibility: 'hidden' } }; let valid = true, redirected = '';
    const document = { body, hidden: false, getElementById: () => null, addEventListener: (name, callback) => { events[name] = callback; } };
    runInNewContext(script, { document, window: { addEventListener: (name, callback) => { events[name] = callback; } }, location: { pathname: `/projects/dcb/${section}/`, search: '?doc=main', replace: url => { redirected = url; } }, fetch: async () => ({ ok: valid }), setInterval: () => {} }, { timeout: 1000 });
    events.pageshow(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(body.style.visibility, 'visible');
    events.pagehide(); assert.equal(body.style.visibility, 'hidden');
    valid = false; events.pageshow(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(body.style.visibility, 'hidden');
    assert.equal(redirected, '/auth/login?return_to=' + encodeURIComponent(`/projects/dcb/${section}/?doc=main`));
  }
});

test('기존 기획은 main 문서로 읽고 양쪽 API 수정과 버전 충돌을 동일하게 보존한다', async () => {
  const f = gamePlansFixture();
  await f.call('/api/game-plans/dcb', { body: { body: '원래 본문', version: 0 } });
  const before = structuredClone([...f.stores.get('game-plans').data]);
  const list = await (await f.call(base)).json();
  assert.deepEqual(list.documents.map(item => item.id), ['main']);
  assert.equal(list.documents[0].body, undefined);
  assert.deepEqual([...f.stores.get('game-plans').data], before);
  assert.equal((await (await f.call(base + '/main')).json()).body, '원래 본문');
  assert.equal((await f.call(base + '/main', { body: record({ body: '새 본문', version: 1 }) })).status, 200);
  assert.equal((await (await f.call('/api/game-plans/dcb')).json()).body, '새 본문');
  assert.equal((await f.call('/api/game-plans/dcb', { body: { body: 'stale', version: 1 } })).status, 409);
  await f.call('/api/game-plans/dcb', { body: { body: '호환 API 수정', version: 2 } });
  const main = await (await f.call(base + '/main')).json();
  assert.equal(main.title, '공격 규칙'); assert.equal(main.folder, '게임플레이/전투'); assert.equal(main.version, 3);
  assert.equal(f.stores.get('game-plans').data.size, 1);
});

test('여러 기획서를 폴더별로 저장하고 선택한 본문과 Edit 대상을 유지한다', async () => {
  const f = gamePlansFixture();
  assert.deepEqual(await (await f.call(base)).json(), { documents: [] });
  assert.equal(f.stores.get('game-plans').data.size, 0);
  for (const [id, title, folder] of [['attack', '공격 규칙', '게임플레이/전투'], ['move', '기본 이동', '게임플레이/이동'], ['hud', '화면 구성', '화면/UI']]) {
    assert.equal((await f.call(base + '/' + id, { body: record({ title, folder, body: 'BODY_' + id }) })).status, 201);
  }
  const html = await (await f.call('/projects/dcb/plans/?doc=move')).text();
  assert.match(html, /BODY_move/); assert.doesNotMatch(html, /BODY_attack|BODY_hud/);
  assert.match(html, /class="folder" open><summary>게임플레이/);
  assert.match(html, /href="\/projects\/dcb\/plans\/\?doc=move&amp;edit=1"/);
  assert.match(html, /data-document-search="기본 이동 게임플레이\/이동"/);
  const editor = await (await f.call('/projects/dcb/plans/?doc=move&edit=1')).text();
  assert.match(editor, /data-endpoint="\/api\/project-documents\/dcb\/plans\/items\/move"/);
  assert.match(editor, /name="body"[^>]*>BODY_move/);
  const concurrency = await Promise.all(['one', 'two'].map(body => f.call(base + '/move', { body: record({ body, version: 1 }) })));
  assert.deepEqual(concurrency.map(r => r.status).sort(), [200, 409]);
  assert.equal((await (await f.call(base + '/attack')).json()).body, 'BODY_attack');
  assert.equal((await f.call('/projects/dcb/plans/?doc=missing')).status, 404);
  const store = f.stores.get('game-plans'), listKeys = [], originalList = store.list.bind(store);
  store.list = async options => { listKeys.push(options.prefix); return originalList(options); };
  const metadata = await (await f.call(base)).json();
  assert.deepEqual(listKeys, ['project-document-index:dcb:plans:']);
  assert.ok(metadata.documents.every(document => !Object.hasOwn(document, 'body')));
});

test('추가 양식은 저장 전까지 문서를 생성하지 않으며 새 문서 ID를 보존한다', async () => {
  const f = gamePlansFixture();
  const html = await (await f.call('/projects/dcb/plans/?new=1&edit=1')).text();
  assert.match(html, /name="title" value=""/);
  assert.match(html, /data-endpoint="\/api\/project-documents\/dcb\/plans\/items\/[a-f0-9-]{36}"/);
  assert.equal(f.stores.get('game-plans').data.size, 0);
});

test('문서 목록·본문·HEAD·추가·수정에 기존 소유자 권한을 적용하고 공개 색인과 분리한다', async () => {
  const f = gamePlansFixture(); await f.call(base + '/attack', { body: record() });
  for (const owner of [false, 'other', 'expired']) {
    for (const path of [base, base + '/attack', '/projects/dcb/plans/?doc=attack', '/projects/dcb/plans/?new=1&edit=1']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await f.call(path, { owner, method });
        assert.equal(response.status, 401); assert.doesNotMatch(await response.text(), /PRIVATE_DOCUMENT|공격 규칙/);
        assert.match(response.headers.get('Cache-Control'), /private, no-store/);
      }
    }
    assert.equal((await f.call(base + '/attack', { owner, body: record({ version: 1 }) })).status, 401);
  }
  assert.equal((await f.call(base + '/attack', { origin: 'https://other.test', body: record({ version: 1 }) })).status, 403);
  const head = await f.call(base + '/attack', { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.deepEqual((await (await f.call('/api/notes/public', { owner: false })).json()).posts, []);
  assert.deepEqual((await (await f.call('/api/project-documents/shape-workshop/plans/items')).json()).documents, []);
  assert.deepEqual((await (await f.call('/api/project-documents/dcb/resources/items')).json()).documents, []);
});

test('리소스는 큰 이미지와 선택 목록을 보여 주고 원래 Markdown 이미지도 표지로 읽는다', async () => {
  const f = gamePlansFixture(), resources = '/api/project-documents/dcb/resources/items';
  await f.call('/api/project-documents/dcb/resources', { body: { body: '![기존 그림](/media/games/dcb.webp)', version: 0 } });
  await f.call(resources + '/environment', { body: record({ title: '환경 이미지', imageUrl: '/media/games/dcb.webp', caption: '등록한 이미지', body: '환경 본문' }) });
  assert.equal((await (await f.call(resources + '/main')).json()).imageUrl, '/media/games/dcb.webp');
  const html = await (await f.call('/projects/dcb/resources/?doc=environment')).text();
  assert.match(html, /class="resource-layout"/); assert.match(html, /class="resource-cover"/); assert.match(html, /환경 본문/);
  assert.match(html, /src="\/media\/games\/dcb.webp"/);
  assert.match(html, /href="\/projects\/dcb\/resources\/\?doc=environment&amp;edit=1"/);
  assert.equal((await (await f.call(resources + '/environment')).json()).folder, '');
});

test('많은 리소스의 다음 목록과 선택 항목 페이지를 연결한다', async () => {
  const f = gamePlansFixture(), resources = '/api/project-documents/dcb/resources/items';
  for (let i = 1; i <= 14; i++) await f.call(resources + '/image-' + i, { body: record({ title: '이미지 ' + i, imageUrl: '/media/games/dcb.webp' }) });
  const next = await (await f.call('/projects/dcb/resources/?doc=image-1&page=1')).text();
  assert.equal((next.match(/class="resource-choice"/g) ?? []).length, 2);
  assert.match(next, /이미지 14/); assert.match(next, /이전/);
  const selected = await (await f.call('/projects/dcb/resources/?doc=image-14')).text();
  assert.match(selected, /class="resource-choice" href="[^\"]*image-14[^\"]*" aria-current="page"/);
});

test('문서 필드와 경로를 검사하고 메타데이터·본문 삽입을 실행하지 않는다', async () => {
  const f = gamePlansFixture();
  for (const fields of [{ title: '' }, { title: 'x'.repeat(111) }, { folder: 'a//b' }, { folder: '../a' }, { folder: Array(9).fill('a').join('/') }, { body: '가'.repeat(67000) }]) {
    const response = await f.call(base + '/invalid', { body: record(fields) });
    assert.ok([400, 413].includes(response.status));
  }
  for (const imageUrl of ['javascript:alert(1)', '//example.com/a.png', 'data:image/svg+xml,x', 'http://example.com/a.png', 'https://name:secret@example.com/a.png', '/media/\\evil']) {
    assert.equal((await f.call('/api/project-documents/dcb/resources/items/bad', { body: record({ imageUrl }) })).status, 400);
  }
  await f.call(base + '/escaped', { body: record({ title: '<img onerror=alert(1)>', folder: '<script>/"quoted"', body: '</textarea><script>window.BAD=true</script>' }) });
  const page = await (await f.call('/projects/dcb/plans/?doc=escaped&edit=1')).text();
  assert.doesNotMatch(page, /<img onerror|<script>window.BAD|<summary><script>/);
  assert.match(page, /&lt;img onerror/); assert.match(page, /&lt;\/textarea&gt;/);
  for (const path of [base + '/upper_ID', base + '/x/extra', base + '/' + 'x'.repeat(81)]) assert.equal((await f.call(path)).status, 404);
  assert.equal((await f.call(base, { body: record() })).status, 405);
});
