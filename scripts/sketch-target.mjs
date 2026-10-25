import { execFileSync } from 'node:child_process';
import { canonicalSketchTarget } from '../server/sketch-target.mjs';
import { resolveSketchSource } from './sketch-source.mjs';
import { readSketchPortfolio } from '../src/lib/sketch-portfolio.server.mjs';

export async function resolveSketchTarget(url, {root=process.cwd(), ref='HEAD'}={}) {
  const target = canonicalSketchTarget(url);
  if (target.kind === 'article') return {...resolveSketchSource(target.url,{root,ref}), kind:'article', path:target.path};
  const git = args => execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();
  const baseCommit = git(['rev-parse','--verify','--end-of-options',`${ref}^{commit}`]);
  if (baseCommit !== git(['rev-parse','HEAD']) || git(['status','--porcelain'])) throw new Error('포트폴리오 원본은 고정 커밋의 깨끗한 작업 공간에서 읽어야 합니다.');
  const snapshot = await readSketchPortfolio(root);
  return {version:1,repository:'imjae/imjae.github.io',kind:'portfolio',canonicalUrl:target.url,path:target.path,slug:'krafton-2027',baseCommit,sourceSha256:snapshot.sourceSha256,snapshot};
}
