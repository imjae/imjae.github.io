import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { selectProjectVideoSettings } from './project-video.mjs';

export async function readProjectVideoSettings(root = process.cwd()) {
  const directory = resolve(root, 'content/project-videos');
  let files;
  try { files = (await readdir(directory)).filter(file => file.endsWith('.json')); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
  const settings = await Promise.all(files.map(async file => JSON.parse(await readFile(join(directory, file), 'utf8'))));
  return selectProjectVideoSettings(settings);
}
