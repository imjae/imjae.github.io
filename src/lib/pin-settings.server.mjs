import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { validatePinSettings } from './pinned-articles.mjs';

export async function readPinSettings(root = process.cwd()) {
  const directory = resolve(root, 'content/pins');
  let files;
  try { files = (await readdir(directory)).filter(file => file.endsWith('.json')); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
  const settings = await Promise.all(files.map(async file => {
    const data = validatePinSettings(JSON.parse(await readFile(join(directory, file), 'utf8')));
    return { ...data, file };
  }));
  return settings.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.file.localeCompare(a.file))[0];
}
