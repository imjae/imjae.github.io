export interface PortfolioMedia {
  url: string;
  title: string;
  caption: string;
  startSeconds?: number;
  endSeconds?: number;
}

export interface PortfolioLink {
  slug: string;
  label: string;
  /** 글 안의 특정 절로 바로 가는 제목 anchor. 제목을 소문자·하이픈으로 바꾼 값이다. */
  anchor?: string;
  /** 'problems'는 구현하며 생긴 문제를 다루는 글이며 카드에서 강조한다. */
  kind?: 'overview' | 'implementation' | 'problems';
}

// 카드는 기능 소개와 구현 방식을 보여 준다. 문제 해결 과정과 확인 범위는 links의 글에서 다룬다.
export interface PortfolioCase {
  id: string;
  featureSlug: string;
  title: string;
  category: string;
  summary: string;
  intro: string;
  implementation: string[];
  role: string;
  tags: string[];
  links: PortfolioLink[];
  media?: PortfolioMedia;
}

// 확인된 프로필만 채웁니다. 빈 값은 화면에 표시하지 않습니다.
export const profile = {
  name: 'imjae',
  headline: 'Unity와 C#으로 게임의 동작과 제작 도구를 만듭니다.',
  intro: 'DCB의 이동·전투·장비 조합을 중심으로, 데이터와 애니메이션을 연결한 구현 및 런타임·그래픽스 작업을 소개합니다.',
  stack: ['Unity 6', 'C#', 'HDRP', 'Addressables', 'ShaderLab / HLSL'],
  contact: '',
  period: '',
  team: '',
};

// 전체 플레이 영상은 등록 화면의 주소를 사용합니다. 기능별 상세 영상은 각 사례의 media에 따로 연결합니다.
export const project: {
  title: string;
  subtitle: string;
  description: string;
  role: string;
  media?: PortfolioMedia;
} = {
  title: 'DCB',
  subtitle: '지게에 짐을 싣고 운반하는 액션 게임',
  description: '조선을 배경으로 이동·전투·장비 조합과 환경 상호작용을 개발하고 있습니다. 아래 사례는 기능의 동작과 구현 방식을 보여 주고, 구현하며 생긴 문제는 연결된 글에서 따로 읽을 수 있습니다.',
  role: '기획, 게임플레이·데이터 시스템, UI·조립 도구와 셰이더·이펙트를 담당하며, 코드와 검증 도구 작성에는 AI를 활용했습니다.',
};

