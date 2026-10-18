import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPinnedArticles } from '../src/lib/pinned-articles.mjs';

const article = (slug, data = {}) => ({ data: { slug, date: '2026-10-18', draft: false, ...data } });

test('고정한 공개 글만 표시하고 미지정 글과 고정한 초안은 제외한다', () => {
  const articles = [article('draft', { pinned: true, draft: true }), article('normal'), article('pinned', { pinned: true }), article('unpinned', { pinned: false })];
  assert.deepEqual(selectPinnedArticles(articles).map(a => a.data.slug), ['pinned']);
  assert.deepEqual(selectPinnedArticles([articles[0], articles[1]]), []);
});

test('새 글이 추가되어도 고정 순서를 우선하고 같은 순서는 날짜와 주소로 정렬한다', () => {
  const articles = [article('new-unpinned', { date: '2026-12-01' }), article('z', { pinned: true }), article('second', { pinned: true, pinOrder: 2 }), article('a', { pinned: true }), article('first', { pinned: true, pinOrder: 1, date: '2020-01-01' }), article('older', { pinned: true, date: '2026-01-01' })];
  const original = [...articles];
  assert.deepEqual(selectPinnedArticles(articles).map(a => a.data.slug), ['first', 'second', 'a', 'z', 'older']);
  assert.deepEqual(articles, original);
});

test('고정 글이 6편을 넘어도 전부 반환한다', () => {
  const articles = Array.from({ length: 9 }, (_, i) => article(`post-${i}`, { pinned: true, pinOrder: i + 1 }));
  assert.equal(selectPinnedArticles(articles).length, 9);
});
