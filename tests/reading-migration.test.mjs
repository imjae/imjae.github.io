import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '../scripts/frontmatter.mjs';

const ledger = JSON.parse(await readFile('docs/READING-MIGRATION.json', 'utf8'));

test('독서 이관 기록은 책별로 중복 없이 실제 파일과 원문 날짜에 연결된다', async () => {
  assert.equal(new Set(ledger.books.map(book => book.slug)).size, ledger.books.length);
  assert.equal(ledger.counts.books, ledger.books.length);
  for (const book of ledger.books) {
    const raw = await readFile(book.file, 'utf8');
    const data = book.action === 'list-only' ? JSON.parse(raw) : parseFrontmatter(raw).data;
    assert.equal(data.slug, book.slug);
    assert.equal(data.date, book.date, book.slug);
    const primary = book.sources.filter(source => source.selected);
    assert.equal(primary.length, 1);
    if (book.dateBasis !== 'legacy') assert.equal(primary[0].date, data.date, book.slug);
    else assert.equal(data.date, '2024-02-23');
    for (const source of book.sources) {
      assert.match(source.url, /^https:\/\/app\.notion\.com\/p\/[a-f0-9]{32}$/);
      if (source.method === 'native-created-time') {
        assert.equal(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(source.createdTime)), source.date);
      } else {
        assert.equal(source.method, 'native-created-date-range');
        assert.equal(source.dayConfirmed, true);
      }
    }
  }
});
