import { findGame } from '../src/data/games.mjs';
import { readPostInput, PostError } from './owner-posts.mjs';
import { gamePlanOperation, GamePlanError } from './game-plans.mjs';
import { gamePlanPage } from './game-plan-ui.mjs';

// Only called after the Worker's existing GitHub owner check.
export async function handleGamePlans(request, env) {
  try {
    const url = new URL(request.url);
    const pageId = /^\/games\/([a-z0-9-]+)\/$/.exec(url.pathname)?.[1];
    const apiId = /^\/api\/game-plans\/([a-z0-9-]+)$/.exec(url.pathname)?.[1];
    const game = findGame(pageId ?? apiId);
    if (!game) throw new GamePlanError('게임을 찾을 수 없습니다.', 404);
    if (['GET', 'HEAD'].includes(request.method)) {
      const result = await gamePlanOperation(env, 'game-plan-get', { id: game.id });
      if (!result.ok) return result;
      const response = pageId ? await gamePlanPage(game, await result.json(), url.searchParams.get('edit') === '1') : result;
      return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
    }
    if (!apiId || request.method !== 'POST') throw new GamePlanError('요청을 찾을 수 없습니다.', 405);
    if (request.headers.get('Origin') !== url.origin) throw new GamePlanError('기획서 편집 화면에서 다시 시도해 주세요.', 403);
    const data = await readPostInput(request);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new GamePlanError('저장 요청을 확인해 주세요.');
    return await gamePlanOperation(env, 'game-plan-save', { id: game.id, body: data.body, version: data.version });
  } catch (error) {
    const known = error instanceof GamePlanError || error instanceof PostError;
    return Response.json({ message: known ? error.message : '기획서를 불러오지 못했습니다. 다시 시도해 주세요.' }, { status: known ? error.status : 503 });
  }
}
