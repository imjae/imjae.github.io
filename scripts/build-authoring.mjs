import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', '.authoring-dist'], {
  env: { ...process.env, AUTHORING_MODE: 'private' }, stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
if (result.status === 0) {
  const check = spawnSync(process.execPath, ['scripts/check-site.mjs'], { env: { ...process.env, AUTHORING_MODE: 'private' }, stdio: 'inherit' });
  process.exitCode = check.status ?? 1;
}
