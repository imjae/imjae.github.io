import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { selectAboutCopy } from './about-copy.mjs';

export async function readAboutCopy(defaults, root = process.cwd()) {
  const directory = resolve(root, 'content/about-copy');
  let files;
  try { files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort(); }
  catch (error) { if (error.code === 'ENOENT') return { ...defaults }; throw error; }
  return selectAboutCopy(await Promise.all(files.map(async file => JSON.parse(await readFile(join(directory, file), 'utf8')))), defaults);
}
