import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { portfolioTextFields, applyPortfolioText, selectPortfolioText, preparePortfolioCopySaves, validatePortfolioCopySettings, portfolioCopyIssues, isPortfolioParagraphKey, portfolioParagraphs, isPortfolioParagraphOrderKey, movePortfolioParagraph } from '../src/lib/portfolio-copy.mjs';
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

test('빈 문구는 삭제로 저장하고 글자 수 초과만 항목별로 알린다', () => {
  const values = { 'profile.name': ' \n', 'cases.water.title': '문'.repeat(601), 'cases.fire.title': '새 불 제목' };
  const issues = portfolioCopyIssues(values, fields);
  assert.deepEqual(issues.map(issue => issue.key), ['cases.water.title']);
  assert.match(issues[0].message, /601자/);
  assert.throws(() => validatePortfolioCopySettings(record(values), fields), /cases\.water\.title.*601자/);
  assert.equal(validatePortfolioCopySettings(record({ 'profile.name': ' \n' }), fields).values['profile.name'], '');
  values['profile.name'] = '이름';
  values['cases.water.title'] = '물'.repeat(600);
  assert.deepEqual(portfolioCopyIssues(values, fields), []);
  const saved = preparePortfolioCopySaves(values, fields);
  assert.deepEqual(Object.assign({}, ...saved.map(save => JSON.parse(save.content).values)), values);
});

test('문구 삭제와 다시 추가한 값이 최신 설정과 실제 저장 내용에 반영된다', () => {
  const values = { 'profile.name': '', 'cases.water.title': ' \n' };
  const saves = preparePortfolioCopySaves(values, fields);
  const records = saves.map(save => JSON.parse(save.content));
  const hidden = selectPortfolioText(records, fields);
  assert.equal(hidden['profile.name'], '');
  assert.equal(hidden['cases.water.title'], '');
  const restored = selectPortfolioText([...records, record({ 'profile.name': '다시 쓴 이름' }, '2099-10-24T00:00:00.000Z')], fields);
  assert.equal(restored['profile.name'], '다시 쓴 이름');
  assert.equal(restored['cases.water.title'], '');
  assert.equal(applyPortfolioText(base, hidden).profile.name, '');
});

test('등록된 영역의 새 문단만 허용하고 나눈 저장·삭제 후에도 추가 순서를 유지한다', () => {
  const first = 'paragraphs.hero.1792800000000-12345678-1234-1234-1234-123456789abc';
  const second = 'paragraphs.hero.1792800000001-12345678-1234-1234-1234-123456789abc';
  const project = first.replace('.hero.', '.project.');
  assert.ok(isPortfolioParagraphKey(first));
  for (const key of [first.replace('.hero.', '.unknown.'), 'paragraphs.hero.script', '../path', 'project.media.url']) {
    assert.ok(!isPortfolioParagraphKey(key));
    assert.throws(() => validatePortfolioCopySettings(record({ [key]: '임의 문구' }), fields));
  }
  const values = { [second]: '두'.repeat(590), [first]: '첫'.repeat(590), [project]: '<script>는 실행하지 않고 문구로 표시합니다.' };
  const saves = preparePortfolioCopySaves(values, fields);
  assert.ok(saves.length > 1);
  const selected = selectPortfolioText(saves.reverse().map(save => JSON.parse(save.content)), fields);
  assert.deepEqual(portfolioParagraphs(selected, 'hero').map(item => item.key), [first, second]);
  assert.equal(portfolioParagraphs(selected, 'project')[0].text, values[project]);
  const deleted = selectPortfolioText([record(selected), record({ [first]: '' }, '2099-10-24T00:00:00.000Z')], fields);
  assert.equal(portfolioParagraphs(deleted, 'hero')[0].text, '');
  assert.equal(portfolioParagraphs(deleted, 'hero')[1].text, values[second]);
});

test('글자 수는 이모지도 한 글자로 세며 저장 검증과 같은 오류를 사용한다', () => {
  assert.deepEqual(portfolioCopyIssues({ 'profile.name': '🎮'.repeat(600) }, fields), []);
  const invalid = { 'profile.name': '🎮'.repeat(601) };
  assert.match(portfolioCopyIssues(invalid, fields)[0].message, /601자/);
  assert.throws(() => validatePortfolioCopySettings(record(invalid), fields), /profile\.name.*601자/);
});

