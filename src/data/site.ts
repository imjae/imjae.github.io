export const site = {
  title: 'imjae · Dev Notes',
  description: 'Unity와 C# 게임 개발, 그래픽스, 개발 도구와 게임 수학에 관한 기술 기록입니다.',
  url: 'https://imjae.github.io',
  github: 'https://github.com/imjae',
};

export const topics = [
  { id: 'gameplay', title: 'Gameplay', english: 'GAMEPLAY', description: '캐릭터 이동, 전투와 상호작용 구현.', number: '01', color: '#286350' },
  { id: 'graphics', title: 'Graphics', english: 'GRAPHICS', description: '렌더링, 셰이더와 VFX 구현.', number: '02', color: '#416c91' },
  { id: 'tools', title: 'Tools & Systems', english: 'TOOLS & SYSTEMS', description: 'UI, 데이터 처리와 개발 도구.', number: '03', color: '#92613e' },
  { id: 'ai', title: 'AI Collaboration', english: 'AI COLLABORATION', description: 'AI를 사용한 구현과 검증 과정.', number: '04', color: '#75618b' },
  { id: 'notes', title: 'Notes', english: 'NOTES', description: '자료구조와 웹 기술에 관한 메모.', number: '05', color: '#716d63' },
  { id: 'math', title: 'Mathematics', english: 'MATHEMATICS', description: '수와 함수, 벡터·행렬·회전의 원리와 계산.', number: '06', color: '#427872' },
  { id: 'reading', title: 'Reading', english: 'READING', description: '책 목록과 짧은 감상, 독서 메모.', number: '07', color: '#8a685e' },
  { id: 'study', title: 'Study', english: 'STUDY', description: 'C++과 게임 엔진의 개념, 실험 순서와 실행 기록.', number: '08', color: '#526c8a' },
] as const;

export const kinds = { 'case-study': '구조 노트', devlog: '개발 기록', note: '기술 노트', reading: '읽기 노트' } as const;
export const seriesTitle = (id: string) => id === 'dcb' ? 'DCB 개발 기록' : id.replaceAll('-', ' ');
export { dcbFeatures as cases } from './dcb-features.mjs';

export const getTopic = (id: string) => topics.find((topic) => topic.id === id) ?? topics[4];