export const clientCases: PortfolioCase[] = [
  {
    id: 'traversal',
    featureSlug: 'ik-traversal',
    title: '지형과 손발 접촉을 잇는 IK 트레버설',
    category: '캐릭터 제어 · 애니메이션',
    summary: '턱 오르기, 벽 타기, 선반 옆걸음을 진입부터 손발 지지, 보행 복귀까지 한 흐름으로 연결했습니다.',
    intro: '턱은 걷다가 그대로 올라서고, 벽과 좁은 선반은 안내가 잡힌 자리에서 Space로 들어갑니다. 세 동작 모두 손발이 실제 지형에 붙은 채 진행되고, 끝나면 일반 보행으로 돌아옵니다.',
    implementation: [
      '작업자에게 받은 클립을 실제 Avatar에서 120Hz로 샘플링해 몸의 이동량, 손발의 접촉·이탈 시점, IK 좌표를 데이터로 만듭니다.',
      '몸을 옮기는 코드와 손발을 지형에 붙이는 IK를 분리하고, 트레버설 중에는 일반 이동과 루트 모션 전달을 막아 이동 주체를 하나로 둡니다.',
      '공중의 발은 원본 궤적에 출발·착지 오차를 나눠 더하고, 착지 뒤 남은 보정은 보행 IK에 넘겨 한 프레임 튐을 피합니다.',
    ],
    role: '언제 들어가고 멈추는지, 무엇을 어디까지 보정하고 확인하는지는 제가 정했습니다. 측정 도구와 런타임 코드는 AI와 함께 작성하고 결과를 보고 채택했습니다.',
    tags: ['IK', 'Root Motion', '상태 복원'],
    links: [
      { slug: 'dcb-traversal-overview', label: '게임에서의 동작', kind: 'overview' },
      { slug: 'ik-traversal', label: '구현 기록', kind: 'implementation' },
      { slug: 'ik-traversal', anchor: 'stepup-종료에서-지면-레이가-잠시-실패한-문제', label: '구현하며 생긴 문제', kind: 'problems' },
    ],
  },
  {
    id: 'combat',
    featureSlug: 'monster-combat',
    title: '개별 패턴과 그룹 전투의 권한 분리',
    category: '상태·전이 · 공유 자원',
    summary: 'Samurai가 자리를 나누고 접근, 공격, 블러프를 이어 가는 그룹 전투를 만들고, 패턴 원본을 Unity Behavior 그래프에서 C# 코드로 옮겼습니다.',
    intro: 'Samurai는 플레이어를 발견하면 쫓아오다 가까워지면 주변에 자리를 잡습니다. 공격 기회를 받은 개체만 들어가고, 나머지는 접근했다 빠지는 블러프로 압박합니다.',
    implementation: [
      '몬스터 타입별 C# definition을 패턴의 원본으로 두고, 등록된 primitive만 조합하는 코드 기반 FSM·DSL을 공통 실행기와 스케줄러가 돌립니다.',
      '그룹 디렉터가 플레이어 주위의 거리 층과 방향으로 자리를 나누고, 실제 공격 권한(토큰)과 접근 권한(클레임)을 인원별 상한으로 따로 배정합니다.',
      '전이를 한눈에 보는 뷰어와 매개변수 프리셋을 에디터에 두어 코드 원본을 유지한 채 튜닝합니다.',
    ],
    role: '앞으로 추가할 패턴까지 AI가 읽고 고치기 쉬운 원본이어야 한다는 목표와, 비용이 줄지 않으면 멈춘다는 조건을 제가 정했습니다. 단계적 이관과 그룹 제어 수정은 AI와 함께 진행했습니다.',
    tags: ['FSM·DSL', '공격 토큰', '중단과 반납'],
    links: [
      { slug: 'monster-combat', label: '게임에서의 동작', kind: 'overview' },
      { slug: 'unity-behavior-to-code-fsm', label: '구현 기록: FSM·DSL 전환', kind: 'implementation' },
      { slug: 'monster-combat-analysis', label: '구현하며 생긴 문제', kind: 'problems' },
    ],
  },
  {
    id: 'equipment',
    featureSlug: 'modular-equipment',
    title: '하나의 파츠 트리로 연결한 장비 조합',
    category: '데이터 · UI · 오브젝트 수명',
    summary: '파츠 트리 하나로 인벤토리 이미지, 3D 장착과 드랍, 작업대 프리뷰, 저장과 복원을 모두 처리합니다.',
    intro: '모루에서 무기의 연결 지점에 파츠를 붙여 하나의 무기를 만듭니다. 완성한 무기는 인벤토리 이미지, 3D 장착과 드랍, 저장에 그대로 쓰입니다.',
    implementation: [
      '조합의 원본은 재귀적인 파츠 트리 하나이며, 2D 이미지와 3D 모델은 같은 트리를 읽되 배치 보정만 표현별로 계산합니다.',
      '작업대 프리뷰는 실제 장착용 리그를 별도 카메라로 RenderTexture에 그리고, 연결 지점을 화면 좌표로 옮겨 마커를 놓습니다.',
      '프리뷰 bounds 계산에서 비활성 효과와 트레일·파티클 렌더러를 제외하고, 풀에서 빌린 리그는 꺼 둔 효과를 복원한 뒤 돌려줍니다.',
    ],
    role: '조합 데이터 구조와 표현별 조립, 프리뷰, 저장 연결을 맡았습니다. 코드 후보와 검증 도구는 AI와 함께 작성했습니다.',
    tags: ['파츠 트리', 'RenderTexture', '풀 반환'],
    links: [
      { slug: 'dcb-equipment-overview', label: '게임에서의 동작', kind: 'overview' },
      { slug: 'modular-equipment', label: '구현 기록', kind: 'implementation' },
      { slug: 'modular-equipment', anchor: '모루-프리뷰에서-무기가-사라진-문제', label: '구현하며 생긴 문제', kind: 'problems' },
      { slug: 'modular-equipment-ui-vfx', label: '조합 UI 이펙트', kind: 'implementation' },
    ],
  },
];

