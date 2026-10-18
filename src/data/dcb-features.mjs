export const dcbFeatures = [
  {
    slug: 'ik-traversal', title: 'IK 트레버설', detail: 'StepUp · Climb · SideStep',
    description: '턱과 절벽을 이동하는 경로, 손발 접촉과 보행 복귀를 다룹니다.',
    topic: 'gameplay', number: '01', label: 'IK TRAVERSAL',
    articleSlugs: ['ik-traversal'],
  },
  {
    slug: 'monster-combat', title: '몬스터 패턴과 그룹 전투', detail: '행동 DSL · 공격 토큰 · 포위 슬롯',
    description: '몬스터의 행동 정의와 상태 전환, 그룹의 위치 배정과 공격 기회를 다룹니다.',
    topic: 'gameplay', number: '02', label: 'COMBAT BEHAVIOR',
    articleSlugs: ['monster-combat', 'unity-behavior-to-code-fsm'],
  },
  {
    slug: 'modular-equipment', title: '2D·3D 장비 파츠 조합', detail: '파츠 데이터 · 피벗 정렬 · 저장과 복원',
    description: '장비 파츠의 2D·3D 조립, 프리뷰와 저장·복원, 조합 화면의 연출을 다룹니다.',
    topic: 'tools', number: '03', label: 'MODULAR EQUIPMENT',
    articleSlugs: ['modular-equipment', 'modular-equipment-ui-vfx'],
  },
  {
    slug: 'water-playback', title: '물 캐시 재생', detail: '오프라인 캐시 · 선행 읽기 · 메시 업로드',
    description: '오프라인에서 계산한 급류를 재생하고 메시와 보조 입자를 갱신하는 구조를 다룹니다.',
    topic: 'graphics', number: '04', label: 'WATER RENDERING',
    articleSlugs: ['water-playback'],
  },
  {
    slug: 'fire-vfx', title: '불 이펙트와 VFX 타임라인', detail: '볼륨 · 레이어 · 표현 단계',
    description: '불의 표현 레이어와 품질 단계, 애니메이션에 연결한 이펙트 저작 구조를 다룹니다.',
    topic: 'graphics', number: '05', label: 'FIRE & VFX',
    articleSlugs: ['fire-vfx'],
  },
];
