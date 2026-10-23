import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { portfolioTextFields, applyPortfolioText, selectPortfolioText, preparePortfolioCopySaves, validatePortfolioCopySettings } from '../src/lib/portfolio-copy.mjs';
import { readPortfolioText } from '../src/lib/portfolio-copy.server.mjs';

const base = { profile: { name: 'imjae', contact: 'author@example.com' }, cases: [{ id: 'water', title: '물 캐시', links: [{ slug: 'water-playback', label: '구현 기록' }], media: { url: 'https://example.com/video' } }, { id: 'fire', title: '불' }] };
const fields = portfolioTextFields(base);
const record = (values, createdAt = '2026-10-23T01:00:00.000Z') => ({ version: 1, portfolio: 'krafton-2027', createdAt, values });

test('사례 순서가 바뀌어도 같은 사례 문구를 고치며 주소·연락처·미디어는 편집 대상에서 제외한다', () => {
  assert.deepEqual(Object.keys(fields), ['profile.name', 'cases.water.title', 'cases.water.links.0.label', 'cases.fire.title']);
  const reordered = { ...base, cases: [...base.cases].reverse() };
  const updated = applyPortfolioText(reordered, { 'cases.water.title': '새 물 제목' });
  assert.equal(updated.cases[0].title, '불');
  assert.equal(updated.cases[1].title, '새 물 제목');
  assert.equal(updated.cases[1].links[0].slug, 'water-playback');
  assert.equal(base.cases[0].title, '물 캐시');
});

test('문구별 최신 저장만 덮고 다른 문구와 이후 기본값 보완을 유지한다', () => {
  const merged = selectPortfolioText([record({ 'profile.name': '이름' }), record({ 'cases.water.title': '예전 제목' }), record({ 'cases.water.title': '새 제목' }, '2026-10-23T02:00:00.000Z')], { ...fields, 'cases.fire.title': '기본 불 제목 보완' });
  assert.equal(merged['profile.name'], '이름');
  assert.equal(merged['cases.water.title'], '새 제목');
  assert.equal(merged['cases.fire.title'], '기본 불 제목 보완');
});

test('한글·줄바꿈·따옴표를 보존하고 긴 변경은 URL 제한 내의 저장들로 나눈다', () => {
  const values = { 'profile.name': '한'.repeat(590), 'cases.water.title': '문'.repeat(590), 'cases.fire.title': '따옴표 "와"\n<script>는 문구로 저장' };
  const saves = preparePortfolioCopySaves(values, fields, { now: new Date('2026-10-23T01:00:00.000Z'), id: '12345678-1234-1234-1234-123456789abc' });
  assert.ok(saves.length > 1);
  const restored = {};
  for (const save of saves) {
    const url = new URL(save.url);
    assert.equal(url.origin, 'https://github.com');
    assert.equal(url.pathname, '/imjae/imjae.github.io/new/main');
    assert.ok(save.url.length <= 8000);
    assert.equal(url.searchParams.get('filename'), save.path);
    assert.match(save.path, /^content\/portfolio-copy\//);
    Object.assign(restored, validatePortfolioCopySettings(JSON.parse(url.searchParams.get('value')), fields).values);
  }
  assert.deepEqual(restored, values);
});

test('임의 경로·주소 변경과 잘못된 날짜·문구 형식을 거절한다', () => {
  for (const values of [{ '../path': 'x' }, { 'cases.water.media.url': 'https://evil.example' }, { 'profile.name': 10 }, { 'profile.name': 'x'.repeat(601) }, {}, []]) assert.throws(() => validatePortfolioCopySettings(record(values), fields));
  assert.throws(() => validatePortfolioCopySettings(record({ 'profile.name': 'x' }, '2026-02-30T00:00:00.000Z'), fields));
});

test('실제 설정 파일을 다시 읽으면 저장 문구가 복원되고 미저장 문구는 기본값을 쓴다', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-copy-'));
  const directory = join(root, 'content', 'portfolio-copy');
  const file = join(directory, 'saved.json');
  try {
    assert.deepEqual(await readPortfolioText(fields, root), fields);
    await mkdir(directory, { recursive: true });
    await writeFile(file, JSON.stringify(record({ 'cases.water.title': '저장된 물 제목' })));
    const restored = await readPortfolioText(fields, root);
    assert.equal(restored['cases.water.title'], '저장된 물 제목');
    assert.equal(restored['profile.name'], 'imjae');
  } finally {
    await unlink(file).catch(() => {});
    await rmdir(directory).catch(() => {});
    await rmdir(join(root, 'content')).catch(() => {});
    await rmdir(root);
  }
});
