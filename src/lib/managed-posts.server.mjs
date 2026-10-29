import { readdir, readFile } from 'node:fs/promises';

export async function managedPostSlugs() {
  let files;
  try { files = await readdir('content/managed-posts'); } catch (error) { if (error.code === 'ENOENT') return new Set(); throw error; }
  const slugs = new Set();
  for (const file of files.filter(file => file.endsWith('.json'))) {
    const data = JSON.parse(await readFile(`content/managed-posts/${file}`, 'utf8'));
    if (data.version !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug ?? '') || file !== `${data.slug}.json` || Object.keys(data).some(key => !['version', 'slug'].includes(key))) throw new Error(`글 이전 설정을 확인해 주세요: ${file}`);
    slugs.add(data.slug);
  }
  return slugs;
}
export function managedPostUrl(slug) {
  const origin = process.env.PUBLIC_AUTHORING_ORIGIN || 'https://imjae-blog-author.imjae-game-dev-notes.workers.dev';
  return new URL(`/notes/${slug}/`, origin).href;
}
