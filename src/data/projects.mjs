// Public introductions only. Private documents stay in the authenticated Worker store.
export const projects = [
  { id: 'dcb', title: 'DCB', cover: '/media/games/dcb.webp', alt: 'DCB의 바위와 물길이 있는 사당 장면', credit: 'DCB 개발 화면 · 기존 공개 캡처', description: '지게로 짐을 운반하는 액션 게임.', status: '개발 중', records: '/series/dcb/' },
  { id: 'shape-workshop', title: '도형 공방', cover: '/media/games/shape-workshop.webp', alt: '여러 다각형 조각을 맞춘 도형 공방 콘셉트 표지', credit: 'AI로 제작한 콘셉트 표지 · 실제 게임 화면 아님', description: '도형 만들기를 소재로 한 게임 프로젝트.', status: '', records: '/projects/shape-workshop/records/' },
  {
    id: 'dungeon-exploration', title: '던전 탐사', cover: '/media/games/dungeon-exploration-pixel.webp', alt: '돌계단 너머 작은 불빛으로 이어지는 던전 통로의 픽셀 아트', credit: 'AI로 제작한 픽셀 아트 콘셉트 표지 · 실제 게임 화면 아님',
    description: '어둠 속에 남겨진 흔적을 따라, 오래된 던전의 비밀을 찾아가는 탐험 게임입니다.',
    status: '기획 중', records: '/projects/dungeon-exploration/records/',
    introduction: {
      title: '같은 던전, 다른 발견',
      sections: [
        {
          title: '',
          paragraphs: [
            '한 번 지나온 길에도 아직 발견하지 못한 것이 남아 있습니다. 서로 다른 시선으로 던전을 살피고, 작은 발견을 이어 더 깊은 곳으로 나아갑니다. 익숙한 장소에서 뜻밖의 길을 찾는 즐거움을 담고 있습니다.',
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
