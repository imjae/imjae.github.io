import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthorSessions, handleAuthorRequest, safeReturnPath } from '../server/author-auth.mjs';

class Storage {
  data = new Map();
  scheduled = null;
  queue = Promise.resolve();
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async get(key) { return structuredClone(this.data.get(key)); }
  async delete(key) { this.data.delete(key); }
  async getAlarm() { return this.scheduled; }
  async setAlarm(value) { this.scheduled = value; }
  async list() { return new Map(this.data); }
  transaction(fn) {
    const result = this.queue.then(() => fn());
    this.queue = result.catch(() => {});
    return result;
  }
}
const cookies = response => response.headers.getSetCookie().map(value => value.split(';')[0]);
function fixture({ userId = 37284282, userLogin = 'imjae', scope = '', providerFailure = false, tokenError = '', providerRedirect = '' } = {}) {
  const storage = new Storage();
  const state = new AuthorSessions({ storage });
  const calls = [];
  let time = Date.now();
  let assets = 0;
  const env = {
    GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-only-secret', ALLOWED_GITHUB_ID: '37284282',
    AUTHOR_SESSIONS: { idFromName: name => name, get: () => ({ fetch: (url, init) => state.fetch(new Request(url, init)) }) },
    ASSETS: { fetch: async () => { assets++; return new Response('owner-only editor', { headers: { 'Content-Type': 'text/html' } }); } },
  };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.redirect, 'manual', 'Cloudflare에서 지원되는 manual만 사용하며 자격 증명을 리디렉션에 전달하지 않는다');
    if (providerFailure) throw new Error('upstream response and test-only-secret must remain private');
    if (providerRedirect === (url.endsWith('/access_token') ? 'token' : 'user')) return new Response(null, { status: 302, headers: { Location: 'https://attacker.example/' } });
    return url.endsWith('/access_token')
      ? Response.json(tokenError ? { error: tokenError, error_description: 'test-only-secret private upstream details' } : { access_token: 'upstream-test-token', scope })
      : Response.json({ id: userId, login: userLogin });
  };
  const request = (path, options = {}) => handleAuthorRequest(new Request(`https://author.example${path}`, options), env, { fetcher, now: () => time });
  const start = async returnTo => {
    const response = await request(`/auth/login?return_to=${encodeURIComponent(returnTo ?? '/portfolio/krafton-2027/?edit=1#graphics')}`);
    const authorization = new URL(response.headers.get('Location'));
    return { response, authorization, state: authorization.searchParams.get('state'), cookie: cookies(response)[0] };
  };
  const complete = async flow => request(`/auth/callback?state=${flow.state}&code=test-code`, { headers: { Cookie: flow.cookie } });
  const signIn = async () => {
    const flow = await start();
    const response = await complete(flow);
    return { flow, response, cookie: cookies(response).find(value => value.startsWith('__Host-imjae_author=')) };
  };
  return { env, storage, state, calls, request, start, complete, signIn, assets: () => assets, advance: ms => { time += ms; } };
}

