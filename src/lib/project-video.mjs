export function normalizeVideoUrl(value) {
  if (typeof value !== 'string') throw new Error('영상 주소를 확인해 주세요.');
  const text = value.trim();
  if (!text) return '';
  if (text.length > 2048) throw new Error('영상 주소는 2,048자 이내로 적어 주세요.');
  let url;
  try { url = new URL(text); }
  catch { throw new Error('https://로 시작하는 전체 영상 주소를 적어 주세요.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('로그인 정보가 없는 HTTPS 영상 주소를 적어 주세요.');
  return url.href;
}

export function validateProjectVideoSettings(value) {
  if (!value || value.version !== 1 || value.project !== 'dcb') throw new Error('프로젝트 영상 설정을 확인해 주세요.');
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) || new Date(value.createdAt).toISOString() !== value.createdAt) throw new Error('영상 설정의 저장 시각을 확인해 주세요.');
  return { version: 1, project: 'dcb', createdAt: value.createdAt, videoUrl: normalizeVideoUrl(value.videoUrl) };
}

export function selectProjectVideoSettings(settings) {
  return settings.map(validateProjectVideoSettings)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.videoUrl.localeCompare(a.videoUrl))[0];
}
