import { dcbFeatures } from '../data/dcb-features.mjs';
import { dcbVideos } from '../data/dcb-videos.mjs';
import { studyCourses } from '../data/study-courses.mjs';
import { repository, branch } from './github-authoring.mjs';

const source = (label, path, directory = false) => ({ label, path, href: `${repository}/${directory ? 'tree' : 'edit'}/${branch}/${path.split('/').map(encodeURIComponent).join('/')}` });

// Only known pages receive an editor. A missing mapping must never open a different page's manager.
export function pageEditorContext(pathname) {
  if (pathname === '/') return { sources: [source('주제별 표지와 대표 글', 'src/data/home-covers.ts'), source('주제 이름과 설명', 'src/data/site.ts')], pins: true };
  if (pathname === '/writing/') return { sources: [source('글 목록의 소개', 'src/pages/writing/index.astro')], articles: {} };
  if (pathname === '/portfolio/') return { sources: [source('포트폴리오 목록과 소개', 'src/pages/portfolio/index.astro')] };
  if (pathname === '/games/') return { sources: [source('게임 이름과 대표 이미지', 'src/data/games.mjs')] };
  if (pathname === '/projects/dcb/') return {
    sources: [source('DCB 소개', 'src/pages/projects/dcb.astro'), source('기능 목록', 'src/data/dcb-features.mjs')],
    videoSlots: dcbVideos.filter(video => video.projectPage).map(video => video.slot),
  };
  const feature = dcbFeatures.find(item => pathname === `/projects/dcb/features/${item.slug}/`);
  if (feature) return {
    sources: [source(`${feature.title}의 소개와 글 연결`, 'src/data/dcb-features.mjs')],
    articles: { slugs: [feature.overviewSlug, ...feature.articleSlugs].filter(Boolean) },
    videoSlots: dcbVideos.filter(video => video.featureSlugs.includes(feature.slug)).map(video => video.slot),
  };
  const topic = pathname.match(/^\/topics\/(gameplay|graphics|tools|ai|notes|math|reading|study)\/$/)?.[1];
  if (topic) return {
    sources: [source('주제 이름과 설명', 'src/data/site.ts'),
      ...(topic === 'study' ? [source('학습 과정과 주차별 계획', 'src/data/study-courses.mjs')] : []),
      ...(topic === 'reading' ? [source('감상 미작성 책 목록', 'content/reading-list', true)] : [])],
    articles: { topic },
  };
  const series = pathname.match(/^\/series\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/)?.[1];
  if (series) return {
    sources: studyCourses.some(course => course.id === series)
      ? [source('학습 과정과 주차별 계획', 'src/data/study-courses.mjs')]
      : [source('시리즈 제목', 'src/data/site.ts'), source('시리즈 소개', 'src/pages/series/[series].astro')],
    articles: { series },
  };
  return null;
}

export function pageEditorArticles(articles, filter) {
  if (!filter) return [];
  return articles.filter(({ data }) => !data.draft && (!filter.topic || data.topic === filter.topic)
    && (!filter.series || data.series === filter.series) && (!filter.slugs || filter.slugs.includes(data.slug)));
}

export function pageModeUrl(href, editing) {
  const url = new URL(href);
  if (editing) url.searchParams.set('edit', '1'); else url.searchParams.delete('edit');
  return url.pathname + url.search + url.hash;
}
