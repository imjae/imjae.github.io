import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { selectPortfolioText } from './portfolio-copy.mjs';

export async function readPortfolioText(defaults, root = process.cwd()) {
  const directory = resolve(root, 'content/portfolio-copy');
  let files;
  try { files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort(); }
  catch (error) { if (error.code === 'ENOENT') return { ...defaults }; throw error; }
  return selectPortfolioText(await Promise.all(files.map(async file => JSON.parse(await readFile(join(directory, file), 'utf8')))), defaults);
}
