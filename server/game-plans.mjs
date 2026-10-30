import { findProject, findProjectDocument } from '../src/data/projects.mjs';

export class GamePlanError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const documentIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const legacyRecord = (id, record) => ({ id, body: record?.body ?? '', version: record?.version ?? 0, updatedAt: record?.updatedAt ?? null });
const legacyKey = (id, section) => section === 'plans' ? `game-plan:${id}` : `project-resource:${id}`;
const prefixFor = (id, section) => `project-document:${id}:${section}:`;
const indexPrefix = (id, section) => `project-document-index:${id}:${section}:`;
export function safeProjectImage(value) {
  if (typeof value !== 'string' || value.length > 2000 || /[\\\u0000-\u0020]/.test(value)) return '';
  if (/^\/(?:media|assets)\//.test(value)) return value;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
function documentRecord(record, section, documentId = record?.id) {
  const firstImage = /!\[[^\]]*\]\(([^\s)]+)/.exec(record?.body ?? '')?.[1] ?? '';
  return { id: documentId, title: record?.title || findProjectDocument(section).title, folder: record?.folder ?? '', imageUrl: safeProjectImage(record?.imageUrl || firstImage), caption: record?.caption ?? '', body: record?.body ?? '', version: record?.version ?? 0, updatedAt: record?.updatedAt ?? null };
}
function documentInput(input, section) {
  const text = (key, limit, required = false) => {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > limit || (required && !value.trim()) || /[\u0000-\u001f]/.test(value)) throw new GamePlanError(`${key === 'title' ? '제목' : key === 'folder' ? '폴더' : '이미지 설명'} 항목을 확인해 주세요.`);
    return value.trim();
  };
  const title = text('title', 110, true), rawFolder = text('folder', 300);
  const segments = rawFolder ? rawFolder.split('/').map(part => part.trim()) : [];
  if (segments.length > 8 || segments.some(part => !part || part === '.' || part === '..' || part.length > 60)) throw new GamePlanError('폴더는 /로 구분해 8단계까지 적어 주세요.');
  const caption = text('caption', 280), imageUrl = input.imageUrl ?? '';
  if (typeof imageUrl !== 'string' || (imageUrl.trim() && !safeProjectImage(imageUrl.trim()))) throw new GamePlanError('대표 이미지는 HTTPS 주소나 /media/, /assets/ 경로를 사용해 주세요.');
  return { title, folder: section === 'plans' ? segments.join('/') : '', imageUrl: section === 'resources' ? safeProjectImage(imageUrl.trim()) : '', caption: section === 'resources' ? caption : '' };
}

// Preserve the existing plan instance and keys; resources use a separate key in that instance.
export async function gamePlanStorage(storage, input) {
  try {
    const { operation, id, section = 'plans', body, version, documentId } = input;
    if (!findProject(id) || !findProjectDocument(section)) throw new GamePlanError('프로젝트 문서를 찾을 수 없습니다.', 404);
    const rootKey = legacyKey(id, section);
    if (operation === 'game-plan-get') return Response.json(legacyRecord(id, await storage.get(rootKey)));
    if (operation === 'game-plan-list') {
      const root = await storage.get(rootKey);
      // List metadata only: opening a large tree must not load every Markdown body.
      const documents = [...(await storage.list({ prefix: indexPrefix(id, section) })).values()];
      if (root) documents.unshift(documentRecord(root, section, 'main'));
      documents.sort((a, b) => a.folder.localeCompare(b.folder, 'ko') || a.title.localeCompare(b.title, 'ko', { numeric: true }) || a.id.localeCompare(b.id));
      return Response.json({ documents: documents.map(({ body: _body, ...metadata }) => metadata) });
    }
    const itemOperation = ['game-plan-document-get', 'game-plan-document-save'].includes(operation);
    if (itemOperation && (typeof documentId !== 'string' || documentId.length > 80 || !documentIdPattern.test(documentId))) throw new GamePlanError('문서를 찾을 수 없습니다.', 404);
    const key = itemOperation && documentId !== 'main' ? prefixFor(id, section) + documentId : rootKey;
    if (operation === 'game-plan-document-get') {
      const record = await storage.get(key);
      if (!record && documentId !== 'main') throw new GamePlanError('문서를 찾을 수 없습니다.', 404);
      return Response.json(documentRecord(record, section, documentId));
    }
    if (!['game-plan-save', 'game-plan-document-save'].includes(operation)) throw new GamePlanError('요청을 찾을 수 없습니다.', 404);
    if (typeof body !== 'string') throw new GamePlanError('문서 본문을 확인해 주세요.');
    if (new TextEncoder().encode(body).length > 200000) throw new GamePlanError('문서의 크기를 줄여 주세요.', 413);
    const fields = itemOperation ? documentInput(input, section) : {};
    return await storage.transaction(async () => {
      const previous = await storage.get(key);
      if (!Number.isSafeInteger(version) || version !== (previous?.version ?? 0)) throw new GamePlanError('다른 화면에서 문서가 변경됐습니다. 입력한 내용을 복사한 뒤 새로 불러와 주세요.', 409);
      const plan = { ...previous, ...fields, id: key === rootKey ? id : documentId, body, version: version + 1, updatedAt: new Date().toISOString() };
      await storage.put(key, plan);
      if (itemOperation && documentId !== 'main') {
        const { body: _body, ...metadata } = documentRecord(plan, section, documentId);
        await storage.put(indexPrefix(id, section) + documentId, metadata);
      }
      return Response.json(itemOperation ? documentRecord(plan, section, documentId) : legacyRecord(id, plan), { status: previous ? 200 : 201 });
    });
  } catch (error) {
    return Response.json({ message: error instanceof GamePlanError ? error.message : '문서를 저장하지 못했습니다. 다시 시도해 주세요.' }, { status: error instanceof GamePlanError ? error.status : 503 });
  }
}

export async function gamePlanOperation(env, operation, data = {}) {
  if (!env.OWNER_POSTS) throw new GamePlanError('문서 저장소가 아직 연결되지 않았습니다.', 503);
  const object = env.OWNER_POSTS.get(env.OWNER_POSTS.idFromName('game-plans'));
  return object.fetch(new Request('https://game-plans/', { method: 'POST', body: JSON.stringify({ ...data, operation }) }));
}
