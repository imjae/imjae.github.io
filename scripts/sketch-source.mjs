import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseFrontmatter } from './frontmatter.mjs';

const origin = 'https://imjae.github.io';
const sourcePath = /^content\/articles\/(gameplay|graphics|tools|ai|notes|math|reading|study)\/[a-z0-9-]+\.md$/;

export function canonicalSketchUrl(value) {
  const url = new URL(value);
  const match = /^\/writing\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(url.pathname);
  if (url.origin !== origin || url.username || url.password || !match) throw new Error('공개 블로그의 글 본문 주소가 필요합니다.');
  return `${origin}/writing/${match[1]}/`;
}

// Read committed bytes: a dirty working copy must never be labelled as HEAD.
// This command neither fetches nor edits files. The runner chooses a fresh main ref.
export function resolveSketchSource(url, { root = process.cwd(), ref = 'HEAD' } = {}) {
  const canonicalUrl = canonicalSketchUrl(url);
  const slug = canonicalUrl.split('/').at(-2);
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024, windowsHide: true });
  const baseCommit = git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
  if (!/^[a-f0-9]{40}$/.test(baseCommit)) throw new Error('Git 커밋을 확인할 수 없습니다.');
  const entries = git(['ls-tree', '-r', '-z', baseCommit, '--', 'content/articles/']).split('\0').filter(Boolean);
  const seen = new Set();
  let target;
  for (const entry of entries) {
    const match = /^(\d+) blob ([a-f0-9]{40})\t(.+)$/.exec(entry);
    if (!match || !match[3].endsWith('.md')) continue;
    const [, mode, blob, path] = match;
    if (mode !== '100644' && mode !== '100755') throw new Error('글 원본의 심볼릭 링크는 지원하지 않습니다.');
    const source = git(['cat-file', 'blob', blob]);
    const { data } = parseFrontmatter(source);
    if (data?.draft !== false) continue;
    if (typeof data.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new Error('공개 글의 slug를 확인해 주세요.');
    if (seen.has(data.slug)) throw new Error(`중복된 공개 글 주소: ${data.slug}`);
    seen.add(data.slug);
    if (data.slug !== slug) continue;
    if (!sourcePath.test(path)) throw new Error('현재 연동 규격에서 지원하지 않는 원본 경로입니다.');
    target = {
      version: 1,
      repository: 'imjae/imjae.github.io',
      canonicalUrl,
      slug,
      sourcePath: path,
      baseCommit,
      sourceSha256: createHash('sha256').update(source.replaceAll('\r\n','\n'), 'utf8').digest('hex'),
    };
  }
  if (!target) throw new Error('해당 커밋에 공개된 글이 없습니다.');
  return target;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { url: { type: 'string' }, ref: { type: 'string', default: 'HEAD' } } });
    if (!values.url) throw new Error('사용법: npm run sketch:resolve -- --url https://imjae.github.io/writing/<slug>/ [--ref origin/main]');
    process.stdout.write(`${JSON.stringify(resolveSketchSource(values.url, { ref: values.ref }), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
