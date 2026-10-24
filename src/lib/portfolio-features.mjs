export function featureUrl(feature) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(feature.slug ?? '')) throw new Error('기능 주소를 확인해 주세요.');
  return `/projects/dcb/features/${feature.slug}/`;
}

export function selectFeatureArticles(feature, articles, includeDrafts = false) {
  const bySlug = new Map(articles
    .filter(article => includeDrafts || !article.data.draft)
    .map(article => [article.data.slug, article]));
  return [...new Set([feature.overviewSlug, ...feature.articleSlugs].filter(Boolean))]
    .flatMap(slug => bySlug.has(slug) ? [bySlug.get(slug)] : []);
}

export function groupFeatureArticles(feature, articles, includeDrafts = false) {
  const selected = selectFeatureArticles(feature, articles, includeDrafts);
  return {
    overview: selected.find(article => article.data.slug === feature.overviewSlug),
    analyses: selected.filter(article => article.data.slug !== feature.overviewSlug),
  };
}
