import { parseDocument } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

export const postTopics = ['gameplay', 'graphics', 'tools', 'ai', 'notes', 'math', 'reading', 'study'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sourceLimit = 200000;
const encoder = new TextEncoder();
const schema = { ...defaultSchema, tagNames: [...defaultSchema.tagNames, 'figure', 'figcaption', 'video', 'source', 'iframe'], attributes: { ...defaultSchema.attributes, code: [...defaultSchema.attributes.code, ['className', /^language-./, 'math-inline', 'math-display']], iframe: ['src', 'title', 'allowFullScreen', 'loading'], video: ['src', 'controls', 'playsInline', 'poster', 'preload'], source: ['src', 'type'] } };
function safeMedia() {
  return tree => {
    function walk(node) {
      if (node.type === 'element') {
        for (const key of ['src', 'href', 'poster']) {
          const value = node.properties?.[key];
          if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) node.properties[key] = 'https://imjae.github.io' + value;
        }
        if (node.tagName === 'iframe') {
          let allowed = false;
          try { const url = new URL(node.properties.src); allowed = url.protocol === 'https:' && ['www.youtube-nocookie.com', 'www.youtube.com'].includes(url.hostname) && /^\/embed\/[A-Za-z0-9_-]{11}$/.test(url.pathname); } catch { /* remove untrusted frame */ }
          if (!allowed) { node.tagName = 'span'; node.properties = {}; node.children = []; }
        }
      }
      for (const child of node.children ?? []) walk(child);
    }
    walk(tree);
  };
}
const renderer = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeSanitize, schema).use(safeMedia).use(rehypeKatex, { trust: false, throwOnError: false }).use(rehypeStringify);
export class PostError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export async function renderPostBody(body) { return String(await renderer.process(body)); }
export function composePost(fields, original = '') {
  if (!fields || typeof fields !== 'object' || typeof fields.body !== 'string') throw new PostError('본문을 확인해 주세요.');
  const header = /^---\n([\s\S]*?)\n---/.exec(original.replaceAll('\r\n', '\n'))?.[1] ?? '';
  const document = parseDocument(header || '{}');
  for (const key of ['title', 'description', 'slug', 'date', 'topic', 'tags']) document.set(key, fields[key]);
  if (!document.has('kind')) document.set('kind', 'note');
  if (!document.has('dateBasis')) document.set('dateBasis', 'authored');
  // Visibility is enforced by the storage record, never by user-supplied Markdown.
  document.set('draft', true);
  return `---\n${String(document)}---\n\n${fields.body}\n`;
}

export function parsePost(source) {
  if (typeof source !== 'string' || encoder.encode(source).length > sourceLimit) throw new PostError('글은 UTF-8 기준 200KB까지 저장할 수 있습니다.');
  const normalized = source.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/.exec(normalized);
  if (!match) throw new PostError('파일 맨 위에 제목·요약·주소·날짜·주제를 포함한 Markdown 정보를 넣어 주세요.');
  const document = parseDocument(match[1]);
  if (document.errors.length) throw new PostError('글 상단 정보의 YAML 형식을 확인해 주세요.');
  let data;
  try { data = document.toJS({ maxAliasCount: 0 }); } catch { throw new PostError('글 상단 정보에 YAML 별칭을 사용할 수 없습니다.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new PostError('글 상단 정보를 확인해 주세요.');
  const text = (key, limit) => {
    if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > limit) throw new PostError(`${key} 항목을 1~${limit}자로 적어 주세요.`);
    return data[key].trim();
  };
  const title = text('title', 110), description = text('description', 220), slug = text('slug', 80), date = text('date', 10);
  if (!slugPattern.test(slug) || ['edit', 'new', 'index', 'public', 'preview', 'parse', 'import', 'migration'].includes(slug)) throw new PostError('다른 글 주소를 영문 소문자·숫자·하이픈으로 적어 주세요.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new PostError('작성 날짜를 확인해 주세요.');
  if (!postTopics.includes(data.topic)) throw new PostError('글 주제를 확인해 주세요.');
  const tags = data.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 12 || tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 40)) throw new PostError('태그는 40자 이내로 최대 12개까지 적어 주세요.');
  if (!match[2].trim()) throw new PostError('본문을 작성해 주세요.');
  return { title, description, slug, date, topic: data.topic, tags: [...new Set(tags)], source: normalized, body: match[2].trim() };
}

