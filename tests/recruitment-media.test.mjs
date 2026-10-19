import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePortfolioMedia } from '../src/lib/recruitment-media.mjs';

const id = 'aB_12-cD345';
const video = (url, fields = {}) => ({ url, title: '게임 시연', caption: '장비 조합과 전투 장면', ...fields });
const validUrl = `https://www.youtube.com/watch?v=${id}`;

test('주소·제목·캡션이 모두 준비된 영상만 반환하고 공백을 정리한다', () => {
  for (const value of [undefined, null, {}, video(''), video('  '), video(validUrl, { title: ' ' }), video(validUrl, { caption: null }), video(validUrl, { title: 12 }), video(12)]) {
    assert.equal(resolvePortfolioMedia(value), undefined);
  }
  const resolved = resolvePortfolioMedia(video(`  ${validUrl}  `, { title: '  시연 제목  ', caption: '  실제 장면 설명  ' }));
  assert.equal(resolved.url, validUrl);
  assert.equal(resolved.title, '시연 제목');
  assert.equal(resolved.caption, '실제 장면 설명');
});

test('실행 가능한 스킴·인증 정보·로컬 네트워크 주소를 거절한다', () => {
  const rejected = [
    'javascript:alert(1)', 'data:text/html,video', '/video', 'http://example.com/video',
    'https://user:password@example.com/video', 'https://user@example.com/video',
    'https://localhost/video', 'https://LOCALHOST./video', 'https://preview.localhost/video',
    'https://machine.local/video', 'https://intranet/video', 'https://127.0.0.1/video',
    'https://127.1/video', 'https://0x7f000001/video', 'https://10.0.0.1/video',
    'https://172.16.0.1/video', 'https://172.31.255.255/video', 'https://192.168.0.1/video',
    'https://169.254.169.254/video', 'https://[::1]/video', 'https://[fd00::1]/video',
    'https://[fe80::1]/video', 'https://[::ffff:127.0.0.1]/video',
  ];
  for (const url of rejected) assert.equal(resolvePortfolioMedia(video(url)), undefined, url);
});

test('지원하는 YouTube 주소를 정확한 개인정보 보호 iframe 주소로 변환한다', () => {
  const supported = [
    `https://youtube.com/watch?v=${id}`, `https://www.youtube.com/watch?v=${id}`,
    `https://m.youtube.com/watch?v=${id}`, `https://www.youtube.com/shorts/${id}`,
    `https://youtube.com/embed/${id}`, `https://youtu.be/${id}`,
    `https://youtube-nocookie.com/embed/${id}`, `https://www.youtube-nocookie.com/embed/${id}`,
  ];
  for (const url of supported) {
    const result = resolvePortfolioMedia(video(url));
    assert.equal(result.url, url);
    assert.equal(result.embedUrl, `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`);
  }
});

test('잘못된 YouTube 식별자·경로·중복 식별자를 표시하지 않는다', () => {
  const rejected = [
    'https://youtube.com/watch?v=short', 'https://youtube.com/watch?v=123456789012',
    `https://youtube.com/watch?v=${id}&v=${id}`, `https://youtube.com/playlist?list=${id}`,
    `https://youtu.be/${id}/extra`, 'https://youtu.be/aB_12%2FcD345',
    `https://youtube-nocookie.com/watch?v=${id}`, `https://youtube.com:8443/watch?v=${id}`,
  ];
  for (const url of rejected) assert.equal(resolvePortfolioMedia(video(url)), undefined, url);
});

test('다른 HTTPS 제공자와 YouTube 유사 도메인은 iframe 없이 외부 링크로 유지한다', () => {
  for (const url of [
    'https://vimeo.com/123456789', `https://youtube.com.example.org/watch?v=${id}`,
    `https://notyoutube.com/watch?v=${id}`, `https://youtu.be.example.org/${id}`,
    'https://172.32.0.1/video', 'https://[2606:4700:4700::1111]/video',
  ]) {
    const result = resolvePortfolioMedia(video(url));
    assert.equal(result.url, url);
    assert.equal(result.embedUrl, undefined);
  }
});

test('명시한 유효 정수 구간만 적용하며 종료는 시작보다 커야 한다', () => {
  const cases = [
    [{ startSeconds: 12, endSeconds: 30 }, '12', '30'],
    [{ startSeconds: 0, endSeconds: 1 }, '0', '1'],
    [{ endSeconds: 25 }, null, '25'],
    [{ startSeconds: -1, endSeconds: 0 }, null, null],
    [{ startSeconds: 12, endSeconds: 12 }, '12', null],
    [{ startSeconds: 12, endSeconds: 11 }, '12', null],
    [{ startSeconds: 1.5, endSeconds: 2.5 }, null, null],
    [{ startSeconds: '12', endSeconds: '30' }, null, null],
    [{ startSeconds: Infinity, endSeconds: NaN }, null, null],
    [{ startSeconds: Number.MAX_SAFE_INTEGER + 1, endSeconds: Number.MAX_SAFE_INTEGER + 1 }, null, null],
  ];
  for (const [fields, start, end] of cases) {
    const embed = new URL(resolvePortfolioMedia(video(validUrl, fields)).embedUrl);
    assert.equal(embed.searchParams.get('start'), start);
    assert.equal(embed.searchParams.get('end'), end);
  }
});

test('원본 쿼리의 자동 재생·플레이어 옵션을 iframe에 전달하지 않는다', () => {
  const url = `${validUrl}&autoplay=1&start=90&end=100&rel=1&origin=https://example.com#t=90`;
  const result = resolvePortfolioMedia(video(url, { startSeconds: 5, endSeconds: 15 }));
  const embed = new URL(result.embedUrl);
  assert.equal(result.url, url);
  assert.deepEqual(Object.fromEntries(embed.searchParams), { rel: '0', playsinline: '1', start: '5', end: '15' });
});
