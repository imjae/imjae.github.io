import { findGame } from '../src/data/games.mjs';

export class GamePlanError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// A separate Durable Object instance and key prefix keep plans out of all post lists.
export async function gamePlanStorage(storage, { operation, id, body, version }) {
  try {
    if (!findGame(id)) throw new GamePlanError('게임을 찾을 수 없습니다.', 404);
    const key = `game-plan:${id}`;
    if (operation === 'game-plan-get') return Response.json(await storage.get(key) ?? { id, body: '', version: 0, updatedAt: null });
    if (operation !== 'game-plan-save') throw new GamePlanError('요청을 찾을 수 없습니다.', 404);
    if (typeof body !== 'string') throw new GamePlanError('기획 본문을 확인해 주세요.');
    if (new TextEncoder().encode(body).length > 200000) throw new GamePlanError('기획서의 크기를 줄여 주세요.', 413);
    return await storage.transaction(async () => {
      const previous = await storage.get(key);
      if (!Number.isSafeInteger(version) || version !== (previous?.version ?? 0)) throw new GamePlanError('다른 화면에서 기획서가 변경됐습니다. 입력한 내용을 복사한 뒤 새로 불러와 주세요.', 409);
      const plan = { id, body, version: version + 1, updatedAt: new Date().toISOString() };
      await storage.put(key, plan);
      return Response.json(plan, { status: previous ? 200 : 201 });
    });
  } catch (error) {
    return Response.json({ message: error instanceof GamePlanError ? error.message : '기획서를 저장하지 못했습니다. 다시 시도해 주세요.' }, { status: error instanceof GamePlanError ? error.status : 503 });
  }
}

export async function gamePlanOperation(env, operation, { id, body, version } = {}) {
  if (!env.OWNER_POSTS) throw new GamePlanError('기획서 저장소가 아직 연결되지 않았습니다.', 503);
  const object = env.OWNER_POSTS.get(env.OWNER_POSTS.idFromName('game-plans'));
  return object.fetch(new Request('https://game-plans/', { method: 'POST', body: JSON.stringify({ operation, id, body, version }) }));
}
