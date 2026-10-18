import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVideoUrl, validateProjectVideoSettings, selectProjectVideoSettings } from '../src/lib/project-video.mjs';
import { prepareProjectVideoSettings } from '../src/lib/github-authoring.mjs';

const now = new Date('2026-10-18T06:30:00.000Z');
const id = '12345678-1234-1234-1234-123456789abc';
const record = (createdAt, videoUrl) => ({ version: 1, project: 'dcb', createdAt, videoUrl });

test('공유 영상 주소의 구간·쿼리를 유지하고 비어 있는 주소는 숨김 설정으로 처리한다', () => {
  assert.equal(normalizeVideoUrl('  https://youtu.be/abcdefghijk?t=12  '), 'https://youtu.be/abcdefghijk?t=12');
  assert.equal(normalizeVideoUrl('  '), '');
  for (const url of ['javascript:alert(1)', 'data:text/html,video', '/local-video', 'http://example.com/video', 'https://name:password@example.com/video', null]) assert.throws(() => normalizeVideoUrl(url));
});

test('최신 영상 변경·제거 설정을 선택해 이전 주소가 다시 표시되지 않게 한다', () => {
  assert.equal(selectProjectVideoSettings([]), undefined);
  const first = record('2026-10-17T00:00:00.000Z', 'https://example.com/first');
  const second = record('2026-10-18T00:00:00.000Z', 'https://example.com/second');
  const removed = record(now.toISOString(), '');
  assert.equal(selectProjectVideoSettings([second, first]).videoUrl, second.videoUrl);
  assert.equal(selectProjectVideoSettings([first, removed, second]).videoUrl, '');
  assert.equal(first.videoUrl, 'https://example.com/first');
});

test('잘못된 프로젝트·저장 시각·버전과 경로 탈출 식별자를 거절한다', () => {
  for (const change of [{ project: '../outside' }, { version: 2 }, { createdAt: '2026-02-30T00:00:00.000Z' }, { createdAt: 'bad-date' }, { videoUrl: 'javascript:alert(1)' }]) assert.throws(() => validateProjectVideoSettings({ ...record(now.toISOString(), ''), ...change }));
  assert.throws(() => prepareProjectVideoSettings('', { now, id: '../outside' }));
});

test('영상 추가와 제거를 GitHub 새 JSON 편집 화면으로 정확히 전달한다', () => {
  for (const videoUrl of ['https://www.youtube.com/watch?v=abcdefghijk&t=12', '']) {
    const result = prepareProjectVideoSettings(videoUrl, { now, id });
    const url = new URL(result.url);
    assert.equal(url.origin, 'https://github.com');
    assert.equal(url.pathname, '/imjae/imjae.github.io/new/main');
    assert.match(result.path, /^content\/project-videos\/[^/]+\.json$/);
    assert.equal(url.searchParams.get('filename'), result.path);
    assert.equal(url.searchParams.get('value'), result.content);
    assert.deepEqual(JSON.parse(result.content), record(now.toISOString(), videoUrl));
  }
});
