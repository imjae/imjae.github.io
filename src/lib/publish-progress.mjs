export const commitPattern = /^[a-f0-9]{40}$/;
export const hashPattern = /^[a-f0-9]{64}$/;
export const publishWorkflows = ['.github/workflows/deploy.yml', '.github/workflows/authoring.yml'];

export function publishPath(value) {
  if (typeof value !== 'string' || value.length > 240 || !/^content\/(?:articles\/(?:gameplay|graphics|tools|ai|notes|math|reading)\/[a-z0-9-]+\.md|(?:portfolio-copy|pins|project-videos)\/[a-zA-Z0-9_.-]+\.json)$/.test(value)) throw new Error('저장할 파일 경로를 확인해 주세요.');
  return value;
}

export function githubSaveTarget(href) {
  try {
    const url = new URL(href);
    if (url.origin !== 'https://github.com' || url.username || url.password) return null;
    const prefix = '/imjae/imjae.github.io/';
    if (url.pathname === prefix + 'new/main') {
      const path = publishPath(url.searchParams.get('filename'));
      if (path.startsWith('content/articles/')) return null; // 새 초안은 기존 새 글 작성 흐름을 유지한다.
      const content = url.searchParams.get('value');
      return content === null ? null : { path, content };
    }
    if (url.pathname.startsWith(prefix + 'edit/main/')) {
      const path = publishPath(decodeURIComponent(url.pathname.slice((prefix + 'edit/main/').length)));
      return path.startsWith('content/articles/') ? { path } : null;
    }
  } catch { /* 관리 대상이 아닌 링크는 기존 방식으로 연다. */ }
  return null;
}

export async function sourceDigest(source) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source.replaceAll('\r\n', '\n')));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export function progressTargets(input, start = false) {
  if (!Array.isArray(input) || !input.length || input.length > 12) throw new Error('한 번에 확인할 저장은 1~12개여야 합니다.');
  const paths = new Set();
  return input.map(item => {
    const path = publishPath(item?.path);
    if (paths.has(path)) throw new Error('중복된 저장 파일입니다.');
    paths.add(path);
    const article = path.startsWith('content/articles/');
    if ((!article || !start && item.expectedHash) && !hashPattern.test(item.expectedHash ?? '')) throw new Error('저장 내용의 식별자를 확인해 주세요.');
    if (!start && article && !commitPattern.test(item.beforeCommit ?? '')) throw new Error('수정 전 버전을 확인해 주세요.');
    if (item.commit && !commitPattern.test(item.commit)) throw new Error('저장된 버전을 확인해 주세요.');
    return { path, ...(item.expectedHash ? { expectedHash: item.expectedHash } : {}), ...(item.beforeCommit ? { beforeCommit: item.beforeCommit } : {}), ...(item.commit ? { commit: item.commit } : {}) };
  });
}

export function workflowStates(runs, revision) {
  return publishWorkflows.map(path => {
    const run = runs.filter(item => item.path?.split('@')[0] === path && item.head_sha === revision && item.head_branch === 'main' && ['push', 'workflow_dispatch'].includes(item.event)).sort((a, b) => b.id - a.id)[0];
    if (!run) return { state: 'waiting' };
    const state = run.status !== 'completed' ? 'running' : run.conclusion === 'success' ? 'success' : ['cancelled', 'skipped'].includes(run.conclusion) ? 'superseded' : 'failed';
    return { state, ...(Number.isSafeInteger(run.id) ? { url: `https://github.com/imjae/imjae.github.io/actions/runs/${run.id}` } : {}) };
  });
}

export function manifestMatches(manifest, targets) {
  return manifest?.version === 1 && commitPattern.test(manifest.revision ?? '') && targets.every(target => hashPattern.test(target.expectedHash ?? '') && manifest.files?.[target.path] === target.expectedHash);
}
