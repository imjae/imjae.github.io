import { canonicalSketchTarget } from './sketch-target.mjs';

export const MAX_BODY = 6_000_000;
export const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export const SHA = /^[a-f0-9]{64}$/;
export const COMMIT = /^[a-f0-9]{40}$/;
export const encoder = new TextEncoder();
export function check(value, message, status = 400) { if (!value) { const e = new Error(message); e.status = status; throw e; } }
export async function digest(value) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', typeof value === 'string' ? encoder.encode(value) : value))].map(b => b.toString(16).padStart(2,'0')).join(''); }
export async function readJson(request, max = MAX_BODY) {
  check(Number(request.headers.get('Content-Length') || 0) <= max, '요청이 너무 큽니다.', 413);
  const reader = request.body?.getReader(); check(reader, '요청 본문이 필요합니다.');
  const chunks = []; let size = 0;
  for (;;) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); check(false,'요청이 너무 큽니다.',413); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { check(false,'JSON 형식을 확인해 주세요.'); }
}
export function decodePng(base64) {
  check(typeof base64 === 'string' && base64.length <= 4_000_000 && base64.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(base64), 'PNG 이미지가 필요합니다.');
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  check(bytes.length > 32 && [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b), 'PNG 형식을 확인해 주세요.');
  const view = new DataView(bytes.buffer); const width = view.getUint32(16), height = view.getUint32(20);
  check(width > 0 && height > 0 && width <= 8192 && height <= 8192 && width * height <= 24_000_000, '이미지 해상도가 너무 큽니다.');
  return bytes;
}
export function validateSubmission(s) {
  check(s?.version === 1 && UUID.test(s.id), '요청 식별자를 확인해 주세요.');
  check(typeof s.instruction === 'string' && s.instruction.length <= 4000 && Number.isFinite(Date.parse(s.capturedAt)), '요청 설명과 시각을 확인해 주세요.');
  const c = s.context; check(c && typeof c.url === 'string', '글 주소가 필요합니다.');
  const target = canonicalSketchTarget(c.url);
  const currentHash = c.currentSourceHash ?? c.sourceHash;
  check(SHA.test(currentHash) && (c.sourceHash === currentHash || s.reanchored === true) && typeof c.visibleText === 'string' && c.visibleText.trim() && c.visibleText.length <= 16000 && typeof c.title === 'string' && c.title.length <= 300, '원문 버전과 문맥을 확인해 주세요.');
  check(typeof c.documentId === 'string' && c.documentId.length <= 100 && Number.isSafeInteger(c.revision) && c.revision >= 0, '문서 상태를 확인해 주세요.');
  check(c.viewport && ['x','y','width','height','scale'].every(k => Number.isFinite(c.viewport[k]) && c.viewport[k] >= 0 && c.viewport[k] < 10_000_000), '화면 위치가 올바르지 않습니다.');
  check(Array.isArray(c.strokes) && c.strokes.length > 0 && c.strokes.length <= 600, '화면에 필기가 필요합니다.');
  let points = 0; const ids = new Set();
  for (const stroke of c.strokes) {
    check(typeof stroke.id === 'string' && stroke.id.length <= 100 && !ids.has(stroke.id), '획 식별자가 올바르지 않습니다.'); ids.add(stroke.id);
    check(['pen','underline','highlighter'].includes(stroke.tool) && /^#[a-f0-9]{6}$/i.test(stroke.color) && Number.isFinite(stroke.width) && stroke.width >= 1 && stroke.width <= 24, '필기 도구를 확인해 주세요.');
    check(Array.isArray(stroke.points) && stroke.points.length, '필기 좌표가 필요합니다.'); points += stroke.points.length;
    check(points <= 24000 && stroke.points.every(p => ['x','y','pressure'].every(k => Number.isFinite(p[k]) && Math.abs(p[k]) <= 10_000_000) && p.pressure >= 0 && p.pressure <= 1), '필기 좌표를 확인해 주세요.');
  }
  decodePng(s.image);
  return { ...s, context: { ...c, url: target.url } };
}

// SQLite-backed DO values are chunked below the KV per-value limit.
export async function putBlob(storage, key, value, type) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  check(bytes.length <= 6_000_000, '저장 파일이 너무 큽니다.', 413);
  const count = Math.ceil(bytes.length / 60000);
  for (let i=0;i<count;i++) await storage.put(`${key}:${i}`, bytes.slice(i*60000,(i+1)*60000));
  const meta = { count, size: bytes.length, type, sha256: await digest(bytes) };
  await storage.put(`${key}:meta`, meta); return meta;
}
export async function getBlob(storage, key) {
  const meta = await storage.get(`${key}:meta`); if (!meta) return null;
  const bytes = new Uint8Array(meta.size);
  for (let i=0;i<meta.count;i++) { const chunk = await storage.get(`${key}:${i}`); check(chunk, '저장한 파일이 없습니다.',503); bytes.set(new Uint8Array(chunk),i*60000); }
  check(await digest(bytes) === meta.sha256, '저장 파일 검증에 실패했습니다.',503);
  return { ...meta, bytes };
}
