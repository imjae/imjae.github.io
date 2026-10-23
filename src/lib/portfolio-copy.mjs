const excluded = new Set(['id', 'featureSlug', 'slug', 'anchor', 'kind', 'media', 'contact']);

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

export function validatePortfolioCopySettings(data, allowed) {
  if (data?.version !== 1 || data.portfolio !== 'krafton-2027' || typeof data.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.createdAt) || Number.isNaN(Date.parse(data.createdAt)) || new Date(data.createdAt).toISOString() !== data.createdAt) throw new Error('포트폴리오 문구의 저장 형식과 시각을 확인해 주세요.');
  if (!data.values || typeof data.values !== 'object' || Array.isArray(data.values) || !Object.keys(data.values).length) throw new Error('저장할 문구가 없습니다.');
  const values = {};
  for (const [key, value] of Object.entries(data.values)) {
    if (!/^[a-zA-Z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*$/.test(key) || !Object.hasOwn(allowed, key)) throw new Error(`수정할 수 없는 문구입니다: ${key}`);
    if (typeof value !== 'string' || !value.trim() || [...value].length > 600) throw new Error('문구는 1~600자로 적어 주세요.');
    values[key] = value;
  }
  return { version: 1, portfolio: 'krafton-2027', createdAt: data.createdAt, values };
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
  validatePortfolioCopySettings({ ...base, values }, allowed);
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