export function postSummary(post) {
  return Object.fromEntries(['slug', 'title', 'description', 'date', 'topic', 'tags', 'visibility', 'version', 'updatedAt', 'migration'].map(key => [key, post[key]]));
}

// Session-protected callers own mutations. Public reads are filtered inside the object too.
export class OwnerPosts {
  constructor(state) { this.storage = state.storage; }
  async fetch(request) {
    try {
      const { operation, slug, source, version, visibility, migration, query = '', topic = '', tag = '' } = await request.json();
      if (operation === 'list' || operation === 'public-list') {
        const words = String(query).toLocaleLowerCase().split(/\s+/).filter(Boolean);
        const posts = [...(await this.storage.list({ prefix: 'post:' })).values()]
          .filter(post => operation !== 'public-list' || (post.visibility === 'public' && !post.migration?.pending))
          .filter(post => (!topic || post.topic === topic) && (!tag || post.tags.includes(tag)) && words.every(word => [post.title, post.description, post.body, ...post.tags].join(' ').toLocaleLowerCase().includes(word)))
          .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
        return Response.json({ posts: posts.map(postSummary) });
      }
      if (!slugPattern.test(slug ?? '') || slug.length > 80) throw new PostError('글 주소를 확인해 주세요.');
      if (operation === 'get' || operation === 'public-get') {
        const post = await this.storage.get(`post:${slug}`);
        if (!post || (operation === 'public-get' && (post.visibility !== 'public' || post.migration?.pending))) return Response.json(null, { status: 404 });
        return Response.json(post);
      }
      if (!['save', 'import', 'migrated', 'visibility', 'delete'].includes(operation)) throw new PostError('요청을 찾을 수 없습니다.', 404);
      return await this.storage.transaction(async () => {
        const key = `post:${slug}`, previous = await this.storage.get(key);
        if (!Number.isSafeInteger(version) || version !== (previous?.version ?? 0)) throw new PostError('다른 화면에서 글이 변경됐습니다. 입력한 내용을 복사한 뒤 새로 불러와 주세요.', 409);
        if (!['save', 'import'].includes(operation) && !previous) throw new PostError('글을 찾을 수 없습니다.', 404);
        if (operation === 'import' && previous) throw new PostError('이미 가져온 글입니다.', 409);
        if (operation === 'visibility' && previous.migration?.pending) throw new PostError('기존 공개 페이지의 이전을 먼저 완료해 주세요.', 409);
        if (operation === 'delete') { await this.storage.delete(key); return Response.json({ deleted: true }); }
        if (operation === 'visibility' && !['public', 'private'].includes(visibility)) throw new PostError('공개 범위를 확인해 주세요.');
        const data = ['save', 'import'].includes(operation) ? parsePost(source) : previous;
        if (data.slug !== slug) throw new PostError('저장한 글의 주소는 바꿀 수 없습니다. 새 글로 저장해 주세요.');
        const post = { ...data, ...(previous?.migration ? { migration: previous.migration } : {}), visibility: operation === 'visibility' ? visibility : previous?.visibility ?? 'private', version: version + 1, updatedAt: new Date().toISOString() };
        if (operation === 'import') post.migration = migration;
        if (operation === 'migrated') post.migration = { ...previous.migration, pending: false };
        await this.storage.put(key, post);
        return Response.json(post, { status: previous ? 200 : 201 });
      });
    } catch (error) {
      return Response.json({ message: error instanceof PostError ? error.message : '글을 저장하지 못했습니다. 다시 시도해 주세요.' }, { status: error instanceof PostError ? error.status : 503 });
    }
  }
}

export async function postOperation(env, operation, data = {}) {
  if (!env.OWNER_POSTS) throw new PostError('글 저장소가 아직 연결되지 않았습니다.', 503);
  const object = env.OWNER_POSTS.get(env.OWNER_POSTS.idFromName('owner-posts'));
  return object.fetch(new Request('https://owner-posts/', { method: 'POST', body: JSON.stringify({ ...data, operation }) }));
}

export async function readPostInput(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new PostError('JSON 형식으로 요청해 주세요.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new PostError('저장할 내용이 없습니다.');
  const chunks = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > sourceLimit * 2) { await reader.cancel(); throw new PostError('글의 크기를 줄여 주세요.', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new PostError('저장 요청을 확인해 주세요.'); }
}
