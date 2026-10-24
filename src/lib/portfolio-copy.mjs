const excluded = new Set(['id', 'featureSlug', 'slug', 'anchor', 'kind', 'media', 'contact']);

export const portfolioParagraphSlots = {
  hero: '상단 소개', project: '프로젝트 소개', ai: 'AI 활용', client: '게임플레이 구현',
  graphics: '런타임·그래픽스', more: '추가 기록', combat: '그룹 전투', traversal: 'IK 트레버설',
  equipment: '장비 조합', water: '물 캐시', fire: '불 이펙트',
};

export function isPortfolioParagraphKey(key) {
  const match = /^paragraphs\.([a-z]+)\.([0-9]{13}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.exec(key);
  return Boolean(match && Object.hasOwn(portfolioParagraphSlots, match[1]));
}

export function portfolioParagraphs(fields, slot) {
  return Object.entries(fields).filter(([key]) => isPortfolioParagraphKey(key) && key.split('.')[1] === slot)
    .sort(([left], [right]) => left.localeCompare(right)).map(([key, text]) => ({ key, text }));
}

// 주소·순서·기능 식별자는 제외하고 화면 문구만 다룬다.
export function portfolioTextFields(value, prefix = '', result = {}) {
  if (typeof value === 'string') result[prefix] = value;
  else if (Array.isArray(value)) value.forEach((item, index) => portfolioTextFields(item, `${prefix}.${item?.id ?? index}`, result));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
    if (!excluded.has(key)) portfolioTextFields(item, prefix ? `${prefix}.${key}` : key, result);
  }
  return result;
}

export function applyPortfolioText(value, fields, prefix = '') {
  if (typeof value === 'string') return Object.hasOwn(fields, prefix) ? fields[prefix] : value;
  if (Array.isArray(value)) return value.map((item, index) => applyPortfolioText(item, fields, `${prefix}.${item?.id ?? index}`));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    excluded.has(key) ? item : applyPortfolioText(item, fields, prefix ? `${prefix}.${key}` : key),
  ]));
  return value;
}

export function portfolioCopyIssues(values, allowed) {
  const issues = [];
  for (const [key, value] of Object.entries(values)) {
    let message = '';
    if (!/^[a-zA-Z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*$/.test(key) || (!Object.hasOwn(allowed, key) && !isPortfolioParagraphKey(key))) message = '수정할 수 없는 항목입니다.';
    else if (typeof value !== 'string') message = '문자로 입력해 주세요.';
    else if (value.trim() && [...value].length > 600) message = `현재 ${[...value].length}자입니다. 600자 이하로 줄여 주세요.`;
    if (message) issues.push({ key, message });
  }
  return issues;
}

export function validatePortfolioCopySettings(data, allowed) {
  if (data?.version !== 1 || data.portfolio !== 'krafton-2027' || typeof data.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.createdAt) || Number.isNaN(Date.parse(data.createdAt)) || new Date(data.createdAt).toISOString() !== data.createdAt) throw new Error('포트폴리오 문구의 저장 형식과 시각을 확인해 주세요.');
  if (!data.values || typeof data.values !== 'object' || Array.isArray(data.values) || !Object.keys(data.values).length) throw new Error('저장할 문구가 없습니다.');
  const [issue] = portfolioCopyIssues(data.values, allowed);
  if (issue) throw new Error(`${issue.key}: ${issue.message}`);
  return { version: 1, portfolio: 'krafton-2027', createdAt: data.createdAt,
    values: Object.fromEntries(Object.entries(data.values).map(([key, value]) => [key, value.trim() ? value : ''])) };
}

export function selectPortfolioText(records, defaults) {
  const fields = { ...defaults };
  const sorted = records.map(record => validatePortfolioCopySettings(record, defaults))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || JSON.stringify(a.values).localeCompare(JSON.stringify(b.values)));
  for (const record of sorted) Object.assign(fields, record.values);
  return fields;
}

export function preparePortfolioCopySaves(values, allowed, { now = new Date(), id = crypto.randomUUID() } = {}) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('저장 식별자를 확인해 주세요.');
  const base = { version: 1, portfolio: 'krafton-2027', createdAt: now.toISOString() };
  values = validatePortfolioCopySettings({ ...base, values }, allowed).values;
  const prepare = (entries, index) => {
    const content = `${JSON.stringify({ ...base, values: Object.fromEntries(entries) }, null, 2)}\n`;
    const path = `content/portfolio-copy/${base.createdAt.replaceAll(':', '-').replace('.', '-')}-${id}-${index}.json`;
    const url = new URL('https://github.com/imjae/imjae.github.io/new/main');
    url.searchParams.set('filename', path);
    url.searchParams.set('value', content);
    return { content, path, url: url.href, keys: entries.map(([key]) => key) };
  };
  const saves = [];
  let entries = [];
  for (const entry of Object.entries(values)) {
    if (prepare([...entries, entry], saves.length).url.length > 8000 && entries.length) {
      saves.push(prepare(entries, saves.length));
      entries = [];
    }
    entries.push(entry);
    if (prepare(entries, saves.length).url.length > 8000) throw new Error('한 문구가 저장 화면의 길이를 초과했습니다. 문구를 줄여 주세요.');
  }
  if (entries.length) saves.push(prepare(entries, saves.length));
  return saves;
}
