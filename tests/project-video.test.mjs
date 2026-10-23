import test from 'node:test';
import assert from 'node:assert/strict';
import { projectVideoSlots, normalizeVideoUrl, validateProjectVideoSettings, selectProjectVideoSettings } from '../src/lib/project-video.mjs';
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

test('등록한 정수 구간은 선택 후에도 유지되고 독립 영상으로 교체하면 이전 구간을 지운다', () => {
  const excerpt = { ...record('2026-10-22T00:00:00.000Z', 'https://youtu.be/abcdefghijk?t=104'), slot: 'cargo-loading', startSeconds: 104, endSeconds: 111, clipVariant: 'main-cargo-excerpt' };
  assert.deepEqual(validateProjectVideoSettings(excerpt), excerpt);
  assert.deepEqual(selectProjectVideoSettings([excerpt], 'cargo-loading'), excerpt);
  const replacement = { ...record('2026-10-23T00:00:00.000Z', 'https://youtu.be/12345678901'), slot: 'cargo-loading' };
  assert.deepEqual(selectProjectVideoSettings([replacement, excerpt], 'cargo-loading'), replacement);
  const removed = { ...record('2026-10-24T00:00:00.000Z', ''), slot: 'cargo-loading' };
  assert.deepEqual(selectProjectVideoSettings([excerpt, removed], 'cargo-loading'), removed);
});

test('영상 구간의 잘못된 형식·순서와 지게 이외의 발췌 캡션 설정을 거절한다', () => {
  const base = { ...record(now.toISOString(), 'https://youtu.be/abcdefghijk'), slot: 'cargo-loading' };
  for (const change of [
    { startSeconds: -1 }, { startSeconds: 0.5 }, { startSeconds: '104' }, { startSeconds: null },
    { endSeconds: 0 }, { endSeconds: 0.5 }, { endSeconds: '111' }, { endSeconds: null },
    { startSeconds: Number.MAX_SAFE_INTEGER + 1 }, { endSeconds: Infinity },
    { startSeconds: 111, endSeconds: 104 }, { startSeconds: 104, endSeconds: 104 },
    { videoUrl: '', startSeconds: 0 }, { clipVariant: 'unknown', startSeconds: 104, endSeconds: 111 },
    { clipVariant: 'main-cargo-excerpt' },
    { slot: 'okgwi', clipVariant: 'main-cargo-excerpt', startSeconds: 20, endSeconds: 45 },
  ]) assert.throws(() => validateProjectVideoSettings({ ...base, ...change }), JSON.stringify(change));
  assert.equal(validateProjectVideoSettings({ ...base, startSeconds: 0 }).startSeconds, 0);
  assert.equal(validateProjectVideoSettings({ ...base, endSeconds: 45 }).endSeconds, 45);
});

test('저장소 GIF 경로를 정리하며 다른 상대 경로와 외부 호스트 우회는 거절한다', () => {
  assert.equal(normalizeVideoUrl(' /assets/clips/../demo.GIF?v=2 '), '/assets/demo.GIF?v=2');
  for (const path of ['assets/demo.gif', '/assets/demo.mp4', '//example.com/demo.gif', '/\\example.com/demo.gif']) {
    assert.throws(() => normalizeVideoUrl(path), path);
  }
});

test('기능 영상의 변경·제거는 전체 플레이와 다른 기능의 최신 설정을 바꾸지 않는다', () => {
  const project = record('2026-10-17T00:00:00.000Z', 'https://example.com/overview.mp4');
  const combat = { ...record('2026-10-18T00:00:00.000Z', '/assets/combat.gif'), slot: 'combat' };
  const water = { ...record('2026-10-19T00:00:00.000Z', 'https://example.com/water.webm'), slot: 'water' };
  const removedCombat = { ...record('2026-10-20T00:00:00.000Z', ''), slot: 'combat' };
  const settings = [water, combat, removedCombat, project];
  assert.deepEqual(selectProjectVideoSettings(settings), project);
  assert.deepEqual(selectProjectVideoSettings(settings, 'combat'), removedCombat);
  assert.deepEqual(selectProjectVideoSettings(settings, 'water'), water);
  assert.equal(selectProjectVideoSettings(settings, 'fire'), undefined);
  assert.deepEqual(validateProjectVideoSettings({ ...project, slot: 'project' }), project);
});

test('지원하지 않는 영상 항목은 조회와 저장 모두 거절한다', () => {
  for (const slot of ['ai', 'unknown', '../outside', '', null]) {
    assert.throws(() => selectProjectVideoSettings([], slot));
    assert.throws(() => prepareProjectVideoSettings('/assets/demo.gif', { now, id, slot }));
  }
});

test('잘못된 프로젝트·저장 시각·버전과 경로 탈출 식별자를 거절한다', () => {
  for (const change of [{ project: '../outside' }, { version: 2 }, { createdAt: '2026-02-30T00:00:00.000Z' }, { createdAt: 'bad-date' }, { videoUrl: 'javascript:alert(1)' }]) assert.throws(() => validateProjectVideoSettings({ ...record(now.toISOString(), ''), ...change }));
  assert.throws(() => prepareProjectVideoSettings('', { now, id: '../outside' }));
});

test('영상 추가와 제거를 GitHub 새 JSON 편집 화면으로 정확히 전달한다', () => {
  for (const videoUrl of ['https://www.youtube.com/watch?v=abcdefghijk&t=12', 'https://example.com/demo.gif?v=2', '/assets/demo.gif', '']) {
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

test('각 기능의 영상·GIF 추가와 제거를 해당 항목만 담은 GitHub 설정으로 전달한다', () => {
  for (const slot of projectVideoSlots) {
    for (const videoUrl of ['https://youtu.be/abcdefghijk', 'https://example.com/demo.mp4', '/assets/demo.gif', '']) {
      const result = prepareProjectVideoSettings(videoUrl, { now, id, slot: slot.id });
      const url = new URL(result.url);
      const saved = JSON.parse(url.searchParams.get('value'));
      assert.equal(saved.slot ?? 'project', slot.id);
      assert.equal(saved.videoUrl, videoUrl);
      assert.deepEqual(selectProjectVideoSettings([saved], slot.id), saved);
      assert.equal(url.searchParams.get('filename'), result.path);
      if (slot.id !== 'project') {
        assert.ok(result.path.includes(`-${slot.id}-${id}.json`));
        assert.equal(selectProjectVideoSettings([saved]), undefined);
      }
    }
  }
});
