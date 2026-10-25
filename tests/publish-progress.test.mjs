import test from 'node:test';
import assert from 'node:assert/strict';
import { githubSaveTarget, manifestMatches, progressTargets, sourceDigest, workflowStates } from '../src/lib/publish-progress.mjs';
import { handlePublishProgress } from '../server/publish-progress.mjs';

const BEFORE = 'a'.repeat(40), SAVED = 'b'.repeat(40), NEWER = 'c'.repeat(40);
const article = 'content/articles/graphics/water-playback.md';
const config = 'content/portfolio-copy/new-copy.json';
const content = '{"version":1,"changes":{"profile.name":"Example"}}\n';
const HASH = await sourceDigest(content);
function fixture({ found = true, missingPaths = [], source = content, revision = SAVED, publicRevision = revision, include = true, conclusion = 'success', latest = SAVED, ancestry = 'ahead', network = false, limited = false, draft = false } = {}) {
  const calls = [];
  const manifest = { version: 1, revision, files: { [article]: HASH, ...(include ? { [config]: HASH } : {}) } };
  const env = { ASSETS: { fetch: async () => Response.json(manifest) } };
  const runs = [
    { id: 11, path: '.github/workflows/deploy.yml', name: 'Publish game development notes' },
    { id: 12, path: '.github/workflows/authoring.yml', name: 'Publish owner-only editor' },
  ].map(run => ({ ...run, event: 'push', head_branch: 'main', head_sha: revision, status: 'completed', conclusion, html_url: 'https://attacker.example/ignore' }));
  const fetcher = async (address, options) => {
    calls.push(address);
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.headers.Cookie, undefined);
    if (network) throw new Error('upstream-private-key-must-not-leak');
    if (limited) return Response.json({ message: 'private-provider-details' }, { status: 429, headers: { 'Retry-After': '75' } });
    const url = new URL(address);
    if (url.hostname === 'raw.githubusercontent.com') return found && !missingPaths.some(path => url.pathname.endsWith('/' + path)) ? new Response(draft ? '---\ndraft: true\n---\ntext' : source) : new Response(null, { status: 404 });
    if (url.hostname === 'imjae.github.io') return Response.json({ ...manifest, revision: publicRevision });
    if (url.pathname.endsWith('/commits')) return Response.json(latest ? [{ sha: latest }] : []);
    if (url.pathname.includes('/compare/')) return Response.json({ status: ancestry });
    if (url.pathname.endsWith('/actions/runs')) return Response.json({ workflow_runs: runs });
    throw new Error('Unexpected URL');
  };
  const call = (targets = [{ path: config, expectedHash: HASH }], kind = 'status', overrides = {}) => handlePublishProgress(new Request('https://author.example/api/publish-progress/' + kind, {
    method: 'POST', headers: { Origin: 'https://author.example', 'Content-Type': 'application/json', ...overrides.headers }, body: JSON.stringify({ targets }),
  }), env, { fetcher });
  return { call, calls, env, runs };
}

test('저장 링크는 해당 저장소 main의 공개 글 수정·허용된 JSON 추가만 추적한다', () => {
  assert.deepEqual(githubSaveTarget(`https://github.com/imjae/imjae.github.io/edit/main/${article}`), { path: article });
  const url = new URL('https://github.com/imjae/imjae.github.io/new/main'); url.searchParams.set('filename', config); url.searchParams.set('value', content);
  assert.deepEqual(githubSaveTarget(url.href), { path: config, content });
  for (const address of ['https://attacker.example/imjae/imjae.github.io/edit/main/' + article, 'https://github.com@attacker.example/x', 'https://github.com/other/repo/edit/main/' + article, 'https://github.com/imjae/imjae.github.io/edit/dev/' + article, 'https://github.com/imjae/imjae.github.io/edit/main/content/articles/graphics/%252e%252e/secret.md', 'https://github.com/imjae/imjae.github.io/delete/main/' + article]) assert.equal(githubSaveTarget(address), null);
  url.searchParams.set('filename', article); assert.equal(githubSaveTarget(url.href), null);
});

test('개행 방식이 다른 원문은 동일하게 식별하고 잘못된 추적 정보는 거부한다', async () => {
  assert.equal(await sourceDigest('a\r\nb\r\n'), await sourceDigest('a\nb\n'));
  for (const targets of [[], [{ path: '../secret' }], [{ path: config }], [{ path: config, expectedHash: HASH }, { path: config, expectedHash: HASH }], [{ path: article, beforeCommit: 'bad' }]]) assert.throws(() => progressTargets(targets));
  assert.equal(progressTargets([{ path: article }], true).length, 1);
});

test('글 편집창을 열기 전 실제 수정 전 커밋을 고정하고 초안 경로는 거부한다', async () => {
  const f = fixture({ latest: BEFORE });
  const result = await (await f.call([{ path: article }], 'start')).json();
  assert.equal(result.targets[0].beforeCommit, BEFORE);
  assert.ok(new URL(f.calls[0]).searchParams.has('until'));
  assert.equal((await f.call([{ path: 'content/articles/notes/not-published.md' }], 'start')).status, 400);
});

