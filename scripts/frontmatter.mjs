import { parse } from 'yaml';
export function parseFrontmatter(source) {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match) throw new Error('Markdown 메타데이터 블록이 없습니다.');
  return { data: parse(match[1]), content: source.slice(match[0].length) };
}
