import type { APIRoute } from 'astro';
import { getArticles, articleUrl } from '../lib/articles';
import { site, topics } from '../data/site';
import { dcbFeatures } from '../data/dcb-features.mjs';
import { featureUrl } from '../lib/portfolio-features.mjs';
import { projects } from '../data/projects.mjs';
import { studyCourses } from '../data/study-courses.mjs';
export const GET: APIRoute = async () => {
  const articles = await getArticles(false);
  const series = [...new Set([...studyCourses.map(course => course.id), ...articles.map((article) => article.data.series).filter(Boolean)])];
  const routes = ['/', '/about/', '/writing/', '/portfolio/', '/projects/', ...projects.map(project => `/projects/${project.id}/`), ...projects.filter(project => project.id !== 'dcb').map(project => project.records), '/portfolio/2027/', '/portfolio/unreal-porting/', ...dcbFeatures.map(featureUrl), ...series.map((id) => `/series/${id}/`), ...topics.map((topic) => `/topics/${topic.id}/`), ...articles.map(articleUrl)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${site.url}${route}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
