import type { Article } from '../lib/articles';
import { topics } from './site';

// Cover selections are independent of the owner's pinned-article order.
export const homeCoverSlugs: Record<(typeof topics)[number]['id'], string> = {
  gameplay: 'fsm-transition-interruption', graphics: 'dissolve-threshold-edge',
  tools: 'object-pool-lease-return', ai: 'parallel-ai-worktrees',
  notes: 'typescript-interface-runtime-validation', math: 'vector-length-dot-cross',
  reading: 'waiting-for-godot', study: 'cpp-objects-memory-lifetime',
};
const codeLanguages: Record<string, string> = { gameplay: 'text', graphics: 'hlsl', notes: 'typescript' };

export function getHomeCovers(articles: Article[]) {
  return topics.map(topic => {
    const published = articles.filter(article => !article.data.draft && article.data.topic === topic.id);
    const article = published.find(article => article.data.slug === homeCoverSlugs[topic.id]) ?? published[0];
    let code: string | undefined;
    if (article?.data.slug === homeCoverSlugs[topic.id] && codeLanguages[topic.id]) {
      const block = article.body?.match(new RegExp('```' + codeLanguages[topic.id] + '\\r?\\n([\\s\\S]*?)\\r?\\n```'))?.[1];
      code = block?.split(/\r?\n/).slice(0, topic.id === 'gameplay' ? 4 : 2).join('\n');
    }
    const quote = topic.id === 'reading' ? article?.data.book?.note?.split(/(?<=\.)\s+/)[0] : undefined;
    const image = topic.id === 'math' && article?.data.slug === 'vector-length-dot-cross'
      ? '/media/vector-length-dot-cross/length-normalize.svg' : undefined;
    return { topic, article, count: published.length, code, quote, image };
  });
}
