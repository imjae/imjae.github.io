export function mergeReadingItems(articles, listings) {
  const items = new Map();
  for (const { data } of listings) {
    if (items.has(data.slug)) throw new Error(`중복된 독서 목록 주소: ${data.slug}`);
    items.set(data.slug, { slug: data.slug, date: data.date, book: { title: data.title, author: data.author }, article: null, sources: data.sources, rating: data.rating });
  }
  for (const article of articles.filter(article => article.data.topic === 'reading')) {
    const previous = items.get(article.data.slug);
    items.set(article.data.slug, { slug: article.data.slug, date: article.data.date, book: article.data.book, article, sources: previous?.sources ?? [], rating: previous?.rating });
  }
  return [...items.values()].sort((a, b) => (b.book.finished ?? b.date).localeCompare(a.book.finished ?? a.date) || a.slug.localeCompare(b.slug));
}
