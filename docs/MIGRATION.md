# Jekyll에서 게임 개발 블로그로 이관

2026년 10월 17일 `imjae/imjae.github.io`의 기존 구조를 확인했습니다. 기준 커밋은 `21c6f56`이며 Jekyll Persephone 테마, Webpack 4, Ruby 의존성, 글 두 개가 있었습니다. GitHub Pages는 `main` 루트의 Jekyll 빌드를 사용했습니다.

## 선택한 구조

Astro와 Markdown 콘텐츠 컬렉션으로 변경했습니다. 주제·태그·프로젝트·시리즈를 각각 관리하고 초안을 공개 대상에서 제외합니다. 로컬에 있는 Node.js를 사용해 Ruby 설치 없이 글 미리보기·빌드·검사를 실행할 수 있습니다.

서버나 계정·데이터베이스가 필요한 CMS는 추가하지 않았습니다. 일반 Markdown 편집기나 VS Code에서 글을 작성하고 기존 Git 이력으로 관리합니다. 사용자 소유의 GitHub.io 도메인은 유지합니다.

## 보존

- 원본 테마·설정·글·스크린샷·도움말: `legacy/jekyll/`.
- 기존 이미지와 자산 URL: `public/assets/`.
- 글 두 개의 원문: `legacy/jekyll/_posts/`에 보존하며 자동 검사로 파일 해시를 확인합니다. 공개된 글은 2026년 10월 17일 사용자 요청에 따라 문체를 수정했습니다. 2024년 작성 날짜와 글 주소는 유지합니다.
- 기존 `/blog`, `/archive`, `/book`, 두 개의 카테고리·날짜 기반 글 주소: 새 위치로 정적 리다이렉트합니다.

DCB의 다섯 시스템과 AI 협업은 구조 설명부터 공개하고, 아직 확인하지 않은 실제 플레이·영상·GPU 측정은 완료로 표현하지 않습니다. 이후 글을 같은 시리즈에 추가해 확장합니다.

## 배포

Pages Source를 GitHub Actions로 바꾸고 `.github/workflows/deploy.yml`이 `main`의 검증·빌드와 배포를 담당합니다. 공개 URL은 https://imjae.github.io/ 입니다. 이전 상태로 복귀해야 하면 원래 커밋을 기반으로 변경을 되돌리고 Pages의 빌드 소스를 함께 확인합니다. 이력을 덮어쓰는 force push는 필요하지 않습니다.
