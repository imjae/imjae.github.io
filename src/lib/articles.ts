import { getCollection, type CollectionEntry } from 'astro:content';
import { readPinSettings } from './pin-settings.server.mjs';
import { applyPinSettings } from './pinned-articles.mjs';
export type Article = CollectionEntry<'articles'>;

export async function getArticles(includeDrafts = import.meta.env.DEV) {
  const articles = await getCollection('articles', ({ data }) => includeDrafts || !data.draft);
  const slugs = new Set<string>();
  for (const article of articles) {
    if (slugs.has(article.data.slug)) throw new Error(`중복된 글 주소: ${article.data.slug}`);
    slugs.add(article.data.slug);
  }
  const settings = await readPinSettings();
  return applyPinSettings(articles, settings?.pins).sort((a, b) => b.data.date.localeCompare(a.data.date) || (a.data.order ?? 99) - (b.data.order ?? 99) || a.data.slug.localeCompare(b.data.slug));
}

export const articleUrl = (article: Article) => `/writing/${article.data.slug}/`;
export const formatDate = (date: string) => date.replaceAll('-', '.');
export const dateBasisLabel = (basis: Article['data']['dateBasis']) => ({ authored: '블로그 작성일', notion: '노션 원문 생성일', commit: '관련 작업의 커밋 작성일', legacy: '기존 블로그 작성일' })[basis];
export const readingTime = (article: Article) => Math.max(1, Math.ceil((article.body?.length ?? 0) / 650));
