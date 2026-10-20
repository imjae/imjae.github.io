import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { projectVideoSlots, selectProjectVideoSettings } from './project-video.mjs';

async function readProjectVideoRecords(root) {
  const directory = resolve(root, 'content/project-videos');
  let files;
  try { files = (await readdir(directory)).filter(file => file.endsWith('.json')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  return Promise.all(files.map(async file => JSON.parse(await readFile(join(directory, file), 'utf8'))));
}

export async function readProjectVideoSettings(root = process.cwd()) {
  return selectProjectVideoSettings(await readProjectVideoRecords(root));
}

export async function readProjectVideoSettingsBySlot(root = process.cwd()) {
  const settings = await readProjectVideoRecords(root);
  return Object.fromEntries(projectVideoSlots.map(({ id }) => [id, selectProjectVideoSettings(settings, id)]));
}
