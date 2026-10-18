/**
 * @template {{ data: { pinned?: boolean, draft?: boolean, pinOrder?: number, date: string, slug: string } }} T
 * @param {T[]} articles
 * @returns {T[]}
 */
export function selectPinnedArticles(articles) {
  return articles.filter(({ data }) => data.pinned && !data.draft).sort((a, b) =>
    (a.data.pinOrder ?? Infinity) - (b.data.pinOrder ?? Infinity)
    || b.data.date.localeCompare(a.data.date)
    || a.data.slug.localeCompare(b.data.slug));
}
