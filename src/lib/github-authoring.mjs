export const repository = 'https://github.com/imjae/imjae.github.io';
export const branch = 'main';
const topics = ['gameplay', 'graphics', 'tools', 'ai', 'notes', 'math'];
const kinds = ['case-study', 'devlog', 'note', 'reading'];
const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function articleSourcePath(filePath) {
  const normalized = String(filePath ?? '').replaceAll('\\', '/');
  const prefix = 'content/articles/';
  const start = normalized.startsWith(prefix) ? 0 : normalized.lastIndexOf(`/${prefix}`) + 1;
  const path = normalized.slice(start);
  if (!path.startsWith(prefix) || !path.endsWith('.md') || path.split('/').some(part => !part || part === '..' || part === '.')) throw new Error('글의 원본 경로를 확인할 수 없습니다.');
  return path;
}

export function githubFileUrl(action, filePath) {
  if (!['edit', 'delete', 'blob'].includes(action)) throw new Error('지원하지 않는 파일 작업입니다.');
  const path = articleSourcePath(filePath).split('/').map(encodeURIComponent).join('/');
  return `${repository}/${action}/${branch}/${path}`;
}

export function koreanDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function prepareNewPost(options) {
  const title = options.title?.trim();
  const description = options.description?.trim();
  const { slug, topic, kind, date, project, series } = options;
  const tags = [...new Set((options.tags ?? '').split(',').map(tag => tag.trim()).filter(Boolean))];
  if (!title || title.length > 110) throw new Error('제목은 1~110자로 적어 주세요.');
  if (!description || description.length > 220) throw new Error('요약은 1~220자로 적어 주세요.');
  if (!identifier.test(slug ?? '')) throw new Error('글 주소는 영문 소문자·숫자·하이픈으로 적어 주세요.');
  if (!topics.includes(topic) || !kinds.includes(kind)) throw new Error('주제와 글 종류를 선택해 주세요.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('작성 날짜를 확인해 주세요.');
  if ([project, series].some(value => value && !identifier.test(value))) throw new Error('프로젝트와 시리즈는 영문 소문자·숫자·하이픈으로 적어 주세요.');
  if (tags.length > 12 || tags.some(tag => tag.length > 40)) throw new Error('태그는 40자 이내로 최대 12개까지 적어 주세요.');
  const data = { title, description, slug, date, topic, kind, tags, ...(project ? { project } : {}), ...(series ? { series } : {}), draft: true };
  const sections = kind === 'case-study' ? ['구현 목표', '구조와 구현', '선택한 방식과 이유', '검증한 범위', '남은 일'] : kind === 'devlog' ? ['이번 작업의 목표', '구현과 관찰', '확인한 결과', '다음 작업'] : ['주제', '정리와 예시', '참고 자료'];
  const content = `---\n${Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n${sections.map(heading => `## ${heading}\n\n<!-- 내용을 작성합니다. -->`).join('\n\n')}\n`;
  const path = `content/articles/${topic}/${slug}.md`;
  const url = new URL(`${repository}/new/${branch}`);
  url.searchParams.set('filename', path);
  url.searchParams.set('value', content);
  if (url.href.length > 8000) throw new Error('입력한 내용이 깁니다. 요약과 태그를 줄여 주세요. 본문은 GitHub에서 작성할 수 있습니다.');
  return { path, content, url: url.href };
}
