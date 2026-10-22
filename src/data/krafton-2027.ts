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
  description: '조선을 배경으로 이동·전투·장비 조합과 환경 상호작용을 개발하고 있습니다. 아래 사례에서 플레이 규칙과 구현 과정, 확인한 범위를 함께 볼 수 있습니다.',
  role: '기획, 게임플레이·데이터 시스템, UI·조립 도구와 셰이더·이펙트를 담당하며, 코드와 검증 도구 작성에는 AI를 활용했습니다.',
};

export const clientCases: PortfolioCase[] = [
  {
    id: 'traversal',
    featureSlug: 'ik-traversal',
    title: '지형과 손발 접촉을 잇는 IK 트레버설',
    category: '캐릭터 제어 · 애니메이션',
    summary: '턱 오르기, 벽 타기, 선반 옆걸음을 진입부터 손발 지지, 보행 복귀까지 한 흐름으로 연결했습니다.',
    problem: '클립의 발 위치만 지면에 맞추면 몸이 움직이는 동안 지지하던 손발이 끌려가고, 턱 위에서 보행으로 넘어가는 순간 발 보정이 끊겼습니다.',
    approach: '실제 Avatar에서 클립의 이동량과 접촉 시점을 측정해 데이터로 만들고, 몸을 옮기는 코드와 손발을 붙이는 IK를 분리했습니다. 착지 뒤에는 남은 보정을 보행 IK에 넘깁니다.',
    contribution: '언제 들어가고 멈추는지, 무엇을 어디까지 보정하고 확인하는지는 제가 정했습니다. 애니메이션은 작업자에게 받았고, 측정 도구와 런타임 코드는 AI와 함께 작성해 결과를 보고 채택 여부를 판단했습니다.',
    evidence: '10월 16일 EditMode 검사 116개 통과. 레이 실패 보정으로 한 비교 표본의 최대 발 변화가 134mm에서 103mm로 줄었습니다.',
    limitation: '높은 턱에서 발이 튀고 손 도달 오차가 남습니다. 실제 장면은 아직 찍지 않았습니다.',
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
    summary: 'Samurai가 자리를 나누고 접근, 공격, 블러프를 이어 가는 그룹 전투를 만들고, 패턴 원본을 Unity Behavior 그래프에서 C# 코드로 옮겼습니다.',
    problem: '패턴을 하나 고칠 때마다 그래프 연결을 따라가야 했습니다. 여러 명이 둘러쌀 때는 대열이 과하게 돌고, 압박 권한이 반납되지 않는 문제가 있었습니다.',
    approach: '몬스터 타입별 C# 정의를 원본으로 두고, 개별 행동을 돌리는 실행기와 포위 자리·공격 토큰을 나눠 주는 그룹 디렉터를 분리했습니다. 공격 권한과 접근 권한을 따로 세기 때문에 공격 없이 빠지는 블러프가 생깁니다.',
    contribution: '앞으로 추가할 패턴까지 AI가 읽고 고치기 쉬운 원본이어야 한다는 목표와, 비용이 줄지 않으면 멈춘다는 조건을 제가 정했습니다. 단계적 이관과 그룹 제어 수정은 AI와 함께 진행했습니다.',
    evidence: '6월에 Bandit부터 옮긴 뒤 Unity Behavior 의존을 제거했고, 7~8월에 실행 순서와 슬롯, 권한 반납을 고친 커밋이 현재 코드에 남아 있습니다.',
    limitation: '오래 기다린 개체에 권한을 강제로 주는 경로는 상한을 다시 검사하지 않습니다. 전환 전후 성능은 재지 않았고 최신 전투 장면도 아직 없습니다.',
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
    summary: '파츠 트리 하나로 인벤토리 이미지, 3D 장착과 드랍, 작업대 프리뷰, 저장과 복원을 모두 처리합니다.',
    problem: '화면마다 조립 결과를 따로 저장하면 파츠를 바꿀 때 결과가 어긋날 수 있었습니다. 날 파츠를 붙이면 트레일의 굴절과 오래된 bounds 때문에 프리뷰에서 무기가 사라지기도 했습니다.',
    approach: '파츠 트리와 조립 순서는 공유하고 2D와 3D의 배치 보정만 따로 계산합니다. 프리뷰에서는 비활성 효과를 bounds 계산에서 빼고, 꺼 둔 효과를 풀에 돌려주기 전에 복원하게 했습니다.',
    contribution: '조합 데이터 구조와 표현별 조립, 프리뷰, 저장 연결을 맡았습니다. 코드 후보와 검증 도구는 AI와 함께 작성했습니다.',
    evidence: '트레일을 손으로 끄면 무기가 보인다는 것을 확인한 뒤 코드로 옮겼습니다. 8월 3~11일에 bounds 필터, 스케일 보정 제거, 풀 반환 정리를 커밋했습니다.',
    limitation: '같은 조합으로 편집부터 저장, 재실행까지 한 번에 왕복한 최신 확인은 아직 없습니다.',
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
    summary: '오프라인에서 계산한 유체를 바로 올릴 수 있는 메시 캐시로 바꾸고, 디스크 읽기와 Unity 메시 갱신을 분리했습니다.',
    problem: '전달받은 영상은 부드러웠지만 에디터에서 직접 플레이하면 프레임이 크게 떨어졌습니다. 베이크한 물인데도 매 프레임 Alembic 평가와 포말 색 적용, 입자 해석이 남아 있었습니다.',
    approach: '정점 28바이트 레이아웃의 캐시를 만들어 메시 버퍼에 바로 올리고, 리그마다 슬롯 세 개로 다음 프레임을 작업 스레드에서 미리 읽습니다. 읽기, 대기, 변환, 업로드에 프로파일러 마커를 따로 두었습니다.',
    contribution: '영상과 실제 재생이 다르다는 점을 제가 제기해 성능 문제를 따로 다루게 했고, 물의 표현 요구와 데이터 보존 조건을 정했습니다. 포맷, 로더, 측정 도구는 AI와 함께 작성했습니다.',
    evidence: '9월 10일 측정에서 샘플 평가 CPU 중앙값이 약 55ms에서 5.7ms로, 반복 전환은 81ms에서 12ms로 줄었습니다. 렌더링을 뺀 구간이며 당시 180프레임 캐시 기준입니다.',
    limitation: '전체 FPS나 GPU 시간은 아닙니다. 현재 캐시는 다시 재지 않았고, 입자 컬링 검사 2건이 실패한 채 남아 있습니다.',
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
    summary: '볼륨 화염과 불혀, 연기와 재를 한 불로 묶어 제어하고, 캐릭터 효과는 애니메이션의 발생 프레임과 부착점에 붙입니다.',
    problem: '불 하나가 여러 레이어로 이뤄져 있어 멀어질 때 어디까지 줄일지, 그리고 효과를 처음 재생할 때 생기는 준비 비용을 어떻게 나눌지가 문제였습니다.',
    approach: '화면에서 차지하는 크기로 Full, Reduced, Minimal, Culled 단계를 고르고 경계에는 hysteresis를 둬 깜빡임을 줄였습니다. 캐릭터 효과는 로딩 중 여러 프레임에 나눠 준비하고 풀로 돌려줍니다.',
    contribution: '불의 형태와 접점, 효과의 발생 시점과 잔존 시간은 제가 기준을 정해 조정했습니다. 코드와 셰이더, 도구는 AI와 함께 작성했고 플립북 텍스처는 Unity ParticlePack을 재사용했습니다.',
    evidence: '10월 16일 불 관련 검사 22개 통과. 대표 프리팹은 넓은 불 모양과 강한 연소 단계, 거리 기준 45m로 저장돼 있습니다.',
    limitation: '게임 카메라에서의 외형과 단계 전환은 아직 찍지 않았고 GPU 시간도 재지 않았습니다.',
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

export const aiUsageCase: {
  title: string;
  context: string;
  choice: string;
  evidence: string;
  limitation: string;
  links: PortfolioLink[];
} = {
  title: '병렬 세션 지침과 통합 방식',
  context: '여러 AI 세션에 같은 작업 기준을 적용하도록 공통 지침을 구성하고, Git 워크트리로 구현·검증 공간을 분리했습니다.',
  choice: '작업마다 수정·보존 범위와 완료 조건을 정하고, 슬롯 소유 기록으로 중복 사용을 관리했습니다. 결과는 작업별 커밋과 검증 기록으로 받아 의존 순서대로 통합하도록 했습니다.',
  evidence: '2026년 10월 1~2일 Deluge의 병행 작업·통합 이력과 현재 DCB의 공통 지침·슬롯 운영 절차를 대조했습니다.',
  limitation: '시간 절감률·처리량은 미측정이며, 선점 경쟁과 비정상 종료 복구의 재현 검증은 남아 있습니다.',
  links: [{ slug: 'parallel-ai-worktrees', label: '병렬 세션 지침과 통합 방식 자세히 보기' }],
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

// 기능별 확인 조건은 각 사례의 limitation에 있습니다. 여기에는 사례에 속하지 않는 공통 실행 근거만 둡니다.
export const verificationNote = '게임 자체는 10월 19일 격리 워크트리의 Unity 6000.3.10f1·D3D11 배치 Editor에서 일반 시작과 새 로비·빌리지 진입, 별도 프로세스 재시작까지 확인한 기록이 있습니다. 독립 실행 Player, 실제 장치 조작, 전투·사망·귀환과 장시간 플레이는 아직 확인하지 않았습니다.';

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
