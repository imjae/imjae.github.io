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
}

export interface PortfolioCase {
  id: string;
  featureSlug: string;
  title: string;
  category: string;
  summary: string;
  problem: string;
  approach: string;
  contribution: string;
  evidence: string;
  limitation: string;
  tags: string[];
  links: PortfolioLink[];
  media?: PortfolioMedia;
}

// 확인된 프로필만 채웁니다. 빈 값은 화면에 표시하지 않습니다.
export const profile = {
  name: 'imjae',
  headline: 'Unity와 C#으로 게임의 동작과 제작 도구를 만듭니다.',
  intro: 'DCB의 이동·전투·장비 조합을 중심으로, 데이터와 애니메이션을 연결한 구현 및 런타임·그래픽스 작업을 소개합니다.',
  stack: ['Unity 6', 'C#', 'HDRP', 'Addressables'],
  contact: '',
  period: '',
  team: '',
};

// 승인된 영상 URL·캡션을 확보하면 media를 추가합니다.
export const project: {
  title: string;
  subtitle: string;
  description: string;
  role: string;
  media?: PortfolioMedia;
} = {
  title: 'DCB',
  subtitle: '지게에 짐을 싣고 운반하는 액션 게임',
  description: '조선을 배경으로 이동·전투·장비 조합과 환경 상호작용을 개발하고 있습니다. 아래 사례에서 플레이 규칙과 구현 과정, 확인한 범위를 함께 볼 수 있습니다.',
  role: '기획, 게임플레이·데이터 시스템, UI·조립 도구와 셰이더·이펙트를 담당하며, 코드와 검증 도구 작성에는 AI를 활용했습니다.',
};

export const clientCases: PortfolioCase[] = [
  {
    id: 'traversal',
    featureSlug: 'ik-traversal',
    title: '지형과 손발 접촉을 잇는 IK 트레버설',
    category: '캐릭터 제어 · 애니메이션',
    summary: 'StepUp·Climb·SideStep의 진입부터 손발 지지와 일반 보행 복귀까지 연결했습니다.',
    problem: '클립을 지형에 맞추는 동안 지지하던 손발이 끌려가거나, 턱 위에서 보행으로 전환할 때 발 보정이 끊겼습니다.',
    approach: '실제 Avatar에서 측정한 이동·접촉 데이터를 바탕으로 몸의 이동과 IK를 나누고, 접지를 확인하며 남은 보정을 보행에 인계했습니다.',
    contribution: '진입·이동·정지 조건과 보정·검증 기준을 정하고, 전달받은 애니메이션에 측정 도구와 런타임 제어를 연결하며 AI 보조로 구현했습니다.',
    evidence: '2026년 10월 16일 선택 EditMode 검사 116개가 통과했으며, 계산·접촉·보행 인계 규칙을 확인한 기록입니다.',
    limitation: '높은 StepUp의 발 튐과 손 도달 오차가 남아 있으며, 현재 버전의 실제 장면 촬영과 외형 확인이 필요합니다.',
    tags: ['IK', 'Root Motion', '상태 복원'],
    links: [
      { slug: 'dcb-traversal-overview', label: '게임에서의 동작' },
      { slug: 'ik-traversal', label: '구현과 검증 기록' },
    ],
  },
  {
    id: 'combat',
    featureSlug: 'monster-combat',
    title: '개별 패턴과 그룹 전투의 권한 분리',
    category: '상태·전이 · 공유 자원',
    summary: 'Samurai의 접근·공격·블러프를 구성하고, 패턴의 원본을 Unity Behavior 그래프에서 C# FSM·DSL로 옮겼습니다.',
    problem: '패턴 수정마다 그래프 연결을 함께 추적해야 했고, 그룹 전투에서는 대열 회전과 압박 권한의 배정·반납 문제가 있었습니다.',
    approach: '타입별 정의를 코드 원본으로 두고, 개별 행동 실행기와 포위 슬롯·공격 토큰을 배정하는 그룹 디렉터를 분리했습니다.',
    contribution: '이후 패턴도 AI가 읽고 수정하기 쉬워야 한다는 목표를 정하고, 단계적 이관과 그룹 제어 수정을 AI와 함께 진행했습니다.',
    evidence: '2026년 6월의 단계적 이관과 7~8월 실행 순서·슬롯·권한 수정 이력을 현재 정의·실행기·디렉터와 대조했습니다.',
    limitation: '강제 권한 부여의 상한 예외와 최신 전투 재생 확인이 남아 있으며, FSM 전환 전후 성능은 측정하지 않았습니다.',
    tags: ['FSM·DSL', '공격 토큰', '중단과 반납'],
    links: [
      { slug: 'monster-combat', label: 'Samurai의 그룹 전투' },
      { slug: 'monster-combat-analysis', label: '문제 해결 과정' },
      { slug: 'unity-behavior-to-code-fsm', label: 'FSM·DSL 전환' },
    ],
  },
  {
    id: 'equipment',
    featureSlug: 'modular-equipment',
    title: '하나의 파츠 트리로 연결한 장비 조합',
    category: '데이터 · UI · 오브젝트 수명',
    summary: '같은 조합 데이터를 인벤토리 이미지, 3D 장착·드랍, 작업대 프리뷰와 저장·복원에 사용합니다.',
    problem: '표현마다 조합이 달라질 위험이 있었고, 무기 이펙트의 렌더링 상태와 bounds 때문에 프리뷰에서 무기가 사라졌습니다.',
    approach: '파츠 트리와 조립 순서를 공유하되 2D·3D 보정을 나누고, 프리뷰의 bounds 필터와 효과·레이어 복원 후 반환 경로를 정리했습니다.',
    contribution: '조합 데이터와 표현별 조립·프리뷰·저장 연결을 담당하고, 코드 후보와 검증 도구 작성에 AI를 활용했습니다.',
    evidence: '트레일을 수동으로 끄면 표시된다는 당시 확인과 2026년 8월 3~11일의 bounds·스케일·정리 경로 수정 이력을 대조했습니다.',
    limitation: '같은 조합으로 편집·장착·드랍·저장·재실행을 왕복하는 최신 플레이와 반복 열기·닫기의 자원 확인은 남아 있습니다.',
    tags: ['파츠 트리', 'RenderTexture', '풀 반환'],
    links: [
      { slug: 'dcb-equipment-overview', label: '게임에서의 조합 흐름' },
      { slug: 'modular-equipment', label: '데이터·프리뷰 구현' },
      { slug: 'modular-equipment-ui-vfx', label: '조합 UI 이펙트' },
    ],
  },
];

