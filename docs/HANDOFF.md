# 블로그 관리 인수인계

2026년 10월 17일 확인한 구성과 작업 상태다. Codex 로컬 프로젝트 **imjae.github.io**에 기존 블로그 저장소가 등록되어 있다. 이후 글과 기능이 바뀌면 실제 파일과 Git 이력을 먼저 확인한다.

## 새 작업에서 먼저 읽을 문서

| 문서 | 내용 |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | 저장소 작업 규칙, 공개 범위, 검증 절차 |
| [문구 작성 지침](EDITORIAL.md) | 해야 할 것·피할 표현·수정 예시·작성 후 확인 항목 |
| [글쓰기 가이드](WRITING.md) | 웹과 로컬에서 글 추가·수정·삭제, 메타데이터와 게시 방법 |
| [이관 기록](MIGRATION.md) | Jekyll 원본 보관, 이전 주소와 GitHub Pages 배포 구조 |

이 문서는 작업 상태를 설명한다. 문구 기준은 `EDITORIAL.md`, 작성 절차는 `WRITING.md`에서 관리한다. 사용자가 문구 지침을 추가하거나 수정해 달라고 하면 `EDITORIAL.md`에 반영한다.

## 블로그의 목적과 현재 구성

게임 개발과 학습 내용을 정리하는 기술 블로그다. DCB 포트폴리오를 포함하며, 이후 게임플레이·그래픽스·개발 도구·AI 사용·학습과 독서 기록을 계속 추가한다.

- 공개 주소: https://imjae.github.io/
- 저장소: https://github.com/imjae/imjae.github.io
- 글 목록: https://imjae.github.io/writing/
- 포트폴리오: https://imjae.github.io/portfolio/dcb/
- DCB 시리즈: https://imjae.github.io/series/dcb/
- 수정 모드: https://imjae.github.io/editor/
- 배포 상태: https://github.com/imjae/imjae.github.io/actions
- 기술 구성: Astro 7.4.0, Markdown, TypeScript, GitHub Pages. 현재 요구 환경은 Node.js 24 이상이다. 이후 버전은 `package.json`을 확인한다.

상단 메뉴의 **Home**은 첫 화면(`/`)으로 연결된다. 기존 `/about/`와 `/profile/`도 Home으로 연결된다. 첫 화면 소개는 “Unity와 C#으로 게임을 개발합니다. 구현한 기능, 공부한 내용, 오류를 수정한 과정을 정리합니다.”이다.

## 완료한 작업

1. Jekyll 블로그를 Astro와 Markdown 콘텐츠 컬렉션으로 이관했다. 원본 테마·글은 `legacy/jekyll/`, 기존 자산은 `public/assets/`에 보관했다.
2. Home, 글 목록과 본문 검색, 주제·태그, 포트폴리오와 DCB 시리즈를 구성했다. 코드 복사, Mermaid 흐름도, KaTeX 수식, RSS와 sitemap을 지원한다.
3. 포트폴리오에 한정됐던 소개를 기술 블로그 소개로 수정했다. 공개 글 8개의 제목·요약·본문을 다시 쓰고, 문구 지침을 만든 뒤 한 번 더 검토했다. 어색한 번역투와 모호한 설명을 다듬었다.
4. 뷰어·수정 모드 전환과 GitHub 파일 편집 연결을 추가했다. 글에서 수정 모드로 전환하면 해당 글을 검색한 상태로 열린다.
5. 글 삭제·초안 전환 후 포트폴리오와 시리즈에 깨진 글 링크가 남지 않도록 처리했다. 예전 Jekyll 글 주소는 공개 글이 있으면 해당 글로, 없으면 학습 메모 목록으로 연결된다.

## 현재 글 목록

확인 시점에는 공개 글 8개와 초안 1개가 있다. 아래 파일의 `draft` 값과 본문을 기준으로 관리한다. 공개 주소는 `/writing/<slug>/` 형식이다.

