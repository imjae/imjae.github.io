import { handleSketchRequest } from './sketch-review.mjs';
import { handlePublishProgress } from './publish-progress.mjs';
import { handleQuestionRequest } from './sketch-question.mjs';
import { handleOwnerPosts, publicPostRequest } from './owner-post-api.mjs';
import { handleGamePlans } from './game-plan-api.mjs';
export { OwnerPosts } from './owner-posts.mjs';
export { SketchQuestions } from './sketch-question.mjs';
export { SketchReviews } from './sketch-review.mjs';
const SESSION_COOKIE = '__Host-imjae_author';
const STATE_COOKIE = '__Host-imjae_oauth';
const SESSION_SECONDS = 8 * 60 * 60;
const OAUTH_SECONDS = 10 * 60;
const encoder = new TextEncoder();

export function safeReturnPath(value = '/') {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n\0]|%(?:2f|5c|0d|0a)/i.test(value)) return '/';
  const url = new URL(value, 'https://author.invalid');
  if (url.origin !== 'https://author.invalid' || url.pathname.startsWith('/auth/')) return '/';
  return url.pathname + url.search + url.hash;
}

function randomValue() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
function readCookie(request, name) {
  const values = (request.headers.get('Cookie') ?? '').split(';').map(part => part.trim()).filter(part => part.startsWith(`${name}=`));
  if (values.length !== 1) return undefined;
  const value = values[0].slice(name.length + 1);
  return /^[a-zA-Z0-9_-]{43}$/.test(value) ? value : undefined;
}
function cookie(name, value, seconds) {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;
}
function privateResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  // no-referrer는 일부 브라우저의 같은 origin POST에도 Origin:null을 만들 수 있다.
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Vary', 'Cookie');
  return new Response(response.body, { status: response.status, headers });
}
function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location });
  for (const value of cookies) headers.append('Set-Cookie', value);
  return new Response(null, { status: 303, headers });
}
function message(status, text) {
  return new Response(`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>편집 로그인</title><body><main><h1>편집 로그인</h1><p>${text}</p><a href="https://imjae.github.io/">블로그로 돌아가기</a></main></body></html>`, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" },
  });
}
async function record(env, operation, key, value) {
  const state = env.AUTHOR_SESSIONS.get(env.AUTHOR_SESSIONS.idFromName('imjae-author'));
  const response = await state.fetch(`https://author-state/${operation}`, { method: 'POST', body: JSON.stringify({ key, value }) });
  if (!response.ok) throw new Error('Author session storage unavailable');
  return response.json();
}

