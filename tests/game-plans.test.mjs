import test from 'node:test';
import assert from 'node:assert/strict';
import { gamePlansFixture } from './helpers/game-plans-fixture.mjs';
import { games } from '../src/data/games.mjs';
import { gamePlanOperation } from '../server/game-plans.mjs';
import { postOperation } from '../server/owner-posts.mjs';
import { runInNewContext } from 'node:vm';

const sentinel = 'PRIVATE_GAME_PLAN_SENTINEL';
const api = '/api/game-plans/dcb';
const save = f => f.call(api, { body: { body: `## 게임 규칙\n\n${sentinel}`, version: 0 } });

test('기획서 읽기는 빈 본문을 반환하고 저장소에 가짜 기획을 만들지 않는다', async () => {
  const f = gamePlansFixture();
  for (const game of games) {
    const result = await f.call('/api/game-plans/' + game.id);
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { id: game.id, body: '', version: 0, updatedAt: null });
  }
  assert.equal(f.stores.get('game-plans').data.size, 0);
});

test('로그인 없음·다른 계정·만료 세션의 직접 URL/API/HEAD와 저장 요청을 차단한다', async () => {
  const f = gamePlansFixture(); await save(f);
  for (const owner of [false, 'other', 'expired']) {
    for (const path of [api, '/games/dcb/', '/games/dcb/?edit=1']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await f.call(path, { owner, method });
        assert.equal(response.status, 401);
        assert.doesNotMatch(await response.text(), new RegExp(sentinel));
        assert.match(response.headers.get('Cache-Control'), /private, no-store/);
      }
    }
    assert.equal((await f.call(api, { owner, body: { body: 'changed', version: 1 } })).status, 401);
  }
  assert.equal(f.assetCalls(), 0);
  const result = await f.call('/games/dcb/?edit=1', { owner: false, headers: { Accept: 'text/html' } });
  assert.equal(result.status, 303);
  assert.equal(new URL(result.headers.get('Location'), 'https://author.test').searchParams.get('return_to'), '/games/dcb/?edit=1');
});

