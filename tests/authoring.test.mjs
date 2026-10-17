import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFrontmatter } from '../scripts/frontmatter.mjs';
import { createPost } from '../scripts/new-post.mjs';

test('새 글은 안전한 초안으로 시작하고 한글·따옴표 제목을 보존한다', async () => {
  const root = await mkdtemp(join(tmpdir(),'imjae-author-'));
  try {
    const file = await createPost({ title: '물의 "깊이": 접점', slug: 'water-depth', topic: 'graphics', kind: 'case-study', series: 'dcb' },root);
    const { data, content } = parseFrontmatter(await readFile(file,'utf8'));
    assert.equal(data.draft,true); assert.equal(data.title,'물의 "깊이": 접점'); assert.equal(data.series,'dcb');
    assert.match(data.date,/^\d{4}-\d{2}-\d{2}$/); assert.match(content,/검증한 범위/);
    const original = await readFile(file,'utf8');
    await assert.rejects(createPost({ title:'다른 글', slug:'water-depth', topic:'tools' },root),/이미 사용하는/);
    assert.equal(await readFile(file,'utf8'),original);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('경로 탈출과 잘못된 분류는 파일 작성 전에 거절한다', async () => {
  const root = await mkdtemp(join(tmpdir(),'imjae-invalid-'));
  try {
    await assert.rejects(createPost({ title:'글',slug:'../outside',topic:'graphics' },root),/slug/);
    await assert.rejects(createPost({ title:'글',slug:'valid',topic:'unknown' },root),/주제/);
    await assert.rejects(createPost({ title:'글',slug:'valid',kind:'unknown' },root),/종류/);
    await assert.rejects(createPost({ title:'글',slug:'valid',series:'../outside' },root),/식별자/);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('Jekyll에서 옮긴 두 글의 본문은 원문과 동일하다', async () => {
  const entries = [['2024-02-23-test-post.md','welcome-to-jekyll.md'],['2024-02-23-philosophy-The-Myth-Of-sisyphus.md','the-myth-of-sisyphus.md']];
  for (const [source,destination] of entries) {
    const original = parseFrontmatter(await readFile(join('legacy/jekyll/_posts',source),'utf8')).content.replaceAll('\r\n','\n').trim();
    const migrated = parseFrontmatter(await readFile(join('content/articles/notes',destination),'utf8')).content.replaceAll('\r\n','\n').trim();
    assert.equal(migrated,original);
  }
});