// GitHub 토큰은 /user 확인에만 사용하며 저장하거나 브라우저에 전달하지 않는다.
export async function handleAuthorRequest(request, env, { fetcher = fetch, now = () => Date.now() } = {}) {
  let failureMessage = '로그인을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  try {
    const url = new URL(request.url);
    if (url.protocol !== 'https:') return privateResponse(message(400, 'HTTPS 주소로 접속해 주세요.'));
    if (url.pathname === '/api/sketch/question-runner/connect') return handleQuestionRequest(request,env,{runner:true});
    if (url.pathname.startsWith('/api/sketch/runner/')) return privateResponse(await handleSketchRequest(request,env,{runner:true}));
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !/^\d+$/.test(env.ALLOWED_GITHUB_ID ?? '') || !env.AUTHOR_SESSIONS || !env.ASSETS) {
      return privateResponse(message(503, '로그인 연결을 확인해 주세요.'));
    }
    if (url.pathname === '/api/notes/public' || url.pathname.startsWith('/notes/')) {
      const publicPost = await publicPostRequest(request, env);
      if (publicPost) return publicPost;
    }
    const callback = `${url.origin}/auth/callback`;
    let response;
    if (url.pathname === '/auth/login' && request.method === 'GET') {
      const state = randomValue();
      const codeVerifier = randomValue();
      await record(env, 'put', `oauth:${state}`, { expiresAt: now() + OAUTH_SECONDS * 1000, codeVerifier, returnTo: safeReturnPath(url.searchParams.get('return_to') ?? '/') });
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callback, state, scope: '', code_challenge_method: 'S256', code_challenge: base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier)))) }).toString();
      response = redirect(authorize.href, [cookie(STATE_COOKIE, state, OAUTH_SECONDS)]);
    } else if (url.pathname === '/auth/callback' && request.method === 'GET') {
      const state = readCookie(request, STATE_COOKIE);
      if (!state || url.searchParams.getAll('state').length !== 1 || state !== url.searchParams.get('state')) return privateResponse(message(400, '로그인 요청을 확인할 수 없습니다. 다시 로그인해 주세요.'));
      failureMessage = '로그인 요청의 세션을 확인하지 못했습니다. 다시 로그인해 주세요.';
      const flow = await record(env, 'consume', `oauth:${state}`);
      const cleared = cookie(STATE_COOKIE, '', 0);
      const code = url.searchParams.get('code');
      if (!flow || flow.expiresAt <= now() || url.searchParams.has('error') || url.searchParams.getAll('code').length !== 1 || !code || code.length > 256) {
        response = message(400, '로그인이 취소되었거나 만료되었습니다. 다시 로그인해 주세요.');
        response.headers.append('Set-Cookie', cleared);
      } else {
        failureMessage = 'GitHub 인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
        const tokenResponse = await fetcher('https://github.com/login/oauth/access_token', { method: 'POST', redirect: 'manual', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'imjae-blog-author-login' }, body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: callback, code_verifier: flow.codeVerifier }), signal: AbortSignal.timeout(10000) });
        failureMessage = `GitHub 인증 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요. (HTTP ${tokenResponse.status})`;
        const token = await tokenResponse.json();
        if (token.error === 'incorrect_client_credentials') {
          const failure = message(503, 'GitHub 앱의 Client ID와 Client Secret 연결을 확인해 주세요. Client Secret에는 Client ID가 아닌, 새로 생성한 비밀 값을 등록해야 합니다.');
          failure.headers.append('Set-Cookie', cleared);
          return privateResponse(failure);
        }
        if (!tokenResponse.ok || typeof token.access_token !== 'string' || !token.access_token || token.error || (token.scope && token.scope.trim())) throw new Error('GitHub identity authentication failed');
        failureMessage = 'GitHub 계정 정보를 확인하지 못했습니다. 잠시 후 다시 로그인해 주세요.';
        const userResponse = await fetcher('https://api.github.com/user', { redirect: 'manual', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'imjae-blog-author-login' }, signal: AbortSignal.timeout(10000) });
        if (!userResponse.ok) throw new Error('GitHub user response unavailable');
        const user = await userResponse.json();
        if (!Number.isSafeInteger(user.id) || String(user.id) !== env.ALLOWED_GITHUB_ID || typeof user.login !== 'string') {
          response = message(403, '사이트 소유자의 GitHub 계정만 편집할 수 있습니다.');
          response.headers.append('Set-Cookie', cleared);
        } else {
          failureMessage = '로그인 상태를 저장하지 못했습니다. 잠시 후 다시 로그인해 주세요.';
          const session = randomValue();
          await record(env, 'put', `session:${session}`, { id: String(user.id), login: user.login, expiresAt: now() + SESSION_SECONDS * 1000 });
          // 로그인 전 세션이 있으면 교체하고 이전 세션을 폐기한다.
          const previous = readCookie(request, SESSION_COOKIE);
          if (previous) await record(env, 'delete', `session:${previous}`);
          response = redirect(safeReturnPath(flow.returnTo), [cleared, cookie(SESSION_COOKIE, session, SESSION_SECONDS)]);
        }
      }
    } else {
      const sessionId = readCookie(request, SESSION_COOKIE);
      const session = sessionId ? await record(env, 'get', `session:${sessionId}`) : null;
      const authenticated = session?.id === env.ALLOWED_GITHUB_ID && session.expiresAt > now();
      if (!authenticated) {
        if (sessionId) await record(env, 'delete', `session:${sessionId}`);
        response = request.method === 'GET' && request.headers.get('Accept')?.includes('text/html') && !url.pathname.startsWith('/auth/')
          ? redirect(`/auth/login?return_to=${encodeURIComponent(safeReturnPath(url.pathname + url.search))}`, [cookie(SESSION_COOKIE, '', 0)])
          : message(401, '편집하려면 GitHub 로그인이 필요합니다.');
      } else if (url.pathname === '/auth/logout') {
        if (request.method !== 'POST' || request.headers.get('Origin') !== url.origin) return privateResponse(message(403, '로그아웃 요청을 확인할 수 없습니다.'));
        await record(env, 'delete', `session:${sessionId}`);
        response = redirect('https://imjae.github.io/', [cookie(SESSION_COOKIE, '', 0)]);
      } else if (url.pathname === '/auth/session' && request.method === 'GET') {
        response = Response.json({ login: session.login });
      } else if ((url.pathname.startsWith('/games/') && url.pathname !== '/games/') || url.pathname === '/api/game-plans' || url.pathname.startsWith('/api/game-plans/')) {
        response = await handleGamePlans(request, env);
      } else if (url.pathname.startsWith('/notes/') || url.pathname === '/api/notes' || url.pathname.startsWith('/api/notes/')) {
        response = await handleOwnerPosts(request, env, { fetcher });
      } else if (url.pathname === '/sketch/ask/' || url.pathname === '/api/sketch/ask' || url.pathname.startsWith('/api/sketch/ask/')) {
        response = await handleQuestionRequest(request, env, { ownerId: session.id });
      } else if (url.pathname === '/sketch/' || url.pathname.startsWith('/api/sketch/')) {
        response = await handleSketchRequest(request, env, { ownerId: session.id });
      } else if (url.pathname.startsWith('/api/publish-progress/')) {
        response = await handlePublishProgress(request, env, { fetcher });
      } else if (url.pathname.startsWith('/auth/') || !['GET', 'HEAD'].includes(request.method)) {
        response = message(404, '요청한 화면을 찾을 수 없습니다.');
      } else {
        response = await env.ASSETS.fetch(request);
      }
    }
    return privateResponse(response);
  } catch {
    // OAuth code·쿠키·upstream 응답을 로그나 오류 화면에 포함하지 않는다.
    return privateResponse(message(503, failureMessage));
  }
}