test('로그인 없는 HTML·편집 쿼리·스크립트·이미지·직접 경로는 보호 자산에 도달하지 못한다', async () => {
  const f = fixture();
  const page = await f.request('/portfolio/krafton-2027/?edit=1', { headers: { Accept: 'text/html' } });
  assert.equal(page.status, 303);
  assert.match(page.headers.get('Location'), /^\/auth\/login\?return_to=/);
  for (const path of ['/editor/', '/_astro/editor.js', '/favicon.svg', '/auth/session', '/editor/index.html', '/api/publish-progress/status']) {
    const response = await f.request(path);
    assert.equal(response.status, 401, path);
    assert.match(response.headers.get('Cache-Control'), /no-store/);
    assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  }
  assert.equal(f.assets(), 0);
  assert.equal((await f.request('/api/publish-progress/start', { method: 'POST', headers: { Origin: 'https://author.example', 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
});

test('OAuth state·PKCE를 검증하고 본인의 불변 GitHub ID만 세션을 발급한다', async () => {
  const f = fixture();
  const { flow, response, cookie } = await f.signIn();
  assert.equal(flow.authorization.origin, 'https://github.com');
  assert.equal(flow.authorization.searchParams.get('scope'), '');
  assert.equal(flow.authorization.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(flow.authorization.searchParams.get('redirect_uri'), 'https://author.example/auth/callback');
  const exchange = f.calls[0].options;
  assert.equal(exchange.method, 'POST');
  assert.equal(exchange.body.get('client_secret'), f.env.GITHUB_CLIENT_SECRET);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(exchange.body.get('code_verifier'))));
  assert.equal(flow.authorization.searchParams.get('code_challenge'), Buffer.from(digest).toString('base64url'));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Location'), '/portfolio/krafton-2027/?edit=1#graphics');
  assert.ok(cookie);
  assert.ok(response.headers.getSetCookie().every(value => /Secure; HttpOnly; SameSite=Lax/.test(value)));
  const allowed = await f.request('/editor/', { headers: { Cookie: cookie } });
  assert.equal(allowed.status, 200);
  assert.equal(await allowed.text(), 'owner-only editor');
  assert.equal(allowed.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(allowed.headers.get('Referrer-Policy'), 'same-origin');
  assert.equal(f.assets(), 1);
  const identity = await f.request('/auth/session', { headers: { Cookie: cookie } });
  assert.deepEqual(await identity.json(), { login: 'imjae' });
  assert.ok([...f.storage.data.values()].every(value => !JSON.stringify(value).includes('upstream-test-token')));
  assert.ok(!JSON.stringify(response.headers.getSetCookie()).includes('upstream-test-token'));
});

test('다른 계정은 로그인해도 거부하고 이름을 흉내 내도 ID가 다르면 거부한다', async () => {
  for (const userLogin of ['another-user', 'imjae']) {
    const f = fixture({ userId: 123456, userLogin });
    const { response, cookie } = await f.signIn();
    assert.equal(response.status, 403);
    assert.equal(cookie, undefined);
    assert.equal(f.assets(), 0);
    assert.ok(![...f.storage.data.keys()].some(key => key.startsWith('session:')));
  }
});

test('state 불일치·쿠키 누락·중복·유효 시간 초과·재사용을 거부한다', async () => {
  const f = fixture();
  const flow = await f.start();
  for (const headers of [{}, { Cookie: `${flow.cookie}; ${flow.cookie}` }, { Cookie: '__Host-imjae_oauth=' + 'x'.repeat(43) }]) {
    const response = await f.request(`/auth/callback?state=${flow.state}&code=test-code`, { headers });
    assert.equal(response.status, 400);
  }
  assert.equal(f.calls.length, 0);
  const accepted = await f.complete(flow);
  assert.equal(accepted.status, 303);
  assert.equal((await f.complete(flow)).status, 400);
  assert.equal(f.calls.length, 2);
  const old = await f.start();
  f.advance(11 * 60 * 1000);
  assert.equal((await f.complete(old)).status, 400);
  assert.equal(f.calls.length, 2);
});

test('같은 OAuth state로 동시에 완료해도 한 요청만 처리한다', async () => {
  const f = fixture();
  const flow = await f.start();
  const responses = await Promise.all([f.complete(flow), f.complete(flow)]);
  assert.deepEqual(responses.map(value => value.status).sort(), [303, 400]);
  assert.equal(f.calls.length, 2);
});

test('OAuth 거절·제공자 장애·과도한 권한 응답·미설정은 실패 시 편집을 허용하지 않는다', async () => {
  const denied = fixture();
  const flow = await denied.start();
  assert.equal((await denied.request(`/auth/callback?state=${flow.state}&error=access_denied`, { headers: { Cookie: flow.cookie } })).status, 400);
  assert.equal(denied.calls.length, 0);
  for (const options of [{ providerFailure: true }, { scope: 'repo' }]) {
    const f = fixture(options);
    const { response, cookie } = await f.signIn();
    assert.equal(response.status, 503);
    assert.equal(cookie, undefined);
    assert.doesNotMatch(await response.text(), /test-only-secret|upstream-test-token/);
  }
  const unconfigured = fixture();
  delete unconfigured.env.GITHUB_CLIENT_SECRET;
  assert.equal((await unconfigured.request('/editor/')).status, 503);
  assert.equal(unconfigured.assets(), 0);
});

test('잘못된 앱 인증 정보는 비밀 값을 노출하지 않고 재설정을 안내한다', async () => {
  for (const tokenError of ['incorrect_client_credentials', 'unknown_provider_error']) {
    const f = fixture({ tokenError });
    const { response, cookie } = await f.signIn();
    const body = await response.text();
    assert.equal(response.status, 503);
    assert.equal(cookie, undefined);
    assert.equal(f.assets(), 0);
    assert.equal(f.calls.length, 1);
    assert.doesNotMatch(body, /test-only-secret|upstream-test-token|private upstream details|unknown_provider_error/);
    assert.equal(body.includes('Client Secret에는 Client ID가 아닌'), tokenError === 'incorrect_client_credentials');
  }
});

test('GitHub 외부 요청은 리디렉션을 따라가지 않고 토큰·계정 응답의 3xx를 거부한다', async () => {
  for (const providerRedirect of ['token', 'user']) {
    const f = fixture({ providerRedirect });
    const { response, cookie } = await f.signIn();
    assert.equal(response.status, 503);
    assert.equal(cookie, undefined);
    assert.equal(f.assets(), 0);
    assert.equal(f.calls.length, providerRedirect === 'token' ? 1 : 2);
    assert.ok(f.calls.every(call => call.options.redirect === 'manual'));
    assert.doesNotMatch(await response.text(), /attacker|test-only-secret|upstream-test-token/);
  }
});

test('세션 위조·쿠키 중복·만료·허용 계정 변경은 거부한다', async () => {
  const f = fixture();
  const { cookie } = await f.signIn();
  for (const invalid of ['__Host-imjae_author=' + 'x'.repeat(43), `${cookie}; ${cookie}`, '__Host-imjae_author=true']) {
    assert.equal((await f.request('/editor/', { headers: { Cookie: invalid } })).status, 401);
  }
  f.advance(8 * 60 * 60 * 1000 + 1);
  assert.equal((await f.request('/editor/', { headers: { Cookie: cookie } })).status, 401);
  const other = fixture();
  const owner = await other.signIn();
  other.env.ALLOWED_GITHUB_ID = '999';
  assert.equal((await other.request('/editor/', { headers: { Cookie: owner.cookie } })).status, 401);
});

test('로그아웃은 같은 origin의 POST만 허용하고 서버 세션을 즉시 폐기한다', async () => {
  const f = fixture();
  const { cookie } = await f.signIn();
  for (const options of [{}, { method: 'POST' }, { method: 'POST', headers: { Origin: 'https://attacker.example' } }]) {
    const response = await f.request('/auth/logout', { ...options, headers: { ...options.headers, Cookie: cookie } });
    assert.equal(response.status, 403);
  }
  const logout = await f.request('/auth/logout', { method: 'POST', headers: { Cookie: cookie, Origin: 'https://author.example' } });
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal((await f.request('/editor/', { headers: { Cookie: cookie } })).status, 401);
});

test('로그인 후 이동은 내부 경로만 허용하며 HTTPS 외의 인증 요청을 거부한다', async () => {
  for (const path of ['https://attacker.example', '//attacker.example', '/\\attacker.example', '/%2fattacker.example', '/%5cattacker.example', '/auth/login', '/\nLocation: https://attacker.example']) assert.equal(safeReturnPath(path), '/');
  assert.equal(safeReturnPath('/portfolio/krafton-2027/?edit=1#graphics'), '/portfolio/krafton-2027/?edit=1#graphics');
  const f = fixture();
  const result = await handleAuthorRequest(new Request('http://author.example/auth/login'), f.env);
  assert.equal(result.status, 400);
});

test('저장소는 만료한 OAuth·세션 기록을 정리하고 다음 만료를 예약한다', async () => {
  const f = fixture();
  const expired = 'session:' + 'a'.repeat(43);
  const future = 'oauth:' + 'b'.repeat(43);
  await f.storage.put(expired, { expiresAt: Date.now() - 1 });
  await f.storage.put(future, { expiresAt: Date.now() + 100000 });
  await f.state.alarm();
  assert.equal(await f.storage.get(expired), undefined);
  assert.equal(f.storage.scheduled, (await f.storage.get(future)).expiresAt);
});