| 상태 | 글 | 원본 |
| --- | --- | --- |
| 공개 | IK 트레버설 구현: StepUp, Climb, SideStep | [ik-traversal.md](../content/articles/gameplay/ik-traversal.md) |
| 공개 | 몬스터 행동 DSL과 그룹 전투 구현 | [monster-combat.md](../content/articles/gameplay/monster-combat.md) |
| 공개 | 2D·3D 장비 파츠 조합 구현 | [modular-equipment.md](../content/articles/tools/modular-equipment.md) |
| 공개 | 물 캐시 재생과 메시 업로드 | [water-playback.md](../content/articles/graphics/water-playback.md) |
| 공개 | 불 이펙트의 레이어와 품질 단계 | [fire-vfx.md](../content/articles/graphics/fire-vfx.md) |
| 공개 | AI를 사용한 구현과 검증 과정 | [working-with-ai.md](../content/articles/ai/working-with-ai.md) |
| 공개 | 시지프 신화 독서 메모 | [the-myth-of-sisyphus.md](../content/articles/notes/the-myth-of-sisyphus.md) |
| 공개 | Jekyll 블로그 게시 테스트 | [welcome-to-jekyll.md](../content/articles/notes/welcome-to-jekyll.md) |
| 초안 | 물의 깊이와 지형 접점 확인 | [water-depth-study.md](../content/articles/graphics/water-depth-study.md) |

DCB 관련 공개 글 6개는 `series: dcb`로 묶여 있다. 2024년 글 두 개는 작성 날짜와 `slug`를 유지하며, 원문은 별도로 보관한다.

## 글을 쓸 때 유지할 기준

세부 기준과 예시는 [EDITORIAL.md](EDITORIAL.md)를 따른다. 작업을 이어갈 때 특히 확인할 내용은 다음과 같다.

- 제목에는 다룬 기능·문제·작업을 바로 적는다. 과장, 슬로건, 거창한 교훈과 사용자가 말하지 않은 감정을 넣지 않는다.
- 소개·안내는 짧은 `~합니다`체, 기술 글·메모는 `~했다 / ~한다`체를 기본으로 한다.
- 구현한 내용, 소스에서 확인한 구조, 실제 실행 결과와 계획을 구분한다. 자동 검사 통과를 모션 완성이나 전체 성능 개선으로 확대하지 않는다.
- 사용자 담당 범위는 기획, 시스템·도구·UI·셰이더·이펙트 구현과 AI를 사용한 구현·검증이다. 3D 모델·애니메이션 원본 제작은 포함하지 않는다. 재사용 텍스처 등은 글별로 구분한다.
- DCB의 전체 소스, 비공개 로그·세이브·로컬 경로를 복사하지 않는다. 공개 설명과 사용자가 허용한 자료만 사용한다.
- 문구를 다듬을 때 기술 내용과 원래 글의 의도를 유지한다. 남은 문제는 관련 내용 옆에 짧게 적는다.

## 뷰어·수정 모드의 범위

**뷰어 모드**는 글을 읽는 화면이다. **수정 모드**는 공개 글 검색과 GitHub 편집 연결 화면이다. 수정 모드 자체는 누구나 볼 수 있으며, 로그인 상태를 확인하는 관리자 화면은 아니다.

새 글 양식은 기본 정보와 본문 틀을 GitHub의 새 파일 화면에 전달한다. 새 글은 `draft: true`로 시작한다. 기존 글의 수정·삭제도 GitHub 화면에서 이어서 진행하고, 저장소 쓰기 권한이 있는 계정으로 로그인해 **Commit changes**로 확정한다. 블로그에서는 로그인 정보나 토큰을 받지 않는다.

초안은 **초안·전체 파일** 링크로 GitHub에서 관리한다. 공개 빌드의 페이지·목록·검색·RSS·sitemap과 수정 모드 목록에는 초안을 포함하지 않는다. 이 설정은 블로그 노출을 제어한다. 공개 GitHub 저장소에 커밋한 파일 자체를 비공개로 만들지는 않는다.

## 파일을 찾는 기준