export default { fetch: handleAuthorRequest };

// 강한 일관성의 세션 저장소로 OAuth state 재사용과 로그아웃 후 세션 재사용을 차단한다.
export class AuthorSessions {
  constructor(state) { this.storage = state.storage; }
  async fetch(request) {
    const { key, value } = await request.json();
    if (!/^(oauth|session):[a-zA-Z0-9_-]{43}$/.test(key ?? '')) return new Response(null, { status: 400 });
    const operation = new URL(request.url).pathname;
    let result = null;
    if (operation === '/put') {
      if (!value || !Number.isFinite(value.expiresAt)) return new Response(null, { status: 400 });
      await this.storage.put(key, value);
      const alarm = await this.storage.getAlarm();
      if (!alarm || alarm > value.expiresAt) await this.storage.setAlarm(value.expiresAt);
    } else if (operation === '/get') result = await this.storage.get(key) ?? null;
    else if (operation === '/delete') await this.storage.delete(key);
    else if (operation === '/consume') result = await this.storage.transaction(async () => {
      // SQLite 저장소의 트랜잭션은 storage 자체에 적용된다.
      const stored = await this.storage.get(key);
      await this.storage.delete(key);
      return stored ?? null;
    });
    else return new Response(null, { status: 404 });
    return Response.json(result);
  }
  async alarm() {
    let next = Infinity;
    for (const [key, value] of await this.storage.list()) {
      if (value.expiresAt <= Date.now()) await this.storage.delete(key);
      else next = Math.min(next, value.expiresAt);
    }
    if (Number.isFinite(next)) await this.storage.setAlarm(next);
  }
}