export const graphicsCases: PortfolioCase[] = [
  {
    id: 'water',
    featureSlug: 'water-playback',
    title: '물 캐시의 읽기·변환·메시 업로드',
    category: '비동기 I/O · 버퍼 · Unity 렌더링 API',
    summary: '오프라인에서 계산한 유체를 바로 올릴 수 있는 메시 캐시로 바꾸고, 디스크 읽기와 Unity 메시 갱신을 분리했습니다.',
    intro: '급류는 게임 중에 유체를 계산하지 않습니다. 지형과 바위에 맞춰 오프라인에서 계산한 수면과 포말·물보라를 같은 시간에 맞춰 재생합니다.',
    implementation: [
      'Alembic 결과를 정점 28바이트 레이아웃의 직접 업로드용 캐시로 변환하고, 해당 프레임의 데이터만 메시 버퍼에 올립니다.',
      '리그마다 슬롯 세 개로 다음 두 프레임을 작업 스레드에서 미리 읽고, 메시 업로드와 객체 해제는 캐시를 만든 스레드에서만 수행합니다.',
      '보조 입자는 표시 범위 밖을 CPU에서 걸러낸 뒤 Burst 변환으로 입자 시스템에 전달하고, 읽기·대기·변환·업로드를 프로파일러 마커로 나눠 잽니다.',
    ],
    role: '영상과 실제 재생이 다르다는 점을 제가 제기해 성능 문제를 따로 다루게 했고, 물의 표현 요구와 데이터 보존 조건을 정했습니다. 포맷, 로더, 측정 도구는 AI와 함께 작성했습니다.',
    tags: ['선행 읽기', 'Mesh Buffer', '자원 수명'],
    links: [
      { slug: 'dcb-water-overview', label: '게임에서의 동작', kind: 'overview' },
      { slug: 'water-playback', label: '구현 기록', kind: 'implementation' },
      { slug: 'water-playback', anchor: '반복-전환과-화면-밖-갱신에서-남은-비용', label: '구현하며 생긴 문제', kind: 'problems' },
      { slug: 'water-playback', anchor: '당시-측정에서-줄어든-구간과-지불한-비용', label: '측정 결과', kind: 'implementation' },
    ],
  },
  {
    id: 'fire',
    featureSlug: 'fire-vfx',
    title: '화염 레이어와 화면 크기별 표현 제어',
    category: '셰이더 · VFX · 저작 도구',
    summary: '볼륨 화염과 불혀, 연기와 재를 한 불로 묶어 제어하고, 캐릭터 효과는 애니메이션의 발생 프레임과 부착점에 붙입니다.',
    intro: '환경 화염은 영역과 모양을 정하면 볼륨 화염, 불혀, 연기, 재와 광원을 함께 제어합니다. 캐릭터 효과는 애니메이션의 특정 프레임과 부착점에서 재생됩니다.',
    implementation: [
      'FireZoneV2가 연료 영역과 화염 모양을 정의하고, ProceduralStructureFireEffect가 절차적 밀도 볼륨과 디테일 셸을 제어합니다.',
      '화면에서 차지하는 크기로 Full·Reduced·Minimal·Culled 단계를 고르고 경계에 hysteresis를 둡니다. 레이어를 생략해도 재생 시간은 초기화하지 않습니다.',
      '애니메이션 이펙트 타임라인이 발생 프레임·부착점·재생 방식(OneShot·Sustained)을 지정하고, 풀 인스턴스 준비는 로딩 중 여러 프레임에 시간 예산으로 나눠 실행합니다.',
    ],
    role: '불의 형태와 접점, 효과의 발생 시점과 잔존 시간은 제가 기준을 정해 조정했습니다. 코드와 셰이더, 도구는 AI와 함께 작성했고 플립북 텍스처는 Unity ParticlePack을 재사용했습니다.',
    tags: ['HDRP', '품질 단계', 'VFX 타임라인'],
    links: [
      { slug: 'dcb-fire-overview', label: '게임에서의 동작', kind: 'overview' },
      { slug: 'fire-vfx', label: '구현 기록', kind: 'implementation' },
    ],
  },
];

