import { postOperation, parsePost, composePost, readPostInput, renderPostBody, PostError } from './owner-posts.mjs';
import { postPage, postEditorPage } from './owner-post-ui.mjs';

const publicOrigin = 'https://imjae.github.io';
const github = 'https://github.com/imjae/imjae.github.io';
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const json = (value, status = 200) => Response.json(value, { status });
const slugFromPath = pathname => /^\/notes\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/.exec(pathname)?.[1];
async function readerAssets(env, origin) {
  const result = await env.ASSETS.fetch(new Request(new URL('/note-reader/', origin)));
  if (!result.ok) return '';
  const html = await result.text();
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="(\/_astro\/[A-Za-z0-9_.-]+\.css)"[^>]*>/g)].map(match => `<link rel="stylesheet" href="${publicOrigin}${match[1]}">`).join('');
  const scripts = [...html.matchAll(/<script\b[^>]*src="(\/_astro\/[A-Za-z0-9_.-]+\.js)"[^>]*>/g)].map(match => `<script type="module" src="${publicOrigin}${match[1]}"></script>`).join('');
  return styles + scripts;
}

export function migrationLink(slug) {
  const url = new URL(`${github}/new/main`);
  url.searchParams.set('filename', `content/managed-posts/${slug}.json`);
  url.searchParams.set('value', JSON.stringify({ version: 1, slug }, null, 2) + '\n');
  return url.href;
}
const removalLink = path => `${github}/delete/main/${path.split('/').map(encodeURIComponent).join('/')}`;
function publicHeaders(response, origin) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Vary', 'Origin');
  if (origin === publicOrigin) headers.set('Access-Control-Allow-Origin', publicOrigin);
  return new Response(response.body, { status: response.status, headers });
}

// Only these public read endpoints bypass owner authentication; no asset or mutation does.
export async function publicPostRequest(request, env) {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  if (url.pathname === '/api/notes/public') {
    const query = (url.searchParams.get('q') ?? '').slice(0, 300);
    const topic = (url.searchParams.get('topic') ?? '').slice(0, 30);
    const tag = (url.searchParams.get('tag') ?? '').slice(0, 40);
    const result = await postOperation(env, 'public-list', { query, topic, tag });
    return publicHeaders(request.method === 'HEAD' ? new Response(null, { status: result.status }) : result, request.headers.get('Origin'));
  }
  const slug = slugFromPath(url.pathname);
  if (!slug || slug === 'edit') return null;
  const result = await postOperation(env, 'public-get', { slug });
  if (result.status === 404) return null;
  if (!result.ok) return publicHeaders(result);
  const post = await result.json();
  const response = await postPage(post, { publicView: true, assets: await readerAssets(env, url.origin) });
  return publicHeaders(request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response);
}

