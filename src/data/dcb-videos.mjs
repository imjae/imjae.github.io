/** 실제 편집본의 표시 정보와 연결 위치. 공개 주소는 project-videos 설정에서 읽는다. */
export const dcbVideos = [
  {
    slot: 'project',
    title: 'DCB — 운반과 전투, 옥귀 격파',
    caption: '출발부터 채집·수리, 지게 적재, 트레버설과 옥귀 처치까지 연결한 플레이 요약입니다. 지게 메기는 1.6배, 적재 후 이동은 1.3배이며 나머지 장면은 원속도입니다.',
    featureSlugs: [],
    projectPage: true,
  },
  {
    slot: 'combat',
    title: '전투 — 일반 교전에서 옥귀 처치까지',
    caption: '일반 적과의 교전부터 옥귀의 대검·도약·특수 공격과 최종 처치까지, 중간 대치를 생략한 원속도 하이라이트입니다.',
    featureSlugs: ['monster-combat'],
    projectPage: false,
  },
  {
    slot: 'traversal',
    title: 'IK 트레버설 — StepUp, SideStep과 Climb',
    caption: 'StepUp과 SideStep의 진입부터 보행 복귀, Climb의 수직 등반과 상단 오르기를 보여줍니다. Climb은 중간 이동을 생략하고 화면을 확대한 원속도 요약입니다.',
    featureSlugs: ['ik-traversal'],
    projectPage: false,
  },
  {
    slot: 'equipment',
    title: '장비 — 파츠 조합, 장착과 실제 공격',
    caption: '모루에서 파츠를 교체하고 조합을 완성한 뒤 장착과 공격으로 이어집니다.',
    featureSlugs: ['modular-equipment'],
    projectPage: false,
  },
  {
    slot: 'water',
    title: '물 — 계곡 수면과 폭포',
    caption: '계곡과 출렁다리에서 보이는 수면·폭포의 화면 표현입니다.',
    featureSlugs: ['water-playback'],
    projectPage: false,
  },
  {
    slot: 'fire',
    title: '불 — 마을 화염과 연기',
    caption: '마을 진입 시네마틱과 플레이 중의 화염·연기를 보여줍니다.',
    featureSlugs: ['fire-vfx'],
    projectPage: false,
  },
  {
    slot: 'rope-bridge',
    title: '출렁다리 — 진입부터 횡단과 착지까지',
    caption: '흔들리는 다리에 진입해 건너편에 도착하기까지 한 번의 통과 장면을 연속으로 보여줍니다.',
    featureSlugs: ['rope-bridge'],
    projectPage: false,
  },
  {
    slot: 'cinematic',
    title: '시네마틱 — 구간 진입과 조작 복귀',
    caption: 'Ambush와 마을의 진입 연출, 이후 플레이로 돌아오는 두 사례를 연결했습니다.',
    featureSlugs: ['cinematic'],
    projectPage: false,
  },
  {
    slot: 'cargo-loading',
    title: '지게 적재 — 세 상자와 운반',
    caption: '세 상자의 적재 동작과 짐이 쌓이는 결과, 지게 메기와 이동을 원속도로 연결했습니다.',
    featureSlugs: ['jige-cargo-motion'],
    projectPage: false,
  },
  {
    slot: 'gather-repair',
    title: '상호작용 — 채집, 지게 수리와 다시 메기',
    caption: '나무를 채집하고 지게를 수리한 뒤 다시 메는 흐름입니다.',
    featureSlugs: ['jige-cargo-motion'],
    projectPage: false,
  },
  {
    slot: 'shrine',
    title: '신단 — 기도와 빛 연출',
    caption: '신단에 들어가 기도하고 빛 연출이 이어진 뒤 자리를 떠나는 장면입니다.',
    featureSlugs: [],
    projectPage: true,
  },
  {
    slot: 'okgwi',
    title: '옥귀 — 공격, 회피와 최종 처치',
    caption: '대검 공격, 도약, 특수 횡베기와 최후 공방을 골라 옥귀가 쓰러지는 장면까지 연결했습니다. 중간 전투를 생략했으며 원속도를 유지했습니다.',
    featureSlugs: ['monster-combat'],
    projectPage: false,
  },
];

const cargoExcerptCaption = '전체 요약에서 세 상자의 적재 장면과 지게를 메고 이동하는 부분을 발췌했습니다. 지게 메기는 1.6배, 이동은 1.3배입니다.';

/**
 * 등록 주소를 실제 촬영 범위의 제목·캡션과 결합한다. 빈 주소 저장은 기존 미디어도 숨긴다.
 * @param {string} slot
 * @param {{ videoUrl: string, startSeconds?: number, endSeconds?: number, clipVariant?: string } | undefined} saved
 * @param {{ url: string, title: string, caption: string, startSeconds?: number, endSeconds?: number } | undefined} [fallbackMedia]
 * @returns {{ url: string, title: string, caption: string, startSeconds?: number, endSeconds?: number } | undefined}
 */
export function getDcbVideoMedia(slot, saved, fallbackMedia) {
  const video = dcbVideos.find(item => item.slot === slot);
  if (!video) throw new Error(`DCB 영상 항목이 없습니다: ${slot}`);
  const url = (saved ? saved.videoUrl : fallbackMedia?.url)?.trim();
  if (!url) return undefined;
  const hasSavedTiming = saved?.startSeconds !== undefined || saved?.endSeconds !== undefined;
  const timing = hasSavedTiming ? saved : fallbackMedia?.url.trim() === url ? fallbackMedia : undefined;
  return {
    url,
    title: video.title,
    caption: slot === 'cargo-loading' && saved?.clipVariant === 'main-cargo-excerpt' ? cargoExcerptCaption : video.caption,
    ...(timing?.startSeconds !== undefined ? { startSeconds: timing.startSeconds } : {}),
    ...(timing?.endSeconds !== undefined ? { endSeconds: timing.endSeconds } : {}),
  };
}
