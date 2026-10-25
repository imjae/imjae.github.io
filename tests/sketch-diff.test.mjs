import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReviewDiff } from '../server/sketch-diff.mjs';

test('projects separated unified changes without file headers or context', () => {
  const diff = ['diff --git a/post.md b/post.md','index abc..def 100644','--- a/post.md','+++ b/post.md','@@ -10,4 +10,4 @@',' 앞 문맥','-기존 문장','+새 문장',' 다음 문맥','-삭제 문장','@@ -30,0 +30,1 @@','+추가 문장','\\ No newline at end of file'].join('\n');
  assert.deepEqual(parseReviewDiff(diff), [
    {before:['기존 문장'],after:['새 문장'],oldLine:11,newLine:11},
    {before:['삭제 문장'],after:[],oldLine:13,newLine:13},
    {before:[],after:['추가 문장'],oldLine:30,newLine:30},
  ]);
});

test('preserves blank lines, Markdown, code and header-like content literally', () => {
  const diff = '@@ -1,3 +1,3 @@\r\n--- 본문\r\n-\r\n-```html\r\n+++ 본문\r\n+<script>alert(1)</script>\r\n+```';
  assert.deepEqual(parseReviewDiff(diff)[0], {before:['-- 본문','','```html'],after:['++ 본문','<script>alert(1)</script>','```'],oldLine:1,newLine:1});
});

test('supports stored simple diffs and a non-diff fallback', () => {
  assert.deepEqual(parseReviewDiff('-원문\n+수정문')[0], {before:['원문'],after:['수정문'],oldLine:1,newLine:1});
  assert.deepEqual(parseReviewDiff('해석할 수 없는 형식'), []);
});
