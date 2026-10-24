import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { articleSourcePath } from './github-authoring.mjs';

// Normalize checkout line endings so Windows and Linux builds identify the same source.
export function articleSourceHash(filePath) {
  const source = readFileSync(articleSourcePath(filePath),'utf8').replaceAll('\r\n','\n');
  return createHash('sha256').update(source).digest('hex');
}
