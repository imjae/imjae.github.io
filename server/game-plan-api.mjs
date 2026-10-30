import { findProject, findProjectDocument } from '../src/data/projects.mjs';
import { readPostInput, PostError } from './owner-posts.mjs';
import { gamePlanOperation, GamePlanError } from './game-plans.mjs';
import { gamePlanPage } from './game-plan-ui.mjs';

// Only called after the Worker's existing GitHub owner check.
export async function handleGamePlans(request, env) {
  try {
    const url = new URL(request.url);
    const legacyId = /^\/games\/([a-z0-9-]+)\/$/.exec(url.pathname)?.[1];
    const page = /^\/projects\/([a-z0-9-]+)\/(plans|resources)\/$/.exec(url.pathname);
    const api = /^\/api\/project-documents\/([a-z0-9-]+)\/(plans|resources)$/.exec(url.pathname);
    const items = /^\/api\/project-documents\/([a-z0-9-]+)\/(plans|resources)\/items(?:\/([a-z0-9-]+))?$/.exec(url.pathname);
    const legacyApiId = /^\/api\/game-plans\/([a-z0-9-]+)$/.exec(url.pathname)?.[1];
    const game = findProject(legacyId ?? page?.[1] ?? api?.[1] ?? items?.[1] ?? legacyApiId);
    const section = findProjectDocument(page?.[2] ?? api?.[2] ?? items?.[2] ?? 'plans');
    if (!game || !section) throw new GamePlanError('프로젝트 문서를 찾을 수 없습니다.', 404);
    if (['GET', 'HEAD'].includes(request.method)) {
      if (legacyId) return new Response(null, { status: 303, headers: { Location: `/projects/${game.id}/plans/${url.search}` } });
      if (page) {
        const list = await gamePlanOperation(env, 'game-plan-list', { id: game.id, section: section.id });
        if (!list.ok) return list;
        const { documents } = await list.json();
        const creating = url.searchParams.get('new') === '1';
        const selected = url.searchParams.get('doc') || documents.find(document => document.id === 'main')?.id || documents[0]?.id || 'main';
        const result = creating ? null : await gamePlanOperation(env, 'game-plan-document-get', { id: game.id, section: section.id, documentId: selected });
        if (result && !result.ok) return result;
        const document = creating ? { id: crypto.randomUUID(), title: '', folder: '', imageUrl: '', caption: '', body: '', version: 0, updatedAt: null } : await result.json();
        const response = await gamePlanPage(game, document, creating || url.searchParams.get('edit') === '1', section, documents, { creating, saved: url.searchParams.get('saved') === '1', page: url.searchParams.has('page') ? Number(url.searchParams.get('page')) : undefined });
        return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
      }
      const operation = items ? (items[3] ? 'game-plan-document-get' : 'game-plan-list') : 'game-plan-get';
      const result = await gamePlanOperation(env, operation, { id: game.id, section: section.id, documentId: items?.[3] });
      if (!result.ok) return result;
      return request.method === 'HEAD' ? new Response(null, { status: result.status, headers: result.headers }) : result;
    }
    if ((!api && !legacyApiId && !items?.[3]) || request.method !== 'POST') throw new GamePlanError('요청을 찾을 수 없습니다.', 405);
    if (request.headers.get('Origin') !== url.origin) throw new GamePlanError('문서 편집 화면에서 다시 시도해 주세요.', 403);
    const data = await readPostInput(request);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new GamePlanError('저장 요청을 확인해 주세요.');
    return await gamePlanOperation(env, items ? 'game-plan-document-save' : 'game-plan-save', { id: game.id, section: section.id, documentId: items?.[3], body: data.body, version: data.version, title: data.title, folder: data.folder, imageUrl: data.imageUrl, caption: data.caption });
  } catch (error) {
    const known = error instanceof GamePlanError || error instanceof PostError;
    return Response.json({ message: known ? error.message : '문서를 불러오지 못했습니다. 다시 시도해 주세요.' }, { status: known ? error.status : 503 });
  }
}
