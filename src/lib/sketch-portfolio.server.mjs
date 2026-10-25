import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { portfolioTextFields, selectPortfolioText, validatePortfolioCopySettings, isPortfolioParagraphOrderKey } from './portfolio-copy.mjs';

export const portfolioSource = fields => JSON.stringify(Object.fromEntries(Object.entries(fields).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0))) + '\n';
export const portfolioSourceHash = fields => createHash('sha256').update(portfolioSource(fields)).digest('hex');

export async function readSketchPortfolio(root) {
  const { portfolioCopyBase } = await import(/* @vite-ignore */ pathToFileURL(join(root, 'src/data/portfolio-copy-base.ts')).href);
  const defaults = portfolioTextFields(portfolioCopyBase);
  const files = (await readdir(join(root, 'content/portfolio-copy'))).filter(f => f.endsWith('.json'));
  const records = await Promise.all(files.map(async f => JSON.parse(await readFile(join(root, 'content/portfolio-copy', f), 'utf8'))));
  const fields = selectPortfolioText(records, defaults);
  return { fields, defaults, latestTimestamp:Math.max(0, ...records.map(r => Date.parse(r.createdAt))), source:portfolioSource(fields), sourceSha256:portfolioSourceHash(fields) };
}

export function applyPortfolioReplacements(snapshot, result, { id, generation, now = Date.now() }) {
  if (!result || typeof result.summary !== 'string' || result.summary.length > 12000 || !Array.isArray(result.questions) || !result.questions.every(q => typeof q === 'string' && q.length <= 1000) || !Array.isArray(result.replacements) || result.replacements.length > 30) throw new Error('포트폴리오 AI 응답 형식을 확인해 주세요.');
  if (result.questions.length) return { questions:result.questions };
  const values = {}, changes = [];
  for (const edit of result.replacements) {
    if (typeof edit.key !== 'string' || !Object.hasOwn(snapshot.fields, edit.key) || isPortfolioParagraphOrderKey(edit.key) || Object.hasOwn(values, edit.key) || typeof edit.before !== 'string' || edit.before !== snapshot.fields[edit.key] || typeof edit.after !== 'string') throw new Error('포트폴리오의 문구 키·원문이 일치하지 않습니다.');
    if (/<\/?[a-z][^>]*>|(?:https?:|javascript:|data:)/i.test(edit.after) && edit.after !== edit.before) throw new Error('HTML·링크 추가는 포트폴리오 문구 수정으로 처리할 수 없습니다.');
    if (edit.before === edit.after) continue;
    values[edit.key] = edit.after;
    changes.push({before:[edit.before], after:[edit.after], label:edit.key.startsWith('profile.') ? '상단 소개' : edit.key.startsWith('paragraphs.') ? '추가 문단' : '포트폴리오 문구'});
  }
  if (!Object.keys(values).length) throw new Error('수정할 포트폴리오 문구가 없습니다.');
  if (!/^[a-f0-9-]{36}$/.test(id) || !Number.isSafeInteger(generation) || generation < 1) throw new Error('포트폴리오 요청 식별자를 확인해 주세요.');
  const createdAt = new Date(Math.max(now, snapshot.latestTimestamp + 1)).toISOString();
  const record = validatePortfolioCopySettings({version:1, portfolio:'krafton-2027', createdAt, values}, snapshot.defaults);
  const fields = {...snapshot.fields, ...record.values};
  return {questions:[], summary:result.summary, source:JSON.stringify(record,null,2)+'\n', sourcePath:`content/portfolio-copy/sketch-${id}-${generation}.json`, afterHash:portfolioSourceHash(fields), changes};
}
