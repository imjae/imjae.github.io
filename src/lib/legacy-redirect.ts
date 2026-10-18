import { getArticles } from './articles';
import { site } from '../data/site';

export async function redirectOldArticle(slug: string) {
  const available = (await getArticles(false)).some(article => article.data.slug === slug);
  const target = available ? `/writing/${slug}/` : '/topics/notes/';
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=${target}"><meta name="robots" content="noindex"><link rel="canonical" href="${site.url}${target}"><title>글 목록으로 이동</title></head><body><p><a href="${target}">${available ? '현재 글 주소로 이동' : '기술 메모 목록으로 이동'}</a></p></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
