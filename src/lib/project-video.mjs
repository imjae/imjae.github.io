export const projectVideoSlots = [
  { id: 'project', label: '전체 플레이' },
  { id: 'combat', label: '전투' },
  { id: 'traversal', label: 'IK 트레버설' },
  { id: 'equipment', label: '장비 조합' },
  { id: 'water', label: '물·급류' },
  { id: 'fire', label: '불·화염' },
];

function normalizeVideoSlot(slot = 'project') {
  if (!projectVideoSlots.some(item => item.id === slot)) throw new Error('영상을 등록할 항목을 확인해 주세요.');
  return slot;
}

export function normalizeVideoUrl(value) {
  if (typeof value !== 'string') throw new Error('영상 주소를 확인해 주세요.');
  const text = value.trim();
  if (!text) return '';
  if (text.length > 2048) throw new Error('영상 주소는 2,048자 이내로 적어 주세요.');
  if (text.startsWith('/') && !text.startsWith('//')) {
    try {
      const file = new URL(text, 'https://imjae.github.io');
      if (file.origin === 'https://imjae.github.io' && /\.gif$/i.test(file.pathname)) return file.pathname + file.search + file.hash;
    } catch { /* 아래에서 지원하는 GIF 경로를 안내합니다. */ }
    throw new Error('/assets/demo.gif 형식의 GIF 파일 경로를 적어 주세요.');
  }
  let url;
  try { url = new URL(text); }
  catch { throw new Error('HTTPS 주소 또는 /assets/demo.gif 형식의 GIF 경로를 적어 주세요.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('로그인 정보가 없는 HTTPS 영상 주소를 적어 주세요.');
  return url.href;
}

export function validateProjectVideoSettings(value) {
  if (!value || value.version !== 1 || value.project !== 'dcb') throw new Error('프로젝트 영상 설정을 확인해 주세요.');
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) || new Date(value.createdAt).toISOString() !== value.createdAt) throw new Error('영상 설정의 저장 시각을 확인해 주세요.');
  const slot = normalizeVideoSlot(value.slot);
  return { version: 1, project: 'dcb', createdAt: value.createdAt, videoUrl: normalizeVideoUrl(value.videoUrl), ...(slot === 'project' ? {} : { slot }) };
}

export function selectProjectVideoSettings(settings, target = 'project') {
  const slot = normalizeVideoSlot(target);
  return settings.map(validateProjectVideoSettings)
    .filter(value => (value.slot ?? 'project') === slot)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.videoUrl.localeCompare(a.videoUrl))[0];
}
