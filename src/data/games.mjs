// Public catalog only. Private planning text lives in the authenticated Worker store.
export const games = [
  { id: 'dcb', title: 'DCB', cover: '/media/games/dcb.webp', alt: 'DCB의 바위와 물길이 있는 사당 장면', credit: 'DCB 개발 화면 · 기존 공개 캡처' },
  { id: 'shape-workshop', title: '도형 공방', cover: '/media/games/shape-workshop.webp', alt: '여러 다각형 조각을 맞춘 도형 공방 콘셉트 표지', credit: 'AI로 제작한 콘셉트 표지 · 실제 게임 화면 아님' },
  { id: 'dungeon-exploration', title: '던전 탐사', cover: '/media/games/dungeon-exploration.webp', alt: '돌계단과 아치형 통로가 이어지는 던전 탐사 콘셉트 표지', credit: 'AI로 제작한 콘셉트 표지 · 실제 게임 화면 아님' },
];

export const findGame = id => games.find(game => game.id === id);