| 위치 | 역할 |
| --- | --- |
| `content/articles/<topic>/` | 글 원본. 주제 ID는 `gameplay`, `graphics`, `tools`, `ai`, `notes` |
| `src/content.config.ts` | 글 메타데이터 검증 |
| `src/data/site.ts` | 사이트 소개, 주제와 대표 사례 정보 |
| `src/layouts/BaseLayout.astro` | 공통 레이아웃과 메뉴 |
| `src/pages/index.astro` | Home 소개 |
| `src/pages/editor.astro`, `src/lib/github-authoring.mjs` | 수정 모드와 GitHub 연결·새 글 양식 |
| `src/pages/portfolio/`, `src/pages/series/` | 포트폴리오와 시리즈 |
| `src/lib/legacy-redirect.ts` | 예전 Jekyll 주소의 이동 대상 결정 |
| `public/media/<slug>/` | 새 글에 사용할 공개 이미지의 저장 위치 |
| `scripts/new-post.mjs`, `scripts/check-site.mjs` | 로컬 초안 생성과 정적 사이트 검사 |
| `.github/workflows/deploy.yml` | `main`의 검증·빌드·배포 |

## 다음 작업의 시작·종료 절차

1. 지침을 읽고 `git status`와 최근 이력을 확인한다. 웹에서 수정했을 수 있으므로 원격 변경도 확인한다. 로컬 변경이 없을 때 `git pull --ff-only`로 동기화하고, 작업 중인 변경은 덮어쓰지 않는다.
2. 사용자 요청에 해당하는 글·화면과 연결된 파일을 확인한다. 새 글은 초안으로 만들며, 공개 여부는 사용자 요청에 맞춘다.
3. 글의 문제, 구현 방식, 확인한 결과와 남은 일을 적는다. 관련 글은 링크와 시리즈로 연결한다.
4. 사이트 내용이나 기능을 바꿨으면 `npm run verify`를 실행한다. 이 명령은 테스트, Astro 검사, 빌드, 내부 링크·공개 상태·이전 주소 검사를 포함한다. 화면 변경은 Home·긴 글·모바일 검색도 확인한다.
5. 게시 요청이 있는 변경은 의도한 파일만 커밋해 `main`에 push한다. GitHub Actions 배포 성공과 실제 페이지 반영을 확인한다.
6. 문서만 바꿨다면 문서 링크와 diff를 확인한다. 글 수나 기능 범위가 달라졌으면 이 인수인계의 관련 항목도 갱신한다.

로컬 명령의 전체 예시와 메타데이터 형식은 [WRITING.md](WRITING.md)에 있다. 새 환경에서는 `npm ci`, 초안 미리보기는 `npm run dev`, 공개 빌드 미리보기는 `npm run verify` 후 `npm run preview`를 사용한다.

## 검증 기록과 남은 작업

기능 구현 기준 커밋은 `3815835`다. 이 커밋의 [GitHub Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/38999538778)는 성공했다. 해당 작업에서 테스트 6개, 타입 검사, 빌드와 27개 HTML의 링크·공개 상태 검사를 통과했다. 모바일 모드 전환·검색·새 글 양식과 글별 수정 연결을 확인했다.

별도 복사본에서 공개 글 8개를 모두 제거한 뒤 빌드와 링크 검사를 실행했다. 포트폴리오·DCB 시리즈, 예전 주소의 학습 메모 목록 이동, 초안 제외를 확인했다. 실제 저장소의 글은 삭제하지 않았다.

남은 확인과 보완은 다음과 같다.

- GitHub 새 글·수정·삭제의 로그인 연결은 확인했다. 당시 브라우저는 미로그인 상태여서 로그인 후 최종 저장 단계는 시험하지 않았다. 실제 글 작업 때 저장과 배포까지 확인한다.
- DCB 글은 구현 구조와 기존 검사 결과를 정리한 상태다. 플레이 영상·캡처와 같은 조건의 성능 측정 자료는 아직 첨부하지 않았다. 각 글에 적힌 모션·반복 전투·조립 왕복 등의 미확인 항목을 완료로 바꾸지 않는다.
- `water-depth-study.md`는 작업 전 초안이다. 실제 조건과 결과를 작성하기 전에는 공개하지 않는다.

## 새 채팅에서 사용할 요청 예시

> AGENTS.md와 docs/HANDOFF.md를 읽고, docs/EDITORIAL.md와 docs/WRITING.md를 따라 블로그를 관리해줘. 이번 작업은 [추가하거나 수정할 내용]이야. 기존 글 주소와 작성 중인 변경을 유지하고, 확인한 범위까지 보고해줘.
