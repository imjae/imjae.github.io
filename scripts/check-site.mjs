import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { markdownFiles } from './new-post.mjs';
import { parseFrontmatter } from './frontmatter.mjs';
import { selectPinnedArticles } from '../src/lib/pinned-articles.mjs';

const root = resolve('dist');
const failures = [];
const articles = [];
async function files(directory) { return (await Promise.all((await readdir(directory, { withFileTypes: true })).map((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]))).flat(); }
async function exists(file) { try { return (await stat(file)).isFile(); } catch { return false; } }
const htmlFiles = (await files(root)).filter((file) => file.endsWith('.html'));
const siteText = (await Promise.all(htmlFiles.map((file) => readFile(file, 'utf8')))).join('\n');
const feeds = (await readFile(join(root,'rss.xml'),'utf8')) + (await readFile(join(root,'sitemap.xml'),'utf8'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const target = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|data:|tel:|javascript:|#)/.test(target)) continue;
    const pathname = decodeURIComponent(target.split(/[?#]/)[0]);
    if (!pathname) continue;
    const base = pathname.startsWith('/') ? join(root, pathname) : resolve(dirname(file), pathname);
    if (!(await exists(base)) && !(await exists(join(base, 'index.html')))) failures.push(`${relative(root,file)} → ${target}`);
  }
}
for (const file of await markdownFiles(resolve('content/articles'))) {
  const { data } = parseFrontmatter(await readFile(file,'utf8'));
  articles.push({ data });
  const output = join(root,'writing',data.slug,'index.html');
  if (data.draft && await exists(output)) failures.push(`비공개 초안이 배포에 포함됨: ${data.slug}`);
  if (!data.draft && !(await exists(output))) failures.push(`공개 글 페이지 누락: ${data.slug}`);
  if (data.draft && siteText.includes(`/writing/${data.slug}/`)) failures.push(`초안 링크 노출: ${data.slug}`);
  if (data.draft && (siteText.includes(`"slug":"${data.slug}"`) || feeds.includes(data.slug))) failures.push(`검색 색인 또는 피드에 초안 노출: ${data.slug}`);
}
const home = await readFile(join(root,'index.html'),'utf8');
const pinnedSlugs = selectPinnedArticles(articles).map(article => article.data.slug);
const shownSlugs = [...home.matchAll(/<article\b[^>]*data-entry="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(shownSlugs) !== JSON.stringify(pinnedSlugs)) failures.push('Home 고정 글 목록과 공개 글의 pinned·pinOrder 설정이 다름');
if (pinnedSlugs.length > 0 && !home.includes('id="pinned-title"')) failures.push('Home Pinned 제목 누락');
const heroCopy = home.match(/<div class="hero-copy">([\s\S]*?)<\/div>/)?.[1] ?? '';
if (/<a\b/.test(heroCopy)) failures.push('Home 소개의 글 목록 버튼이 남아 있음');
for (const path of ['개발/2024/02/23/test-post.html','철학/2024/02/23/philosophy-The-Myth-Of-sisyphus.html']) {
  if (!(await exists(join(root,path)))) failures.push(`예전 글 주소의 실제 HTML 누락: ${path}`);
}
const editor = await readFile(join(root,'editor','index.html'),'utf8');
if (!/name="robots" content="noindex, nofollow"/.test(editor)) failures.push('수정 모드의 검색 수집 제외 설정 누락');
if (feeds.includes('/editor/')) failures.push('수정 모드가 RSS 또는 sitemap에 포함됨');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`${htmlFiles.length}개 HTML의 로컬 링크, 글 공개 상태, 예전 주소를 확인했습니다.`);
