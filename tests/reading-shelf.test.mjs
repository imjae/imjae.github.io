import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeReadingItems } from '../src/lib/reading-shelf.mjs';

test('같은 책의 감상이 게시되면 목록 항목을 대체하고 기존 글 날짜를 유지한다', () => {
  const listings = [{ data: { slug: 'same-book', title: '책', date: '2023-01-01', sources: [{ url: 'source' }], rating: 5 } }];
  const article = { data: { slug: 'same-book', topic: 'reading', date: '2024-02-23', book: { title: '책', note: '감상' } } };
  const result = mergeReadingItems([article], listings);
  assert.equal(result.length, 1);
  assert.equal(result[0].date, '2024-02-23');
  assert.equal(result[0].article, article);
  assert.equal(result[0].rating, 5);
  assert.deepEqual(result[0].sources, listings[0].data.sources);
});

test('감상 없는 책을 완독이나 독후감으로 만들지 않고 중복 목록을 거절한다', () => {
  const listing = { data: { slug: 'listed', title: '제목만 있는 책', date: '2023-01-01', sources: [] } };
  const result = mergeReadingItems([], [listing]);
  assert.equal(result[0].article, null);
  assert.equal(result[0].book.finished, undefined);
  assert.equal(result[0].book.note, undefined);
  assert.throws(() => mergeReadingItems([], [listing, listing]), /중복된/);
});
