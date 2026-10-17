import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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

test('수학 글을 전용 폴더의 초안으로 생성한다', async () => {
  const root = await mkdtemp(join(tmpdir(),'imjae-math-'));
  try {
    const file = await createPost({title:'기저와 좌표',slug:'basis-study',topic:'math'},root);
    assert.equal(file,join(root,'content/articles/math/basis-study.md'));
    const { data } = parseFrontmatter(await readFile(file,'utf8'));
    assert.equal(data.topic,'math');
    assert.equal(data.draft,true);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('Jekyll 원본을 보존하고 편집된 글의 작성 날짜와 주소를 유지한다', async () => {
  const entries = [
    ['2024-02-23-test-post.md','welcome-to-jekyll','d924e4c564ecf8626eb11f02d1ae551cc1bbb53e2156d14282be6b5e9ff26520'],
    ['2024-02-23-philosophy-The-Myth-Of-sisyphus.md','the-myth-of-sisyphus','e731cc3cc01e1c717db8393bc3890d4cd95705a7f7dab52e1d75ff9676c3d60d'],
  ];
  for (const [source,slug,hash] of entries) {
    const original = (await readFile(join('legacy/jekyll/_posts',source),'utf8')).replaceAll('\r\n','\n');
    assert.equal(createHash('sha256').update(original).digest('hex'),hash);
    const published = await readFile(join('content/articles/notes',`${slug}.md`),'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (published !== null) {
      const { data } = parseFrontmatter(published);
      assert.equal(data.date,'2024-02-23');
      assert.equal(data.slug,slug);
    }
  }
});