export async function handleOwnerPosts(request, env, { fetcher = fetch } = {}) {
  try {
    const url = new URL(request.url);
    if (url.pathname === '/notes/edit/' && request.method === 'GET') return postEditorPage();
    const readSlug = slugFromPath(url.pathname);
    if (readSlug && ['GET', 'HEAD'].includes(request.method)) {
      const response = await postOperation(env, 'get', { slug: readSlug });
      if (!response.ok) return response;
      const page = await postPage(await response.json(), { assets: await readerAssets(env, url.origin) });
      return request.method === 'HEAD' ? new Response(null, { headers: page.headers }) : page;
    }
    if (url.pathname === '/api/notes' && request.method === 'GET') return postOperation(env, 'list');
    const slug = /^\/api\/notes\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(url.pathname)?.[1];
    if (slug && request.method === 'GET') return postOperation(env, 'get', { slug });
    if (request.method !== 'POST' || request.headers.get('Origin') !== url.origin) return json({ message: '원래 글 편집 화면에서 다시 시도해 주세요.' }, 403);
    const data = await readPostInput(request);
    if (url.pathname === '/api/notes/parse') return json(parsePost(data.source));
    if (url.pathname === '/api/notes/preview') {
      const post = parsePost(data.fields ? composePost(data.fields) : data.source);
      return json({ html: await renderPostBody(post.body) });
    }
    const manifest = async () => {
      const result = await env.ASSETS.fetch(new Request(new URL('/publish-manifest.json', url.origin)));
      if (!result.ok) throw new PostError('현재 배포 정보를 확인하지 못했습니다.', 503);
      return result.json();
    };
    if (url.pathname === '/api/notes/import') {
      if (typeof data.path !== 'string' || data.path.length > 300 || !/^content\/articles\/[a-z]+\/[^/\\\0]+\.md$/.test(data.path)) throw new PostError('공개 글의 파일 경로를 확인해 주세요.');
      const local = await manifest();
      if (!Object.hasOwn(local.articles ?? {}, data.path) || !/^[a-f0-9]{40}$/.test(local.revision)) throw new PostError('현재 공개된 글을 선택해 주세요.');
      const upstream = await fetcher(`https://raw.githubusercontent.com/imjae/imjae.github.io/${local.revision}/${data.path.split('/').map(encodeURIComponent).join('/')}`, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
      if (!upstream.ok) throw new PostError('기존 글을 가져오지 못했습니다.', 503);
      const source = await upstream.text(), post = parsePost(source);
      const expectedUrl = `/writing/${post.slug}/`;
      if (local.articles[data.path].url !== expectedUrl) throw new PostError('글의 주소가 바뀌었습니다. 페이지를 새로고침해 주세요.', 409);
      const existing = await postOperation(env, 'get', { slug: post.slug });
      if (existing.ok) {
        const stored = await existing.json();
        if (stored.migration?.path !== data.path) throw new PostError('같은 주소의 다른 글이 있습니다.', 409);
        return json({ post: stored, url: migrationLink(post.slug), removalUrl: removalLink(data.path) });
      }
      if (existing.status !== 404) return existing;
      const result = await postOperation(env, 'import', { source, slug: post.slug, version: 0, migration: { path: data.path, pending: true } });
      if (!result.ok) return result;
      return json({ post: await result.json(), url: migrationLink(post.slug), removalUrl: removalLink(data.path) });
    }
    if (url.pathname === '/api/notes/migration') {
      if (!safeSlug.test(data.slug ?? '')) throw new PostError('글 주소를 확인해 주세요.');
      const result = await postOperation(env, 'get', { slug: data.slug });
      if (!result.ok) return result;
      const post = await result.json();
      if (!post.migration?.pending) return json(post);
      const pending = message => json({ ...post, pendingMessage: message, migrationUrl: migrationLink(post.slug), removalUrl: removalLink(post.migration.path) });
      const local = await manifest();
      const upstream = await fetcher(`${publicOrigin}/publish-manifest.json`, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const deployed = upstream.ok ? await upstream.json() : null;
      if (!local.managedPosts?.includes(post.slug) || !deployed?.managedPosts?.includes(post.slug)) return pending('GitHub에서 이전 설정과 원본 제거를 각각 확정하고 두 배포가 완료될 때까지 기다려 주세요.');
      const moved = await fetcher(`${publicOrigin}/writing/${post.slug}/`, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const destination = `${url.origin}/notes/${post.slug}/`;
      const redirected = moved.headers.get('Location') === destination || (moved.ok && (await moved.text()).includes(`url=${destination}`));
      if (!redirected) return pending('기존 공개 주소가 새 저장소로 연결될 때까지 기다리고 있습니다.');
      const original = await fetcher(`https://raw.githubusercontent.com/imjae/imjae.github.io/main/${post.migration.path.split('/').map(encodeURIComponent).join('/')}`, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (original.status !== 404) return pending('원문은 비공개 저장소에 보관했습니다. GitHub의 공개 원본 제거를 확정해 주세요. 이전 커밋 이력은 남습니다.');
      return postOperation(env, 'migrated', { slug: post.slug, version: post.version });
    }
    if (slug && ['save', 'visibility', 'delete'].includes(data.action)) {
      if (data.action === 'save' && data.version === 0) {
        const local = await manifest();
        if (Object.values(local.articles ?? {}).some(article => article.url === `/writing/${slug}/`) || local.managedPosts?.includes(slug)) throw new PostError('기존 글 주소입니다. 공개 글 관리에서 이전하거나 다른 주소를 사용해 주세요.', 409);
      }
      let source = data.source;
      if (data.action === 'save' && data.fields) {
        const previous = await postOperation(env, 'get', { slug });
        if (!previous.ok && previous.status !== 404) return previous;
        source = composePost(data.fields, previous.ok ? (await previous.json()).source : data.importSource ?? '');
      }
      return postOperation(env, data.action, { slug, source, visibility: data.visibility, version: data.version });
    }
    return json({ message: '요청한 화면을 찾을 수 없습니다.' }, 404);
  } catch (error) {
    return json({ message: error instanceof PostError ? error.message : '글을 처리하지 못했습니다. 다시 시도해 주세요.' }, error instanceof PostError ? error.status : 503);
  }
}
