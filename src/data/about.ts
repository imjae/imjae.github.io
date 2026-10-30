import type { ImageMetadata } from 'astro';
import mountainPortrait from '../assets/about/mountain-portrait.jpg';

interface AboutContent {
  profile: Record<'name' | 'role' | 'interests' | 'summary' | 'email', string>;
  portrait: { image: ImageMetadata; alt: string };
}

// 공개할 소개와 연락처만 입력합니다. 빈 값은 [입력할 항목]으로 표시합니다.
export const about: AboutContent = {
  profile: {
    name: 'imjae',
    role: '게임 개발자 · Unity, C# · Unreal Engine, C++',
    interests: '게임플레이 · 그래픽스 · 개발 도구',
    summary: '게임을 만들고, 구현한 기능과\n문제를 해결한 과정을 기록합니다.',
    email: '',
  },
  portrait: {
    image: mountainPortrait,
    alt: '눈 덮인 산봉우리를 배경으로 서 있는 imjae',
  },
};
