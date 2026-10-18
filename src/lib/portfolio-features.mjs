export function featureUrl(feature) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(feature.slug ?? '')) throw new Error('기능 주소를 확인해 주세요.');
  return `/portfolio/dcb/features/${feature.slug}/`;
}

export function selectFeatureArticles(feature, articles, includeDrafts = false) {
  const bySlug = new Map(articles
    .filter(article => includeDrafts || !article.data.draft)
    .map(article => [article.data.slug, article]));
  return [...new Set(feature.articleSlugs)].flatMap(slug => bySlug.has(slug) ? [bySlug.get(slug)] : []);
}