export const aiSteps: Array<{ title: string; description: string }> = [
  {
    title: '문제와 보존 범위 지정',
    description: '재현 조건, 수정할 파일, 보존할 자산과 완료 조건을 정하고 실제 호출·프리팹·데이터 연결을 먼저 확인하게 했습니다.',
  },
  {
    title: '세션과 실행 공간 분리',
    description: '배치·캡처·장시간 검사는 별도 워크트리에 맡기고, 공통 지침과 슬롯 소유 기록으로 작업 범위와 공유 입력을 관리했습니다.',
  },
  {
    title: '결과를 보고 채택 판단',
    description: '코드의 변경 범위와 재생 결과를 함께 검토하고, 자동 검사를 통과해도 손목 외형이 악화한 IK 후보는 제외했습니다.',
  },
  {
    title: '검증 수준과 통합 기록',
    description: 'AI가 수행한 컴파일·자동 검사·캡처·측정을 구분하고, 작업별 커밋과 남은 문제를 받아 의존 순서에 맞춰 통합하도록 했습니다.',
  },
];

export const aiUsageCase: {
  title: string;
  context: string;
  choice: string;
  links: PortfolioLink[];
} = {
  title: '병렬 세션 지침과 통합 방식',
  context: '문제 파악·구현·검증·통합 단계별로 필요한 컨텍스트를 분리했습니다. 이전 단계의 가정이나 다른 작업의 지시가 섞여 수정 범위를 벗어나거나, 구현한 내용을 검증 완료로 단정하는 AI의 실수를 줄이려는 목적입니다.',
  choice: '공통 지침으로 작업 기준을 맞추고, Git 워크트리로 구현·검증 공간을 분리했습니다. 작업마다 수정·보존 범위와 완료 조건을 정하고, 슬롯 소유 기록으로 중복 사용을 관리했습니다. 결과는 작업별 커밋과 검증 기록으로 받아 의존 순서대로 통합하도록 했습니다.',
  links: [{ slug: 'parallel-ai-worktrees', label: '병렬 세션 지침과 통합 방식 자세히 보기' }],
};

export const contributionRows: Array<{ label: string; description: string }> = [
  {
    label: '직접 정하고 판단한 범위',
    description: '게임 규칙과 작업 목표, 수정·보존 범위, 표현과 검증 기준을 정했습니다. 영상과 실제 재생의 차이를 제기하고 후보의 채택·수정·제외를 판단했습니다.',
  },
  {
    label: 'AI가 보조한 작업',
    description: '코드·셰이더 후보, 측정·검사 도구 작성, 상태 조사, 배치 실행과 Git 통합에 AI를 사용했습니다.',
  },
  {
    label: '작업자·기존 자산·외부 도구',
    description: '3D 모델은 기존 자산을 사용하고, 트레버설 클립은 애니메이션 작업자에게 받았습니다. 화염 플립북은 Unity ParticlePack, 물 계산은 Blender Mantaflow를 사용했습니다.',
  },
];

export const additionalLinks: PortfolioLink[] = [
  { slug: 'jige-cargo-secondary-motion', label: '지게 짐의 출렁임' },
  { slug: 'rope-bridge-physical-sway', label: '밧줄 다리의 물리 흔들림' },
  { slug: 'dcb-cinematic-overview', label: '시네마틱과 전투 전환' },
  { slug: 'dcb-gameplay-balance-overview', label: '게임플레이 밸런싱과 제어' },
  { slug: 'player-balance-tuning-tool', label: '밸런스 조정 도구' },
  { slug: 'opengl-vertex-texture-pipeline', label: 'OpenGL 정점 버퍼와 텍스처' },
];

export const aiLinks: PortfolioLink[] = [
  { slug: 'working-with-ai', label: 'AI 사용과 검증 기준' },
  { slug: 'cli-agent-harness', label: '별도 CLI 하네스 제작·사용 중단 경험' },
];