export const graphicsCases: PortfolioCase[] = [
  {
    id: 'water',
    featureSlug: 'water-playback',
    title: '물 캐시의 읽기·변환·메시 업로드',
    category: '비동기 I/O · 버퍼 · Unity 렌더링 API',
    summary: '오프라인 유체 계산 결과를 직접 업로드용 캐시로 바꾸고, 선행 읽기와 Unity 메시 갱신의 경계를 나눴습니다.',
    problem: '베이크한 물도 매 샘플의 Alembic 평가·포말 색 적용·입자 해석 비용이 남아 실제 Editor 재생에서 프레임 드롭이 발생했습니다.',
    approach: '리그마다 세 슬롯을 재사용해 파일 읽기를 앞당기고, 활성 데이터만 메시 버퍼에 올리며 읽기·대기·변환·업로드를 따로 측정했습니다.',
    contribution: '영상과 실제 재생의 차이를 제기해 성능 조사를 요청하고 표현·보존 조건을 정했으며, 포맷·로더·자동 측정 도구는 AI 보조로 작성했습니다.',
    evidence: '2026년 9월 10일 초기 180프레임 캐시의 배치 Editor·렌더링 제외 CPU 평가 중앙값은 54.7971→5.6990ms였습니다.',
    limitation: '이 수치는 현재 캐시의 FPS·GPU 성능이 아니며, 10월 16일 컬링 검사 2건 실패와 현재 데이터의 재측정이 남아 있습니다.',
    tags: ['선행 읽기', 'Mesh Buffer', '자원 수명'],
    links: [
      { slug: 'dcb-water-overview', label: '게임에서의 급류 표현' },
      { slug: 'water-playback', label: '캐시 구조와 측정 조건' },
    ],
  },
  {
    id: 'fire',
    featureSlug: 'fire-vfx',
    title: '화염 레이어와 화면 크기별 표현 제어',
    category: '셰이더 · VFX · 저작 도구',
    summary: '볼륨 화염·불혀·연기·재를 함께 제어하고, 애니메이션 효과는 발생 프레임과 부착점에 연결합니다.',
    problem: '환경 화염의 여러 레이어를 일관되게 재생하면서, 화면에서 작아질 때의 표현과 애니메이션 효과의 첫 재생도 관리해야 했습니다.',
    approach: '화염은 화면 크기에 따라 표현 단계를 바꾸고, 애니메이션 효과는 타임라인·로딩 중 사전 준비·풀 반환을 연결했습니다.',
    contribution: '형태·접점·발생 시점·잔존 시간의 기준을 정해 조정했고, 코드·셰이더·도구 작성에 AI와 재사용 텍스처를 활용했습니다.',
    evidence: '2026년 10월 16일 불 관련 선택 검사 22개가 통과했으며, 현재 표현 계층과 대표 프리팹 설정도 소스로 대조했습니다.',
    limitation: '게임 카메라의 외형과 단계 전환은 실제 재생으로 보완해야 하며, 같은 해상도·품질 조건의 GPU 시간은 미측정입니다.',
    tags: ['HDRP', '품질 단계', 'VFX 타임라인'],
    links: [
      { slug: 'dcb-fire-overview', label: '게임에서의 화염 표현' },
      { slug: 'fire-vfx', label: '레이어·재생 구조' },
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

export const aiDecision: {
  title: string;
  context: string;
  choice: string;
  evidence: string;
  limitation: string;
  links: PortfolioLink[];
} = {
  title: '부드러운 영상과 실제 프레임 드롭을 따로 판단했습니다.',
  context: '2026년 9월 10일 전달받은 물 영상은 부드러웠지만, 실제 Editor 플레이에는 심한 프레임 드롭이 있어 수정을 요청했습니다.',
  choice: '고정 30fps로 저장한 영상을 성능 근거로 삼지 않고, 물의 형상을 유지하며 재생의 읽기·변환·업로드·대기를 조사하는 방향으로 진행했습니다.',
  evidence: 'AI가 작성한 RMC 로더·변환·검사 도구와 자동 측정 기록을 바탕으로, 원본 데이터 동등성과 CPU 평가 구간을 나눠 확인했습니다.',
  limitation: '당시 자동 측정은 초기 캐시의 CPU 평가에 한정되며, 현재 게임의 GPU 비용·전체 FPS나 새 영상 촬영을 대신하지 않습니다.',
  links: [{ slug: 'water-playback', label: '요청·구현·측정의 상세 근거' }],
};

export const contributionRows: Array<{ label: string; description: string }> = [
  {
    label: '직접 정하고 판단한 범위',
    description: '게임 규칙과 작업 목표, 수정·보존 범위, 표현과 검증 기준을 정했습니다. 영상과 실제 재생의 차이를 제기하고 후보의 채택·수정·제외를 판단했습니다.',
  },
  {
    label: 'AI가 보조한 작업',
    description: '코드·셰이더 후보, 측정·검사 도구 작성, 상태 조사, 배치 실행과 Git 통합에 AI를 사용했습니다. 자동 검사 결과를 직접 수행한 플레이로 바꾸어 설명하지 않습니다.',
  },
  {
    label: '작업자·기존 자산·외부 도구',
    description: '3D 모델은 기존 자산을 사용하고, 트레버설 클립은 애니메이션 작업자에게 받았습니다. 화염 플립북은 Unity ParticlePack, 물 계산은 Blender Mantaflow를 사용했습니다.',
  },
];

export const verificationRows: Array<{ subject: string; confirmed: string; remaining: string }> = [
  {
    subject: '시작·재시작 경로',
    confirmed: '10월 19일 격리 워크트리의 Unity 6000.3.10f1·D3D11 배치 Editor에서 일반 시작, 새 로비·빌리지 진입, 별도 프로세스 재시작 기록을 확인했습니다.',
    remaining: '독립 실행 Player, 실제 장치 조작, 전투·사망·귀환과 장시간 플레이는 별도 확인이 필요합니다.',
  },
  {
    subject: 'IK·접촉',
    confirmed: '10월 16일 선택 EditMode 검사 116/116 통과 기록과 현재 이동·접촉·인계 구조를 대조했습니다.',
    remaining: '높은 StepUp의 발 튐·손 도달 오차와 현재 Avatar·지형의 외형을 확인하고 촬영해야 합니다.',
  },
  {
    subject: '전투·장비',
    confirmed: '상태·권한 반납과 파츠 조립·프리뷰·저장 경로를 현재 소스와 수정 이력에서 확인했습니다.',
    remaining: '몬스터 전투 반복, 풀 재사용, 같은 장비의 편집부터 저장·재실행까지의 최신 왕복 검증이 남아 있습니다.',
  },
  {
    subject: '물 캐시',
    confirmed: '초기 180프레임 캐시의 CPU 측정·원본 동등성·수명 검사 기록을 확인했고, 현재 주요 급류의 메시 비대기 옵션은 꺼져 있습니다.',
    remaining: '10월 16일 물 관련 선택 검사 19건 중 2건이 실패했습니다. 고정 가정 정비와 현재 캐시·Player·GPU 재측정이 필요합니다.',
  },
  {
    subject: '불·VFX',
    confirmed: '10월 16일 선택 검사 22/22 통과 기록과 표현 단계·재생·사전 준비·반환 경로를 확인했습니다.',
    remaining: '고정한 카메라·해상도·품질 조건의 실제 화면과 GPU 비용을 확인해야 합니다.',
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
  { slug: 'parallel-ai-worktrees', label: '병렬 세션 지침과 통합 방식' },
  { slug: 'working-with-ai', label: 'AI 사용과 검증 기준' },
  { slug: 'cli-agent-harness', label: '별도 CLI 하네스 제작·사용 중단 경험' },
];
