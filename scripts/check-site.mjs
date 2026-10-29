import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { markdownFiles } from './new-post.mjs';
import { parseFrontmatter } from './frontmatter.mjs';
import { selectPinnedArticles, applyPinSettings } from '../src/lib/pinned-articles.mjs';
import { readPinSettings } from '../src/lib/pin-settings.server.mjs';
import { readProjectVideoSettingsBySlot } from '../src/lib/project-video.server.mjs';
import { projectVideoSlots } from '../src/lib/project-video.mjs';
import { dcbFeatures } from '../src/data/dcb-features.mjs';
import { dcbVideos, getDcbVideoMedia } from '../src/data/dcb-videos.mjs';
import { resolvePortfolioMedia } from '../src/lib/recruitment-media.mjs';
import { featureUrl, selectFeatureArticles } from '../src/lib/portfolio-features.mjs';
import { githubFileUrl } from '../src/lib/github-authoring.mjs';
import { mergeReadingItems } from '../src/lib/reading-shelf.mjs';
import { managedPostSlugs, managedPostUrl } from '../src/lib/managed-posts.server.mjs';

const privateAuthoring = process.env.AUTHORING_MODE === 'private';
const root = resolve(privateAuthoring ? '.authoring-dist' : 'dist');
const failures = [];
const articles = [];
const managed = await managedPostSlugs();
async function files(directory) { return (await Promise.all((await readdir(directory, { withFileTypes: true })).map((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]))).flat(); }
async function exists(file) { try { return (await stat(file)).isFile(); } catch { return false; } }
const htmlFiles = (await files(root)).filter((file) => file.endsWith('.html'));
const siteText = (await Promise.all(htmlFiles.map((file) => readFile(file, 'utf8')))).join('\n');
if (!privateAuthoring && /data-author-session|action="\/auth\/logout"/.test(siteText)) failures.push('공개 빌드에 소유자 세션 전용 UI가 포함됨');
if (!privateAuthoring && /id="publish-progress"|id="publish-articles"/.test(siteText)) failures.push('공개 빌드에 저장·배포 관리 화면이 포함됨');
if (privateAuthoring && !siteText.includes('id="publish-progress"')) failures.push('편집 빌드에 저장·배포 진행창이 없음');
const publishManifest = JSON.parse(await readFile(join(root, 'publish-manifest.json'), 'utf8'));
if (publishManifest.version !== 1 || !/^[a-f0-9]{40}$/.test(publishManifest.revision ?? '')) failures.push('배포 버전 식별자 누락');
if (!publishManifest.articles || typeof publishManifest.articles !== 'object' || Array.isArray(publishManifest.articles)) failures.push('기존 글 이전에 필요한 공개 글 배포 정보 누락');
if (!Array.isArray(publishManifest.managedPosts) || JSON.stringify([...publishManifest.managedPosts].sort()) !== JSON.stringify([...managed].sort())) failures.push('공개·비공개 관리 글의 배포 정보 불일치');
const feeds = (await readFile(join(root,'rss.xml'),'utf8')) + (await readFile(join(root,'sitemap.xml'),'utf8'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const target = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|data:|tel:|javascript:|#)/.test(target)) continue;
    if (privateAuthoring && target.startsWith('/notes/edit/')) continue;
    const pathname = decodeURIComponent(target.split(/[?#]/)[0]);
    if (!pathname) continue;
    const base = pathname.startsWith('/') ? join(root, pathname) : resolve(dirname(file), pathname);
    if (!(await exists(base)) && !(await exists(join(base, 'index.html')))) failures.push(`${relative(root,file)} → ${target}`);
  }
}
for (const file of await markdownFiles(resolve('content/articles'))) {
  const { data } = parseFrontmatter(await readFile(file,'utf8'));
  if (managed.has(data.slug)) {
    const movedPage = join(root, 'writing', data.slug, 'index.html');
    const redirect = await exists(movedPage) ? await readFile(movedPage, 'utf8') : '';
    if (!redirect.includes(managedPostUrl(data.slug))) failures.push(`이전 글 주소 연결 누락: ${data.slug}`);
    if (redirect.includes(data.description) || redirect.includes('class="prose"')) failures.push(`이전 글 원문이 정적 페이지에 남음: ${data.slug}`);
    if (Object.values(publishManifest.articles ?? {}).some(article => article.url === `/writing/${data.slug}/`)) failures.push(`이전 글이 공개 글 manifest에 남음: ${data.slug}`);
    if (siteText.includes(`"slug":"${data.slug}"`) || feeds.includes(`/writing/${data.slug}/`)) failures.push(`이전 글이 정적 검색 또는 피드에 남음: ${data.slug}`);
    articles.push({ data: { ...data, draft: true } });
    continue;
  }
  articles.push({ data });
  const output = join(root,'writing',data.slug,'index.html');
  if (data.draft && await exists(output)) failures.push(`비공개 초안이 배포에 포함됨: ${data.slug}`);
  const manifestPath = relative(resolve('.'), file).replaceAll('\\', '/');
  if (data.draft && Object.hasOwn(publishManifest.articles ?? {}, manifestPath)) failures.push(`공개 글 배포 정보에 초안이 포함됨: ${data.slug}`);
  if (!data.draft && (publishManifest.articles?.[manifestPath]?.url !== `/writing/${data.slug}/` || publishManifest.articles?.[manifestPath]?.title !== data.title)) failures.push(`공개 글의 배포 정보 불일치: ${data.slug}`);
  if (data.draft && Object.hasOwn(publishManifest.files, manifestPath)) failures.push(`배포 확인 정보에 초안이 포함됨: ${data.slug}`);
  if (!data.draft && !(await exists(output))) failures.push(`공개 글 페이지 누락: ${data.slug}`);
  if (!data.draft && await exists(output)) {
    const html = await readFile(output, 'utf8');
    const modes = html.match(/<nav\b[^>]*class="mode-switch"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const editLink = [...modes.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]).find(link => />Edit(?:<|\s)/.test(link));
    const expected = githubFileUrl('edit', file);
    if (privateAuthoring && (editLink?.match(/\bhref="([^"]*)"/)?.[1] !== expected || !editLink?.includes('target="_blank"') || !editLink?.includes('rel="noopener noreferrer"'))) failures.push(`글의 Edit가 실제 원본의 GitHub 편집 화면으로 연결되지 않음: ${data.slug}`);
    if (!privateAuthoring && editLink) failures.push(`공개 글에 로그인 없는 Edit가 노출됨: ${data.slug}`);
  }
  if (data.draft && siteText.includes(`/writing/${data.slug}/`)) failures.push(`초안 링크 노출: ${data.slug}`);
  if (data.draft && (siteText.includes(`"slug":"${data.slug}"`) || feeds.includes(data.slug))) failures.push(`검색 색인 또는 피드에 초안 노출: ${data.slug}`);
}
const home = await readFile(join(root,'index.html'),'utf8');
for (const slug of managed) {
  const redirectPath = join(root, 'writing', slug, 'index.html');
  if (!(await exists(redirectPath)) || !(await readFile(redirectPath, 'utf8')).includes(managedPostUrl(slug))) failures.push(`이전 글 주소 연결 누락: ${slug}`);
}
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
const projectPage = await readFile(join(root,'projects/dcb/index.html'),'utf8');
const portfolioPage = await readFile(join(root,'portfolio/index.html'),'utf8');
const portfolioMain = portfolioPage.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
const portfolioLinks = [...portfolioMain.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(portfolioLinks) !== JSON.stringify(['/portfolio/2027/', '/portfolio/unreal-porting/']) || /<(?:section|svg)\b/.test(portfolioMain)) failures.push('포트폴리오 목록의 DCB 프로젝트·언리얼 엔진 포팅 연결이 다름');
const unrealPortfolio = await readFile(join(root,'portfolio/unreal-porting/index.html'),'utf8');
if (!unrealPortfolio.includes('rel="canonical" href="https://imjae.github.io/portfolio/unreal-porting/"') || !feeds.includes('<loc>https://imjae.github.io/portfolio/unreal-porting/</loc>')) failures.push('언리얼 포팅 포트폴리오의 정규 주소 또는 사이트맵 누락');
for (const [, id] of unrealPortfolio.matchAll(/href="#([^"]+)"/g)) if (!unrealPortfolio.includes(`id="${id}"`)) failures.push(`언리얼 포팅 목차의 이동 대상 누락: ${id}`);
if (privateAuthoring && !unrealPortfolio.includes('href="https://github.com/imjae/imjae.github.io/edit/main/src/pages/portfolio/unreal-porting/index.astro"')) failures.push('언리얼 포팅 페이지의 보호된 GitHub 편집 링크 누락');
if (/<(?:button|a)\b[^>]*\bdata-portfolio-edit(?:=|\s|>)|id="portfolio-copy-state"/.test(unrealPortfolio)) failures.push('언리얼 포팅 페이지에 기존 DCB 전용 문구 편집기가 표시됨');
async function checkDcbRoute(html, route) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
  if (/\bhref="\/portfolio\//.test(main) || /<a\b[^>]*href="\/portfolio\/"[^>]*aria-current=/.test(html)) failures.push(`DCB 화면이 포트폴리오 하위로 표시됨: ${route}`);
  if (!html.includes(`rel="canonical" href="https://imjae.github.io${route}"`)) failures.push(`DCB 정규 주소가 다름: ${route}`);
  if (!feeds.includes(`<loc>https://imjae.github.io${route}</loc>`)) failures.push(`DCB 정규 주소의 sitemap 누락: ${route}`);
  if (!route.startsWith('/projects/dcb/')) return;
  const oldRoute = route.replace('/projects/dcb/', '/portfolio/dcb/');
  const redirectPath = join(root, oldRoute, 'index.html');
  if (!(await exists(redirectPath))) { failures.push(`기존 DCB 주소의 정적 이동 페이지 누락: ${oldRoute}`); return; }
  const redirect = await readFile(redirectPath, 'utf8');
  if (!redirect.includes(`content="0;url=${route}"`) || !redirect.includes(`href="${route}"`)) failures.push(`기존 DCB 주소의 이동 대상이 다름: ${oldRoute}`);
  if (feeds.includes(`<loc>https://imjae.github.io${oldRoute}</loc>`)) failures.push(`기존 DCB 주소가 sitemap에 남음: ${oldRoute}`);
}
await checkDcbRoute(projectPage, '/projects/dcb/');
await checkDcbRoute(await readFile(join(root,'series/dcb/index.html'),'utf8'), '/series/dcb/');
const featureLinks = [...projectPage.matchAll(/<a\b[^>]*data-feature="([^"]+)"[^>]*>/g)];
if (JSON.stringify(featureLinks.map(match => match[1])) !== JSON.stringify(dcbFeatures.map(feature => feature.slug))) failures.push('DCB 구현한 기능 목록과 기능 설정의 순서가 다름');
const recruitmentPage = await readFile(join(root,'portfolio/2027/index.html'),'utf8');
const portfolioRedirect = await readFile(join(root,'portfolio/krafton-2027/index.html'),'utf8');
if (!portfolioRedirect.includes('content="0;url=/portfolio/2027/"') || !portfolioRedirect.includes('href="/portfolio/2027/"') || !portfolioRedirect.includes('window.location.search + window.location.hash')) failures.push('기존 포트폴리오 주소의 정적 이동 또는 쿼리·앵커 보존 누락');
if (!recruitmentPage.includes('rel="canonical" href="https://imjae.github.io/portfolio/2027/"') || !recruitmentPage.includes('property="og:url" content="https://imjae.github.io/portfolio/2027/"')) failures.push('포트폴리오 정규 주소 또는 공유 주소 불일치');
if (!feeds.includes('<loc>https://imjae.github.io/portfolio/2027/</loc>') || feeds.includes('/portfolio/krafton-2027/')) failures.push('포트폴리오 사이트맵 주소 불일치');
if (/크래프톤|KRAFTON/i.test(portfolioMain + recruitmentPage)) failures.push('포트폴리오에 지원처 전용 문구가 남음');
if (!recruitmentPage.includes('href="/projects/dcb/"')) failures.push('지원용 포트폴리오에서 DCB 프로젝트 참조가 누락됨');
const portfolioModes = recruitmentPage.match(/<nav\b[^>]*aria-label="Portfolio mode"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
if (privateAuthoring && (!portfolioModes.includes('data-portfolio-edit') || !portfolioModes.includes('data-portfolio-view') || portfolioModes.includes('github.com'))) failures.push('포트폴리오 Edit가 화면 안의 문구 편집 전환이 아님');
const stateJson = recruitmentPage.match(/<script\b[^>]*id="portfolio-copy-state"[^>]*>([\s\S]*?)<\/script>/)?.[1];
const copyState = stateJson ? JSON.parse(stateJson) : {};
const copyKeys = [...recruitmentPage.matchAll(/\bdata-portfolio-copy="([^"]+)"/g)].map(match => match[1]);
for (const key of ['profile.headline', 'project.description', 'pageCopy.combatContents', 'aiUsageCase.title', 'pageCopy.clientTitle', 'clientCases.traversal.implementation.0', 'graphicsCases.water.intro', 'graphicsCases.fire.implementation.0']) {
  if (!copyKeys.includes(key)) failures.push(`포트폴리오 주요 문구 편집 지점 누락: ${key}`);
}
if (privateAuthoring) for (const key of copyKeys) if (!Object.hasOwn(copyState, key)) failures.push(`편집 문구의 저장 식별자 누락: ${key}`);
if (!privateAuthoring && (stateJson || portfolioModes.includes('data-portfolio-edit') || editor.includes('id="new-post-form"') || editor.includes('id="pin-editor-data"') || editor.includes('data-video-editor='))) failures.push('공개 빌드에 로그인 없는 편집 화면이 포함됨');
if (!privateAuthoring && /data-add-paragraph=|id="portfolio-copy-defaults"|id="portfolio-copy-removed"/.test(recruitmentPage)) failures.push('공개 포트폴리오에 문구 추가·삭제 관리 UI가 포함됨');
if (privateAuthoring && (!recruitmentPage.includes('id="portfolio-copy-remove"') || !recruitmentPage.includes('id="portfolio-copy-removed"') || [...recruitmentPage.matchAll(/data-add-paragraph=/g)].length !== 11)) failures.push('보호된 포트폴리오의 문구 삭제·복원·문단 추가 UI 누락');
if (privateAuthoring && (!recruitmentPage.includes('id="portfolio-copy-up"') || !recruitmentPage.includes('id="portfolio-copy-down"'))) failures.push('보호된 포트폴리오의 문단 위·아래 이동 버튼 누락');
if (!privateAuthoring && /id="portfolio-copy-(?:up|down|order)"/.test(recruitmentPage)) failures.push('공개 포트폴리오에 문단 순서 관리 UI가 포함됨');
if (copyKeys.some(key => /^(?:clientCases|graphicsCases)\.[^.]+\.role$/.test(key)) || /<dt>내 역할<\/dt>/.test(recruitmentPage)) failures.push('포트폴리오 기능별 사례에 제거한 내 역할 칸이 표시됨');
if (copyKeys.includes('project.role') || copyKeys.some(key => /^contributionRows\./.test(key) || /^pageCopy\.scope/.test(key)) || /(?:id="scope"|href="#scope"|class="rp-project-assets"|<dt>담당 범위<\/dt>)/.test(recruitmentPage)) failures.push('지원용 포트폴리오에 제거한 담당 범위·사용 자산 구역이나 연결이 표시됨');
if (privateAuthoring && !editor.includes('href="/portfolio/2027/?edit=1"')) failures.push('관리 화면에 포트폴리오 직접 편집 연결 누락');
const editorSlots = [...editor.matchAll(/\bdata-video-editor="([^"]+)"/g)].map(match => match[1]);
if (privateAuthoring && JSON.stringify(editorSlots) !== JSON.stringify(projectVideoSlots.map(slot => slot.id))) failures.push('영상 수정 모드의 전체 플레이·기능별 입력 항목이 다름');
const recruitmentVideoSlots = new Set(['project', 'combat', 'traversal', 'equipment', 'water', 'fire']);
const readVideoFigure = (html, slot) => html.match(new RegExp(`<figure\\b[^>]*data-video-slot="${slot}"[^>]*>[\\s\\S]*?</figure>`))?.[0];
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
function checkVideoDestination(html, slot, destination, placeholder = false, showCaption = true) {
  const figure = readVideoFigure(html, slot);
  const saved = videoSettings[slot];
  if (!saved?.videoUrl) {
    if (placeholder && !figure) failures.push(`${destination} 영상 칸 누락: ${slot}`);
    if (!placeholder && figure) failures.push(`${destination} 미등록 영상 영역 노출: ${slot}`);
    if (saved && figure && /<(?:img|iframe|video)\b/.test(figure)) failures.push(`${destination} 제거한 영상이 다시 표시됨: ${slot}`);
    return;
  }
  const media = resolvePortfolioMedia(getDcbVideoMedia(slot, saved));
  if (!media) { failures.push(`등록한 영상 주소를 표시할 수 없음: ${slot}`); return; }
  if (!figure) { failures.push(`${destination} 등록 영상 누락: ${slot}`); return; }
  const originalUrl = figure.match(/<a\b[^>]*\bhref="([^"]*)"/)?.[1].replaceAll('&amp;', '&');
  if (originalUrl !== media.url) failures.push(`${destination} 등록한 주소가 다른 영상 칸에 연결됨: ${slot}`);
  const caption = figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] ?? '';
  if (!figure.includes(escapeHtml(media.title))) failures.push(`${destination} 영상 접근성 제목 누락: ${slot}`);
  if (showCaption && (!caption.includes(escapeHtml(media.title)) || !caption.includes(escapeHtml(media.caption)))) failures.push(`${destination} 실제 영상 제목·촬영 범위 캡션이 다름: ${slot}`);
  if (!showCaption && (caption.includes(escapeHtml(media.title)) || caption.includes(escapeHtml(media.caption)))) failures.push(`${destination} 제거한 영상 하단 문구가 표시됨: ${slot}`);
  for (const [tag, src] of [['iframe', media.embedUrl], ['video', media.videoSrc], ['img', media.gifSrc]]) {
    if (!src) continue;
    const actualSrc = figure.match(new RegExp(`<${tag}\\b[^>]*\\bsrc="([^"]*)"`))?.[1].replaceAll('&amp;', '&');
    if (actualSrc !== src) failures.push(`${destination} 재생 미디어 주소가 다름: ${slot}`);
  }
}
for (const { id } of projectVideoSlots) {
  if (recruitmentVideoSlots.has(id)) checkVideoDestination(recruitmentPage, id, '지원용 포트폴리오', true, id !== 'project');
  else if (readVideoFigure(recruitmentPage, id)) failures.push(`지원용 대표 사례에 추가 영상이 잘못 연결됨: ${id}`);
  const saved = videoSettings[id];
  if (!saved || !privateAuthoring) continue;
  const field = editor.match(new RegExp(`<fieldset\\b[^>]*data-video-editor="${id}"[^>]*>[\\s\\S]*?</fieldset>`))?.[0] ?? '';
  const inputValue = field.match(/<input\b[^>]*\bvalue="([^"]*)"/)?.[1].replaceAll('&amp;', '&') ?? '';
  if (inputValue !== saved.videoUrl) failures.push(`영상 수정 모드의 게시된 주소가 다름: ${id}`);
}
for (const video of dcbVideos) {
  if (video.projectPage) checkVideoDestination(projectPage, video.slot, 'DCB 소개');
  else if (readVideoFigure(projectPage, video.slot)) failures.push(`DCB 소개에 기능별 영상이 잘못 연결됨: ${video.slot}`);
}
const primaryFeatures = new Set(['ai-collaboration', 'monster-combat', 'ik-traversal', 'modular-equipment', 'water-playback', 'fire-vfx']);
const recruitmentFeatures = [...recruitmentPage.matchAll(/\bdata-dcb-feature="([^"]+)"/g)].map(match => match[1]);
const expectedRecruitmentFeatures = dcbFeatures.filter(feature => primaryFeatures.has(feature.slug)).map(feature => feature.slug);
if (JSON.stringify(recruitmentFeatures) !== JSON.stringify(expectedRecruitmentFeatures)) failures.push('지원용 포트폴리오의 AI 협업·대표 사례 순서가 DCB 기능 설정과 다름');
const recruitmentNav = recruitmentPage.match(/<nav\b[^>]*class="rp-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
const recruitmentAnchors = [...recruitmentNav.matchAll(/\bhref="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(recruitmentAnchors) !== JSON.stringify(['#project', '#ai', '#client', '#graphics'])) failures.push('지원용 포트폴리오 메뉴의 구역이나 AI 협업 순서가 다름');
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
  await checkDcbRoute(html, route);
  for (const video of dcbVideos) {
    if (video.featureSlugs.includes(feature.slug)) checkVideoDestination(html, video.slot, `기능 ${feature.slug}`);
    else if (readVideoFigure(html, video.slot)) failures.push(`영상이 다른 기능에 연결됨: ${video.slot} → ${feature.slug}`);
  }
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
if (privateAuthoring && (!projectPage.includes('/editor/?project=dcb#project-video') || !editor.includes('id="project-video"'))) failures.push('DCB 영상 링크의 수정 모드 연결 누락');
if (!/name="robots" content="noindex, nofollow"/.test(editor)) failures.push('수정 모드의 검색 수집 제외 설정 누락');
if (feeds.includes('/editor/')) failures.push('수정 모드가 RSS 또는 sitemap에 포함됨');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`${htmlFiles.length}개 HTML의 로컬 링크, 글 공개 상태, 예전 주소를 확인했습니다.`);
