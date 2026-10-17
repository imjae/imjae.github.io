import type { APIRoute } from 'astro';
import { getArticles, articleUrl } from '../lib/articles';
import { site } from '../data/site';
const escape = (text: string) => text.replace(/[<>&"']/g, (value) => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[value]!));
export const GET: APIRoute = async () => {
  const articles = await getArticles(false);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(site.title)}</title><link>${site.url}</link><description>${escape(site.description)}</description><language>ko</language>${articles.map((article) => `<item><title>${escape(article.data.title)}</title><link>${site.url}${articleUrl(article)}</link><guid>${site.url}${articleUrl(article)}</guid><description>${escape(article.data.description)}</description><pubDate>${new Date(`${article.data.date}T00:00:00+09:00`).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