const paragraphKey = (index, slot = 'hero') => `paragraphs.${slot}.179280000000${index}-12345678-1234-1234-1234-123456789abc`;
const orderKey = key => key.replace(/^paragraphs\./, 'paragraphOrder.');

test('문단 위·아래 이동은 같은 영역에서만 순서를 바꾸고 내용과 식별자를 보존한다', () => {
  const [first, second, third] = [0, 1, 2].map(index => paragraphKey(index));
  const project = paragraphKey(0, 'project');
  const values = { [first]: '첫 문단', [second]: '둘째 문단', [third]: '셋째 문단', [project]: '프로젝트 문단' };
  const moved = { ...values, ...movePortfolioParagraph(values, third, -1) };
  assert.deepEqual(portfolioParagraphs(moved, 'hero').map(item => item.key), [first, third, second]);
  for (const key of Object.keys(values)) assert.equal(moved[key], values[key]);
  assert.deepEqual(portfolioParagraphs(moved, 'project'), [{ key: project, text: '프로젝트 문단' }]);
  const returned = { ...moved, ...movePortfolioParagraph(moved, third, 1) };
  assert.deepEqual(portfolioParagraphs(returned, 'hero').map(item => item.key), [first, second, third]);
  assert.deepEqual(movePortfolioParagraph(values, first, -1), {});
  assert.deepEqual(movePortfolioParagraph(values, third, 1), {});
  assert.deepEqual(movePortfolioParagraph(values, 'profile.name', -1), {});
});

test('순서만 저장해 다시 읽거나 파일을 나눠 저장해도 순서를 복원하고 새 문단은 뒤에 붙인다', () => {
  const [first, second, third, added] = [0, 1, 2, 3].map(index => paragraphKey(index));
  const values = { [first]: '첫'.repeat(590), [second]: '둘'.repeat(590), [third]: '셋'.repeat(590) };
  const order = movePortfolioParagraph(values, third, -1);
  const initial = record(values);
  const saveOptions = { now: new Date('2026-10-24T00:00:00.000Z') };
  const orderOnly = preparePortfolioCopySaves(order, fields, saveOptions).map(save => JSON.parse(save.content));
  const selected = selectPortfolioText([initial, ...orderOnly], fields);
  assert.deepEqual(portfolioParagraphs(selected, 'hero').map(item => item.key), [first, third, second]);
  const batches = preparePortfolioCopySaves({ ...values, ...order }, fields, saveOptions);
  assert.ok(batches.length > 1);
  const restored = selectPortfolioText(batches.reverse().map(save => JSON.parse(save.content)), fields);
  assert.deepEqual(portfolioParagraphs(restored, 'hero').map(item => item.key), [first, third, second]);
  assert.deepEqual(portfolioParagraphs({ ...restored, [added]: '나중에 추가' }, 'hero').map(item => item.key), [first, third, second, added]);
});

test('삭제된 문단은 이동 대상으로 건너뛰고 잘못된 순서 메타데이터를 거절한다', () => {
  const [first, hidden, third] = [0, 1, 2].map(index => paragraphKey(index));
  const values = { [first]: '첫 문단', [hidden]: '', [third]: '셋째 문단' };
  const moved = { ...values, ...movePortfolioParagraph(values, third, -1) };
  assert.deepEqual(portfolioParagraphs(moved, 'hero').filter(item => item.text).map(item => item.key), [third, first]);
  assert.deepEqual(portfolioParagraphs({ ...moved, [hidden]: '복원 문단' }, 'hero').map(item => item.key), [third, hidden, first]);
  assert.deepEqual(movePortfolioParagraph(values, hidden, -1), {});
  assert.ok(isPortfolioParagraphOrderKey(orderKey(first)));
  for (const value of ['-1', '1.5', '01', 'Infinity', '1000000000', 2, '']) {
    if (value === '') assert.doesNotThrow(() => validatePortfolioCopySettings(record({ [orderKey(first)]: value }), fields));
    else assert.throws(() => validatePortfolioCopySettings(record({ [orderKey(first)]: value }), fields));
  }
  assert.throws(() => validatePortfolioCopySettings(record({ [orderKey(first).replace('.hero.', '.unknown.')]: '0' }), fields));
});
