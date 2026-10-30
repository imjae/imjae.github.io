import type { ImageMetadata } from 'astro';
import dcbShrine from '../assets/home/dcb-shrine.png';

// 상단 profile은 사용자가 채울 영역입니다. 빈 값은 [입력할 항목]으로 표시합니다.
// projects 순서가 앨범 순서입니다. id는 중복되지 않는 영문 식별자를 사용합니다.
// cover가 없으면 프로젝트 이름을 표지로 씁니다. url이 비어 있으면 링크를 숨깁니다.
interface AboutProject {
  id: string;
  name: string;
  summary: string;
  url: string;
  linkLabel: string;
  cover?: { image: ImageMetadata; alt: string };
}

interface AboutContent {
  profile: Record<'name' | 'role' | 'summary' | 'email', string>;
  projects: AboutProject[];
}

export const about: AboutContent = {
  profile: { name: '', role: '', summary: '', email: '' },
  projects: [
    {
      id: 'dcb',
      name: 'DCB',
      summary: '지게로 짐을 운반하는 액션 게임입니다.',
      url: '/projects/dcb/',
      linkLabel: '프로젝트 보기',
      cover: {
        image: dcbShrine,
        alt: 'DCB 신단의 폭포와 푸른 안개가 있는 게임 장면',
      },
    },
    {
      id: 'imjaess',
      name: 'imjaess',
      summary: 'CLI 기반 AI 작업 도구의 제작 기록입니다.',
      url: '/writing/cli-agent-harness/',
      linkLabel: '제작 기록 보기',
    },
  ],
};
