import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { getArticles, articleUrl } from './articles';
import { articleSourcePath } from './github-authoring.mjs';
import { managedPostSlugs } from './managed-posts.server.mjs';

let cached;
export function publishManifest() {
  return cached ??= (async () => {
    const files = {};
    const articles = {};
    for (const article of await getArticles(false)) {
      const path = articleSourcePath(article.filePath);
      articles[path] = { url: articleUrl(article), title: article.data.title };
    }
    const paths = Object.keys(articles);
    for (const dir of ['content/portfolio-copy', 'content/about-copy', 'content/pins', 'content/project-videos']) {
      for (const file of await readdir(dir)) if (file.endsWith('.json')) paths.push(`${dir}/${file}`);
    }
    await Promise.all(paths.map(async path => {
      files[path] = createHash('sha256').update((await readFile(path, 'utf8')).replaceAll('\r\n', '\n')).digest('hex');
    }));
    let revision = process.env.GITHUB_SHA ?? '';
    if (!/^[a-f0-9]{40}$/.test(revision)) {
      try { revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(); } catch { revision = ''; }
    }
    return { version: 1, revision: /^[a-f0-9]{40}$/.test(revision) ? revision : null, files, articles, managedPosts: [...await managedPostSlugs()] };
  })();
}