test('소유자만 저장·재접속 읽기·Markdown 렌더링과 편집을 할 수 있다', async () => {
  const f = gamePlansFixture(); const first = await save(f);
  assert.equal(first.status, 201); assert.equal((await first.json()).version, 1);
  const record = await (await f.call(api)).json();
  assert.match(record.body, new RegExp(sentinel)); assert.ok(record.updatedAt);
  const read = await f.call('/games/dcb/'); const html = await read.text();
  assert.match(html, /<h2>게임 규칙<\/h2>/); assert.match(html, new RegExp(sentinel));
  assert.match(read.headers.get('Cache-Control'), /private, no-store/);
  assert.match(read.headers.get('X-Robots-Tag'), /noindex/);
  assert.match(read.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  assert.match(await (await f.call('/games/dcb/?edit=1')).text(), /<textarea[^>]*>[\s\S]*PRIVATE_GAME_PLAN_SENTINEL/);
  const head = await f.call('/games/dcb/', { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.equal(f.assetCalls(), 0);
});

test('기획서는 글 목록·공개 검색·본문에서 격리되고 공개 요청 필드를 무시한다', async () => {
  const f = gamePlansFixture();
  const response = await f.call(api, { body: { body: sentinel, version: 0, id: 'shape-workshop', operation: 'public-get', visibility: 'public' } });
  assert.equal(response.status, 201);
  assert.deepEqual(Object.keys(await response.json()).sort(), ['body', 'id', 'updatedAt', 'version']);
  assert.equal((await (await f.call('/api/game-plans/shape-workshop')).json()).body, '');
  for (const path of ['/api/notes', '/api/notes/public', '/api/notes/public?q=' + sentinel]) {
    assert.deepEqual((await (await f.call(path, { owner: path === '/api/notes' })).json()).posts, []);
  }
  assert.equal((await f.call('/notes/dcb/', { owner: false })).status, 401);
  assert.equal((await postOperation(f.env, 'public-get', { slug: 'dcb' })).status, 404);
  // Even accidentally listing the plan object cannot expose game-plan: keys.
  const list = await f.env.OWNER_POSTS.get('game-plans').fetch(new Request('https://fixture/', { method: 'POST', body: JSON.stringify({ operation: 'public-list' }) }));
  assert.deepEqual((await list.json()).posts, []);
  assert.equal(f.stores.get('owner-posts').data.size, 0);
});

test('같은 버전의 동시 저장은 하나만 성공하고 충돌 시 기존 본문을 지킨다', async () => {
  const f = gamePlansFixture(); await save(f);
  const results = await Promise.all(['first', 'second'].map(body => f.call(api, { body: { body, version: 1 } })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  assert.equal((await (await f.call(api)).json()).version, 2);
  for (const version of [undefined, -1, 1, 2.5, '2']) assert.equal((await f.call(api, { body: { body: 'stale', version } })).status, 409);
});

test('원래 편집 Origin과 JSON 요청만 허용하며 ID·크기·본문을 검사한다', async () => {
  const f = gamePlansFixture();
  for (const origin of ['https://evil.test', 'null', '']) assert.equal((await f.call(api, { origin, body: { body: sentinel, version: 0 } })).status, 403);
  assert.equal((await f.call(api, { body: {}, headers: { 'Content-Type': 'text/plain' } })).status, 415);
  for (const body of [null, [], {}, { body: 7, version: 0 }]) assert.equal((await f.call(api, { body })).status, 400);
  assert.equal((await f.call(api, { body: { body: '가'.repeat(67000), version: 0 } })).status, 413);
  assert.equal((await f.call(api, { body: { body: 'x'.repeat(400001), version: 0 } })).status, 413);
  for (const path of ['/games/unknown/', '/api/game-plans/unknown', '/api/game-plans', '/games/dcb/extra/']) assert.equal((await f.call(path)).status, 404);
  assert.equal((await f.call(api, { method: 'DELETE' })).status, 405);
  const result = await f.call(api, { body: { body: '', version: 0 } });
  assert.equal(result.status, 201); assert.equal((await result.json()).body, '');
});

test('저장한 Markdown의 실행 코드와 textarea 탈출은 소유자 화면에서도 차단한다', async () => {
  const f = gamePlansFixture();
  await f.call(api, { body: { body: '<script>alert("unsafe")</script>\n\n<img src="https://example.com/a.png" onerror="alert(1)">\n\n[bad](javascript:alert(1))\n\n</textarea><script>window.bad=true</script>', version: 0 } });
  const read = await (await f.call('/games/dcb/')).text();
  assert.doesNotMatch(read, /<script>alert|onerror=|href="javascript:|<script>window.bad/);
  const editor = await (await f.call('/games/dcb/?edit=1')).text();
  assert.match(editor, /&lt;\/textarea&gt;&lt;script&gt;/);
  assert.doesNotMatch(editor, /<script>window.bad/);
});

test('기획서 저장 실패는 민감한 내부 오류를 응답에 싣지 않는다', async () => {
  const f = gamePlansFixture();
  f.env.OWNER_POSTS.get = () => ({ fetch: () => { throw new Error('INTERNAL_SECRET'); } });
  const response = await f.call(api);
  assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /INTERNAL_SECRET/);
  await assert.rejects(gamePlanOperation({}, 'game-plan-get', { id: 'dcb' }), /저장소/);
});

test('소유자 확인 뒤 화면을 표시하고 탭 복귀·세션 만료 시 본문을 숨긴다', async () => {
  const f = gamePlansFixture(); await save(f);
  const html = await (await f.call('/games/dcb/')).text();
  const script = html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1];
  const events = {}, body = { style: { visibility: 'hidden' } }; let valid = true, redirected = '';
  const document = { body, hidden: false, getElementById: () => null, addEventListener: (name, callback) => { events[name] = callback; } };
  runInNewContext(script, { document, window: { addEventListener: (name, callback) => { events[name] = callback; } }, location: { pathname: '/games/dcb/', search: '', replace: url => { redirected = url; } }, fetch: async () => ({ ok: valid }), setInterval: () => {}, encodeURIComponent });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  events.pageshow(); await settle(); assert.equal(body.style.visibility, 'visible');
  events.pagehide(); assert.equal(body.style.visibility, 'hidden');
  events.pageshow(); await settle(); assert.equal(body.style.visibility, 'visible');
  document.hidden = true; events.visibilitychange(); assert.equal(body.style.visibility, 'hidden');
  valid = false; document.hidden = false; events.visibilitychange(); await settle();
  assert.equal(body.style.visibility, 'hidden'); assert.equal(redirected, '/auth/login?return_to=%2Fgames%2Fdcb%2F');
});