test('새 파일이 없거나 본문 커밋이 그대로면 배포 성공 기록이 있어도 저장 완료로 표시하지 않는다', async () => {
  const missing = fixture({ found: false });
  assert.equal((await (await missing.call()).json()).phase, 'waiting');
  assert.equal(missing.calls.some(url => url.includes('/actions/runs')), false);
  const unchanged = fixture({ latest: BEFORE });
  assert.equal((await (await unchanged.call([{ path: article, beforeCommit: BEFORE }])).json()).phase, 'waiting');
});

test('저장 예상 내용과 다른 파일은 충돌로 남기고 임의의 배포 완료를 인정하지 않는다', async () => {
  const f = fixture({ source: 'different' });
  const result = await (await f.call()).json();
  assert.equal(result.phase, 'conflict');
  assert.equal(f.calls.some(url => url.includes('/actions/runs')), false);
});

test('대상 커밋·두 워크플로·두 실제 빌드의 원문이 일치해야 반영 완료다', async () => {
  const f = fixture();
  const result = await (await f.call()).json();
  assert.equal(result.phase, 'complete');
  assert.equal(result.targets[0].commit, SAVED);
  assert.ok(result.workflows.every(w => w.state === 'success' && w.url.startsWith('https://github.com/imjae/imjae.github.io/actions/runs/')));
  assert.ok(!JSON.stringify(result).includes('attacker'));
});

test('편집·공개 버전 차이 또는 실제 파일 누락은 두 Actions 성공만으로 완료하지 않는다', async () => {
  for (const options of [{ publicRevision: BEFORE }, { include: false }]) {
    const result = await (await fixture(options).call()).json();
    assert.equal(result.phase, 'deploying');
  }
});

test('분할 저장의 일부만 커밋되면 반영 완료를 표시하지 않는다', async () => {
  const f = fixture({ missingPaths: ['content/portfolio-copy/other.json'] });
  const targets = [{ path: config, expectedHash: HASH }, { path: 'content/portfolio-copy/other.json', expectedHash: 'd'.repeat(64) }];
  const result = await (await f.call(targets)).json();
  assert.equal(result.phase, 'waiting');
  assert.match(result.message, /1\/2개 저장 완료/);
});

test('재배포된 후속 커밋은 대상 저장을 포함하고 두 빌드가 모두 반영했을 때만 허용한다', async () => {
  const targets = [{ path: config, expectedHash: HASH, commit: SAVED }];
  const ahead = fixture({ revision: NEWER });
  assert.equal((await (await ahead.call(targets)).json()).phase, 'complete');
  const unrelated = fixture({ revision: NEWER, ancestry: 'behind' });
  assert.notEqual((await (await unrelated.call(targets)).json()).phase, 'complete');
});

test('실패·진행 중·취소·다른 커밋·다른 workflow를 구분한다', async () => {
  const f = fixture({ conclusion: 'failure' });
  assert.equal((await (await f.call()).json()).phase, 'failed');
  f.runs[0].status = 'in_progress'; f.runs[1].conclusion = 'cancelled';
  assert.deepEqual(workflowStates(f.runs, SAVED).map(w => w.state), ['running', 'superseded']);
  assert.ok(workflowStates(f.runs, BEFORE).every(w => w.state === 'waiting'));
  assert.ok(workflowStates([{ ...f.runs[0], path: '.github/workflows/other.yml' }], SAVED).every(w => w.state === 'waiting'));
});

test('초안 전환은 저장을 인정하되 공개 글로 복귀시키지 않는다', async () => {
  const result = await (await fixture({ draft: true }).call([{ path: article, beforeCommit: BEFORE }])).json();
  assert.equal(result.phase, 'draft');
});

test('교차 사이트 요청과 과도한 입력은 조회 전에 거부한다', async () => {
  const f = fixture();
  assert.equal((await f.call(undefined, 'status', { headers: { Origin: 'https://attacker.example' } })).status, 403);
  assert.equal((await f.call(Array.from({ length: 13 }, () => ({ path: config, expectedHash: HASH })))).status, 400);
  assert.equal(f.calls.length, 0);
});

test('네트워크·사용량 제한에서는 안전한 재시도 안내를 반환하고 성공으로 바꾸지 않는다', async () => {
  for (const options of [{ network: true }, { limited: true }]) {
    const response = await fixture(options).call();
    assert.ok([429, 503].includes(response.status));
    assert.doesNotMatch(await response.text(), /private-key|private-provider-details/);
    assert.ok(Number(response.headers.get('Retry-After')) >= 30);
  }
});

test('배포 확인 원문은 경로·해시·버전이 전부 일치해야 한다', () => {
  const target = [{ path: config, expectedHash: HASH }];
  assert.equal(manifestMatches({ version: 1, revision: SAVED, files: { [config]: HASH } }, target), true);
  assert.equal(manifestMatches({ version: 1, revision: SAVED, files: { [config]: 'x' } }, target), false);
  assert.equal(manifestMatches({ version: 1, revision: 'main', files: { [config]: HASH } }, target), false);
});
