import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { markdownFiles } from './new-post.mjs';
import { parseFrontmatter } from './frontmatter.mjs';
import { selectPinnedArticles, applyPinSettings } from '../src/lib/pinned-articles.mjs';
import { readPinSettings } from '../src/lib/pin-settings.server.mjs';
import { readProjectVideoSettingsBySlot } from '../src/lib/project-video.server.mjs';
import { projectVideoSlots } from '../src/lib/project-video.mjs';
import { dcbFeatures } from '../src/data/dcb-features.mjs';
import { featureUrl, selectFeatureArticles } from '../src/lib/portfolio-features.mjs';
import { githubFileUrl } from '../src/lib/github-authoring.mjs';
import { mergeReadingItems } from '../src/lib/reading-shelf.mjs';

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
  if (!data.draft && await exists(output)) {
    const html = await readFile(output, 'utf8');
    const modes = html.match(/<nav\b[^>]*class="mode-switch"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const editLink = [...modes.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]).find(link => />Edit(?:<|\s)/.test(link));
    const expected = githubFileUrl('edit', file);
    if (editLink?.match(/\bhref="([^"]*)"/)?.[1] !== expected || !editLink?.includes('target="_blank"') || !editLink?.includes('rel="noopener noreferrer"')) failures.push(`글의 Edit가 실제 원본의 GitHub 편집 화면으로 연결되지 않음: ${data.slug}`);
  }
  if (data.draft && siteText.includes(`/writing/${data.slug}/`)) failures.push(`초안 링크 노출: ${data.slug}`);
  if (data.draft && (siteText.includes(`"slug":"${data.slug}"`) || feeds.includes(data.slug))) failures.push(`검색 색인 또는 피드에 초안 노출: ${data.slug}`);
}
const home = await readFile(join(root,'index.html'),'utf8');
const readingListings = [];
for (const name of await readdir(resolve('content/reading-list'))) {
  if (!name.endsWith('.json')) continue;
  const data = JSON.parse(await readFile(resolve('content/reading-list', name), 'utf8'));
  if (!data.draft) readingListings.push({ data });
}
const readingPage = await readFile(join(root,'topics/reading/index.html'), 'utf8');
const expectedBooks = mergeReadingItems(articles.filter(article => !article.data.draft), readingListings).map(item => item.slug);
const shownBooks = [...readingPage.matchAll(/\bdata-book="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(expectedBooks) !== JSON.stringify(shownBooks)) failures.push('Reading 목록에 중복·누락된 책이나 비공개 기록이 있음');
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
const videoSettings = await readProjectVideoSettingsBySlot();
const projectVideo = videoSettings.project;
const projectPage = await readFile(join(root,'portfolio/dcb/index.html'),'utf8');
const featureLinks = [...projectPage.matchAll(/<a\b[^>]*data-feature="([^"]+)"[^>]*>/g)];
if (JSON.stringify(featureLinks.map(match => match[1])) !== JSON.stringify(dcbFeatures.map(feature => feature.slug))) failures.push('DCB 구현한 기능 목록과 기능 설정의 순서가 다름');
const recruitmentPage = await readFile(join(root,'portfolio/krafton-2027/index.html'),'utf8');
const editorSlots = [...editor.matchAll(/\bdata-video-editor="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(editorSlots) !== JSON.stringify(projectVideoSlots.map(slot => slot.id))) failures.push('영상 수정 모드의 전체 플레이·기능별 입력 항목이 다름');
for (const { id } of projectVideoSlots) {
  const figure = recruitmentPage.match(new RegExp(`<figure\\b[^>]*data-video-slot="${id}"[^>]*>[\\s\\S]*?</figure>`))?.[0];
  if (!figure) { failures.push(`포트폴리오 영상 칸 누락: ${id}`); continue; }
  const saved = videoSettings[id];
  if (!saved) continue;
  const field = editor.match(new RegExp(`<fieldset\\b[^>]*data-video-editor="${id}"[^>]*>[\\s\\S]*?</fieldset>`))?.[0] ?? '';
  const inputValue = field.match(/<input\b[^>]*\bvalue="([^"]*)"/)?.[1].replaceAll('&amp;', '&') ?? '';
  if (inputValue !== saved.videoUrl) failures.push(`영상 수정 모드의 게시된 주소가 다름: ${id}`);
  if (!saved.videoUrl) {
    if (/<(?:img|iframe|video)\b/.test(figure)) failures.push(`제거한 영상이 다시 표시됨: ${id}`);
  } else {
    const originalUrl = figure.match(/<a\b[^>]*\bhref="([^"]*)"/)?.[1].replaceAll('&amp;', '&');
    if (originalUrl !== saved.videoUrl) failures.push(`등록한 주소가 다른 영상 칸에 연결됨: ${id}`);
  }
}
const primaryFeatures = new Set(['ai-collaboration', 'monster-combat', 'ik-traversal', 'modular-equipment', 'water-playback', 'fire-vfx']);
const recruitmentFeatures = [...recruitmentPage.matchAll(/\bdata-dcb-feature="([^"]+)"/g)].map(match => match[1]);
const expectedRecruitmentFeatures = dcbFeatures.filter(feature => primaryFeatures.has(feature.slug)).map(feature => feature.slug);
if (JSON.stringify(recruitmentFeatures) !== JSON.stringify(expectedRecruitmentFeatures)) failures.push('지원용 포트폴리오의 AI 협업·대표 사례 순서가 DCB 기능 설정과 다름');
const recruitmentNav = recruitmentPage.match(/<nav\b[^>]*class="rp-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
const recruitmentAnchors = [...recruitmentNav.matchAll(/\bhref="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(recruitmentAnchors) !== JSON.stringify(['#project', '#ai', '#client', '#graphics', '#scope'])) failures.push('지원용 포트폴리오 메뉴에서 AI 협업이 대표 구현보다 뒤에 있음');
const extraFeatureOrder = [...recruitmentPage.matchAll(/\bdata-portfolio-extra="\/writing\/([^/]+)\/"/g)].map(match => {
  const index = dcbFeatures.findIndex(feature => feature.overviewSlug === match[1] || feature.articleSlugs.includes(match[1]));
  return index < 0 ? dcbFeatures.length : index;
});
if (extraFeatureOrder.some((order, index) => index > 0 && order < extraFeatureOrder[index - 1])) failures.push('지원용 포트폴리오의 추가 구현 글 순서가 DCB 기능 설정과 다름');
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
  const overviewSection = html.match(/<section\b[^>]*data-feature-overview\b[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  const analysisSection = html.match(/<section\b[^>]*data-feature-analyses\b[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  const overviewSlugs = [...overviewSection.matchAll(/<article\b[^>]*data-entry="([^"]+)"/g)].map(match => match[1]);
  const analysisSlugs = [...analysisSection.matchAll(/<article\b[^>]*data-entry="([^"]+)"/g)].map(match => match[1]);
  const expectedOverview = expected.filter(slug => slug === feature.overviewSlug);
  const expectedAnalyses = expected.filter(slug => slug !== feature.overviewSlug);
  if (JSON.stringify(overviewSlugs) !== JSON.stringify(expectedOverview) || JSON.stringify(analysisSlugs) !== JSON.stringify(expectedAnalyses)) failures.push(`기능 설명과 구현·분석 글의 구분이 다름: ${feature.slug}`);
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
