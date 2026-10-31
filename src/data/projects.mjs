// Public introductions only. Private documents stay in the authenticated Worker store.
export const projects = [
  { id: 'dcb', title: 'DCB', cover: '/media/games/dcb.webp', alt: 'DCB의 바위와 물길이 있는 사당 장면', credit: 'DCB 개발 화면 · 기존 공개 캡처', description: '지게로 짐을 운반하는 액션 게임.', status: '개발 중', records: '/series/dcb/' },
  { id: 'shape-workshop', title: '도형 공방', cover: '/media/games/shape-workshop.webp', alt: '여러 다각형 조각을 맞춘 도형 공방 콘셉트 표지', credit: 'AI로 제작한 콘셉트 표지 · 실제 게임 화면 아님', description: '도형 만들기를 소재로 한 게임 프로젝트.', status: '', records: '/projects/shape-workshop/records/' },
  {
    id: 'dungeon-exploration', title: '던전 탐사', cover: '/media/games/dungeon-exploration.webp', alt: '돌계단과 아치형 통로가 이어지는 던전 탐사 콘셉트 표지', credit: 'AI로 제작한 콘셉트 표지 · 실제 게임 화면 아님',
    description: '다섯 직업의 캐릭터가 하나의 던전을 번갈아 탐험하는 탑다운 2D 픽셀 게임을 기획하고 있습니다.',
    status: '기획 중', records: '/projects/dungeon-exploration/records/',
    introduction: {
      title: '다섯 직업이 이어 가는 던전 탐험',
      sections: [
        {
          title: '같은 던전을 다르게 탐색하기',
          paragraphs: [
            '지도사·약초꾼·사냥꾼·공병·학자가 같은 던전을 각자의 방식으로 탐색합니다. 한 번에 한 캐릭터를 조작하고, 거점에서 다른 캐릭터로 교대합니다. 앞선 탐험에서 연 길과 거점에 가져온 기록을 다음 캐릭터가 이어받는 구조입니다.',
            '지도사는 지형과 숨은 공간을 살피고, 약초꾼은 약초를 거두어 약을 만듭니다. 사냥꾼은 흔적을 읽고 큰 몬스터를 상대하며, 공병은 지형과 구조물을 다룹니다. 학자는 옛 글자와 장치의 규칙을 읽습니다.',
          ],
        },
        {
          title: '직업마다 다른 단서와 해결 방법',
          paragraphs: [
            '파기·거두기·흔적 읽기 같은 공통 기술은 모든 직업이 사용합니다. 직업에 따라 작업 속도와 자원 소모, 위험, 단서를 이해하는 정도가 달라집니다. 지금 캐릭터로 해결할지, 더 잘하는 캐릭터에게 맡길지 판단하는 재미를 중심에 둡니다.',
            '직업별 시야인 렌즈로 지형의 빈 곳, 약초의 상태, 짐승의 흔적, 구조물과 글자의 연결을 살핍니다. 전용 기술은 지름길이나 숨은 방, 추가 보상을 찾는 데 쓰고, 필수 진행은 공통 기술로도 해결할 수 있도록 설계합니다.',
          ],
        },
        {
          title: '탐험과 귀환, 쉬기',
          paragraphs: [
            '안개에 가려진 공간을 밝히며 기름·체력·식량을 관리합니다. 더 깊이 들어갈지, 얻은 물건과 기록을 거점에 가져갈지 결정합니다. 짐승과 몬스터는 피하거나 싸워야 하는 위협이며, 쓰러지면 가지고 있던 짐과 아직 거점에 보관하지 않은 기록을 잃습니다.',
            '거점에 들러 기록을 저장한 뒤 탐험을 계속할 수 있습니다. 귀환을 선택하면 탐험을 끝내고 회복하며, 쉬기는 별도로 선택합니다. 쉬면 약초와 짐승·몬스터의 상태가 바뀌지만, 캐릭터가 열어 둔 길과 끝낸 작업은 남습니다.',
          ],
        },
        {
          title: '기획 중인 범위',
          paragraphs: [
            '고정된 던전 하나를 여러 직업으로 거듭 살펴보는 구성을 잡고 있습니다. 탑다운 픽셀 그래픽과 어두운 판타지 분위기를 바탕으로, Unity를 사용한 PC용 게임과 무료 데모를 계획하고 있습니다.',
            '우선 던전 1층을 완성하는 범위에서 다섯 직업의 역할과 공통 규칙을 정리했습니다. 현재는 입구의 작은 구간에서 탐색의 차이를 확인할 수 있도록 직업별 작업, 전투와 보상, 레벨 구성을 구체화하고 있습니다.',
          ],
        },
      ],
    },
  },
];

export const findProject = id => projects.find(project => project.id === id);
export const projectDocuments = [
  { id: 'plans', title: '기획서', description: '게임의 규칙과 진행, 앞으로 만들 내용을 정리합니다.' },
  { id: 'resources', title: '리소스', description: '사용할 자료의 링크와 출처, 작업 메모를 정리합니다.' },
];
export const findProjectDocument = id => projectDocuments.find(section => section.id === id);
export function projectLinks(project) {
  const root = `/projects/${project.id}/`;
  return [
    { id: 'intro', title: '소개', href: root, private: false },
    ...projectDocuments.map(section => ({ ...section, href: `${root}${section.id}/`, private: true })),
    ...(project.records ? [{ id: 'records', title: '개발 기록', href: project.records, private: false }] : []),
  ];
}
