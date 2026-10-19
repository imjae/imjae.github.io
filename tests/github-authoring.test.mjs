import test from 'node:test';
import assert from 'node:assert/strict';
import { articleSourcePath, githubFileUrl, prepareNewPost } from '../src/lib/github-authoring.mjs';
import { parseFrontmatter } from '../scripts/frontmatter.mjs';

const input = { title: '손의 "접점": 수정', description: '접촉 오차와 수정한 내용을 정리한다.', slug: 'hand-contact', date: '2026-10-17', topic: 'gameplay', kind: 'case-study', tags: 'Unity, IK, Unity', project: 'dcb', series: 'dcb' };

test('GitHub 새 글 화면에 한글·따옴표와 초안 상태를 손상 없이 전달한다', () => {
  const post = prepareNewPost(input);
  const url = new URL(post.url);
  assert.equal(url.origin,'https://github.com');
  assert.equal(url.pathname,'/imjae/imjae.github.io/new/main');
  assert.equal(url.searchParams.get('filename'),'content/articles/gameplay/hand-contact.md');
  assert.equal(url.searchParams.get('value'),post.content);
  const { data, content } = parseFrontmatter(url.searchParams.get('value'));
  assert.equal(data.title,input.title);
  assert.equal(data.draft,true);
  assert.deepEqual(data.tags,['Unity','IK']);
  assert.equal(data.series,'dcb');
  assert.match(content,/검증한 범위/);
});

test('주소와 메타데이터를 검증해 경로 탈출·잘못된 날짜를 막는다', () => {
  for (const change of [{slug:'../outside'},{topic:'unknown'},{kind:'unknown'},{date:'2026-02-30'},{series:'../series'},{project:'../../secret'},{title:''}]) assert.throws(() => prepareNewPost({...input,...change}));
});

test('GitHub 편집 양식도 수학 카테고리의 초안을 전달한다', () => {
  const post = prepareNewPost({...input,topic:'math'});
  const url = new URL(post.url);
  assert.equal(url.searchParams.get('filename'),'content/articles/math/hand-contact.md');
  const {data} = parseFrontmatter(url.searchParams.get('value'));
  assert.equal(data.topic,'math');
  assert.equal(data.draft,true);
  assert.equal(new URL(githubFileUrl('edit',post.path)).pathname,'/imjae/imjae.github.io/edit/main/content/articles/math/hand-contact.md');
});

test('독서 기록은 책 정보와 짧은 감상을 보존하고 Reading 초안으로 생성한다', () => {
  const bookNote = '첫 문장: "이유를 묻는다"\n두 번째 문장을 다시 읽었다.';
  const post = prepareNewPost({ ...input, topic: 'reading', bookTitle: '책: "제목"', bookAuthor: ' 저자 ', bookFinished: '2024-02-29', bookNote });
  const url = new URL(post.url);
  assert.equal(url.searchParams.get('filename'), 'content/articles/reading/hand-contact.md');
  const { data, content } = parseFrontmatter(url.searchParams.get('value'));
  assert.equal(data.kind, 'reading');
  assert.equal(data.draft, true);
  assert.deepEqual(data.book, { title: '책: "제목"', author: '저자', finished: '2024-02-29', note: bookNote });
  assert.match(content, /기억에 남는 내용/);
  assert.ok(!content.includes(bookNote));
  assert.ok(!content.includes('검증한 범위'));
});

test('책 제목만으로 기록할 수 있으며 비어 있는 선택 정보나 잘못된 날짜를 저장하지 않는다', () => {
  const reading = { ...input, topic: 'reading', bookTitle: '책 제목', bookAuthor: ' ', bookFinished: '', bookNote: '' };
  assert.deepEqual(parseFrontmatter(prepareNewPost(reading).content).data.book, { title: '책 제목' });
  for (const change of [{ bookTitle: '' }, { bookTitle: '책'.repeat(161) }, { bookAuthor: '가'.repeat(121) }, { bookFinished: '2025-02-29' }, { bookFinished: '2026-04-31' }, { bookNote: '가'.repeat(281) }]) {
    assert.throws(() => prepareNewPost({ ...reading, ...change }));
  }
  assert.equal(parseFrontmatter(prepareNewPost({ ...reading, topic: 'gameplay' }).content).data.book, undefined);
});

test('파일명과 slug가 달라도 실제 원본 경로의 수정·삭제 화면을 연다', () => {
  const file = 'D:\\dev\\blog\\content\\articles\\notes\\다른 파일명.md';
  assert.equal(articleSourcePath(file),'content/articles/notes/다른 파일명.md');
  for (const action of ['edit','delete']) assert.equal(new URL(githubFileUrl(action,file)).pathname,`/imjae/imjae.github.io/${action}/main/content/articles/notes/${encodeURIComponent('다른 파일명.md')}`);
  assert.throws(() => githubFileUrl('edit','content/articles/../../private.md'));
  assert.throws(() => githubFileUrl('edit','D:/dev/DCB/secret.md'));
});
