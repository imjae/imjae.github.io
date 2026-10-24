import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { canonicalSketchUrl, resolveSketchSource } from '../scripts/sketch-source.mjs';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'sketch-source-'));
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git(['init', '--quiet']);
    git(['config', 'user.name', 'Fixture']);
    git(['config', 'user.email', 'fixture@example.invalid']);
    git(['config', 'core.autocrlf', 'false']);
    mkdirSync(join(root, 'content/articles/tools'), { recursive: true });
    const file = join(root, 'content/articles/tools/different-file-name.md');
    const source = '---\ntitle: "테스트"\nslug: public-slug\ndraft: false\n---\n\n원문입니다.\n';
    writeFileSync(file, source);
    writeFileSync(join(root, 'content/articles/tools/draft.md'), '---\nslug: draft-only\ndraft: true\n---\n비공개');
    git(['add', '.']);
    git(['-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Fixture']);
    run({ root, git, file, source });
  } finally {
    // Delete only the exact fixture directory generated inside the temp folder.
    assert.equal(resolve(root).startsWith(resolve(tmpdir()) + '\\') || resolve(root).startsWith(resolve(tmpdir()) + '/'), true);
    rmSync(root, { recursive: true, force: true });
  }
}

test('블로그 글 주소만 정규화하고 쿼리와 문단 링크를 제거한다', () => {
  assert.equal(canonicalSketchUrl('https://imjae.github.io/writing/public-slug?utm_source=tablet#one'), 'https://imjae.github.io/writing/public-slug/');
  for (const url of ['https://example.com/writing/x/', 'http://imjae.github.io/writing/x/', 'https://imjae.github.io/portfolio/', 'https://user@imjae.github.io/writing/x/', 'https://imjae.github.io/writing/%2e%2e/']) {
    assert.throws(() => canonicalSketchUrl(url));
  }
});

test('slug와 다른 실제 파일명을 찾고 수정 중인 파일 대신 고정 커밋의 바이트를 읽는다', () => fixture(({ root, file, source, git }) => {
  const base = git(['rev-parse', 'HEAD']);
  writeFileSync(file, source.replace('원문입니다.', '아직 저장하지 않은 편집입니다.'));
  writeFileSync(join(root, 'content/articles/tools/untracked.md'), '---\nslug: untracked\ndraft: false\n---\n미저장');
  const target = resolveSketchSource('https://imjae.github.io/writing/public-slug/', { root, ref: base });
  assert.equal(target.sourcePath, 'content/articles/tools/different-file-name.md');
  assert.equal(target.baseCommit, base);
  assert.equal(target.sourceSha256, createHash('sha256').update(source).digest('hex'));
  assert.throws(() => resolveSketchSource('https://imjae.github.io/writing/untracked/', { root }), /공개된 글/);
  assert.throws(() => resolveSketchSource('https://imjae.github.io/writing/draft-only/', { root }), /공개된 글/);
}));

test('존재하지 않는 ref와 중복된 공개 slug는 거절한다', () => fixture(({ root, source, git }) => {
  assert.throws(() => resolveSketchSource('https://imjae.github.io/writing/public-slug/', { root, ref: 'missing-ref' }));
  writeFileSync(join(root, 'content/articles/tools/duplicate.md'), source);
  git(['add', '.']);
  git(['-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Duplicate']);
  assert.throws(() => resolveSketchSource('https://imjae.github.io/writing/public-slug/', { root }), /중복/);
}));
