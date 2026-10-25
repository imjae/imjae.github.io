import { commitPattern, manifestMatches, progressTargets, sourceDigest, workflowStates } from '../src/lib/publish-progress.mjs';

const api = 'https://api.github.com/repos/imjae/imjae.github.io';
const raw = 'https://raw.githubusercontent.com/imjae/imjae.github.io/';
const publicOrigin = 'https://imjae.github.io';
class ProgressError extends Error {
  constructor(message, status = 503, retryAfter = 30) { super(message); this.status = status; this.retryAfter = retryAfter; }
}

export async function handlePublishProgress(request, env, { fetcher = fetch } = {}) {
  try {
    const url = new URL(request.url);
    if (request.method !== 'POST' || request.headers.get('Origin') !== url.origin || !request.headers.get('Content-Type')?.startsWith('application/json')) return Response.json({ message: '원래 수정 화면에서 다시 시도해 주세요.' }, { status: 403 });
    const text = await request.text();
    if (text.length > 16000) throw new ProgressError('확인할 저장이 너무 많습니다.', 400);
    const start = url.pathname === '/api/publish-progress/start';
    if (!start && url.pathname !== '/api/publish-progress/status') throw new ProgressError('요청한 화면을 찾을 수 없습니다.', 404);
    let targets;
    try { targets = progressTargets(JSON.parse(text).targets, start); } catch { throw new ProgressError('저장 정보를 확인해 주세요.', 400); }
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'imjae-blog-publish-progress' };
    const read = async (address, json = true, ttl = 20) => {
      const response = await fetcher(address, { redirect: 'manual', headers, signal: AbortSignal.timeout(10000), cf: { cacheEverything: true, cacheTtl: ttl } });
      if (response.status === 404) return null;
      if ([403, 429].includes(response.status)) throw new ProgressError('조회가 잠시 제한됐습니다. 잠시 후 다시 확인합니다.', 429, Math.min(300, Math.max(60, Number(response.headers.get('Retry-After')) || 60)));
      if (!response.ok) throw new ProgressError('배포 상태를 확인하지 못했습니다. 다시 확인해 주세요.');
      return json ? response.json() : response.text();
    };
    const localResponse = await env.ASSETS.fetch(new Request(new URL('/publish-manifest.json', url.origin)));
    if (!localResponse.ok) throw new ProgressError('편집 화면의 배포 정보를 확인하지 못했습니다.');
    const local = await localResponse.json();
    for (const target of targets) if (target.path.startsWith('content/articles/') && !Object.hasOwn(local.files ?? {}, target.path)) throw new ProgressError('공개된 글만 이 화면에서 확인할 수 있습니다.', 400);
    const latest = async (path, snapshot = false) => {
      // 저장 창을 열기 전 기준은 공유 캐시의 이전 응답을 사용하지 않는다.
      const until = snapshot ? '&until=' + encodeURIComponent(new Date().toISOString()) : '';
      const commits = await read(`${api}/commits?sha=main&path=${encodeURIComponent(path)}&per_page=1${until}`);
      return Array.isArray(commits) && commitPattern.test(commits[0]?.sha ?? '') ? commits[0].sha : null;
    };
    const source = (path, revision) => read(raw + revision + '/' + path.split('/').map(encodeURIComponent).join('/'), false, revision === 'main' ? 10 : 86400);
    if (start) {
      targets = await Promise.all(targets.map(async target => target.path.startsWith('content/articles/') ? { ...target, beforeCommit: await latest(target.path, true) } : target));
      if (targets.some(t => t.path.startsWith('content/articles/') && !t.beforeCommit)) throw new ProgressError('수정 전 버전을 확인하지 못했습니다.');
      return Response.json({ targets });
    }
    const checked = await Promise.all(targets.map(async target => {
      let commit = target.commit;
      if (!commit) {
        if (!target.beforeCommit) {
          const current = await source(target.path, 'main');
          if (current === null) return { ...target, state: 'waiting' };
          if (await sourceDigest(current) !== target.expectedHash) return { ...target, state: 'conflict' };
        }
        commit = await latest(target.path);
      }
      if (!commit || commit === target.beforeCommit) return { ...target, state: 'waiting' };
      const content = await source(target.path, commit);
      if (content === null) return { ...target, state: 'conflict' };
      const expectedHash = await sourceDigest(content);
      if (target.expectedHash && expectedHash !== target.expectedHash) return { ...target, state: 'conflict' };
      const frontmatter = /^\uFEFF?---\n([\s\S]*?)\n---/.exec(content.replaceAll('\r\n', '\n'))?.[1] ?? '';
      const draft = target.path.endsWith('.md') && /^draft:\s*true\s*(?:#.*)?$/m.test(frontmatter);
      return { ...target, expectedHash, commit, state: draft ? 'draft' : 'committed' };
    }));
    if (checked.some(t => t.state === 'conflict')) return Response.json({ phase: 'conflict', targets: checked, workflows: [], message: '저장할 내용과 다른 버전이 확인됐습니다. 변경 내용을 확인해 주세요.' });
    if (checked.some(t => t.state === 'draft')) return Response.json({ phase: 'draft', targets: checked, workflows: [], message: '초안으로 저장됐습니다. 공개 목록에는 표시되지 않습니다.' });
    const committed = checked.filter(t => t.commit && t.state === 'committed');
    if (!committed.length) return Response.json({ phase: 'waiting', targets: checked, workflows: [], message: 'GitHub에서 Commit changes를 완료해 주세요. 창을 닫아도 이 화면에서 계속 확인합니다.' });
    let publicManifest;
    try { publicManifest = await read(`${publicOrigin}/publish-manifest.json`, true, 10); } catch { /* 배포 전·CDN 갱신 중에는 아직 완료하지 않는다. */ }
    const allCommitted = committed.length === checked.length;
    let revision = committed.at(-1).commit;
    let live = false;
    if (allCommitted && publicManifest?.revision === local.revision && manifestMatches(local, checked) && manifestMatches(publicManifest, checked)) {
      const ancestry = await Promise.all(committed.map(async t => t.commit === local.revision || ['ahead', 'identical'].includes((await read(`${api}/compare/${t.commit}...${local.revision}`, true, 300))?.status)));
      if (ancestry.every(Boolean)) { revision = local.revision; live = true; }
    }
    const runs = await read(`${api}/actions/runs?head_sha=${revision}&per_page=30`);
    const workflows = workflowStates(runs?.workflow_runs ?? [], revision);
    const phase = allCommitted && live && workflows.every(w => w.state === 'success') ? 'complete' : workflows.some(w => w.state === 'failed') ? 'failed' : allCommitted ? 'deploying' : 'waiting';
    const message = phase === 'complete' ? '공개 블로그와 편집 화면에 모두 반영됐습니다.' : phase === 'failed' ? '배포에 실패했습니다. 실패한 배포의 기록을 확인해 주세요.' : !allCommitted ? `${committed.length}/${checked.length}개 저장 완료 · 나머지 GitHub 저장도 확정해 주세요.` : workflows.some(w => w.state === 'superseded') ? '다음 저장이 이어서 배포되고 있습니다. 실제 반영까지 확인합니다.' : '공개 블로그와 편집 화면의 배포·반영을 확인하고 있습니다.';
    return Response.json({ phase, targets: checked, workflows, revision, message });
  } catch (error) {
    const known = error instanceof ProgressError;
    return Response.json({ message: known ? error.message : '진행 상태를 확인하지 못했습니다. 다시 확인해 주세요.', retryAfter: known ? error.retryAfter : 30 }, { status: known ? error.status : 503, headers: { 'Retry-After': String(known ? error.retryAfter : 30) } });
  }
}
