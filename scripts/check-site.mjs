import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { markdownFiles } from './new-post.mjs';
import { parseFrontmatter } from './frontmatter.mjs';
import { selectPinnedArticles, applyPinSettings } from '../src/lib/pinned-articles.mjs';
import { readPinSettings } from '../src/lib/pin-settings.server.mjs';
import { readProjectVideoSettings } from '../src/lib/project-video.server.mjs';
import { dcbFeatures } from '../src/data/dcb-features.mjs';
import { featureUrl, selectFeatureArticles } from '../src/lib/portfolio-features.mjs';

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
const settings = await readPinSettings();
const pinnedSlugs = selectPinnedArticles(applyPinSettings(articles, settings?.pins)).map(article => article.data.slug);
const shownSlugs = [...home.matchAll(/<article\b[^>]*data-entry="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(shownSlugs) !== JSON.stringify(pinnedSlugs)) failures.push('Home 고정 글 목록과 공개 글의 pinned·pinOrder 설정이 다름');
if (pinnedSlugs.length > 0 && !home.includes('id="pinned-title"')) failures.push('Home Pinned 제목 누락');
const heroCopy = home.match(/<div class="hero-copy">([\s\S]*?)<\/div>/)?.[1] ?? '';
if (/<a\b/.test(heroCopy)) failures.push('Home 소개의 글 목록 버튼이 남아 있음');
for (const path of ['개발/2024/02/23/test-post.html','철학/2024/02/23/philosophy-The-Myth-Of-sisyphus.html']) {
  if (!(await exists(join(root,path)))) failures.push(`예전 글 주소의 실제 HTML 누락: ${path}`);
}
const editor = await readFile(join(root,'editor','index.html'),'utf8');
const projectVideo = await readProjectVideoSettings();
const projectPage = await readFile(join(root,'portfolio/dcb/index.html'),'utf8');
const featureLinks = [...projectPage.matchAll(/<a\b[^>]*data-feature="([^"]+)"[^>]*>/g)];
if (JSON.stringify(featureLinks.map(match => match[1])) !== JSON.stringify(dcbFeatures.map(feature => feature.slug))) failures.push('DCB 구현한 기능 목록과 기능 설정의 순서가 다름');
for (const feature of dcbFeatures) {
  const route = featureUrl(feature);
  const linked = featureLinks.find(match => match[1] === feature.slug)?.[0];
  if (linked?.match(/\bhref="([^"]*)"/)?.[1] !== route) failures.push(`기능 목록이 관련 글 화면으로 연결되지 않음: ${feature.slug}`);
  const page = join(root,route,'index.html');
  if (!(await exists(page))) { failures.push(`기능 상세 화면 누락: ${feature.slug}`); continue; }
  const html = await readFile(page,'utf8');
  const expected = selectFeatureArticles(feature, articles).map(article => article.data.slug);
  const actual = [...html.matchAll(/<article\b[^>]*data-entry="([^"]+)"/g)].map(match => match[1]);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`기능별 공개 글 목록·순서가 다름: ${feature.slug}`);
  if (!feeds.includes(route)) failures.push(`기능 상세 화면의 sitemap 경로 누락: ${feature.slug}`);
}
const videoLink = projectPage.match(/<a\b[^>]*class="[^"]*\bproject-video-link\b[^"]*"[^>]*>/)?.[0];
if (projectVideo?.videoUrl) {
  const href = videoLink?.match(/\bhref="([^"]*)"/)?.[1].replaceAll('&amp;', '&');
  if (href !== projectVideo.videoUrl || !videoLink?.includes('target="_blank"') || !videoLink?.includes('rel="noopener noreferrer"')) failures.push('DCB 소개의 게임 영상 링크와 저장 설정이 다름');
} else if (videoLink) failures.push('영상 주소가 없는데 DCB 소개에 영상 버튼이 노출됨');
if (!projectPage.includes('/editor/?project=dcb#project-video') || !editor.includes('id="project-video"')) failures.push('DCB 영상 링크의 수정 모드 연결 누락');
if (!/name="robots" content="noindex, nofollow"/.test(editor)) failures.push('수정 모드의 검색 수집 제외 설정 누락');
if (feeds.includes('/editor/')) failures.push('수정 모드가 RSS 또는 sitemap에 포함됨');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`${htmlFiles.length}개 HTML의 로컬 링크, 글 공개 상태, 예전 주소를 확인했습니다.`);
