import test from 'node:test';
import assert from 'node:assert/strict';
import { dcbVideos, getDcbVideoMedia } from '../src/data/dcb-videos.mjs';
import { dcbFeatures } from '../src/data/dcb-features.mjs';
import { projectVideoSlots } from '../src/lib/project-video.mjs';
import { resolvePortfolioMedia } from '../src/lib/recruitment-media.mjs';

test('12개 편집본은 등록 항목과 대응하고 실제 기능 또는 프로젝트 소개로 연결된다', () => {
  assert.equal(dcbVideos.length, 12);
  assert.equal(new Set(dcbVideos.map(video => video.slot)).size, 12);
  assert.deepEqual(dcbVideos.map(video => video.slot), projectVideoSlots.map(slot => slot.id));
  const features = new Set(dcbFeatures.map(feature => feature.slug));
  for (const video of dcbVideos) {
    assert.ok(video.title.trim());
    assert.ok(video.caption.trim());
    assert.ok(video.projectPage || video.featureSlugs.length > 0, video.slot);
    assert.ok(video.featureSlugs.every(slug => features.has(slug)), video.slot);
    assert.equal(Object.hasOwn(video, 'url'), false, '공통 설명 데이터에 임시 공개 주소를 넣지 않는다');
  }
});

test('보충 영상은 해당 기능에만 연결하고 AI·밸런스와 초안 글의 공개 근거로 사용하지 않는다', () => {
  const slotsFor = feature => dcbVideos.filter(video => video.featureSlugs.includes(feature)).map(video => video.slot);
  assert.deepEqual(slotsFor('monster-combat'), ['combat', 'okgwi']);
  assert.deepEqual(slotsFor('jige-cargo-motion'), ['cargo-loading', 'gather-repair']);
  assert.deepEqual(slotsFor('rope-bridge'), ['rope-bridge']);
  assert.deepEqual(slotsFor('cinematic'), ['cinematic']);
  assert.deepEqual(slotsFor('ai-collaboration'), []);
  assert.deepEqual(slotsFor('gameplay-balancing'), []);
  assert.deepEqual(dcbVideos.filter(video => video.projectPage).map(video => video.slot), ['project', 'shrine']);
});

test('미등록 영상은 생성하지 않고 빈 주소 저장은 이전 미디어를 숨긴다', () => {
  const fallback = { url: 'https://example.invalid/previous.mp4', title: '이전 제목', caption: '이전 설명' };
  assert.equal(getDcbVideoMedia('project', undefined), undefined);
  assert.equal(getDcbVideoMedia('project', { videoUrl: '' }, fallback), undefined);
  assert.equal(getDcbVideoMedia('project', { videoUrl: '  ' }, fallback), undefined);
  assert.throws(() => getDcbVideoMedia('unknown', undefined));
});

test('실제 영상 설명을 사용하며 주소가 바뀌면 이전 구간 설정을 넘기지 않는다', () => {
  const video = dcbVideos.find(item => item.slot === 'water');
  const fallback = {
    url: 'https://example.invalid/previous.mp4', title: '캐시 구현 설명', caption: '측정 범위가 다른 설명',
    startSeconds: 12, endSeconds: 30,
  };
  const expected = { url: fallback.url, title: video.title, caption: video.caption, startSeconds: 12, endSeconds: 30 };
  assert.deepEqual(getDcbVideoMedia('water', undefined, fallback), expected);
  assert.deepEqual(getDcbVideoMedia('water', { videoUrl: ` ${fallback.url} ` }, fallback), expected);
  assert.deepEqual(getDcbVideoMedia('water', { videoUrl: 'https://example.invalid/current.mp4' }, fallback), {
    url: 'https://example.invalid/current.mp4', title: video.title, caption: video.caption,
  });
  assert.equal(fallback.title, '캐시 구현 설명');
});

test('등록한 발췌 구간을 YouTube 재생 주소에 반영하고 이전 구간과 섞지 않는다', () => {
  const saved = { videoUrl: 'https://youtu.be/abcdefghijk?t=20', startSeconds: 20, endSeconds: 45 };
  const fallback = { url: saved.videoUrl, title: '이전 제목', caption: '이전 설명', startSeconds: 1, endSeconds: 10 };
  const media = getDcbVideoMedia('okgwi', saved, fallback);
  assert.equal(media.startSeconds, 20);
  assert.equal(media.endSeconds, 45);
  assert.equal(resolvePortfolioMedia(media).embedUrl, 'https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0&playsinline=1&start=20&end=45');
  const startOnly = getDcbVideoMedia('okgwi', { videoUrl: saved.videoUrl, startSeconds: 0 }, fallback);
  assert.equal(startOnly.startSeconds, 0);
  assert.equal(Object.hasOwn(startOnly, 'endSeconds'), false);
  assert.equal(fallback.startSeconds, 1);
});

test('지게 본편 발췌만 배속 설명을 사용하며 독립 영상으로 교체하면 기본 설명을 복원한다', () => {
  const normal = dcbVideos.find(video => video.slot === 'cargo-loading');
  const excerpt = getDcbVideoMedia('cargo-loading', { videoUrl: 'https://youtu.be/abcdefghijk?t=104', startSeconds: 104, endSeconds: 111, clipVariant: 'main-cargo-excerpt' });
  assert.equal(excerpt.title, normal.title);
  assert.match(excerpt.caption, /전체 요약/);
  assert.match(excerpt.caption, /1\.6배/);
  assert.match(excerpt.caption, /1\.3배/);
  const replacement = getDcbVideoMedia('cargo-loading', { videoUrl: 'https://youtu.be/12345678901' });
  assert.equal(replacement.caption, normal.caption);
  assert.equal(Object.hasOwn(replacement, 'startSeconds'), false);
  assert.equal(Object.hasOwn(replacement, 'endSeconds'), false);
});
