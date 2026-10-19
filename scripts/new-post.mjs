import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseFrontmatter } from './frontmatter.mjs';
import { prepareReadingBook, readingSections } from '../src/lib/reading-record.mjs';

export const validTopics = ['gameplay', 'graphics', 'tools', 'ai', 'notes', 'math', 'reading'];
export const validKinds = ['case-study', 'devlog', 'note', 'reading'];
export async function markdownFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const results = await Promise.all(entries.map((entry) => entry.isDirectory() ? markdownFiles(join(directory, entry.name)) : entry.name.endsWith('.md') ? [join(directory, entry.name)] : []));
  return results.flat();
}

export async function createPost(options, root = process.cwd()) {
  const { title, slug, topic = 'notes', series, project } = options;
  const kind = topic === 'reading' ? 'reading' : options.kind ?? 'note';
  if (!title?.trim()) throw new Error('--title "글 제목"을 지정해 주세요.');
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('--slug에는 영문 소문자·숫자·하이픈으로 된 주소를 지정해 주세요.');
  if (!validTopics.includes(topic)) throw new Error(`지원하는 주제: ${validTopics.join(', ')}`);
  if (!validKinds.includes(kind)) throw new Error(`지원하는 글 종류: ${validKinds.join(', ')}`);
  if ([series, project].some((value) => value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))) throw new Error('프로젝트·시리즈 식별자는 영문 소문자·숫자·하이픈만 사용할 수 있습니다.');
  const book = topic === 'reading' ? prepareReadingBook(options) : undefined;
  const directory = resolve(root, 'content/articles');
  for (const file of await markdownFiles(directory)) {
    const existing = parseFrontmatter(await readFile(file, 'utf8')).data;
    if (existing.slug === slug) throw new Error(`이미 사용하는 글 주소입니다: ${slug}`);
  }
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const data = { title: title.trim(), description: '글에서 다룬 내용을 한두 문장으로 적습니다.', slug, date, topic, kind, tags: [], ...(book ? { book } : {}), ...(project ? { project } : {}), ...(series ? { series } : {}), draft: true };
  const sections = kind === 'reading' ? readingSections : kind === 'case-study' ? ['구현 목표', '구조와 구현', '선택한 방식과 이유', '검증한 범위', '남은 일'] : kind === 'devlog' ? ['이번 작업의 목표', '구현과 관찰', '확인한 결과', '다음 작업'] : ['주제', '정리와 예시', '참고 자료'];
  const guidance = kind === 'reading' ? '직접 읽고 남기고 싶은 내용을 작성합니다. 필요 없는 절은 지워도 됩니다.' : '재현 조건, 본인 판단과 확인한 근거를 작성합니다.';
  const body = sections.map((heading) => `## ${heading}\n\n<!-- ${guidance} -->`).join('\n\n');
  const output = join(directory, topic, `${slug}.md`);
  await mkdir(join(directory, topic), { recursive: true });
  await writeFile(output, `---\n${Object.entries(data).map(([key,value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n${body}\n`, { encoding: 'utf8', flag: 'wx' });
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { title: { type: 'string' }, slug: { type: 'string' }, topic: { type: 'string' }, kind: { type: 'string' }, series: { type: 'string' }, project: { type: 'string' }, 'book-title': { type: 'string' }, 'book-author': { type: 'string' }, 'book-finished': { type: 'string' }, 'book-note': { type: 'string' }, help: { type: 'boolean' } } });
    if (values.help) console.log('npm run new -- --title "글 제목" --slug english-slug --topic graphics --kind case-study [--series dcb --project dcb]\n독서 기록: --topic reading --book-title "책 제목" [--book-author "저자" --book-finished YYYY-MM-DD --book-note "짧은 감상"]');
    else console.log(`초안을 만들었습니다: ${await createPost({ ...values, bookTitle: values['book-title'], bookAuthor: values['book-author'], bookFinished: values['book-finished'], bookNote: values['book-note'] })}\n로컬 미리보기: npm run dev\n공개할 때 description과 본문을 작성하고 draft: false로 변경하세요.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
