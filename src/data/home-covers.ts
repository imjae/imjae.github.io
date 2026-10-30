import type { Article } from '../lib/articles';
import { topics } from './site';

// Cover selections are independent of the owner's pinned-article order.
export const homeCoverSlugs: Record<(typeof topics)[number]['id'], string> = {
  gameplay: 'monster-combat', graphics: 'dissolve-threshold-edge',
  tools: 'modular-equipment', ai: 'parallel-ai-worktrees',
  notes: 'dynamic-array-list-growth-removal', math: 'projectile-parabola-time',
  reading: 'waiting-for-godot', study: 'cpp-objects-memory-lifetime',
};
export type HomeCoverDiagram = 'combat' | 'dissolve' | 'parts' | 'worktrees' | 'array' | 'trajectory' | 'pointers';
// Keep diagrams tied to their source article, so a fallback never inherits an unrelated preview.
const diagrams: Record<string, HomeCoverDiagram> = {
  'monster-combat': 'combat',
  'dissolve-threshold-edge': 'dissolve',
  'modular-equipment': 'parts',
  'parallel-ai-worktrees': 'worktrees',
  'dynamic-array-list-growth-removal': 'array',
  'projectile-parabola-time': 'trajectory',
  'cpp-objects-memory-lifetime': 'pointers',
};

export function getHomeCovers(articles: Article[]) {
  return topics.map(topic => {
    const published = articles.filter(article => !article.data.draft && article.data.topic === topic.id);
    const article = published.find(article => article.data.slug === homeCoverSlugs[topic.id]) ?? published[0];
    const sentences = article?.data.book?.note?.split(/(?<=\.)\s+/);
    const quote = topic.id === 'reading'
      ? sentences?.[article?.data.slug === 'waiting-for-godot' ? 1 : 0] ?? sentences?.[0]
      : undefined;
    const diagram = article ? diagrams[article.data.slug] : undefined;
    return { topic, article, count: published.length, diagram, quote };
  });
}
