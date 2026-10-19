import { getCollection } from 'astro:content';
import { getArticles, type Article } from './articles';
import { mergeReadingItems } from './reading-shelf.mjs';

export async function getReadingItems(articles?: Article[]) {
  const entries = articles ?? await getArticles();
  const listings = await getCollection('readingList', ({ data }) => import.meta.env.DEV || !data.draft);
  return mergeReadingItems(entries, listings);
}
