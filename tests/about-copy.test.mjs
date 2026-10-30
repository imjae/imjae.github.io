import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aboutCopyIssues, validateAboutCopy, selectAboutCopy, prepareAboutSaves, restoreAboutDraft } from '../src/lib/about-copy.mjs';
import { readAboutCopy } from '../src/lib/about-copy.server.mjs';
import { githubSaveTarget, progressTargets, sourceDigest } from '../src/lib/publish-progress.mjs';

const base = { name: 'imjae', summary: '소개', role: '게임 개발자', interests: '게임플레이', email: '', github: 'https://github.com/imjae' };
const record = (values, createdAt = '2026-10-30T04:00:00.000Z') => ({ version: 1, page: 'about', createdAt, values });

test('About의 허용한 항목만 저장하며 잘못된 링크와 이메일을 거절한다', () => {
  for (const values of [{ github: 'javascript:alert(1)' }, { github: 'https://github.com.evil.test/imjae' }, { github: 'https://user@github.com/imjae' }, { email: 'a@example.com?bcc=other@example.com' }, { email: 'a%0d%0a@example.com' }, { portrait: 'private.jpg' }, { name: '' }, { name: 3 }, { role: 'a\nb' }, { summary: 'a'.repeat(601) }, []]) assert.ok(aboutCopyIssues(values).length);
  assert.deepEqual(aboutCopyIssues({ email: '', summary: '줄바꿈\n<script>도 문자열', github: base.github }), []);
  assert.throws(() => validateAboutCopy(record({ name: '이름' }, '2026-02-30T00:00:00.000Z')));
  assert.throws(() => validateAboutCopy({ ...record({ name: '이름' }), page: 'portfolio' }));
});

test('변경된 항목만 덮고 이메일 지우기와 최신 저장 순서를 유지한다', () => {
  const fields = selectAboutCopy([record({ name: '새 이름', email: 'a@example.com' }), record({ email: '' }, '2026-10-30T05:00:00.000Z')], base);
  assert.equal(fields.name, '새 이름'); assert.equal(fields.email, ''); assert.equal(fields.role, base.role);
});

test('저장 URL이 About 설정과 배포 추적에 연결되고 한글·줄바꿈을 보존한다', async () => {
  const changes = { name: '한'.repeat(80), summary: '첫줄\n' + '가'.repeat(590), role: '나'.repeat(180), interests: '다'.repeat(180) };
  const saves = prepareAboutSaves(changes);
  assert.ok(saves.length > 1);
  const values = {};
  for (const save of saves) {
    assert.ok(save.url.length <= 8000);
    assert.deepEqual(githubSaveTarget(save.url), { path: save.path, content: save.content });
    assert.equal(progressTargets([{ path: save.path, expectedHash: await sourceDigest(save.content) }], true)[0].path, save.path);
    Object.assign(values, JSON.parse(new URL(save.url).searchParams.get('value')).values);
  }
  assert.deepEqual(values, changes);
  assert.equal(githubSaveTarget('https://github.com/imjae/imjae.github.io/new/main?filename=content/about-copy/../../private.json&value=x'), null);
});

test('같은 버전의 임시 편집을 복원하고 새 배포와 충돌하면 별도 복원을 기다린다', () => {
  const changes = { name: '임시 이름', email: '잘못된 주소' };
  assert.deepEqual(restoreAboutDraft({ base, changes }, base), { changes, previous: null });
  const newer = { ...base, role: '새 역할' };
  const pending = restoreAboutDraft({ base, changes }, newer);
  assert.deepEqual(pending, { changes: {}, previous: changes });
  assert.deepEqual(restoreAboutDraft({ base: newer, ...pending }, newer), pending);
  assert.deepEqual(restoreAboutDraft({ base, changes: { name: base.name, unknown: 'x' } }, base), { changes: {}, previous: null });
});

test('저장한 About 설정을 다시 읽으면 공개 렌더링 값으로 복원한다', async () => {
  const root = await mkdtemp(join(tmpdir(), 'about-copy-'));
  const directory = join(root, 'content/about-copy');
  try {
    assert.deepEqual(await readAboutCopy(base, root), base);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'saved.json'), JSON.stringify(record({ name: '저장한 이름', summary: '첫줄\n다음줄' })));
    const result = await readAboutCopy(base, root);
    assert.equal(result.name, '저장한 이름'); assert.equal(result.summary, '첫줄\n다음줄'); assert.equal(result.github, base.github);
  } finally {
    await unlink(join(directory, 'saved.json')).catch(() => {});
    await rmdir(directory).catch(() => {}); await rmdir(join(root, 'content')).catch(() => {}); await rmdir(root);
  }
});
