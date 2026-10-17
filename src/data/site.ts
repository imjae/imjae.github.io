export const site = {
  title: 'imjae · Dev Notes',
  description: '게임 개발을 중심으로 프로그래밍과 컴퓨터 그래픽스를 공부하며, 학습한 개념과 실험, 구현 중 해결한 문제를 기록하는 기술 블로그입니다.',
  url: 'https://imjae.github.io',
  github: 'https://github.com/imjae',
};

export const topics = [
  { id: 'gameplay', title: '게임플레이', english: 'GAMEPLAY', description: '캐릭터가 움직이고, 전투하고, 상호작용하는 규칙.', number: '01', color: '#286350' },
  { id: 'graphics', title: '그래픽스', english: 'GRAPHICS', description: '렌더링, 셰이더와 VFX. 시각 표현의 원리와 구현.', number: '02', color: '#416c91' },
  { id: 'tools', title: '도구와 구조', english: 'TOOLS & SYSTEMS', description: '반복 작업을 줄이고, 데이터를 일관되게 다루는 방법.', number: '03', color: '#92613e' },
  { id: 'ai', title: 'AI 협업', english: 'AI COLLABORATION', description: '요구사항, 구현 후보, 검증과 선택에 관한 기록.', number: '04', color: '#75618b' },
  { id: 'notes', title: '생각과 메모', english: 'FIELD NOTES', description: '개발을 둘러싼 공부와 읽기, 아직 열린 질문들.', number: '05', color: '#716d63' },
] as const;

export const kinds = { 'case-study': '구조 노트', devlog: '개발 기록', note: '기술 노트', reading: '읽기 노트' } as const;
export const seriesTitle = (id: string) => id === 'dcb' ? 'DCB 개발 기록' : id.replaceAll('-', ' ');
export const cases = [
  { slug: 'ik-traversal', title: '지형에 맞춰 움직이는 캐릭터', detail: 'StepUp · Climb · SideStep', topic: 'gameplay', number: '01', label: 'IK TRAVERSAL' },
  { slug: 'monster-combat', title: '개별 패턴에서 그룹 전투까지', detail: '행동 DSL · 공격 토큰 · 포위 슬롯', topic: 'gameplay', number: '02', label: 'COMBAT BEHAVIOR' },
  { slug: 'modular-equipment', title: '하나의 파츠, 두 가지 표현', detail: '2D · 3D 조립 · 저장과 복원', topic: 'tools', number: '03', label: 'MODULAR EQUIPMENT' },
  { slug: 'water-playback', title: '물의 움직임을 재생하는 방법', detail: '오프라인 캐시 · 선행 읽기 · 메시', topic: 'graphics', number: '04', label: 'WATER RENDERING' },
  { slug: 'fire-vfx', title: '불의 형태와 표현 비용', detail: '볼륨 · 레이어 · VFX 타임라인', topic: 'graphics', number: '05', label: 'FIRE & VFX' },
] as const;

export const getTopic = (id: string) => topics.find((topic) => topic.id === id) ?? topics[4];
