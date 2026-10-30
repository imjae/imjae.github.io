export const aboutFields = {
  name: { label: '이름', max: 80 },
  summary: { label: '짧은 소개', max: 600 },
  role: { label: '하는 일', max: 180 },
  interests: { label: '관심 분야', max: 180 },
  email: { label: '이메일', max: 254 },
  github: { label: 'GitHub 주소', max: 200 },
};

export function aboutCopyIssues(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return [{ key: '', message: '입력 내용을 확인해 주세요.' }];
  return Object.entries(values).flatMap(([key, value]) => {
    let message = '';
    if (!Object.hasOwn(aboutFields, key)) message = '수정할 수 없는 항목입니다.';
    else if (typeof value !== 'string') message = '문자로 입력해 주세요.';
    else if ([...value].length > aboutFields[key].max) message = `${aboutFields[key].max}자 이하로 적어 주세요.`;
    else if (key === 'name' && !value.trim()) message = '이름을 입력해 주세요.';
    else if (key !== 'summary' && /[\r\n]/.test(value)) message = '한 줄로 입력해 주세요.';
    else if (key === 'email' && value && !/^[^\s@<>?&#%"\\:;]+@[^\s@<>?&#%"\\:;]+\.[^\s@<>?&#%"\\:;]+$/.test(value)) message = '이메일 주소를 확인해 주세요.';
    else if (key === 'github' && !/^https:\/\/github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?\/?$/.test(value)) message = 'https://github.com/계정 형식으로 입력해 주세요.';
    return message ? [{ key, message }] : [];
  });
}

export function validateAboutCopy(data) {
  if (data?.version !== 1 || data.page !== 'about' || typeof data.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.createdAt) || Number.isNaN(Date.parse(data.createdAt)) || new Date(data.createdAt).toISOString() !== data.createdAt) throw new Error('About 저장 형식과 시각을 확인해 주세요.');
  const [issue] = aboutCopyIssues(data.values);
  if (issue) throw new Error(`${issue.key}: ${issue.message}`);
  if (!Object.keys(data.values).length) throw new Error('저장할 변경이 없습니다.');
  return { version: 1, page: 'about', createdAt: data.createdAt, values: { ...data.values } };
}

export function selectAboutCopy(records, defaults) {
  const result = { ...defaults };
  const sorted = records.map(validateAboutCopy).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || JSON.stringify(a.values).localeCompare(JSON.stringify(b.values)));
  for (const record of sorted) Object.assign(result, record.values);
  return result;
}

export function restoreAboutDraft(draft, fields) {
  if (!draft?.changes || typeof draft.changes !== 'object' || Array.isArray(draft.changes)) return { changes: {}, previous: null };
  const clean = values => Object.fromEntries(Object.entries(values && typeof values === 'object' && !Array.isArray(values) ? values : {}).filter(([key, value]) => Object.hasOwn(aboutFields, key) && typeof value === 'string' && value !== fields[key]));
  const pending = clean(draft.changes);
  const savedPrevious = clean(draft.previous);
  const sameBase = Object.keys(aboutFields).every(key => draft.base?.[key] === fields[key]);
  const previous = sameBase ? savedPrevious : { ...savedPrevious, ...pending };
  return { changes: sameBase ? pending : {}, previous: Object.keys(previous).length ? previous : null };
}

export function prepareAboutSaves(values, { now = new Date(), id = crypto.randomUUID() } = {}) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('저장 식별자를 확인해 주세요.');
  const base = { version: 1, page: 'about', createdAt: now.toISOString() };
  values = validateAboutCopy({ ...base, values }).values;
  const prepare = (entries, index) => {
    const content = `${JSON.stringify({ ...base, values: Object.fromEntries(entries) }, null, 2)}\n`;
    const path = `content/about-copy/${base.createdAt.replaceAll(':', '-').replace('.', '-')}-${id}-${index}.json`;
    const url = new URL('https://github.com/imjae/imjae.github.io/new/main');
    url.searchParams.set('filename', path); url.searchParams.set('value', content);
    return { path, content, url: url.href };
  };
  const saves = []; let entries = [];
  for (const entry of Object.entries(values)) {
    if (entries.length && prepare([...entries, entry], saves.length).url.length > 8000) { saves.push(prepare(entries, saves.length)); entries = []; }
    entries.push(entry);
    if (prepare(entries, saves.length).url.length > 8000) throw new Error('입력한 문구가 깁니다. 내용을 줄여 주세요.');
  }
  if (entries.length) saves.push(prepare(entries, saves.length));
  return saves;
}
