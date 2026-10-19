import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseFrontmatter } from '../scripts/frontmatter.mjs';
import { createPost, markdownFiles } from '../scripts/new-post.mjs';

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

test('독서 CLI는 책 정보와 감상을 저장하고 추가 메모용 초안을 생성한다', async () => {
  const root = await mkdtemp(join(tmpdir(), 'imjae-reading-'));
  try {
    const script = fileURLToPath(new URL('../scripts/new-post.mjs', import.meta.url));
    await promisify(execFile)(process.execPath, [script, '--title', '책에 대한 기록', '--slug', 'reading-record', '--topic', 'reading', '--book-title', '책 제목', '--book-author', '저자', '--book-finished', '2024-02-29', '--book-note', '질문을 다시 생각했다.'], { cwd: root });
    const { data, content } = parseFrontmatter(await readFile(join(root, 'content/articles/reading/reading-record.md'), 'utf8'));
    assert.equal(data.topic, 'reading');
    assert.equal(data.kind, 'reading');
    assert.equal(data.draft, true);
    assert.deepEqual(data.book, { title: '책 제목', author: '저자', finished: '2024-02-29', note: '질문을 다시 생각했다.' });
    assert.match(content, /기억에 남는 내용/);
    assert.ok(!content.includes(data.book.note));
    await assert.rejects(createPost({ title: '제목', slug: 'missing-book', topic: 'reading' }, root), /책 제목/);
    await assert.rejects(createPost({ title: '제목', slug: 'invalid-date', topic: 'reading', bookTitle: '책', bookFinished: '2026-02-30' }, root), /다 읽은 날짜/);
    assert.equal((await markdownFiles(join(root, 'content/articles'))).length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('Jekyll 원본을 보존하고 편집된 글의 작성 날짜와 주소를 유지한다', async () => {
  const publishedPosts = await Promise.all((await markdownFiles('content/articles')).map(async file => parseFrontmatter(await readFile(file, 'utf8')).data));
  const entries = [
    ['2024-02-23-test-post.md','welcome-to-jekyll','d924e4c564ecf8626eb11f02d1ae551cc1bbb53e2156d14282be6b5e9ff26520'],
    ['2024-02-23-philosophy-The-Myth-Of-sisyphus.md','the-myth-of-sisyphus','e731cc3cc01e1c717db8393bc3890d4cd95705a7f7dab52e1d75ff9676c3d60d'],
  ];
  for (const [source,slug,hash] of entries) {
    const original = (await readFile(join('legacy/jekyll/_posts',source),'utf8')).replaceAll('\r\n','\n');
    assert.equal(createHash('sha256').update(original).digest('hex'),hash);
    const matches = publishedPosts.filter(data => data.slug === slug);
    assert.equal(matches.length, 1, `${slug}의 현재 글이 한 편 있어야 합니다.`);
    assert.equal(matches[0].date, '2024-02-23');
    assert.equal(matches[0].slug, slug);
  }
});
