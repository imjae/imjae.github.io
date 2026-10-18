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

export function validatePinSettings(value) {
  if (!value || value.version !== 1 || typeof value.createdAt !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.createdAt)
    || Number.isNaN(Date.parse(value.createdAt)) || new Date(value.createdAt).toISOString() !== value.createdAt
    || !Array.isArray(value.pins) || value.pins.length > 1000
    || value.pins.some(slug => typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    || new Set(value.pins).size !== value.pins.length) {
    throw new Error('고정 글 설정의 날짜·주소·중복 여부를 확인해 주세요.');
  }
  return value;
}

/**
 * @template {{ data: { slug: string, pinned?: boolean, pinOrder?: number } }} T
 * @param {T[]} articles
 * @param {string[] | undefined} pins
 * @returns {T[]}
 */
export function applyPinSettings(articles, pins) {
  if (pins === undefined) return articles;
  const order = new Map(pins.map((slug, index) => [slug, index + 1]));
  return articles.map(article => ({ ...article, data: { ...article.data, pinned: order.has(article.data.slug), pinOrder: order.get(article.data.slug) } }));
}
