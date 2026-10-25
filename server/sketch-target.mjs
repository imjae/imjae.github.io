export function canonicalSketchTarget(value) {
  const invalid = message => Object.assign(new Error(message), {status:400});
  let url; try { url = new URL(value); } catch { throw invalid('올바른 글 주소가 필요합니다.'); }
  if (!['https://imjae.github.io','https://imjae-blog-author.imjae-game-dev-notes.workers.dev'].includes(url.origin) || url.username || url.password) throw invalid('지원하는 블로그 주소가 아닙니다.');
  if (/^\/portfolio\/krafton-2027\/?$/.test(url.pathname)) return {kind:'portfolio', path:'/portfolio/krafton-2027/', url:'https://imjae.github.io/portfolio/krafton-2027/'};
  const article = /^\/writing\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(url.pathname);
  if (!article) throw invalid('블로그 글이나 크래프톤 포트폴리오 주소가 필요합니다.');
  return {kind:'article', path:`/writing/${article[1]}/`, slug:article[1], url:`https://imjae.github.io/writing/${article[1]}/`};
}
