# 블로그 관리 인수인계

## 2026-10-23 화면에서 포트폴리오 문구 편집

사용자가 원본 파일을 편집하는 연결 대신 화면의 문구만 고치도록 요청했다. 지원용 페이지의 View·Edit를 화면 내 전환 버튼으로 바꾸고 소개·목차·구역·대표 사례·내 역할·기여 문구에 편집 지점을 연결했다. View는 미저장 미리보기이며 번호·주소·구조는 유지한다. 같은 식별자의 문구는 함께 갱신한다. 변경 취소와 같은 탭의 새로고침 복원을 제공하고 게시 내용이 바뀐 임시 편집은 명시적으로 복원하게 한다.

저장은 변경된 문구만 content/portfolio-copy JSON에 담아 GitHub 새 파일 화면에 자동 전달한다. 사용자는 파일 문법을 고치지 않고 Commit changes로 확정한다. 긴 변경은 URL 제한 안에서 저장 여러 개로 나누고 각각 저장하도록 안내한다. 문구별 최신 기록이 적용되며 주소·순서·미디어는 문구 설정으로 변경하지 못한다. 본문은 텍스트로만 렌더링하며 토큰은 수집하지 않는다. 아래의 앞선 원본 편집 연결 기록을 대체한다.

게시 대상만 분리한 npm run verify에서 테스트 51개·Astro 진단 0개·109개 경로 빌드·116개 HTML 검사를 통과했다. 실제 저장 형식의 임시 설정을 넣은 빌드에서 제목·줄바꿈·따옴표와 HTML처럼 보이는 문구의 텍스트 표시를 확인한 뒤 임시 파일을 제거하고 원래 문구로 최종 빌드·링크 검사를 통과했다. 임시 설정은 게시 대상에 포함하지 않았다. 브라우저에서 Edit 클릭과 직접 문구 입력, 같은 문구 동기화, View 미리보기, 새로고침 복원·취소와 게시 내용 변경 시 복원 선택, 목차 편집 중 이동 방지, 긴 변경 두 개 저장 분할과 600자 제한을 확인했다. 390px 모바일 편집·긴 글·AI 검색은 가로 넘침이 없고 Home 고정 12편과 검색 결과 1편을 유지했다. GitHub 저장 URL의 파일·내용 자동 채움은 확인했으며 사용자 계정으로 임시 문구를 공개 저장하지 않았다. 검증 자료는 .verification/portfolio-inline/에 보관한다.

## 2026-10-23 지원용 포트폴리오 문구 편집

지원용 포트폴리오 상단에 공통 View·Edit 전환을 추가했다. Edit는 소개·대표 사례·내 역할·AI 활용·기여·확인 범위가 있는 src/data/krafton-2027.ts의 GitHub 편집 화면을 새 탭으로 연다. /editor/#portfolio-copy에는 해당 문구와 페이지의 구역 제목·안내 원본 편집, 기존 영상·GIF 설정을 연결했다. 저장은 GitHub 로그인·쓰기 권한·Commit changes를 사용하며 사이트에서 토큰을 받지 않는다. 본문 내용·사례 순서·기존 주소는 유지했다. 기존 About·촬영·계획 문서와 문제 분석 초안 WIP는 별도 유지한다.

게시 대상만 분리한 npm run verify에서 테스트 46개·Astro 43개 파일 진단 0개·109개 경로 빌드·116개 HTML 검사를 통과했다. 브라우저에서 상단 View·Edit와 실제 문구 원본 URL, /editor의 문구·제목·영상 연결, Home 고정 12편, 긴 CLI 글의 기존 Edit 원본을 확인했다. 390px 모바일 포트폴리오·관리·검색과 820px 헤더의 가로 넘침이 없고 AI 분야의 'CLI 지연' 검색은 1편이다. 편집 URL은 GitHub 로그인 화면의 return_to까지 확인했으며 로그인 후 저장은 실행하지 않았다. 로그와 화면은 .verification/portfolio-copy-editor/에 보관한다.

공개 화면에서 더 좁은 사이드 패널의 메뉴 잘림을 발견해 모바일 메뉴 줄바꿈을 추가했다. 실제 본문 폭 308px에서 메뉴 다섯 개와 Edit가 영역 안에 표시되며 문서·스크롤 폭이 같다. 보완한 게시 대상의 npm run verify도 같은 46개 테스트와 116개 HTML 검사를 통과했다.

2026년 10월 17일 확인한 구성과 작업 상태다. Codex 로컬 프로젝트 **imjae.github.io**에 기존 블로그 저장소가 등록되어 있다. 이후 글과 기능이 바뀌면 실제 파일과 Git 이력을 먼저 확인한다.

## 새 작업에서 먼저 읽을 문서

| 문서 | 내용 |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | 저장소 작업 규칙, 공개 범위, 검증 절차 |
| [문구 작성 지침](EDITORIAL.md) | 해야 할 것·피할 표현·수정 예시·작성 후 확인 항목 |
| [글쓰기 가이드](WRITING.md) | 웹과 로컬에서 글 추가·수정·삭제, 메타데이터와 게시 방법 |
| [이관 기록](MIGRATION.md) | Jekyll 원본 보관, 이전 주소와 GitHub Pages 배포 구조 |
| [포트폴리오 개편 방안](PORTFOLIO-REVAMP-PLAN.md) | 지원용 포트폴리오로 재구성하는 페이지별 개편안, 글 템플릿, 증거 계획과 10월 23일까지의 순서 |

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

상단 메뉴의 **Home**은 첫 화면(`/`)으로 연결된다. 소개 페이지 `src/pages/about.astro`와 메뉴의 **About** 항목, `/profile/`→`/about/` 연결은 2026년 10월 19일 로컬에 만들었고 아직 게시하지 않았다. 게시 전까지 공개 사이트의 `/about/`과 `/profile/`은 Home으로 연결된다. 첫 화면 소개는 “Unity와 C#으로 게임을 개발합니다.”이다.

## 완료한 작업

1. Jekyll 블로그를 Astro와 Markdown 콘텐츠 컬렉션으로 이관했다. 원본 테마·글은 `legacy/jekyll/`, 기존 자산은 `public/assets/`에 보관했다.
2. Home, 글 목록과 본문 검색, 주제·태그, 포트폴리오와 DCB 시리즈를 구성했다. 코드 복사, Mermaid 흐름도, KaTeX 수식, RSS와 sitemap을 지원한다.
3. 포트폴리오에 한정됐던 소개를 기술 블로그 소개로 수정했다. 공개 글 8개의 제목·요약·본문을 다시 쓰고, 문구 지침을 만든 뒤 한 번 더 검토했다. 어색한 번역투와 모호한 설명을 다듬었다.
4. 뷰어·수정 모드 전환과 GitHub 파일 편집 연결을 추가했다. 글에서 수정 모드로 전환하면 해당 글을 검색한 상태로 열린다.
5. 글 삭제·초안 전환 후 포트폴리오와 시리즈에 깨진 글 링크가 남지 않도록 처리했다. 예전 Jekyll 글 주소는 공개 글이 있으면 해당 글로, 없으면 학습 메모 목록으로 연결된다.

## 현재 글 목록

확인 시점에는 공개 글 62개와 초안 1개가 있다. 아래 파일의 `draft` 값과 본문을 기준으로 관리한다. 공개 주소는 `/writing/<slug>/` 형식이다.

| 상태 | 글 | 원본 |
| --- | --- | --- |
| 공개 | IK 트레버설 구현: StepUp, Climb, SideStep | [ik-traversal.md](../content/articles/gameplay/ik-traversal.md) |
| 공개 | 몬스터 행동 DSL과 그룹 전투 구현 | [monster-combat.md](../content/articles/gameplay/monster-combat.md) |
| 공개 | 2D·3D 장비 파츠 조합 구현 | [modular-equipment.md](../content/articles/tools/modular-equipment.md) |
| 공개 | 물 캐시 재생과 메시 업로드 | [water-playback.md](../content/articles/graphics/water-playback.md) |
| 공개 | 불 이펙트의 레이어와 품질 단계 | [fire-vfx.md](../content/articles/graphics/fire-vfx.md) |
| 공개 | AI를 사용한 구현과 검증 과정 | [working-with-ai.md](../content/articles/ai/working-with-ai.md) |
| 공개 | 시지프 신화 독서 메모 | [the-myth-of-sisyphus.md](../content/articles/reading/the-myth-of-sisyphus.md) |
| 공개 | Jekyll 블로그 게시 테스트 | [welcome-to-jekyll.md](../content/articles/notes/welcome-to-jekyll.md) |
| 초안 | 물의 깊이와 지형 접점 확인 | [water-depth-study.md](../content/articles/graphics/water-depth-study.md) |
| 공개 | 자료구조 선택하기: 배열, List, Dictionary, HashSet, Queue, Stack | [data-structures-collections.md](../content/articles/notes/data-structures-collections.md) |
| 공개 | OpenGL 학습 기록: 정점 버퍼에서 텍스처 혼합까지 | [opengl-vertex-texture-pipeline.md](../content/articles/graphics/opengl-vertex-texture-pipeline.md) |
| 공개 | 동적 배열과 List의 확장·삭제 구현 | [dynamic-array-list-growth-removal.md](../content/articles/notes/dynamic-array-list-growth-removal.md) |
| 공개 | Spine 마스크의 머티리얼 복제로 배칭이 나뉜 문제 | [spine-mask-material-batching.md](../content/articles/graphics/spine-mask-material-batching.md) |
| 공개 | Azure DevOps로 Addressables 콘텐츠를 빌드·배포한 과정 | [azure-devops-content-build-deploy.md](../content/articles/tools/azure-devops-content-build-deploy.md) |
| 공개 | Unity CI에서 라이선스 메시지와 패키지 다운로드 실패를 구분한 과정 | [unity-ci-package-download-failure.md](../content/articles/tools/unity-ci-package-download-failure.md) |
| 공개 | 태그를 고정한 다중 저장소 checkout으로 빌드 입력 맞추기 | [tag-pinned-multi-repo-checkout.md](../content/articles/tools/tag-pinned-multi-repo-checkout.md) |
| 공개 | 오브젝트 풀의 생성·대여·반환과 중복 반환 방지 | [object-pool-lease-return.md](../content/articles/tools/object-pool-lease-return.md) |
| 공개 | 벡터의 길이·정규화·내적·외적을 게임 판정에 쓰기 | [vector-length-dot-cross.md](../content/articles/math/vector-length-dot-cross.md) |
| 공개 | 지게 운반의 이동 속도와 스태미너 계산 구조 | [jige-carry-burden.md](../content/articles/gameplay/jige-carry-burden.md) |
| 공개 | Git 워크트리로 AI 작업을 병행하고 통합한 과정 | [parallel-ai-worktrees.md](../content/articles/ai/parallel-ai-worktrees.md) |
| 공개 | API 호출을 Codex CLI로 바꾼 로컬 AI 하네스 | [cli-agent-harness.md](../content/articles/ai/cli-agent-harness.md) |

DCB 관련 공개 글 8개는 `series: dcb`로 묶여 있다. 하네스 글은 `project: imjaess`이며 DCB 시리즈에 포함하지 않는다. 2024년 글 두 개는 작성 날짜와 `slug`를 유지하며, 원문은 별도로 보관한다.

## 10월 17일 추가 글 검토와 공개

사용자 요청에 따라 지게 운반, 워크트리 병행 작업, CLI 하네스 초안의 문구를 다시 검토하고 공개 상태로 전환했다. 반복과 대화체 표현을 줄이고 CLI의 `unknown`이 작업 전체 상태가 아닌 명령 검증 항목임을 명확히 했다. 세 글의 날짜와 slug는 유지했다.

지게 글은 계산 구조와 카탈로그 설정을 구분한다. 10월 17일 확인한 적재 속도·소모·회복 곡선은 모두 배율 1이다. 과거 문서의 기본 곡선을 현재 적용 결과로 사용하지 않는다. Unity 검사와 게임 플레이를 이번에 다시 실행한 것은 아니다.

워크트리 글은 10월 1일 Deluge의 불·급류 포말·SideStep 작업 세션과 Git 통합 이력, StepUp 실험 기록을 대조했다. 과거 실행과 현재 DCB 운영 규칙을 구분하며, 16개는 과거 누적 워크트리 수다. 작업 시간 절감률은 측정하지 않았다.

하네스 글은 5월 21일 API→CLI 전환 이력과 현재 소스를 대조했다. 최종 응답 파일 부재 시 표준출력 대체, 판정 키워드 해석, 넓은 sandbox 기본값과 실계정 CLI 미재검증 범위를 유지한다. 인증 정보, 로컬 DB와 원본 로그는 옮기지 않았다.

게시 대상은 세 글과 인수인계 문서다. 별도로 작성 중인 `docs/DCB-WRITING-PLAN.md`는 로컬 변경으로 유지한다.

## 몬스터 전투 글 보완

`monster-combat.md`의 기존 제목·날짜·slug·공개 설정을 유지하고 본문을 보완했다. DCB의 스폰·DSL 실행기·Samurai 정의·그룹 디렉터·자원 상태·밸런스 카탈로그와 7월 28일, 8월 9~14일 수정 이력을 대조했다. 상태 전환의 이동 공백, 포위 기준축과 슬롯 갱신, 토큰·클레임의 배정·반납 문제를 원인과 수정 방식으로 설명한다.

일반 자원 배정의 상한과 `UpdateBackstop`의 강제 부여는 구분한다. 현재 강제 부여 경로에는 일반 상한 재검사가 없으므로 모든 상황에서 동시 공격자 수를 보장한다고 쓰지 않는다. 몬스터 검사 코드의 내용과 10월 16일 선택 검사에 해당 항목이 없다는 점을 확인했으며, 이번에 Unity 컴파일·EditMode·실제 전투를 실행하지 않았다. DCB 파일은 수정하지 않았고 원본 소스·로그·개인 데이터와 새 미승인 미디어를 옮기지 않았다.

`npm run verify`의 테스트 6개·Astro 검사·빌드·30개 HTML 검사를 통과했다. Home, 긴 본문의 흐름도·표와 모바일 본문 검색을 확인했다. 모바일에서 긴 표·코드 때문에 본문 열이 넓어지는 문제가 있어 글 템플릿의 `.article-main`에 `min-width: 0`을 추가했다. 수정 후 몬스터 글과 기존 긴 하네스 글에서 페이지 가로 넘침이 없는 것을 확인했다.

몬스터 본문과 글 템플릿의 모바일 너비 수정은 10월 17일 사용자 요청으로 `501e54d`에서 게시했다. [해당 Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39011251631)가 성공했고 공개 페이지에서 보완된 본문과 실행 미검증 문구를 확인했다. 작성 계획 문서의 기존 로컬 변경은 유지한다.

## 장비 글 보완과 전체 기술 학습 목록

`modular-equipment.md`는 기존 제목·날짜·slug·공개 설정을 유지해 보완했다. 모루 호출→편집용 복사본→조립 리그→표현별 조립→저장·복원을 추적했다. 8월 3일 프리뷰 효과 비활성화·복원, 4일 bounds 필터, 11일 3D 스케일 보정 제거 이력을 현재 코드와 대조했다. 현재 코드의 리그 선추적과 해제 경로, 기존 장비 검사 코드의 범위도 설명한다. Unity 컴파일·EditMode·프리뷰 렌더·전체 조립 왕복은 이번에 실행하지 않았다. 후속 사용자 요청으로 장비 파일만 `ac795ae`에 커밋해 main에 push했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39013140265)가 같은 커밋에서 성공했고 [공개 본문](https://imjae.github.io/writing/modular-equipment/)의 보완 내용과 실행 미검증 문구를 확인했다.

사용자가 블로그만으로 프로젝트 기술을 공부할 수 있는 글 구성을 요청했다. 로컬 [학습 목록](TECH-STUDY-ROADMAP.md)을 21개 영역·189개 글 후보로 정리했다. DCB 관련 155개, imjaess 12개, 블로그 8개, 후속 기획 4개, LearnOpenGL 10개다. 후속 요청에 따라 C# 문법 입문을 제외하고 A 영역을 자료구조 9개로 바꿨다. 언어 기능은 해당 프로젝트 개념에 필요한 곳에서 설명한다. 각 글은 기초 정의→독립 예제→프로젝트 적용→실습·풀이→검증 범위로 작성한다. 패키지 설치만 확인된 기술과 기획 기능은 현재 구현 성과로 다루지 않는다.

자료구조 첫 글은 여섯 컬렉션의 내부 동작·선택·비용, 실행 예제, 실습 네 개와 풀이·복습을 포함한다. 본문에서 추출한 완성 코드 네 개를 .NET SDK 10.0.301에서 경고를 오류로 처리해 각각 컴파일·실행했고 예상 출력과 일치했다. Unity의 실행 결과와 구분한다.

그래픽스에는 별도 OpenGL 글을 추가했다. 공개 `imjae/LearnOpenGL`의 main과 로컬 `bc9d85f`가 같음을 확인하고 정점·인덱스·속성·GLSL·두 텍스처·uniform 경로와 이력을 읽었다. 현재 `shader.fs`의 `new vec2` 문제, RGB 내부 형식과 RGBA 입력, mipmap 생성과 축소 필터 차이를 설명한다. 블로그에만 수정 후보를 적었으며 C++·GLSL 컴파일·GPU 재생은 하지 않았다.

두 글의 첫 초안을 작성했을 당시 `npm run verify`에서 테스트 6개·Astro 검사·빌드·30개 HTML의 링크·공개 상태·예전 주소 검사를 통과했다. 당시 두 초안이 공개 페이지·검색·RSS·sitemap에서 제외됨을 검사했다. Home, 긴 자료구조 본문·코드, OpenGL 표·흐름도·수식과 모바일 본문 검색을 확인했다. 두 글의 모바일 문서 폭이 화면을 넘지 않았다. 학습 목록의 ID 189개가 중복 없이 이어지는지와 인수인계·목록의 로컬 문서 링크도 확인했다.

이번 후속 작업의 DCB·imjaess·LearnOpenGL은 읽기 전용이었다. 기존 로컬 `docs/DCB-WRITING-PLAN.md`는 수정하지 않았다. 학습 목록·인수인계는 로컬 검토 상태로 관리한다.

## 자료구조·OpenGL 게시와 동적 배열 후속 글

후속 사용자 요청으로 자료구조·OpenGL 문구를 재검토했다. 분할 상환 분석과 무작위 입력의 평균을 구분하고, Big O 정의와 해시 동등성 설명을 다듬었다. OpenGL은 현재 구현 범위와 남은 GPU 검증을 설명하는 문장으로 정리했다. 기존 제목·날짜·slug를 유지해 두 파일만 `6e5d39f`에서 게시했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39014501899)는 같은 커밋에서 성공했고 실제 공개 페이지 두 개의 반영을 확인했다. 자료구조 완성 코드 네 개도 다시 실행해 출력을 대조했다.

다음 A02 글 `dynamic-array-list-growth-removal.md`는 `draft: true`인 로컬 초안이다. Count·Capacity 불변식, 두 배 확장과 복사, RemoveAt 이동, 조건 삭제의 read·write 압축, Clear·축소·참조 수명을 설명한다. 직접 작성한 IntBuffer, 실제 List와 삭제·확장 비용을 비교하는 완성 프로그램 네 개와 실습 네 개·풀이를 넣었다.

네 프로그램은 .NET SDK 10.0.301에서 경고를 오류로 처리해 컴파일·실행했고 본문 출력과 일치했다. 본문에서 추출한 IntBuffer를 빈 목록·잘못된 인덱스·0 값·모든/일부/없는 조건 삭제·복사본 독립성·Clear 재사용으로 확인했다. 고정 시드의 연산 5,000회를 List의 결과와 매번 대조했다. 복사·이동 수는 알고리즘 관찰용이며 실행 시간·Unity 플레이·성능 측정으로 해석하지 않는다.

게시 전과 후속 초안 작성 후 `npm run verify`의 테스트 6개·Astro 검사·빌드·32개 HTML 검사를 통과했다. Home, 자료구조와 동적 배열의 긴 본문·코드, 공개 빌드의 모바일 OpenGL 검색과 로컬 동적 배열 검색을 확인했다. 동적 배열 초안의 모바일 문서 폭은 화면 폭을 넘지 않았고 공개 페이지·검색·RSS·sitemap에서 제외된다. A02 초안·학습 목록·이 인수인계는 로컬에 남겼으며 기존 작성 계획 문서는 변경하지 않았다.

## 노션에서 가져올 글 후보

10월 17일 Notion 연결 후 [노션 이전 후보 목록](NOTION-MIGRATION-CANDIDATES.md)을 작성했다. 노션 페이지·색인 107건 중 기술 자료를 중심으로 기존 공개 글 13개·초안 2개와 비교했고, 집필 후보 37개를 P1 13개·P2 22개·P3 2개로 나눴다. 후보별 원문 링크, 기존 글과의 중복, 기술 학습 목록 ID, 보완·실행 확인 항목을 기록했다. 대부분 기존 189개 학습 후보의 자료이며 두 목록의 수를 합산하지 않는다.

이번 작업에서는 노션·공개 글·게시 상태를 바꾸지 않았다. 이미지·첨부와 하네스 DB의 전체 행은 미확인이고 긴 강의 노트는 필요한 부분 중심으로 읽었다. 과거 노트에 적힌 결과를 현재 실행 검증으로 확대하지 않는다. Spine 알파 설명 오류, 회전 방향의 일반화, CI 다운로드 실패의 원인 추정과 접속정보가 들어 있는 서버 노트의 이전 범위는 후보 문서에 따로 적었다. 기존 자료구조 학습 순서는 유지한다.

## Spine 마스크 배칭 글

노션 이전 후보 N13을 [Spine 마스크 배칭 글](../content/articles/graphics/spine-mask-material-batching.md)로 작성했다. 처음에는 `draft: true`였고 프로젝트·DCB 시리즈를 지정하지 않았다. 노션의 원인 설명과 InsideMask 재질 준비→자동 Mask Interaction None→CustomMaterialOverride 적용·해제 과정을 재구성했다. 원문의 UI 이미지는 옮기지 않았다.

공개 Spine 4.2 소스의 재질 생성·교체 API·셰이더·Inspector와 공식 Unity 문서를 대조했다. 확인한 소스 기준은 `e7dc1435fa4a0083ab431f1b28e083c14a1f5c68`이다. 당시 설치 버전이 4.2였다고 단정하지 않는다. Inspector의 사전 마스크 재질 준비 경로가 있어 현재 버전에서 과거 문제가 재현되지 않을 가능성도 적었다. 4.3의 컴포넌트 분리·MaskInteraction 변경을 구분한다.

개념·참조 그림, Unity 컴포넌트 두 개, 콘솔 참조 모델과 실습 네 개·풀이를 넣었다. 콘솔 완성 코드는 본문에서 추출해 .NET SDK 10.0.301에서 경고를 오류로 처리해 실행했고 False·True·False 출력과 일치했다. Unity 컴포넌트의 컴파일·마스크 화면·Frame Debugger·재사용·성능 비교는 미실행이다. 과거 노트에 전후 수치와 원본 구현이 없어 이를 만들어 넣지 않았다.

`npm run verify`의 테스트 6개·Astro 검사·빌드·32개 HTML 검사를 통과했다. Home과 긴 초안의 표·코드·Mermaid, 390px 모바일 본문과 로컬 검색을 확인했다. 모바일 본문은 화면 폭을 넘지 않고 긴 코드는 내부 스크롤을 사용한다. 공개 빌드의 모바일 Spine 검색은 0개였고 초안 페이지·링크·검색·RSS·sitemap 제외 검사도 통과했다. 임시 preview 서버와 탭은 종료했으며 기존 개발 서버와 초안 미리보기는 유지했다. 커밋·push·게시하지 않았다.

후속 사용자 요청으로 문구와 검증 범위를 다시 검토하고 Spine 파일만 `5c0a35a`에 커밋해 main에 push했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39017463004)가 같은 커밋에서 성공했고 실제 공개 페이지 200 응답·제목·수정된 끝 문장·Unity 미검증 표기를 확인했다. 공개 빌드의 Home·긴 본문·모바일 검색도 확인했다. 제목·날짜·slug와 미실행 범위는 유지한다. 초안 때의 기록과 현재 공개 상태를 구분한다.

## Azure DevOps 콘텐츠 빌드·배포 글

[Azure DevOps 글](../content/articles/tools/azure-devops-content-build-deploy.md)은 노션의 CI/CD 구현·초기 DevOps·버전 순서·번들 보존·저장소 권한 오류·시간 초과 기록 6개를 바탕으로 작성했다. 처음에는 `draft: true`였고 DCB 프로젝트·시리즈를 지정하지 않았다. 파일 경로의 실행 머신, 업로드 작업의 OS, 다중 저장소 checkout, 종료 옵션과 콜드 빌드, 스크립트·리소스 버전의 의미를 설명한다. Blob 업로드와 CDN·Player 로드 완료도 구분한다.

Unity C# 진입점·파일 목록 생성/검사 PowerShell·두 단계 YAML과 실습 5개·풀이를 새로 작성했다. 원본 조직명·저장소명·연결명·머신 정보·자격증명과 업무 YAML·로그는 옮기지 않았다. 예제의 업로드는 기본값 false인 후보 경로이며 실제 파이프라인과 계정은 변경하지 않았다.

본문의 PowerShell 두 개를 추출해 PowerShell 7.6.5에서 정상 출력과 같은 길이의 내용 변조·카탈로그 누락·파일 추가·이름 변경·환경 및 태그 불일치 거부를 확인했다(정상 1개+실패 조건 6개). YAML 일반 파싱·내장 PowerShell 세 개의 구문 검사를 수행했다. Azure 템플릿 확장·서비스 연결·실제 아티팩트 전달·Unity 컴파일·번들 생성·Blob 업로드·CDN·Player 로딩·롤백은 미실행이다.

초안 작성 후 `npm run verify`의 테스트 6개·Astro 검사·빌드·33개 HTML 검사를 통과했다. Home·긴 본문·Mermaid·모바일 검색과 가로 넘침을 확인했다. 공개 빌드의 Azure 검색은 0개이며 페이지·링크·검색·RSS·sitemap에서 초안이 제외된다. Azure 글과 계획·인수인계의 변경은 로컬에 남기고 Spine 글만 게시했다.

후속 사용자 요청으로 문구·예제·검증 범위를 재검토했다. 에이전트 설명과 마지막 문장을 다듬고 Azure 글만 `92ac047`에 커밋해 main에 push했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39018207328)가 같은 커밋에서 성공했다. 실제 공개 페이지의 200 응답·제목·수정 문구·Unity 미검증 표기를 확인했다. PowerShell 예제의 정상 1개·실패 조건 6개도 다시 통과했다. Home·긴 본문·공개 빌드의 모바일 Azure 검색 1개를 확인했다. 기존 날짜·slug와 Unity·Azure 실행 미검증 범위는 유지한다.

## Unity CI 패키지 다운로드 실패 분석 글

노션 후보 N12를 [Unity CI 패키지 다운로드 실패 글](../content/articles/tools/unity-ci-package-download-failure.md)로 작성했다. 처음에는 `draft: true`였고 DCB 프로젝트·시리즈를 지정하지 않았다. 노션 「어드레서블 버전」의 설명과 텍스트 로그를 확인했다. 라이선스 메시지에 집중한 초기 오해, 빌드 머신의 Editor 로그로 조사 범위를 넓힌 과정, 의도하지 않은 Addressables 1.21.18→1.21.19 변경과 이전 버전 복구를 설명한다.

관찰된 의존성 해석 실패·연결 시간 초과 두 개와 당시 복원 후 해결 기록을 구분한다. 1.21.19 코드 결함이나 당시 네트워크·캐시 상태를 원인으로 확정하지 않는다. 복원 후 전체 로그·원본 manifest/lock·통제 실험은 이번에 확보하지 않았다. 비공개 프로젝트명·머신 정보·접속정보·전체 로그는 옮기지 않았다.

개념 3개, 가상 자료 생성·신호 수집·직접 의존성 비교 PowerShell 3개, 실습 5개·풀이와 설명 그림을 새로 작성했다. 본문에서 코드를 추출해 PowerShell 7.6.5에서 실행했다. 실패·같은 라이선스 메시지가 있는 성공·자료 부족·로그 파일 누락·여러 종료 표식·CRLF/CR 줄바꿈·버전 변경·추가/삭제·잘못된 JSON과 요청 값·기존 폴더 보호 등 19개 항목을 확인했다. 분석 도구 종료 코드와 가상 Unity 종료 표식도 구분했다. 실제 Unity·Azure·UPM 다운로드·네트워크·콜드/웜 실험은 미실행이다.

`npm run verify`의 테스트 6개·Astro 검사·빌드·34개 HTML 검사를 통과했다. Home·긴 본문·Mermaid·390px 모바일 본문과 검색을 확인했다. 모바일 문서 폭은 375px이고 긴 코드는 내부 스크롤을 사용한다. 공개 빌드에서 CI 초안의 고유 본문 검색은 0개이며 페이지·링크·검색·RSS·sitemap 제외 검사도 통과했다. 새 초안과 계획·인수인계는 로컬에 남기고 Azure 글만 게시했다.

후속 사용자 요청으로 문구·검증 범위를 다시 검토했다. lock 변경 기록의 한계와 복구 결과 해석 문장을 다듬고 Unity CI 글만 `6475fb9`에 커밋해 main에 push했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39018637665)가 같은 커밋에서 성공했다. 실제 공개 페이지의 200 응답·제목·수정 문구·원인 미확인 표기를 확인했다. PowerShell 19개 항목도 다시 통과했다. Home·긴 본문·공개 빌드의 모바일 고유 본문 검색 1개를 확인했다. 날짜·slug와 실제 Unity·Azure 재현 미실행 범위는 유지한다.

## 태그를 고정한 다중 저장소 checkout 글

노션 후보 N11을 [다중 저장소 checkout 글](../content/articles/tools/tag-pinned-multi-repo-checkout.md)로 작성했다. 처음에는 `draft: true`였고 DCB 프로젝트·시리즈를 지정하지 않았다. 노션 「서브모듈 적용」과 「Azure DevOps CI/CD 구현」의 설명·코드 조각을 대조했다. CmdLine의 태그 fetch 접근 권한 오류와 저장소 리소스·endpoint·태그 ref·checkout 경로 선언으로 전환한 과정을 설명한다. 당시 빌더 master HEAD와 콘텐츠 태그를 선택한 기록을 두 커밋 전체 고정으로 확대하지 않는다. 서브모듈 다운로드 수정이나 원본 .gitmodules 제거를 완료했다고도 쓰지 않는다.

서브모듈/다중 checkout·태그/주석 태그/커밋/HEAD·선언 항목·경로의 개념, 로컬 실습용 PowerShell 3개와 Azure YAML 1개, 실습 5개·풀이를 새로 작성했다. 새 검사는 빌더·콘텐츠 HEAD와 별도 예상 커밋, 콘텐츠 태그 대상 커밋, 루트 경로와 작업 트리를 대조한다. 형제 폴더 배치는 새 예제의 선택이며 Unity 자산 경로 연결·LFS·전체 환경 재현성을 보장하지 않는다. 원본 조직명·저장소명·서비스 연결명·머신 경로·전체 YAML은 공개하지 않았다.

본문에서 코드를 추출해 Windows의 PowerShell 7.6.5·Git 2.48.1에서 실행했다. 로컬 bare 원격·작업 복사본 두 개를 만들고 정상 출력·JSON 기록·태그/같은 이름 브랜치 구분·detached HEAD·주석 태그·누락·콘텐츠/빌더 커밋 불일치·태그 이동·추적/미추적 변경·하위 폴더 오지정·기존 출력 보호·예시 0 값 거부 등 19개 항목을 확인했다. YAML 일반 파싱과 내장 PowerShell 1개의 구문도 확인했다. Azure 템플릿 확장·서비스 연결·실제 다중 checkout·Linux 실행·Unity 자산 연결/빌드/런타임 로드는 미실행이다.

`npm run verify`의 테스트 6개·Astro 검사·빌드·35개 HTML 검사를 통과했다. Home·긴 본문·Mermaid·코드 표시와 390px 모바일 검색을 확인했다. 모바일 문서 폭은 375px이고 긴 코드는 내부 스크롤을 사용한다. 초안 고유 본문의 로컬 검색은 1개, 공개 빌드 검색은 0개이며 페이지·링크·검색·RSS·sitemap 제외 검사도 통과했다. 새 초안과 계획·인수인계는 로컬에 남겼으며 이번 게시 커밋에는 Unity CI 글만 포함했다.

후속 사용자 요청으로 문구와 검증 범위를 다시 검토했다. 서브모듈 기록의 해석과 마지막 문장을 다듬고 checkout 파일만 `76d2e9e`에 커밋해 main에 push했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39019287398)가 같은 커밋에서 성공했다. 실제 공개 페이지의 200 응답·제목·수정 문구·Azure 미실행 표기를 확인했다. 로컬 Git 검사 19개 항목도 다시 통과했다. Home·긴 본문·공개 빌드 모바일 고유 본문 검색 1개를 확인했다. 날짜·slug와 클라우드·Unity 미검증 범위는 유지한다.

## 오브젝트 풀 글

노션 후보 N01을 [오브젝트 풀 글](../content/articles/tools/object-pool-lease-return.md)로 작성했다. 처음에는 `draft: true`였고 `kind: note`이며 프로젝트·시리즈를 지정하지 않았다. 노션 「Object Pool」의 Dictionary/Queue·사전 생성·OnDisable 반환·초기 개수 검사·CancelInvoke 코드 조각을 대조했다. 원문은 과거 학습 노트이며 특정 게임의 버그 수정 완료·성능 개선 기록으로 쓰지 않는다. Inspector 이미지는 확인·이전하지 않았고 DCB의 현재 구현과도 혼합하지 않는다.

풀의 소유 상태와 활성 상태, 소속·슬롯·대여 번호, Returning 상태의 정리 순서, 사전 생성·동시 사용 상한·보관 상한을 설명한다. 같은 참조의 중복 큐 모델, 새 고정 용량 LeasePool과 실행 프로그램, Unity 연결 컴포넌트 두 개, 실습 5개·풀이와 설명 그림을 새로 작성했다. 새 예제는 부족하면 거부하고 정리 예외가 난 슬롯은 Retired로 남긴다. 자동 확장·보충·외부 Destroy 처리·다중 스레드·실제 효과 초기화·성능 측정은 구현 또는 검증하지 않았다.

본문의 순수 C# 세 블록을 추출해 .NET SDK 10.0.301에서 경고를 오류로 처리해 컴파일·실행했고 예상 출력과 일치했다. 별도 검사 32개 항목에서 기본/이전/다른 풀 표식·상한·중복 참조 생성·상태 초기화·재진입·정리 예외·종료를 확인했다. 고정 시드의 연산 1,000회에서 개수와 동시 대여 참조의 유일성도 대조했다. Unity 연결 코드의 컴파일·Play Mode·부모 비활성화·씬 종료·외부 파괴·GC/프레임 측정은 미실행이다.

`npm run verify`의 테스트 6개·Astro 검사·빌드·36개 HTML 검사를 통과했다. Home·긴 본문·Mermaid와 390px 모바일 본문·검색을 확인했다. 모바일 문서 폭은 375px이고 긴 코드는 내부 스크롤을 사용한다. 초안 고유 본문의 로컬 검색은 1개·공개 빌드 검색은 0개이며 페이지·링크·검색·RSS·sitemap 제외 검사도 통과했다. 새 초안·계획·인수인계는 로컬에 남기고 checkout 글만 게시했다.

후속 사용자 요청으로 문구와 검증 범위를 다시 검토했다. 원문의 학습 노트 성격과 새 고정 용량 정책 문장을 다듬고 풀 글만 `d635da1`에 커밋해 main에 push했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39020050039)가 같은 커밋에서 성공했다. 실제 공개 페이지의 200 응답·제목·수정 문구·Unity 미실행 표기를 확인했다. 순수 C# 예제와 32개 검사·고정 시드 연산 1,000회도 다시 통과했다. Home·긴 본문·공개 빌드 모바일 고유 본문 검색 1개를 확인했다. 날짜·slug와 Unity·성능 미검증 범위는 유지한다.

## 벡터 길이·정규화·내적·외적 초안

노션 후보 N02를 처음에는 [벡터 초안](../content/articles/math/vector-length-dot-cross.md)으로 작성했다. 당시 `draft: true`, `kind: note`이며 프로젝트·시리즈를 지정하지 않았다. 「벡터 수학」·「벡터의 내적과 외적」·「물체의 수학 3: 벡터의 내적과 외적」 세 노트의 텍스트와 코드 조각을 대조했다. 원문 이미지와 책·강의의 정확한 원 출처는 이번에 확인하지 못했으며 그림·긴 설명을 복제하지 않았다.

위치/변위/방향·길이 제곱·영벡터·정규화·내적과 투영·시야 반각·수평/3D 판정·외적과 법선·퇴화·좌우 축 규약을 설명한다. 원문의 내적 투영 길이 설명에 축 정규화 조건을 보완하고, 외적 0에서 영벡터 예외와 평행 판정의 크기 영향을 구분했다. 외적이 항상 더 빠르다는 성능 단정은 사용하지 않는다. 쿼터니언·행렬 전체와 실제 DCB 구현 검증은 포함하지 않았다.

System.Numerics.Vector3 기반 계산 함수와 실행 프로그램 두 블록, 실습 6개·풀이를 새로 작성했다. 본문에서 코드를 추출해 .NET SDK 10.0.301에서 경고를 오류로 처리해 컴파일·실행했고 출력이 일치했다. 별도 수치 검사 49개 항목에서 영벡터·작은/큰 벡터·오류 입력·투영축 크기/부호·시야 거리/각도/높이·퇴화 법선·순서를 확인했다. 고정 시드 벡터 쌍 1,000개의 단위 길이·수직성·외적 반교환성도 확인했다. Unity 컴파일·장면·작은 값 처리의 동일성·DCB 전투/IK/카메라·GPU·성능은 미검증이다.

Matplotlib로 새 좌표 그림 두 개를 `public/media/vector-length-dot-cross/`의 SVG로 만들고 PNG 미리보기로 검토했다. 길이 3-4-5 그림과 XZ 반지름 5/전체 시야각 90°의 P·Q 그림이다. 설명용 수학 그림이며 게임 캡처나 원문 그림을 옮긴 것이 아니다. 새 초안과 이 그림은 로컬 작업 상태로 유지한다.

벡터 초안 추가 후 `npm run verify`를 통과했다. 테스트 6개, Astro 검사 24개 파일의 오류·경고·힌트 0개, 빌드와 37개 HTML의 링크·공개 상태·예전 주소를 확인했다. 브라우저에서 Home, 긴 글, 모바일 검색을 검토했고 초안의 그림 2개가 로드되며 수식 24개의 렌더링 오류가 없었다. 390px 화면에서 문서 폭은 375px였고 긴 코드는 블록 안에서 가로 스크롤된다. `VectorStudy` 검색은 개발 미리보기에서 1건, 공개 빌드에서 0건이었다. 초안의 페이지·링크·검색·RSS·사이트맵 제외도 확인했다. 이번 공개 커밋은 오브젝트 풀 글만 포함하며 벡터 초안·그림과 문서 변경은 로컬에 남겼다.

## 노션 후보 37개 순차 집필과 게시

사용자의 “아까 리스트업한 글 차례로 쭉 게시” 요청을 직전 노션 이전 후보 37개 기준으로 진행했다. 기존 5개 공개 사례를 유지하고 N02 벡터와 동적 배열을 `14be2a0`에서 게시했다. [Actions](https://github.com/imjae/imjae.github.io/actions/runs/39020668426)가 같은 SHA에서 성공했으며 두 실제 페이지의 200 응답·본문 반영을 확인했다.

남은 31개 후보를 새 글로 작성하고 [공개 학습 목차](../content/articles/notes/notion-study-reading-order.md)로 연결했다. N14 환경 준비와 N15 행렬의 선행 관계도 목차에서 안내한다. 이로써 공개 글은 52개이며 물 깊이 글 1개만 초안으로 남는다. 189개 전체 기술 목록과 보류 자료를 모두 게시한 것은 아니다.

| 상태 | 추가 글 | 원본 |
| --- | --- | --- |
| 공개 | 화면 좌표를 월드로, 월드 위치를 UI로 옮기기 | [unity-screen-world-ui-coordinates.md](../content/articles/tools/unity-screen-world-ui-coordinates.md) |
| 공개 | VBO·VAO·EBO와 정점 속성의 stride·offset | [opengl-vertex-layout-stride-offset.md](../content/articles/graphics/opengl-vertex-layout-stride-offset.md) |
| 공개 | GLSL 컴파일·링크 오류와 uniform 갱신 | [opengl-shader-errors-uniforms.md](../content/articles/graphics/opengl-shader-errors-uniforms.md) |
| 공개 | 텍스처 객체·텍스처 유닛·sampler와 이미지 포맷 | [opengl-texture-units-formats.md](../content/articles/graphics/opengl-texture-units-formats.md) |
| 공개 | 텍스처 반복·필터링·mipmap을 같은 조건에서 비교하기 | [opengl-filtering-mipmaps.md](../content/articles/graphics/opengl-filtering-mipmaps.md) |
| 공개 | Local·World·View·Clip·NDC·Screen 좌표를 구분하기 | [local-world-clip-ndc-screen.md](../content/articles/math/local-world-clip-ndc-screen.md) |
| 공개 | 직접 참조·Resources·AssetBundle·Addressables 선택하기 | [unity-asset-loading-choices.md](../content/articles/tools/unity-asset-loading-choices.md) |
| 공개 | GLFW·GLAD·컨텍스트와 첫 렌더 루프 만들기 | [opengl-context-render-loop.md](../content/articles/graphics/opengl-context-render-loop.md) |
| 공개 | 이동·회전·크기 행렬과 변환 순서 직접 계산하기 | [matrix-transform-order.md](../content/articles/math/matrix-transform-order.md) |
| 공개 | 카메라의 기준축과 LookAt 행렬 만들기 | [camera-basis-lookat.md](../content/articles/math/camera-basis-lookat.md) |
| 공개 | FSM의 Enter·Execute·Exit와 전이·중단 규칙 | [fsm-transition-interruption.md](../content/articles/gameplay/fsm-transition-interruption.md) |
| 공개 | Behavior Tree의 Sequence·Selector·Running과 중단 | [behavior-tree-running-abort.md](../content/articles/gameplay/behavior-tree-running-abort.md) |
| 공개 | 캐릭터 방향과 이동 벡터를 같은 좌표계로 맞추기 | [movement-facing-coordinate-space.md](../content/articles/math/movement-facing-coordinate-space.md) |
| 공개 | Addressables 로드 핸들의 수명과 해제 책임 | [addressables-handle-lifetime.md](../content/articles/tools/addressables-handle-lifetime.md) |
| 공개 | AssetBundle 구조와 LZMA·LZ4의 로딩 비용 비교 | [assetbundle-compression-costs.md](../content/articles/tools/assetbundle-compression-costs.md) |
| 공개 | Addressables 카탈로그 옵션을 줄이기 전에 확인할 것 | [addressables-catalog-key-options.md](../content/articles/tools/addressables-catalog-key-options.md) |
| 공개 | 스크립트와 Addressables 콘텐츠의 버전 호환성 | [addressables-player-content-compatibility.md](../content/articles/tools/addressables-player-content-compatibility.md) |
| 공개 | Addressables 커스텀 빌드 스크립트의 호출 단계 | [addressables-custom-build-stages.md](../content/articles/tools/addressables-custom-build-stages.md) |
| 공개 | Unity 배치 빌드가 끝나지 않을 때: 종료 인수와 첫 빌드 비용 | [unity-batch-exit-cold-build.md](../content/articles/tools/unity-batch-exit-cold-build.md) |
| 공개 | Spine 텍스처의 PMA·Straight Alpha·색 공간 맞추기 | [spine-alpha-color-space.md](../content/articles/graphics/spine-alpha-color-space.md) |
| 공개 | 화면 텍스처 왜곡과 충격파: UV 오프셋부터 계산하기 | [screen-distortion-shockwave-uv.md](../content/articles/graphics/screen-distortion-shockwave-uv.md) |
| 공개 | 텍스처를 여러 번 샘플링해 블러 만들기 | [texture-blur-kernel-texel.md](../content/articles/graphics/texture-blur-kernel-texel.md) |
| 공개 | 노이즈 임계값으로 Dissolve와 발광 경계 만들기 | [dissolve-threshold-edge.md](../content/articles/graphics/dissolve-threshold-edge.md) |
| 공개 | AA 방식과 움직일 때의 계단·흐림·잔상 비교 | [anti-aliasing-static-motion.md](../content/articles/graphics/anti-aliasing-static-motion.md) |
| 공개 | Bloom과 노출을 분리해서 발광 조절하기 | [bloom-exposure-emission.md](../content/articles/graphics/bloom-exposure-emission.md) |
| 공개 | React useEffect로 작업 상태를 동기화하고 정리하기 | [react-effect-task-cleanup.md](../content/articles/notes/react-effect-task-cleanup.md) |
| 공개 | TypeScript interface와 실행 중 데이터 검증을 구분하기 | [typescript-interface-runtime-validation.md](../content/articles/notes/typescript-interface-runtime-validation.md) |
| 공개 | CSS Grid·Flex와 긴 코드·표의 가로 넘침 해결 | [css-grid-flex-overflow.md](../content/articles/tools/css-grid-flex-overflow.md) |
| 공개 | DynamoDB의 Partition Key·Sort Key와 조회 패턴 설계 | [dynamodb-keys-query-patterns.md](../content/articles/notes/dynamodb-keys-query-patterns.md) |
| 공개 | HTTP 요청·응답·실패·취소를 작업 API로 이해하기 | [http-response-failure-cancellation.md](../content/articles/notes/http-response-failure-cancellation.md) |
| 공개 | Unity에서 클라우드 데이터에 접근할 때의 인증·SDK 경계 | [unity-cloud-auth-sdk-boundary.md](../content/articles/tools/unity-cloud-auth-sdk-boundary.md) |
| 공개 | 노션 학습 기록에서 이어 읽는 게임 개발 글 37편 | [notion-study-reading-order.md](../content/articles/notes/notion-study-reading-order.md) |

이번 집필에서는 노션의 실제 텍스트와 공식 문서를 대조했다. 외부 이미지·긴 번역·원본 코드·계정·접속정보는 복제하지 않았다. UI·회전 좌표, clip/NDC, 필터 사용, 핸들 소유권, 카탈로그 키, 압축·버전·인증 경계를 보완했다. 모든 새 글을 처음에는 draft true로 작성한 뒤 검토·실행 범위 표시를 마치고 공개했다.

새 글 중 독립 실행 프로그램 14개(JavaScript 11·C# 2·TypeScript 1)를 본문에서 추출해 실제 출력과 대조했다. C#은 .NET 10.0.301에서 경고를 오류로 처리했고 TypeScript는 6.0.3 strict 검사, JavaScript는 Node 24.15.0을 사용했다. 새 글의 외부 참고 URL 55개가 HTTP 성공했으며 BT 링크의 대소문자 오류를 수정했다. 이는 Unity·GLSL/HLSL·GPU·React·Azure·AWS·기기·실서비스·성능 실행 검증과 다르며 각 글에 미검증을 명시했다.

공개 빌드에서 노션 후보 37편 전부를 390×844 모바일 화면으로 열어 문서 폭 375px·가로 넘침 없음·수식 오류 없음·깨진 이미지 없음·초안 배너 없음으로 확인했다. 본문 artifactCount 검색은 TypeScript 글 1개를 반환했다. Home과 긴 벡터 글도 확인했다. 최종 `npm run verify`는 테스트 6개·Astro 24개 파일의 진단 0개·빌드·71개 HTML의 링크·공개 상태·예전 주소 검사를 통과했다.

31개 후속 글·공개 목차·벡터의 다음 글 링크와 SVG 공백 정리는 `4e27313`에서 main에 게시했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39021746409)가 정확한 SHA `4e2731388e9a2f4dae53b38622f68885b5459895`에서 성공했다. 실제 공개 주소 39개(후보 37·동적 배열·목차)의 HTTP 200·제목·본문·초안 배너 없음을 확인했고 RSS·sitemap에 모두 포함된다. 물 깊이 초안은 계속 제외된다. 문서와 기존 작성 계획·189개 기술 학습 목록은 로컬 작업 상태로 유지했다.

## 카테고리에 맞춘 태그 표시

10월 17일 사용자 요청으로 `ArticleLibrary.astro`의 태그 목록을 선택한 카테고리에서 사용한 태그만 표시하도록 변경했다. 초기 HTML에서도 해당 카테고리 밖의 태그를 숨기고, 드롭다운 변경 뒤에는 공개 글 검색 인덱스에서 태그 집합을 다시 구한다. 검색어·선택 태그에 따라 목록을 좁히지는 않는다.

다른 카테고리에서도 쓰이는 선택 태그는 유지하고 없는 태그는 해제해 URL에서도 제거한다. 초기화는 해당 페이지의 기본 카테고리로 돌아간다. 카테고리 페이지에서 모든 주제로 바꾼 경우 `topic=`을 주소에 남겨 새로고침 때도 전체 선택을 유지한다.

`npm run verify`의 테스트 6개·Astro 24개 파일의 진단 0개·빌드·71개 HTML 검사를 통과했다. 초기 HTML 여섯 목록과 브라우저 로컬 상태 21개를 확인했다. 다섯 카테고리·태그 유지/해제·본문 검색·초기화·직접 URL·새로고침·390px 모바일 검색을 확인했고 가로 넘침은 없었다. Home과 긴 벡터 본문도 확인했다.

기능 파일 하나만 `af34da7`에서 main에 게시했다. [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39023796027)가 정확한 SHA `af34da70cf7ae969dbeb7b3d56ba3035c457e00b`에서 성공했다. 실제 그래픽스 페이지에서 글 18개·관련 태그 33개를 확인했다. 현재 전체 태그는 88개이며 글이 늘면 이 수는 달라진다. `.verification/topic-tag-filter/`에 공개 화면 캡처와 브라우저 확인 기록을 보관했다. 기존 계획·이전 후보·기술 학습 목록은 변경하지 않았다.

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
| `content/articles/<topic>/` | 글 원본. 주제 ID는 `gameplay`, `graphics`, `tools`, `ai`, `notes`, `math` |
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

10월 17일 세 글의 공개 전환 후 `npm run verify`를 통과했다. 테스트 6개, Astro 검사, 빌드와 30개 HTML의 링크·공개 상태·예전 주소를 확인했다. 공개 빌드의 Home, 긴 하네스 글의 표·흐름도, 지게 글의 수식과 모바일 검색을 확인했다. 세 글이 검색에 나오고 남은 물 깊이 초안은 제외된다. 이 검증은 블로그 빌드에 관한 것이며 Unity나 하네스의 실행 검증을 추가한 것은 아니다.

별도 복사본에서 공개 글 8개를 모두 제거한 뒤 빌드와 링크 검사를 실행했다. 포트폴리오·DCB 시리즈, 예전 주소의 학습 메모 목록 이동, 초안 제외를 확인했다. 실제 저장소의 글은 삭제하지 않았다.

남은 확인과 보완은 다음과 같다.

- GitHub 새 글·수정·삭제의 로그인 연결은 확인했다. 당시 브라우저는 미로그인 상태여서 로그인 후 최종 저장 단계는 시험하지 않았다. 실제 글 작업 때 저장과 배포까지 확인한다.
- DCB 글은 구현 구조와 기존 검사 결과를 정리한 상태다. 플레이 영상·캡처와 같은 조건의 성능 측정 자료는 아직 첨부하지 않았다. 각 글에 적힌 모션·반복 전투·조립 왕복 등의 미확인 항목을 완료로 바꾸지 않는다.
- `water-depth-study.md`는 작업 전 초안이다. 실제 조건과 결과를 작성하기 전에는 공개하지 않는다.

## 새 채팅에서 사용할 요청 예시

> AGENTS.md와 docs/HANDOFF.md를 읽고, docs/EDITORIAL.md와 docs/WRITING.md를 따라 블로그를 관리해줘. 이번 작업은 [추가하거나 수정할 내용]이야. 기존 글 주소와 작성 중인 변경을 유지하고, 확인한 범위까지 보고해줘.

## 2026-10-18 수학 카테고리와 노션 이전

사용자 요청으로 수학 주제 ID math를 추가했다. 기존 5편의 slug·날짜를 유지해 옮겼고 새 학습 글 9편과 읽기 순서 1편을 작성·공개했다. 수학 15편, 전체 공개 62편과 물 깊이 초안 1편이다. 상세 범위와 검증은 [수학 이전 기록](MATH-MIGRATION.md)을 따른다. 본문 프로그램 13개와 벡터 C# 2개·49개 검사·1,000개 벡터 쌍, npm run verify의 테스트 8개·Astro 진단 0개·82개 HTML 검사를 통과했다. Unity·물리·GPU 실행을 새로 완료한 것은 아니다.

게시 커밋 ac1ee74a88453384755e252294fba4b3aa194c4d의 [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39077911243)가 성공했다. 공개 응답 21개에서 수학 15편·전체 62편, 5개 기존 주소, RSS·sitemap·편집 경로·초안 제외를 대조했다. 기존 계획 문서 3개는 그대로 두었고 인수인계의 선행 로컬 변경은 게시 커밋에 포함하지 않았다.

## 2026-10-18 전체 글 작성일 조사

공개 62편과 초안 1편을 대조해 노션 중심 원문의 생성일 46편·관련 커밋 AuthorDate 10편을 반영했다. 새 학습 글·목차·빈 초안 5편과 Jekyll 기존 2편은 날짜를 유지했다. 노션 참조 70개의 생성일 조건을 조회했고 마지막 수정일을 대용하지 않았다. 노션은 원시 생성 시각·시간대가 제공되지 않아 날짜 조건 결과를 사용한다. Git은 작성 시각의 한국 날짜를 사용하며 체리픽·합류 날짜와 구분한다. [전체 날짜 조사](ARTICLE-DATES.md)와 [근거 데이터](ARTICLE-DATES.json)에 글별 기준을 남겼다.

메타데이터 dateBasis와 글 화면의 노션 원문·작업 기록·수정일 표시를 추가했다. 본문·slug·공개 상태는 63편 모두 유지했고 신규 글은 없다. npm run verify 테스트 11개·Astro 진단 0개·82개 HTML 검사를 통과했다. 별도로 62편의 실제 빌드 날짜·Home/목록/RSS 정렬·피드 날짜·기존 주소·초안 제외, Home·긴 글·모바일 검색과 날짜 줄바꿈을 확인했다. 기존 계획 문서 3개는 그대로 유지한다.

게시 커밋 6caa41fbb12cab42c4ee72e333a8d4b9f9c53fa8의 [Actions 배포](https://github.com/imjae/imjae.github.io/actions/runs/39078907695)가 성공했다. 공개 응답 66개에서 62편의 날짜·출처·수정일, Home/목록/RSS 정렬과 피드 날짜, 기존 sitemap 주소·초안 제외를 대조했다. 기존 본문과 검증 날짜를 새로 실행한 결과로 바꾸지 않았다.

## 2026-10-18 문구 정리와 Home Pinned 목록

사용자 요청으로 공부를 위해 정리했다는 직접 안내를 사이트 소개·목록·본문에서 제거했다. notes의 공개 이름은 기술 메모로 바꾸고 ID·주소는 유지했다. 목차 링크는 전체 글 목차로 맞췄으며, 원문 출처·AI 사용·독립 예제·가상 데이터·실행 미검증 범위는 유지했다. 본문 변경은 46편, 고정 설정을 포함한 글 변경은 55편이다. 63편의 date·dateBasis·slug·분류·공개 상태와 링크 403개를 대조했다. 코드 블록 118개는 두 출력·오류 문자열의 문구 변경 외에 그대로다. legacy/jekyll 원본과 기존 계획 문서 3개는 변경하지 않았다.

Home 소개의 글 목록 버튼을 제거하고 최근 글 자리를 Pinned 목록으로 바꿨다. 공개 글의 pinned: true·pinOrder 설정을 사용한다. 우선 인턴쉽 태그의 9편을 몬스터→장비→IK→물→불→지게→AI 구현·검증→워크트리→CLI 하네스 순서로 고정했다. 순서는 작성일·시리즈 order와 별도로 관리하며 초안은 고정해도 Home에서 제외한다. 수정 모드 목록에 Pinned 표시를 추가했다. 상세 사용법은 WRITING.md에 있다.

npm run verify 테스트 14개·Astro 25개 파일 진단 0개·82개 HTML 검사와 Home 목록 대조를 통과했다. 82개 HTML에서 공부·학습 문구가 남지 않은 것을 확인했다. 로컬 브라우저에서 Home 9편의 순서·소개 버튼 제거·긴 Spine 본문의 검증 구분·390px Home과 검색·새로고침·수정 모드 Pinned 표시 9개를 확인했다. 가로 넘침은 없었다. 기존 HANDOFF 로컬 변경은 게시 커밋에서 제외한다.

게시 커밋 6d45f832b56423e4382b4eb69364505353674fbe의 Actions 배포(39082486746)가 성공했다. 실제 공개 글 62편·Home·글 목록·수정 모드에서 공부·학습 문구 제거, 기존 작성일, Pinned 9편의 순서, 소개 버튼 제거와 관리 표시 9개를 확인했다. 공개 Home 화면은 .verification/pinned-home/home-live.jpg에 보관했다. npm preview 임시 서버는 종료했고 공개 Home 탭을 결과로 남겼다.

## 2026-10-18 수정 모드 고정 관리와 Behavior→FSM 글 초안

수정 모드에 고정·해제, ↑·↓ 순서 이동, 변경 취소, 저장 전 상태와 탭 세션 보관을 추가했다. 저장 버튼은 content/pins/의 새 JSON 설정이 채워진 GitHub 파일 작성 화면을 연다. GitHub Commit changes와 배포가 끝나야 게시된 Home에 반영된다. 브라우저에서 토큰을 받거나 저장하지 않는다. 최신 createdAt 설정이 전체 고정 순서를 덮어쓰고 빈 배열은 전체 해제다. 삭제·초안 글은 제외한다. 설정이 없을 때만 기존 글 메타데이터를 사용한다. WRITING.md에 사용법과 저장 형식을 갱신했다.

npm run verify의 테스트 18개·Astro 27개 파일 진단 0개·82개 HTML 검사를 통과했다. 임시 설정을 넣은 실제 빌드에서도 Home과 수정 모드의 순서 일치·삭제/초안 제외를 확인한 뒤 임시 파일을 제거하고 원래 9편으로 다시 빌드했다. 브라우저에서 고정·해제·순서·전체 해제·취소·새로고침 복원·저장 URL의 JSON 일치와 390px 가로 넘침 없음을 확인했다. GitHub 저장 연결은 로그인 화면까지 확인했으며 로그인 후 최종 커밋은 시험하지 않았다. 새 설정을 실제 공개 저장해 기존 9편을 변경한 것은 아니다.

unity-behavior-to-code-fsm.md는 게임플레이의 새 로컬 초안이다. 6월 2일 사용자 요청 로그 두 건에서 많은 몬스터의 Update 비용 우려와 장기 AI 편집성이 주목적임을 확인했다. 82b1b9f25(코드 DSL 도입), 79f3c5d8d(조건/이벤트), 75da27868(뷰어), 34f697871(프리셋), 050634066(Behavior 1.0.14 제거), 77dfc0945(디버깅)을 현재 registry·실행기·뷰어·검사 코드와 대조했다. 대표 커밋 AuthorDate로 date 2026-06-02/dateBasis commit을 지정했다. 기존 MonsterStateController를 재사용한 행동 저작 방식의 전환이며 프로젝트 전체에 FSM을 처음 도입한 것으로 쓰지 않았다. AI 구현 보조와 본인 요구·판단을 구분했고 성능·수정 시간의 전후 수치는 없다. Unity 컴파일·EditMode·Play Mode는 새로 실행하지 않았다. DCB는 읽기 전용으로 사용했다. 로컬 글의 표 3개·흐름도 1개와 모바일 폭을 확인했다. 초안은 공개 검색·목록·RSS·sitemap·편집 목록에서 제외된다.

기능 게시 커밋 4b7f7902af8263766e341025109666d4a4b18a8f의 Actions 39083552753이 성공했다. 공개 수정 모드에서 고정 버튼 62개·고정 9편, 순서 변경과 저장 JSON 반영·취소를 확인했다. 실제 Home 고정 순서는 변경하지 않았다. 화면은 .verification/pin-editor/editor-live.jpg에 보관했다. 임시 공개 빌드 preview 서버는 종료했고, 새 글을 검토할 수 있도록 4324의 dev 서버(session 57397)와 초안 탭을 남겼다. 수정 모드 공개 탭도 결과로 남겼다. 새 글은 로컬 초안이며 기능 게시 커밋에는 포함하지 않았다. 기존 HANDOFF·계획 문서 3개는 로컬 상태로 유지한다.

## 2026-10-18 병렬 AI 세션 지침 중심으로 워크트리 글 보완

parallel-ai-worktrees의 제목과 본문을 공통 지침·작업 분해·공용 슬롯·점유와 복구·검증·통합·인계 중심으로 다시 썼다. AGENTS/CLAUDE 진입점과 CONVENTIONS/AI/ARCHITECTURE/문서 색인의 역할, 변경·보존 범위와 완료 조건, 신규 C#·Player 컴파일·VFX·IK의 검증 구분을 설명한다. 요청 형식과 인계 형식은 실제 지침을 재구성한 예시로 명시했다. 불·급류·SideStep·StepUp은 짧은 운영 근거로 줄였다. 제목·요약 외 메타데이터와 주소·날짜·공개 상태·고정 순서는 유지한다.

DCB의 현재 지침, 10월 1~2일 변경·실험 기록 커밋, 10월 15일 지침 편입/작업 위치 변경 커밋, 10월 2일 실험 기록 보존 요청 로그를 읽기 전용으로 대조했다. 현재 절차와 과거 실행을 구분하며 중앙 스케줄러 구현이나 시간 절감률을 주장하지 않는다. 선점 경쟁·비정상 종료 복구·Unity 실행은 새로 재현하지 않았다. 오래된 claim 회수 시 Unity 프로세스 부재만으로 편집 세션 종료를 입증하지 못한다는 한계도 적었다.

npm run verify 테스트 18개·Astro 27개 파일 진단 0개·82개 HTML 검사를 통과했다. 로컬 Home 9편·새 제목, 긴 본문의 표 2개·흐름도 1개, 390px AI 카테고리에서 본문 '슬롯' 검색 결과 1편·본문 가로 넘침 없음을 확인했다. 게시 커밋 658165051ad9d21c36466384bf260ceb6c9912d4의 Actions 39084122275 빌드·배포가 성공했다. 공개 글에서 제목·14개 목차·예시·검증 한계·흐름도와 기존 날짜를 확인했고 공개 Home 고정 9편의 순서를 대조했다. 화면은 .verification/parallel-ai-guidelines/article-live.jpg에 보관했다. 게시 커밋은 해당 글 한 파일만 포함하며 기존 FSM 초안·계획 문서 3개와 HANDOFF 로컬 변경은 포함하지 않았다. 임시 4322 preview 서버는 종료하고 4324 초안 dev 서버는 유지한다.

## 2026-10-18 CLI 하네스 글의 역할·실행·검증 구조 보완

cli-agent-harness의 제목·요약·본문을 API 제약에서의 CLI 선택, 역할별 책임과 입력, Node 큐, 작업 공간과 ref, 프롬프트·인계 예산, 프로세스 입출력, EvidenceContract, 재시도·검토 대기로 다시 구성했다. slug·작업 기록 날짜 2026-05-21·수정일·인턴쉽 태그·고정 9번은 유지한다. imjaess HEAD 7cc89e97733ec8f1f8fca710983cbc51ac74fd23의 소스와 e85ea62 전환·a0a1cb3 contract·de9e911 계획 통합·6월 역할 규칙 변경을 읽기 전용으로 조사했다. 5월 21일 초기 요구와 researcher의 할당량 관련 429 오류 보고를 작업 기록과 대조했다. 인증·exec 입출력·output-schema는 OpenAI 공식 문서와 확인했으며 원본 로그·비밀 값·비공개 로컬 경로는 게시하지 않았다.

Task 병행과 Task 내 역할 순서, fast/balanced, 조사·계획 질문 통합과 waiting_for_user, 구현 ref에서 생성한 tester 공간·verifier 재사용을 설명했다. 변경 요약은 전체 패치가 아닌 git diff stat/name-status이며 미추적 파일이 빠질 수 있는 한계를 적었다. 문자 예산은 하네스 입력/본문 대상이며 전체 모델 컨텍스트 상한으로 쓰지 않았다. 판정 하향과 명령 unknown·검토 대기를 분리했고 출력 파일 부재 fallback·키워드 판정·이벤트 수집/시간·프로세스 트리·sandbox 한계도 명시했다. 본인 요구와 방향 판단, AI 코드·테스트 작성 보조를 구분했다. 하네스 테스트·실계정 CLI·Unity 실행은 새로 수행하지 않았다. 테스트 코드는 조사만 했으며 mock 흐름을 실제 모델 호출 성공으로 쓰지 않았다.

npm run verify의 18개 테스트·Astro 27개 파일 진단 0개·82개 HTML 검사가 통과했다. Home 고정 9편과 새 제목, 긴 글의 표 6개·흐름도 1개, 390px AI 카테고리의 EvidenceContract 본문 검색 1편·표/페이지 가로 넘침 없음을 확인했다. 게시 커밋 de07b06d24c624c782f1343150199caa89a3e623의 Actions 39087124369 빌드·배포가 성공했다. 공개 글에서 제목·15개 목차·표·흐름도·기존 날짜·미실행 안내를 확인했고 공개 Home 고정 9번과 제목을 대조했다. 화면은 .verification/cli-harness/article-live.jpg, 조사 요약은 같은 폴더 review.json에 보관했다. 커밋은 해당 글 한 파일만 포함한다. 기존 FSM 초안·계획 문서 3개·HANDOFF 로컬 변경을 유지했고 임시 4322 preview를 종료했다. 기존 4324 초안 dev 서버는 유지한다.

## 2026-10-18 Behavior→FSM·DSL 글 문구 검토와 공개 설정

먼저 origin/main의 fc912bb를 fast-forward로 반영해 IK 트레버설 보완을 보존했다. unity-behavior-to-code-fsm의 요약과 표현을 검토하고 draft를 false로 바꿨다. 전환 작업의 Deluge→DCB 계보, 당시 Update 비용 보고와 이후 성능 측정의 구분, 타입별 C# definition 원본, named primitive의 의미를 명확히 했다. 수정·검색·diff 검토·전이 규칙·시각화·프리셋의 구조상 이점을 설명하며 시간 절감률이나 성능 향상을 주장하지 않는다. slug·작성일 2026-06-02·수정일·태그·시리즈 순서는 유지한다.

6월 2일 원 요청 두 세션과 도입·뷰어·프리셋·6월 17일 패키지 제거 커밋, 현재 DCB의 registry·runner·뷰어 적용·검사 코드와 Unity 공식 기능 소개를 대조했다. 기존 MonsterStateController 재사용, 초기 legacy fallback과 현재 미등록 경고, 일반 스폰에 preset이 자동 적용되지 않는 점을 유지했다. Unity 컴파일·EditMode·Play Mode·실제 전투·CPU/GC 측정은 새로 하지 않았다. DCB는 읽기 전용으로 사용했다.

npm run verify의 테스트 18개·Astro 27개 파일 진단 0개·83개 HTML 검사를 통과했다. 공개 글은 63편, 게임플레이 6편이며 물 깊이 초안은 유지한다. Home 고정 9편의 순서, 긴 본문의 표 3개·흐름도 1개, 390px 게임플레이에서 preset 검색 결과 1편과 본문·표 가로 넘침 없음을 확인했다. 공개 경로는 /writing/unity-behavior-to-code-fsm/이며 별도로 Home 고정 목록에 추가하지 않았다.

## 2026-10-18 FSM·DSL 전환 글 Home 고정

사용자 요청으로 unity-behavior-to-code-fsm을 monster-combat 바로 다음인 2번에 고정했다. 기존 9편의 상대 순서는 유지하며 고정 글은 10편이다. content/pins/에 첫 정식 JSON 설정을 추가했으므로 이후 고정 여부와 순서는 최신 createdAt 설정을 기준으로 한다. 수정 모드에서도 같은 목록을 읽는다. 글 본문·작성일·주소·공개 상태는 변경하지 않았다.

npm run verify의 테스트 18개·Astro 진단 0개·83개 HTML 검사를 통과했다. 로컬 공개 빌드에서 Home과 수정 모드의 10편 순서 일치, 긴 본문의 표 3개·흐름도 1개, 390px 게임플레이 preset 검색 결과 1편과 Home·검색의 가로 넘침 없음을 확인했다.

## 2026-10-18 물 캐시 재생 글 보완본

water-playback의 제목·slug·작성일·공개 상태·시리즈·고정 설정을 유지하고 요약·본문을 보완했다. DCB HEAD 37fa37df2에서 BakedRapidsEffect·MeshCache·SecondaryCache·CacheStream, exporter·분할 검사 도구, 실제 급류 프리팹과 02_Zone 참조를 읽기 전용으로 대조했다. cd6b904a4의 직접 업로드, 1d3d91c5b의 입자 처리, c1ce1030c의 분할 저장, fd5397e1c의 화면 밖 갱신·비대기 경로, bc4dec1a7의 저장 설정을 확인했다. 9월 10일 실제 플레이 프레임 드롭 제기와 9월 28일·10월 1일 제작 데이터 보존 요청 로그를 기여 범위에 반영했다. 코드·검사 도구 작성의 AI 보조와 Mantaflow·Alembic 사용을 구분한다.

초기 180프레임의 CPU 측정 JSON·메시/RPD 동등성·Play Mode 수명 검사와 현재 Forest01Final 120프레임 캐시를 분리했다. 현재 주요 급류 두 프리팹은 화면 밖 컬링 ON·거리 80m·nonBlockingStreaming OFF이며 씬 인스턴스의 관련 override는 없다. 코드 기본값만으로 비대기 모드가 적용됐다고 쓰지 않는다. RPD의 요청 읽기는 대기하고 주 메시·shore 업로드도 독립적이므로 전체 효과의 완전한 비동기·프레임 동기화를 주장하지 않는다. RMS는 용량 압축이 아니며 런타임 길이 검사와 저작 도구의 SHA 검사를 구분한다.

10월 16일 focused-tests.xml의 급류 19개 중 17개 통과·2개 실패를 원본 집계와 대조했다. 40~50% 기대와 실제 60.92% 컬링, 기본 범위에 첫 프레임의 입자가 0개인 조건을 설명하며 검사 수정·전체 런타임 품질 통과로 확대하지 않는다. 초기 물 전용 Player 빌드 중단과 이후 프로젝트 Windows 빌드 성공·nographics 시작을 구분한다. 이번 보완에서는 Unity 컴파일·EditMode·Play Mode·새 캡처·성능 측정을 하지 않았다. DCB는 변경하지 않았다.

npm run verify 테스트 18개·Astro 진단 0개·83개 HTML 검사를 통과했다. 로컬 Home 고정 10편·물 글 5번 유지와 새 요약, 긴 본문의 표 6개·흐름도 1개·수식 1개, 390px 그래픽스 RMC 검색 결과 1편과 본문·표 가로 넘침 없음을 확인했다. 이 보완본은 로컬 검토 상태이며 아직 커밋·push하지 않았다.

## 2026-10-18 실제 촬영과 YouTube 첨부 준비

사용자가 10월 19일부터 DCB 실제 영상을 촬영하고 블로그에 첨부할 계획을 밝혔다. 추가 선택은 YouTube 등에 업로드한 뒤 본문에 삽입하는 방식이다. [촬영 계획](DCB-CAPTURE-PLAN.md)에 12개 장면의 순서·조작·확인 범위·본문 위치, 지게 적재 곡선 중립·FSM preset 일반 스폰 미적용·물 비대기 OFF 등의 조건, 약 3분 편집 후보를 정리했다. [take 양식](templates/DCB-TAKE.md)과 [YouTube HTML 양식](templates/youtube-figure.html), 글별 이미지 폴더를 만들었다. media-inbox/ 원본은 Git에서 제외한다. WRITING과 기존 작성 계획에서 새 문서로 연결한다.

글의 .article-video에 반응형 iframe·캡션 스타일을 추가했다. 16:9를 기본으로 하고 테두리를 제외한 플레이어 높이가 최소 200px이 되도록 했다. 좁은 화면에서 aspect-ratio와 최소 높이가 너비를 늘리는 경우를 명시적 width로 수정했다. 양식은 youtube-nocookie·지연 로드·인라인 재생·전체 화면 허용·원본 링크를 사용하며 자동 재생은 넣지 않는다. 실제 영상 ID·구간·공개 범위를 받기 전에는 공개 글에 플레이어를 추가하지 않는다. API key나 업로드 자동화는 추가하지 않았다.

npm run verify 테스트 18개·Astro 진단 0개·83개 HTML 검사를 통과했다. 별도 로컬 iframe 페이지와 UI 확인용 단색 MP4로 데스크톱·390px 레이아웃을 검사했다. 모바일 본문·프레임 폭은 346px, iframe 높이는 200px이고 clientWidth와 scrollWidth는 모두 390px이다. Home 고정 10편, 긴 물 본문과 모바일 그래픽스 RMC 검색 1편을 확인했다. 실제 DCB 촬영·YouTube 업로드·공개 영상 재생은 아직 수행하지 않았다. 테스트 화면은 .verification/capture-prep/에 보관하며 배포 산출물의 임시 페이지는 제거한다. DCB와 기존 물 글 보완본은 이 준비 작업에서 수정하지 않았다. 촬영 준비 역시 로컬 상태다.

## 2026-10-18 물 글 최종 검토와 촬영 준비 게시

사용자가 물 글을 최종 검토해 게시하고 촬영 준비 변경까지 커밋·push하도록 요청했다. 물 글에서 반복 전환의 한 렌더 프레임 내 두 리그 갱신, 생성 스레드에서의 메시 업로드·객체 해제, IJob.Run의 호출 스레드 실행을 정확히 표현했다. 본인 기여는 표현 요구·실제 플레이의 프레임 드롭 제기·제작 데이터 보존 조건으로 구체화했다. 주소·작성일·공개 상태와 Home 고정 5번은 유지한다.

DCB HEAD 37fa37df2의 현재 설정과 초기 180프레임 측정·19개 중 17개 통과한 검사 원본을 다시 대조했다. 현재 120프레임 데이터·비대기 OFF와 과거 측정을 구분하며 실행 미검증 안내를 유지한다. 새 Unity 실행·촬영·성능 측정은 하지 않았다. npm run verify의 테스트 18개·Astro 진단 0개·83개 HTML 검사가 통과했다. 로컬 Home 고정 10편의 순서, 긴 글의 표 6개·흐름도 1개·수식 1개, 390px 그래픽스 RMC 검색 1편과 본문 가로 넘침 없음을 확인했다. 촬영 문서의 로컬 링크와 배포 HTML의 임시 검사 페이지·가짜 영상 ID 부재도 확인했다. 물 글과 촬영 준비 전체를 이번 게시 대상으로 확정했다. 배포 결과는 Git 커밋의 Actions와 공개 페이지에서 별도로 확인한다.

## 2026-10-18 장비 조합 UI 이펙트 글 초안

사용자 요청으로 graphics/modular-equipment-ui-vfx.md를 새 초안으로 추가했다. 기존 장비 조립 글은 유지하며 새 글에서 연결한다. DCB HEAD 37fa37df2의 팝업·3D 프리뷰·불티/연기 MaskableGraphic·가산 셰이더·머티리얼·프리팹 참조와 7월 11~15일 변경을 읽기 전용으로 대조했다. 대표 비행·코일 통합 커밋 310e6cfc6의 AuthorDate로 date 2026-07-14/dateBasis commit을 지정했고 DCB 시리즈 order 10·인턴쉽 태그를 넣었다. 게시·고정·커밋·push는 하지 않았다.

중앙 빛무리·flicker 제거, 공유 흐름과 시간 분산 발생, SeatImpact/SnapImpact, 파츠 선분의 최근접점 밀림, 배경/생성 알파 분리와 플립북, 조립 축 우선과 UI 확대 추적, 3차 베지어 끝 속도·초과 시간 연결을 설명했다. 현재 프리팹의 불티 29·연기 9·코일 200개/0.5초와 소스/빌더 기본값을 구분한다. 실제 메시 표면 추종이나 3D 깊이 판정으로 설명하지 않는다. 다중 파츠 연기 생성과 하나의 지속 밀림 상태, 고정 로컬 범위의 UI 변환 추적 한계도 적었다. 원본 모델·Unity 연기 텍스처 재사용과 AI 구현 보조, 기록에 남은 사용자 시각 기준을 구분한다. 비공개 원본 소스·로그·로컬 경로와 미디어는 복사하지 않았다.

7월 14일 추가된 시각·낫 축 검사 도구는 7월 27일 제거된 이력을 확인했다. 이번에는 해당 도구의 과거 코드만 읽었으며 당시 결과 로그·캡처 성공이나 최신 Unity 실행을 확인한 것으로 쓰지 않는다. 남아 있는 AnvilWorkbenchSmokeTest는 이전 팝업용이다. 새 Unity 컴파일·Play Mode·Player·게임 촬영·CPU/GPU 측정은 하지 않았다. 분출 누적기·베지어 독립 예제와 실습·풀이 세 개를 포함했고 촬영 계획에 CAP-13을 추가했다.

본문에서 추출한 JavaScript 예제를 Node.js에서 실행했다. 30·60·144Hz의 총 발생 수는 모두 200개이며 완료 시각은 0.500·0.500·0.507초, 끝 제어점 (92.5,185)와 도착 속도 (30,60)을 확인했다. npm run verify 테스트 18개·Astro 27개 파일 진단 0개·83개 HTML 검사를 통과했다. 새 초안은 생산 빌드의 경로·HTML/XML/JSON에 없고 공개 수는 63편으로 유지된다. 브라우저에서 로컬 초안 표시, 표 4개·흐름도 1개·표시 수식 5개와 모바일 수식의 내부 스크롤·페이지 가로 넘침 없음을 확인했다. 공개 빌드 Home 고정 10편의 순서와 390px 그래픽스 RMC 검색 1편도 유지된다. 초안 화면은 .verification/equipment-ui-vfx/article-draft.jpg에 보관했다. 기존 4324 dev 서버와 새 초안 탭을 남기고 임시 공개 preview는 종료한다.

## 2026-10-18 CLI 하네스의 제작 목적과 현재 사용 판단 명시

사용자가 API 키 기반 호출 요금제를 별도로 이용하지 않았다는 배경, 현재 본인 작업에는 Codex·Claude Code의 기본 하네스와 역할·세션 분리로 충분하다는 판단을 직접 밝혔다. cli-agent-harness의 요약·도입·CLI 선택 이유·기여 문단에 반영했다. 자체 하네스는 역할·실행·인계·검증 구조를 직접 설계하고 구현하는 경험을 위한 프로젝트이며 일상 작업에 반드시 필요한 운영 도구나 기본 도구보다 우수하다고 검증한 시스템으로 소개하지 않는다. 현재 사용 범위에 대한 개인 판단과 제품 전반의 기능·성능 비교를 구분한다.

기존 구현 설명과 429 오류 기록·실행 미검증 범위, 제목·주소·날짜·분류·공개 설정·고정 순서를 유지했다. 새 제품 기능·요금·사용 한도를 조사해 추가한 것이 아니며 사용자가 밝힌 배경과 판단을 반영한 문구 수정이다. npm run verify의 테스트 18개·Astro 27개 파일 진단 0개·83개 HTML 검사를 통과했다. 로컬 공개 빌드에서 Home 고정 10편과 새 요약, 긴 글의 표 6개·흐름도 1개, 390px AI 카테고리의 '경험 프로젝트' 검색 1편과 가로 넘침 없음을 확인했다. 하네스나 실계정 CLI를 새로 실행하지 않았다. 수정 화면은 .verification/cli-harness-purpose/article-local.jpg에 보관한다. 기존 장비 UI 이펙트 초안·촬영 계획 변경을 유지하고 커밋·push는 하지 않았다. 4324의 수정본 탭을 남기고 임시 4322 preview를 종료한다.

## 2026-10-18 프로젝트 소개의 게임 영상 링크 관리

사용자가 DCB 소개 화면에 짧은 게임 영상 링크를 추가할 수 있게 요청했고 현재 촬영 전이라고 답했다. 소개의 수정 모드가 /editor/?project=dcb#project-video로 연결되도록 했다. 새 ProjectVideoEditor에서 HTTPS 영상 주소 입력·확인 링크·변경 취소·GitHub 저장 화면 생성을 제공한다. 주소가 있을 때만 소개 문구 아래에 게임 영상 보기 버튼을 표시하고 새 탭에서 연다. 현재 실제 주소는 없으므로 공개 버튼·플레이어·가짜 미디어를 추가하지 않았다. 영상 등록 시 하단의 미첨부 안내도 맞춰 바뀐다.

고정 설정과 같은 새 JSON 저장 방식을 사용한다. content/project-videos/의 최신 createdAt 설정을 빌드가 읽으며 videoUrl 빈 문자열은 제거 설정이다. 버전·프로젝트·저장 시각·HTTPS 주소를 검증하고 스크립트 URL·로그인 정보 포함 URL 등을 거절한다. GitHub 저장은 새 파일 작성 화면의 Commit changes와 배포로 확정하며 인증 정보는 사이트에서 받지 않는다. WRITING과 촬영 계획에 사용법을 추가했다. 실제 영상 업로드·공개 범위 변경이나 재생 검증은 하지 않았다.

npm run verify의 테스트 22개·Astro 30개 파일 진단 0개·83개 HTML 검사가 통과했다. 별도 시험 주소를 임시 JSON에 넣은 실제 빌드에서 영상 버튼의 주소·새 탭·rel·조건부 안내, 주소 제거용 저장 JSON을 확인했다. 시험 파일을 제거하고 다시 verify해 영상 미등록 상태로 복원했다. 데스크톱·390px 버튼 배치와 수정 양식, 잘못된 주소의 저장 차단·취소·프로젝트 뷰어 복귀를 확인했다. Home 고정 10편, 긴 CLI 글의 표 6개·흐름도 1개와 390px AI 본문 검색 1편도 유지된다. 최종 dist에 시험 주소가 없고 content/project-videos에는 .gitkeep만 남긴다. 화면은 .verification/project-video/editor-local.jpg에 보관한다. 기존 장비 UI 이펙트 초안과 CLI 문구 수정은 유지하며 커밋·push는 하지 않았다. 4324의 영상 관리 탭을 남기고 임시 4322 preview는 종료한다.

## 2026-10-18 DCB 기능별 관련 글 목록

사용자 요청으로 구현한 기능의 링크를 단일 글에서 기능별 상세 목록으로 바꿨다. /portfolio/dcb/features/<slug>/의 5개 정적 페이지를 만들었고 기존 기능 제목·순서와 글 주소는 유지했다. src/data/dcb-features.mjs의 title·description은 글 제목과 별도이며 articleSlugs가 관련 글과 읽는 순서를 정한다. src/data/site.ts의 cases는 이 설정을 다시 내보낸다. 프로젝트 목록에 관련 글 수를 표시하고 상세 화면은 기존 ArticleCard로 제목·요약·분류·날짜를 보여 준다. 기능 목록으로 돌아가는 링크와 sitemap 경로도 추가했다.

몬스터 전투는 monster-combat와 unity-behavior-to-code-fsm을 연결했다. 장비 조합은 modular-equipment와 UI 이펙트 초안을 연결하되 공개 빌드에서는 초안을 제외한다. 현재 공개 글 수는 기능 순서대로 1·2·1·1·1편이며 로컬 장비 목록에서만 초안 배지를 단 2편이 보인다. 지정한 다른 주제·프로젝트 글도 연결할 수 있고, 미지정 글을 자동으로 모으지는 않는다. 삭제·초안·중복을 제외하며 관련 글이 0편이어도 기능 제목과 빈 목록 페이지를 유지한다. 글의 draft와 고정 설정은 변경하지 않았다.

npm run verify 테스트 24개·Astro 33개 파일 진단 0개·88개 HTML 검사를 통과했다. 돌아가기 문구를 정리한 뒤 build와 check:site도 다시 통과했다. 실제 브라우저에서 프로젝트→몬스터 기능→관련 글 2편→FSM 본문, 기능 목록 복귀와 장비 공개 1편을 확인했다. 390px 기능 목록·긴 FSM 본문의 표 3개/흐름도 1개와 검색(preset 1편), Home 고정 10편·가로 넘침 없음을 확인했다. 로컬 dev의 장비 초안 배지도 대조했다. 화면은 .verification/portfolio-features/feature-local.jpg에 보관한다. 기존 CLI 문구·장비 초안·영상 관리 변경을 보존했고 커밋·push는 하지 않았다. 4324의 기능 상세 탭을 남기며 임시 4322 preview는 종료한다.

## 2026-10-18 장비 UI 이펙트 게시와 누적 변경 통합

사용자가 장비 조합 UI 이펙트 글을 최종 검토해 게시하고 현재 변경 전부를 커밋·push하도록 요청했다. DCB HEAD 37fa37df2의 변경 없음과 현재 코드·설정, 글의 구현 설명·기여·재사용 자산·AI 보조 구분을 다시 확인하고 draft를 false로 바꿨다. 글 주소와 커밋 기준 작성일 2026-07-14는 유지한다. 최신 Unity 실행·실제 조합 화면·성능 측정이 미검증이라는 안내도 유지하며 Home 고정 목록은 변경하지 않는다.

이번 통합 대상은 새 이펙트 글과 CAP-13 촬영 계획, CLI 하네스의 경험 프로젝트 목적 명시, 프로젝트 영상 주소 관리, 기능별 관련 글 목록과 문서·테스트다. 실제 영상 주소는 아직 없어 content/project-videos에는 .gitkeep만 남으며 공개 영상 버튼을 표시하지 않는다. 장비 기능의 공개 글은 2편으로 늘어나 기능별 수는 1·2·2·1·1편이다.

Node 24.15.0에서 npm run verify의 테스트 24개·Astro 33개 파일 진단 0개·89개 HTML 검사와 82개 경로 빌드가 통과했다. 공개 빌드의 Home 고정 10편 순서, 장비 관련 글 2편, 영상 버튼 미노출, 새 글의 표 4개·흐름도 1개·표시 수식 5개와 초안 표시 부재를 확인했다. 390px 그래픽스 검색에서 새 제목 1편이 나오며 검색·긴 본문에 페이지 가로 넘침이 없다. origin/main을 fetch해 기존 HEAD와 일치함을 확인했다. 로그는 .verification/ui-vfx-publish/verify.log에 보관한다. 배포 결과는 push할 커밋의 Actions와 공개 페이지에서 별도로 확인한다.

## 2026-10-18 장비 UI 이펙트 Home 고정

사용자 요청으로 새 고정 설정을 저장해 modular-equipment-ui-vfx를 modular-equipment 바로 다음에 추가했다. 전체 11편 중 장비 파츠 조합은 3번, UI 이펙트는 4번이며 기존 나머지 글의 상대 순서는 유지한다. 이전 고정 설정과 글 본문·날짜는 변경하지 않았다. npm run verify의 테스트 24개·Astro 진단 0개·89개 HTML 검사가 통과했다. 브라우저에서 Home 순서와 긴 이펙트 글의 표·흐름도, 390px 그래픽스 제목 검색 1편·가로 넘침 없음을 확인했다. 로그는 .verification/ui-vfx-pin/verify.log에 보관한다. 공개 홈 반영은 이 변경의 main push와 Actions 배포 후 별도로 확인한다.

## 2026-10-18 Samurai의 현재 그룹 전투 설명 보완

사용자가 몬스터 패턴과 그룹 전투의 첫 글에서 현재 게임의 전투 방식부터 설명하도록 요청했다. monster-combat의 제목을 'Samurai의 그룹 전투: 포위·압박·공격 패턴'으로 바꾸고 요약과 앞부분을 재구성했다. 발견·경계·추격/복귀, 거리 층·슬롯, 재정비·관찰·압박, 인원별 일반 토큰/클레임, 공격·블러프, 헛스윙·구르기·가드·밀착 반응, 패리·동료 사망 순으로 설명한다. 기존 DSL·스케줄러·포위/권한 오류 수정 과정과 기여 설명은 뒤에 유지한다. slug·작성일·공개 설정·고정 순서와 기능별 글 목록 순서는 변경하지 않았다.

읽기 전용으로 DCB HEAD 37fa37df2의 SamuraiBehaviorDefinition, GroupCombatActions/Conditions, CombatGroupDirector/MemberState, ConfrontPhase, PlayerCombatSignals, 기술 가중 선택과 현재 GameBalanceCatalog를 대조했다. 저장값은 대치 4.5m/재추격 7.5m, 공격 2.5m, 거리 층 3.3·5.25·9m, 공격 쿨다운 1.9~2.7초, 블러프 재도전 1.8~2.6초/후퇴 비중 80%다. 오래된 주석의 다른 수치는 사용하지 않는다. 기술 쿨다운 후보가 모두 막힐 때의 대체 선택, 일반 상한을 재검사하지 않는 장기 대기 보완, Press 역할 기록과 별도 실행 분기 부재를 설명했다. 고정 3인 팀·항상 한 명만 반응·반드시 측면 협공·새 플레이 검증으로 확대하지 않는다.

소스·데이터 대조 범위이며 Unity 컴파일·EditMode·Play Mode·전투 촬영·성능 측정은 새로 수행하지 않았다. DCB 파일은 수정하지 않았다. npm run verify의 테스트 24개·Astro 33개 파일 진단 0개·89개 HTML 검사와 82개 경로 빌드가 통과했다. 브라우저에서 Home 고정 11편, 몬스터 기능 목록의 첫 글/두 번째 FSM 글, 긴 본문의 표 8개·흐름도 2개, 390px 게임플레이 제목 검색 1편과 페이지 가로 넘침 없음을 확인했다. 로그는 .verification/samurai-current-pattern/verify.log에 보관한다. 이번 글 보완은 로컬 변경이며 커밋·push하지 않았다.

## 2026-10-18 DCB 기능 설명 우선 구조와 게시

사용자가 나머지 DCB 기능도 첫 글에서 현재 게임의 동작을 설명하고 그 아래에 분석 글을 두도록 요청했다. 현재 포트폴리오의 다섯 기능을 기준으로 트레버설·장비 조합·급류·환경 화염의 새 기능 설명 네 편을 작성했다. 각 dcb-<기능>-overview는 여러 현재 경로를 종합한 새 안내이므로 작성일 2026-10-18/dateBasis authored를 쓰고, 본문에 소스·설정 확인일과 실행 미검증 범위를 적었다. 초안으로 생성해 검토한 뒤 사용자 게시 요청에 따라 공개 상태로 전환했다.

monster-combat는 이전 턴의 Samurai 설명을 첫 글로 유지하되 기존 DSL·문제 해결·검증 본문을 monster-combat-analysis로 분리했다. 분석 글은 원래 대표 수정 작업의 날짜 2026-08-14/dateBasis commit을 유지한다. 기존 글의 URL·날짜·Home 고정 11편과 상대 순서는 바꾸지 않았다. 기존 분석 글들에는 해당 기능 설명으로 돌아가는 링크를 추가했다. 프로젝트별 기능 목록의 순서는 시리즈 order와 별개다.

DCB HEAD 37fa37df2를 읽기 전용으로 대조했다. 트레버설 진입·이동·접촉/복귀와 입력, 모루의 후보 선택·결합·확정·공간 부족과 임시 인벤토리, 현재 급류 두 프리팹과 재생기, FireZoneV2·자식 효과·대표 프리팹의 표시/재생 정책을 확인했다. 급류는 화면 밖 생략 ON/80m·비대기 OFF이고, 대표 화염은 비 억제 0·거리 기준 45m다. 모든 벽의 자유 등반, 자동 유체 재계산, 화재 전파·연료 게임 규칙, 최신 실기 품질을 구현·검증했다고 확대하지 않는다. 새 Unity 실행·게임 촬영·성능 측정이나 DCB 변경은 하지 않았다.

기능 설정에 overviewSlug를 추가하고 articleSlugs를 분석 목록으로 사용한다. 상세 페이지는 기능 설명 한 편과 구현·분석 글을 별도 영역으로 표시한다. 중복 지정한 설명 글은 분석에 재노출하지 않으며 설명이 초안·삭제돼도 나머지 분석은 유지한다. 전체 글 수는 두 영역을 합산한다. 공개 수는 기능 순서대로 2·3·3·2·2편이다. EDITORIAL에 사용자 구성 기준, WRITING에 필드와 날짜·관리 방법을 적었다. 새 설명 네 편과 분리 분석 한 편이 추가돼 공개 글은 69편이다.

npm run verify 테스트 25개·Astro 33개 파일 진단 0개·94개 HTML 검사와 87개 경로 빌드가 통과했다. 영역 사이 여백을 보완한 후 build와 check:site도 다시 통과했다. 브라우저에서 다섯 기능의 첫 글/분석 순서, 새 다섯 글의 표·흐름도, Home 고정 11편을 확인했다. 390px 장비 목록·긴 화염 본문·그래픽스 검색에 가로 넘침이 없다. 'DCB의 급류' 검색은 기능 설명과 이를 연결한 기존 분석 두 편을 반환한다. 로그는 .verification/dcb-feature-overviews/에 보관한다. origin/main fetch 시 로컬 HEAD와 일치했다. 이번 게시 범위에 이전 로컬 Samurai 보완을 포함하며, 배포 결과는 이 변경의 main push 후 Actions와 공개 페이지에서 별도로 확인한다.

## 2026-10-19 시네마틱 기능 설명 추가

사용자 요청으로 gameplay/dcb-cinematic-overview.md를 작성했다. 현재 VideoClip을 전체 화면 UI로 재생하고 영상 이후의 월드 상태를 맞추는 흐름부터 설명한다. 새 기능 안내이므로 date 2026-10-19/dateBasis authored, DCB 시리즈 order 16을 썼다. 초안으로 생성해 문구·근거를 검토한 뒤 요청한 글 추가의 게시 대상으로 전환했다. 기능 설정에 cinematic/06을 추가하고 overviewSlug로 연결했으며 분석 목록은 아직 비어 있다. 기존 URL·날짜·Home 고정 11편은 유지한다.

DCB HEAD 37fa37df2의 CinematicRegionFeature, CinematicOverlay, PlayerRegion/Driver, GameTimer, GameInputSystem, 카메라 정지 경로, LoseJige와 매복·산성 입구 두 프리팹을 읽기 전용으로 대조했다. 매복은 장애물 묶음 교체·플레이어 재배치·지게 상실·레벨 1 Samurai 2명 생성이며, 산성 입구는 영상만 지정돼 있다. 두 프리팹의 playOnce ON·페이드 0.3초·미등록 대체 3초와 영상 참조를 확인했다. 10월 2일 b7505ca80·7fffb1efd·da504a8a5 이력과 AI 공동 작성, 막대를 손에 남기는 요구를 구분했다. 당시 결과 로그·영상 성공으로 확대하지 않는다.

게임을 멈춘 동안의 unscaled 페이드와 DSP/Unscaled 영상 시계, 입력 차단·버퍼 정리, RenderTexture 표시·해제, 영상 실패 시에도 결과 적용으로 진행하는 정책을 설명했다. 실제 복구는 오브젝트 교체 후·플레이어 재배치 전이므로 페이드가 끝날 때까지 입력을 잠근다고 쓰지 않는다. playOnce는 메모리 상태이고 세이브 연계가 없다. 입력은 Player/Game 활성만 기록하고 Global/UI의 개별 이전 상태를 모두 보존하지 않는다. OnDisable에 StopCoroutine이 없으며 GameObject 비활성화와 컴포넌트 enabled=false를 동일하게 취급할 수 없다는 한계를 Unity 6.3 공식 문서와 대조해 적었다. 이미 적용한 결과의 롤백·전체 결과 트랜잭션·수동 스킵을 구현했다고 설명하지 않는다.

DCB에 기존 씬·설정·기획 WIP가 있었으며 건드리지 않았다. 새 Unity 컴파일·EditMode·Play Mode·영상 디코딩/오디오 동기·실기 화면·성능 측정은 하지 않았다. 원본 영상·모델·애니메이션 제작을 본인 성과로 포함하지 않으며 미디어 파일은 복사하지 않았다. npm run verify 테스트 25개·Astro 33개 파일 진단 0개·96개 HTML 검사와 89개 경로 빌드가 통과했다. 브라우저에서 Home 고정 순서, 여섯 번째 기능과 공개 글 1편/분석 0편, 본문 표 2개·흐름도 1개, 390px 게임플레이 '시네마틱' 검색 1편과 페이지 가로 넘침 없음을 확인했다. 공개 글은 70편이다. 로그는 .verification/dcb-cinematic/에 보관한다. 배포는 이 변경의 main push 후 Actions와 공개 주소에서 별도로 확인한다.

## 2026-10-19 지게 짐의 출렁임과 밧줄 다리 글

사용자가 운반 속도·스태미너보다 짐의 출렁임과 다리의 물리 흔들림 구현을 중심으로 요청했다. gameplay에 jige-cargo-secondary-motion과 rope-bridge-physical-sway 두 글을 초안으로 작성하고 코드·문구를 대조한 뒤 게시 대상으로 전환했다. 작업 기록 중심의 구조 노트이므로 대표 AuthorDate 기준으로 각각 2026-09-22(bd4b806c6), 2026-09-21(ce5cc0dd4)을 쓰고 dateBasis commit·updated 2026-10-19를 지정했다. DCB 시리즈 order 17·18이다. 기능 목록에 07 지게 짐의 출렁임과 08 밧줄 다리의 물리 흔들림을 추가했다. 지게 기능은 새 글을 먼저 두고 기존 jige-carry-burden을 분석으로 연결했다. 기존 운반 글에도 새 글 링크를 넣었다. 기존 URL·작성일·Home 고정 11편과 순서는 유지했다.

DCB HEAD 37fa37df2에서 SecondaryMotionChain, JigeCarrierAttachment/Cargo, Player.Carry/CarryBundle, 피벗·끈 도구와 검사, Carrier_Package/Carrier_Bone1, Model_Wanderer/Wanderer를 읽기 전용으로 대조했다. Bottom·Middle 병렬/Top은 Middle 아래 구조, 틀 다음 짐 Tick, 스프링·부드러운 한계·적재율 결합, 실제 적재율과 애니메이터 강제 0.6의 차이, 적재 충격과 바닥 지게의 시간 기반 복원을 설명했다. 끈 가중치는 초기 기획의 상자 거리 설명을 복사하지 않고 현재 삼각형 표면 거리 코드를 기준으로 썼다. 120Hz·8회 적분의 히치 시간 버림과 별도 틀 적분의 미검증 범위를 구분했다.

다리는 RopeBridgeSway, PlayerController/IGroundCarrier, FootstepAudioPlayer, Bridge_00/05_Shrine, 편집·플레이 검증 도구와 9월 19~21일·10월 2일 이력을 대조했다. 하중·접지·바람 → 네 모드 → 정점/충돌면/표면 속도 연결, 공중 부양·횡이동·끝단 걸림의 원인과 수정 과정을 설명했다. 현재 저장값은 loadSag 0.5m·수직 1Hz·수직 제한 0.35m·걷기 충격 0.8×1.6이며, 이름 기준 판자 26개·난간 52개다. 과거 튜닝 문서와 커밋의 68·80개 검사 결과를 현재 실행 결과로 재사용하지 않는다. 하중 자동 지게 무게 연동·모든 몬스터 자동 등록·Rigidbody/Joint 구조 해석·잡의 완전 비동기 처리로 확대하지 않는다. 다리는 긴 프레임에 제한된 서브스텝으로 전체 시간을 나누므로 짐의 시간 버림과 다르다.

DCB의 기존 씬·설정·기획 WIP는 변경하지 않았다. 새 Unity 컴파일·EditMode·Play Mode·Player·물리 재현·시각/음향 캡처·성능 측정을 실행하지 않았고 과거 원본 로그·영상도 이번에 재확인하지 않았다. 검사 소스·과거 기록·현재 설정을 구분했다. AI 공동 작성과 재사용 모델/애니메이션 범위를 적고 원본 소스·로그·미디어는 옮기지 않았다.

npm run verify 테스트 25개·Astro 33개 파일 진단 0개·100개 HTML 검사·93개 경로 빌드를 통과했다. Home 고정 11편, 여덟 기능의 글 수 2·3·3·2·2·1·2·1, 새 글마다 표 2개·흐름도 1개·수식 오류 없음, 지게의 설명→운반 분석 순서와 다리 설명 1편/분석 0편을 확인했다. 390px 게임플레이 '출렁임' 검색은 새 짐 글과 이를 연결한 기존 운반 글 두 편을 반환하며, 두 새 본문·검색·다리 기능 목록에 가로 넘침이 없다. 공개 글은 72편이다. 로그는 .verification/dcb-secondary-motion/verify.log에 보관한다. main push 후 Actions와 공개 주소를 별도로 확인한다.

## 2026-10-19 CLI 하네스의 비용 배경과 사용 중단 회고

사용자 요청으로 cli-agent-harness의 API→CLI 전환 중심 소개를 API 사용료 부담 때문에 기존 계정의 CLI를 경유한 학습·경험용 개발 배경으로 고쳤다. 요약·도입·선택 이유·기여 설명을 맞추고, 429 오류는 당시 기록을 설명하는 근거 항목으로 옮겼다. 마지막에 '만들어 보며 느낀 점과 지금 사용하지 않는 이유'를 추가했다. 역할별 입력·작업 공간·실패·검증 상태를 연결해 본 경험, 실제 사용 당시 느린 CLI 접근·응답과 반복 대기의 불편, 제작 당시보다 Codex·Claude Code가 좋아져 현재 작업에는 기본 도구로 충분하므로 사용하지 않는다는 사용자 경험을 반영했다. 측정한 지연 수치나 객관적인 최신 제품 비교 결과로 확대하지 않았다. 이 글에만 적용하는 제작 배경·마무리 기준은 EDITORIAL에 적었다.

제목·slug·작성일·분류·공개 설정·Home 고정 순서와 기존 구현 설명은 유지하고 updated를 2026-10-19로 바꿨다. 구현 설명은 10월 17~18일의 조사 기준임을 적었고 이번에는 imjaess 소스 재조사·하네스 테스트·실계정 CLI 호출·성능 비교를 하지 않았다고 구분했다. 다른 저장소는 변경하지 않았다.

npm run verify 테스트 25개·Astro 33개 파일 진단 0개·100개 HTML 검사·93개 경로 빌드가 통과했다. 최종 문구 정리 후 build/check:site도 통과했다. Home 고정 11편의 새 요약, 긴 본문의 표 6개와 마지막 회고, 390px AI 카테고리 'CLI 지연' 검색 1편과 본문·검색 가로 넘침 없음을 확인했다. 로그는 .verification/cli-harness-retrospective/에 보관한다. main push 후 Actions와 공개 주소에서 반영을 별도로 확인한다.

## 2026-10-19 Home 고정 교체와 밸런싱 글 구조

사용자 요청으로 새 content/pins 설정(2026-10-19T01:37:05.000Z)을 저장했다. 기존 jige-carry-burden의 Home 자리에 jige-cargo-secondary-motion을 넣고 rope-bridge-physical-sway를 바로 뒤에 추가했다. 총 12편 중 각각 8·9번이며 나머지 10편의 상대 순서는 유지한다. 이전 고정 JSON은 보존하고 최신 설정으로 덮는다. 글의 pinned 메타데이터는 최신 JSON보다 우선하지 않으므로 본문 메타데이터에 중복 고정 설정을 추가하지 않았다.

이동 속도·스태미너·회복·행동/입력 제약을 별도 기능 gameplay-balancing(09, 게임플레이 밸런싱과 제어)으로 묶었다. dcb-gameplay-balance-overview를 초안으로 작성·검토한 뒤 공개 대상으로 전환해 overviewSlug로 연결했다(date 2026-10-19/authored, DCB order 19). 기존 jige-carry-burden을 짐 출렁임 기능의 articleSlugs에서 새 밸런싱 기능의 분석으로 옮겼다. 기존 글의 URL·작성일·공개 설정은 유지하고 Balancing 태그와 밸런싱 목록 링크를 추가했다. 짐/다리의 물리 표현과 이동/자원/입력 규칙의 차이와 관련 링크는 유지한다.

공개 안내는 기존 운반 글이 10월 17일 확인한 규칙·중립 적재 곡선을 연결하고 후속 범위와 비교 기준을 제시한다. DCB 소스를 새로 조사하거나 밸런스 값을 바꾸고 Unity를 실행한 작업은 아니다. 블로그의 docs/DCB-BALANCING-PLAN.md에 후속 6단계와 근거·기록 기준을, docs/templates/DCB-BALANCE-CASE.md에 초안 작성 양식을 준비했다. 미작성 글의 빈 공개 주소·대량 초안은 만들지 않았다. EDITORIAL과 WRITING에 분류/구성/작성 방법을 적었다.

npm run verify 테스트 25개·Astro 33개 파일 진단 0개·102개 HTML 검사·95개 경로 빌드가 통과했다. 실제 설정 로더와 assert로 고정 12편·새 글 8/9번·기존 운반 제외, 기능 목록 이동을 확인했다. 브라우저에서 Home의 전체 고정 순서, 아홉 기능 글 수 2·3·3·2·2·1·1·1·2, 밸런싱 안내→운반 분석 순서를 확인했다. 새 본문 표 3개와 390px 게임플레이 Balancing 태그+스태미너 검색의 두 글, 본문/검색 가로 넘침 없음을 확인했다. 공개 글은 73편이다. 로그는 .verification/gameplay-balance-pins/에 보관한다. main push 후 Actions와 공개 페이지를 별도로 확인한다.

## 2026-10-19 플레이어 밸런싱 도구 제작 글

사용자 요청으로 tools/player-balance-tuning-tool.md를 초안으로 작성·검토한 뒤 게시 대상으로 전환했다. 대표 커밋 0d4515e04의 AuthorDate로 date 2026-10-02/commit, updated 2026-10-19, DCB order 20을 썼다. 도구 제작 경험이므로 tools에 두고 Balancing 태그와 gameplay-balancing의 두 번째 분석으로 연결했다. 기존 운반 계산 분석과 밸런싱 안내에 관련 링크를 추가했다. 후속 목록에 도구 제작을 2번으로 넣고 규칙 분석(gameplay)과 도구 제작(tools)의 연결 기준을 WRITING과 계획 문서에 적었다. 기존 URL·작성일·Home 고정 12편과 순서는 유지한다.

DCB HEAD 37fa37df2에서 JigeCarryBurdenTunerWindow, GameBalanceCatalog/Runtime/Builder, ReapplyBalanceCatalog, PlayerController의 속도 계측, PlayerNeedSystemBase, 저장 카탈로그와 속성 경로 검사, 10월 1~2일 커밋을 읽기 전용으로 대조했다. 여섯 편집/예측/실측 영역, 맨몸·지게 비교와 단위, 곡선·프리셋·결과 표, 자원 단계 재현 버튼, 같은 에셋/별도 인스턴스/미로드 처리, 시트 B0 임시 변경·재계산·클립보드 복사, 저장·Undo를 설명했다. 0fe68c0b4·7c81a0e9a·0d4515e04의 AI 공동 작성과 담당 범위를 구분한다.

프리셋과 실제 ×1 적재 곡선을 구분했다. 계산 표는 환경/회복 패널티 등 제외 조건이 있고 실측 표시는 차분·평활값이다. 지게 부담 끄기는 스태미너 모드·적재 곡선만 대상으로 하며 모든 기준 속도를 초기화하지 않는다. 'Play 시작' 비교값은 패널이 처음 값을 읽을 때 캡처하고, 카탈로그 검증 메시지가 모든 잘못된 편집의 런타임 적용을 차단하지 않는다는 한계도 적었다. 원본 시트 자동 저장·실험 이력 관리·모든 임시 값 Undo·전체 밸런스 확정 도구로 확대하지 않는다. ApplyModifiedProperties와 SaveAssetIfDirty는 Unity 6.3 공식 문서와 대조했다.

DCB에 기존 씬·설정·기획/지원 문서 WIP가 있었으며 건드리지 않았다. 새 Unity 컴파일·EditMode·GUI·Play Mode·도구 캡처·시트 변경·작업 시간/밸런스 비교를 실행하지 않았다. 검사 소스 확인과 실제 실행을 구분했으며 private 원본 소스·로그·개인 데이터·미디어를 옮기지 않았다.

npm run verify 테스트 25개·Astro 33개 파일 진단 0개·103개 HTML 검사·96개 경로 빌드를 통과했다. 브라우저에서 Home 고정 12편 전체 순서, 밸런싱 안내→운반 분석→도구 분석 순서, 새 본문 표 3개·흐름도 1개·수식 오류 없음과 가로 넘침 없음을 확인했다. 390px 도구와 구조의 '밸런싱 도구' 검색은 새 글 1편을 반환하고 긴 본문에 가로 넘침이 없다. 공개 글은 74편이다. 로그는 .verification/player-balance-tool/에 보관한다. main push 후 Actions와 공개 페이지를 별도로 확인한다.

## 2026-10-19 걷기·달리기·질주와 고갈 후 재입력 분석

사용자 요청으로 gameplay/locomotion-stamina-reinput.md를 초안 작성·근거 검토 후 게시 대상으로 전환했다. 대표 커밋 0fe68c0b4 AuthorDate로 date 2026-10-01/commit, updated 2026-10-19, DCB order 21을 썼다. gameplay-balancing의 세 번째 분석으로 도구 글 다음에 연결하고, 밸런싱 안내·운반 분석·후속 계획에 링크와 상태를 반영했다. 기존 주소·작성일·Home 고정 12편과 순서를 유지했다.

DCB HEAD 488dc55af에서 GameInputSystem/InputActions, Player.Input/Carry/CarryBurden/Attribute/FixedUpdate, PlayerBehaviourStateMachine/StateMachine, PlayerController.BareLocomotion, 카탈로그·부담 계산, 관련 검사 소스와 8e60b380b·0fe68c0b4·54b5b2857 커밋을 읽기 전용으로 대조했다. 대상 코드·카탈로그에는 로컬 diff가 없었다. 맨몸 기본 Run/Shift Sprint와 지게 기본 Walk/Shift Run, 소모 0/10과 0/5, 현재 기준 속도, 착용 전환 때 동일 상태 속도 갱신, 고갈 시 래치 해제→상태 재선택, 고정 스텝 소모로의 변경을 설명했다. DCB의 별도 씬·설정·기획 문서 WIP는 건드리지 않았다.

Ctrl/Shift의 상호 래치 해제로 단순한 물리 키 동시 유지와 걷기 플래그 우선순위가 다름을 구분했다. 패드 L3 토글·스틱 중립, 보따리/무기 전환 예외, 자원 >0 진입 판정과 최소 회복 문턱 없음, 자원 0에서 재입력 시 래치가 남는 경계, 걷기 비용을 켰을 때의 바닥 상태, 실제 변위가 아닌 입력 기준 소모를 적었다. 코드의 오래된 속도 주석 대신 현재 카탈로그를 사용했다. 9월 29일 과거 통과 기록은 당시 범위로 한정하고 원본 보고서를 확보하지 못했음을 밝혔다. 검사 코드의 존재와 이번 통과 결과를 분리했으며, 새 Unity 컴파일·EditMode·Play Mode·키보드/패드 재현·프레임 제한별 비교·체감 평가를 실행하지 않았다. 관련 커밋의 Claude 공동 작성과 기여 범위도 적었다. private 원본 코드·로그·로컬 경로·개인 데이터·미디어를 복사하지 않았다.

npm run verify는 테스트 25개, Astro 33개 파일 진단 0개, 97개 경로 빌드와 104개 HTML 검사를 통과했다. 로컬 브라우저에서 Home 고정 12편과 전체 순서, 밸런싱 안내→운반→도구→재입력 분석 순서를 확인했다. 새 본문의 표 3개·흐름도 1개와 가로 넘침 없음, 390px 게임플레이 Balancing+재입력 검색의 관련 3편 및 모바일 본문 가로 넘침 없음을 확인했다. 공개 글은 75편이다. 로그는 .verification/locomotion-stamina/에 둔다. main push 후 Actions와 공개 경로를 별도로 확인한다.

## 2026-10-19 공격·구르기·패리의 비용과 회복 분석

사용자 요청으로 gameplay/action-stamina-cost-and-recovery.md를 초안으로 작성·검토하고 게시 대상으로 전환했다. 대표 커밋 0fe68c0b4의 AuthorDate로 date 2026-10-01/commit, updated 2026-10-19, DCB order 22를 썼다. gameplay-balancing 네 번째 분석으로 이동 전환 글 다음에 연결하고, 안내·운반·이동 글과 계획에 관련 링크·공개 상태를 반영했다. 기존 URL·작성일·Home 고정 12편과 순서를 유지했다.

DCB HEAD 488dc55af에서 Player의 입력/비용/코루틴/이동 소모, PlayerAttributeController, 장비 StaminaCost 유입, PlayerAnimatorSMB·기본 Wanderer 컨트롤러 연결, ParryWindowSMB, ModelController 상태, 카탈로그·속성 프리팹과 검사 소스를 읽기 전용으로 대조했다. becdc4ee0·881770612·98f164068·8780d4612·0fe68c0b4의 diff·작성 시각으로 회복 도입, Roll 시작 실패 복구, 패리 확장, 무기 비용 선택, 착용·적재 배율을 구분했다. 관련 코드·카탈로그의 로컬 diff가 없었으며 DCB의 별도 WIP는 건드리지 않았다.

무기 양수 비용 우선·기본10 복귀, 맨몸1/지게1.2/적재곡선1, 전체 비용 확보가 아닌 >0 진입·0 제한, Animator 상태 진입 차감과 입력/적중의 차이를 설명했다. Roll의 비용 전 snapshot 복원·시작 실패0.3과 회복 지연0.3의 분리, 탈출 전환 시작과 방향 정리 종료의 차이, 타이머 재시작과 FixedUpdate 회복 게이트를 추적했다. 패리에는 CancleSprint의 지연 시작 뒤 코루틴의 중단/종료 재개 호출이 없고, 이동 소모 제외에도 패리 플래그가 없음을 확인했다. 이를 실제 패리 중 회복·소모를 관찰한 결과로 쓰지 않았다. 기존 운반 글의 세 행동 공통 종료 재개 설명을 바로잡고 링크했다. 게임 코드 수정은 없으며 새 Unity 컴파일·EditMode·Play Mode·무기별 차감/회복 타이밍·중단/환불·패드 재현을 실행하지 않았다. 관련 커밋의 AI 공동 작성과 직접 다루는 범위, 독립 계산 예시도 구분했다. private 전체 코드·로그·로컬 경로·개인 데이터·미디어를 옮기지 않았다.

npm run verify는 테스트 25개·Astro 33개 파일 진단 0개·98개 경로 빌드·105개 HTML 검사를 통과했다. 브라우저에서 Home 고정 순서, 밸런싱 설명→운반→도구→이동→행동 분석 순서, 새 본문의 표 4개·흐름도 1개와 가로 넘침 없음을 확인했다. 390px 게임플레이 Balancing+구르기 시작 실패 검색은 안내/새 글 2편이며, 본문 표와 페이지에도 가로 넘침이 없다. 공개 글은 76편이다. 조사·검사 기록은 .verification/action-stamina/에 둔다. main push 후 Actions와 공개 글·목록을 별도로 확인한다.

## 2026-10-19 배고픔·갈증의 보정 수치 보완

사용자 요청으로 기존 행동 비용·회복 글에 배고픔·갈증의 수치와 적용 경로를 추가했다. 별도 새 글은 만들지 않고 원래 slug·date/commit·order 22를 유지했다. 밸런싱 안내에는 현재 수치 요약표, 도구 글에는 상세 분석 링크, 계획의 네 번째 분석에는 Needs 범위를 반영했다. 기능의 분석 순서와 Home 고정 12편은 유지한다.

DCB HEAD 488dc55af에서 PlayerNeedSystemBase/Hunger/Thirst, PlayerStat 수정자 곱셈, CharacterStatus, PlayerNeedBalance·저장 카탈로그, Player 생성/질주 통지/직접 체력 피해와 0d4515e04·c49fadd92를 읽기 전용으로 대조했다. 관련 소스·카탈로그 diff가 없었고 별도 게임 WIP는 건드리지 않았다. 절대 문턱 <=25/10, 회복 시간 각×2.1·동시×4.41, 허기 운반 한도×0.7·갈증 속도×0.8, 각0 체력2/초·동시 합계4/초, 감소2.5/1.5·활동4/3·질주+과적5.5/4.5를 설명했다. 시간 배율과 회복량의 역수, 지게 걷기0.48 중첩, 행동 비용/지연을 직접 바꾸지 않음, 플레이어 무게 한도와 지게 화물 용량의 구분을 적었다. 최대100/회복5초 예시는 계산 가정이며 실측이 아니다.

단계별 기본 능력치 보정0과 근성 완화 함수0, 적용/해제·같은 단계 변경 재적용, 로비 자연 감소/체력 피해 제외와 저자원 보정 유지, 일반 지게 달리기와 질주 통지 차이를 구분했다. 오래된 50/25·미연동 주석 대신 현재 코드·저장값을 사용했다. GameBalanceCatalogTests 소스를 읽었지만 새 Unity 컴파일·검사·Play Mode·단계 전환/회복 중첩/과적/0자원 피해·사망/로비 재현은 실행하지 않았다. private 원본 코드·로그·로컬 경로·개인 데이터·미디어를 옮기지 않았다.

npm run verify 테스트 25개·Astro 33개 파일 진단 0개·98개 경로 빌드·105개 HTML 검사를 통과했다. 브라우저에서 Home 고정 순서, 상세 글 표6개·도식1개, 안내의 새 수치표와 가로 넘침 없음을 확인했다. 390px 게임플레이 Balancing+배고픔 검색은 안내/상세2편이며 모바일 본문 표·페이지에 가로 넘침이 없다. 공개 글은 76편으로 유지한다. 기록은 .verification/needs-balance/에 둔다. main push 후 Actions와 공개 본문·표를 별도로 확인한다.

## 2026-10-22 날짜·커밋 인용 제거와 지원용 카드 재구성

사용자 요청으로 DCB 글 23편과 지원용 데이터에서 커밋 해시와 정확한 날짜를 근거로 쓴 문장을 제거했다. 해시는 모두 지우고 작업 이력 표는 `순서` 열로 바꿨으며, "N월 N일 … 대조했다"류의 출처 문장은 삭제하거나 "당시 기록·이후·이번 보강" 같은 상대 표현으로 바꿨다. 검사 건수·수치·식별자·링크는 유지했고, Git 절차를 설명하는 "커밋"(워크트리 글의 체리픽·커밋 범위, 지원용 AI 절차 문구)만 남겼다. 수정일 frontmatter는 건드리지 않았다. 지원용 verificationNote의 Unity 패치 버전·D3D11 표기도 함께 뺐다.

지원용 포트폴리오 카드의 구성을 바꿨다. `PortfolioCase`는 `problem·approach·contribution·evidence·limitation` 대신 `intro`(게임에서 보이는 동작), `implementation`(구현 방식 3항목), `role`(내 역할)을 가지며, 카드는 소개·구현·내 역할과 링크만 보여 준다. 링크는 `kind`로 게임에서의 동작 / 구현 기록 / 구현하며 생긴 문제를 구분하고, 문제 링크는 `anchor`로 해당 글의 문제 절(IK 레이 실패, 모루 프리뷰 소실, 물 반복 전환 비용)에 바로 연결하며 강조 스타일을 준다. 문제 해결 과정과 확인 범위는 카드에서 빼고 연결된 글에 둔다. 불 사례는 문제 글이 없어 동작·구현 기록 두 링크만 있다.

## 2026-10-22 장황한 부분 축소

사용자 요청으로 글·절 길이와 반복을 측정해 장황한 지점을 보고한 뒤, 제안한 다섯 가지 축소를 적용했다. 사실과 수치는 유지했다. (1) 행동 비용·회복 글의 배고픔·갈증 절을 표 두 개와 짧은 문단으로 압축하고 끝 절의 9행 재현 표를 검사 이름 문단과 목록 5개로 바꿨다. (2) 장비 UI 이펙트 글의 실습 1~3과 풀이를 삭제하고 JavaScript 예제와 출력만 남겼으며 제목을 "독립 예제"로 바꿨다. (3) FSM 전환 글의 확인 범위 표 7행을 3행으로, 몬스터 분석 글과 이동 재입력 글의 재현 표를 목록으로 압축했다. (4) 지원용 페이지의 `verificationRows` 표를 제거하고 사례에 없는 공통 실행 근거(10월 19일 배치 Editor 시작·재시작 기록)만 `verificationNote` 문단으로 남겼다. (5) Samurai 그룹 전투 글의 거리·시간·가중치 수치를 "현재 저장값" 표 하나로 모으고 본문은 흐름만 남겼다. 수정한 글의 updated는 2026-10-22다. 게시는 사용자 확인 뒤에 한다.

## 2026-10-22 AI 문체 분석과 대표 글·지원용 카피 수정

사용자 요청으로 DCB 글 25편과 지원용 포트폴리오 카피를 문장 단위로 분석해 AI가 쓴 티가 나는 패턴 10가지(면책 문장 비율, 날짜·커밋 해시의 감사 문체, 메타 문장, 중점 명사 나열, 균일한 리듬, 추상 명사, 1인칭 부재, 로그 수치의 소수점, 보일러플레이트 반복, 제목 틀)를 측정값과 함께 보고했다. 분석 스크립트와 결과는 세션 임시 폴더에만 두고 저장소에는 넣지 않았다.

이어서 `src/data/krafton-2027.ts`의 사례 카피 5개(트레버설·전투·장비·물·불)와 IK 트레버설·Samurai 그룹 전투·물 캐시 재생 세 글의 도입부와 끝 절을 고쳤다. 기준은 면책은 끝의 기록 표 한 곳, 날짜·커밋은 표로, 첫 문장은 현상이나 결과, 중점 나열은 한 문장에 둘까지, 1인칭 결정 문장 복원, 소수점 반올림, 문장 길이 변주다. 사실·수치·기여 구분은 유지했고 새 성과나 감정을 넣지 않았다. 물 글은 CPU 표를 소수점 첫째 자리로 반올림하고 검증 기록 세 소절을 표 하나와 목록으로 합쳤다. 세 글의 updated는 2026-10-22다. 게시는 사용자 확인 뒤에 하기로 했다.

## 2026-10-19 기여 범위 표와 소개 페이지

사용자가 인사담당자 관점의 DCB 글 검토를 요청했고, 그 결과를 바탕으로 기여 문장을 표로 바꾸는 작업과 소개 페이지 작성을 요청했다. 먼저 물 캐시 재생·Behavior→FSM·워크트리 세 글의 기여 절을 `| 구분 | 내용 |` 표로 교체했다. 행은 직접 정한 요구·조건·판단, AI를 사용한 것, 재사용 자산·외부 도구로 나눈다. 표의 내용은 각 글과 인수인계에 이미 있던 사실만 재배치했고 새 기여를 추가하지 않았다. 세 글의 slug·작성일·공개 상태·고정 순서는 유지하고 updated를 2026-10-19로 바꿨다. 나머지 DCB 글의 기여 절은 아직 문장 형태다.

소개 페이지 `src/pages/about.astro`를 새로 만들어 상단 메뉴에 **소개**를 추가하고, `/about` 리다이렉트를 제거했으며 `/profile`은 `/about/`으로 연결한다. sitemap에 `/about/`을 넣었다. 페이지는 이름·위치·연락, 다루는 분야 표, DCB 소개와 담당 범위, 먼저 읽을 글 3편(IK 트레버설·Samurai 그룹 전투·물 캐시 재생), AI 사용 방식, 블로그 구성을 `~합니다`체로 적는다. 학력·연락처·DCB 기간·구성은 파일 상단 `profile` 객체가 비어 있어 표시하지 않으며, 사용자가 확정한 사실을 채우면 표시된다. 2026년 10월 초 삭제된 이전 Profile 페이지의 자기평가 문구는 다시 쓰지 않았다. WRITING에 소개 페이지 관리 방법을 적었다.

npm run verify의 테스트 25개·Astro 진단 0개·100개 경로 빌드·106개 HTML 검사를 통과했다. 로컬 공개 빌드에서 소개 페이지의 데스크톱 표시, 390px 모바일 문서 폭 375px·가로 넘침 없음, 상단 메뉴의 소개 항목, `/profile/`의 `/about/` 이동과 세 글의 기여 표를 확인했다. 커밋·push는 하지 않았다.

## 2026-10-19 인벤토리 무게·갈증·물속 이동 보정 중첩

사용자 요청으로 gameplay/movement-speed-modifier-stacking.md를 초안 작성·검토 후 게시 대상으로 전환했다. 대표 커밋 b07aab272의 AuthorDate로 date 2026-09-26/commit, updated 2026-10-19, DCB order 23을 썼다. gameplay-balancing 다섯 번째 분석으로 행동 비용·회복 글 다음에 연결하고 안내·운반·행동 글과 계획에 관련 링크·상태를 반영했다. 기존 URL·작성일·Home 고정 12편과 순서를 유지한다.

DCB HEAD 488dc55af에서 PlayerInventoryInfo의 두 목록·조합 파츠 무게 합산, 속성 컨트롤러 초기 계산/무게/한도 리스너, RuntimeStat/PlayerStat, WeightMoveSpeedCalculator와 실제 속성 프리팹, Thirst/Needs, PlayerWadingSlowdown/WadingSlowdown, 수역 등록/접촉, footstep와 Wanderer 자식 프리팹, PlayerController·루트 모션과 관련 검사·커밋을 읽기 전용으로 대조했다. 대상 코드·프리팹 diff가 없었으며 별도 게임 WIP는 건드리지 않았다. 74673a3e2·7682ce084·b07aab272·0fe68c0b4로 무게→스탯 연결·원인별 곱셈·물 배율·적재 확장을 구분했다.

기준 속도×무게×갈증×적용 물×적재의 곱, 동일 키 교체·개별 제거·상태 전환 후 보정 유지, 코드 p6/h12와 실제 p20/h20 차이, 허기로 한도 축소 시 무게 곡선의 간접 변화를 설명했다. 물 수심0.02·무릎 기준/실측 대체·걸음/방향/물살, 최초 적용/큰 이동 즉시 반영과 시상수0.25 평활, 출수 목표1과0.999 해제·데이터 교체 정리를 구분했다. 순수 함수 상한1.1과 실제 해제 조건을 나눠 최대10% 가속을 단정하지 않고, 물 하한0.33을 전체 속도 하한으로 쓰지 않았다. 예시 무게110/한도100·물0.6과 별도 계산 결과는 실측이 아님을 밝혔다. 스탯/램프/명령 속도/실제 변위, 표면 실림·애니메이션·소음·루트 모션 경계를 설명했다.

새 Unity 컴파일·EditMode·Play Mode·최신 다중 보정 속도/해제/소음/발 접지·씬 수역 검증을 실행하지 않았다. 기존 물 검사와 당시 통과 기록은 현재 전체 중첩 검증으로 확대하지 않았다. 물·운반의 AI 공동 작성과 기여 범위를 구분했고 private 전체 코드·로그·로컬 경로·개인 데이터·미디어를 복사하지 않았다.

npm run verify 테스트 25개·Astro 33개 파일 진단 0개·99개 경로 빌드·106개 HTML 검사를 통과했다. 브라우저에서 Home 고정 순서와 기능 설명→운반→도구→이동→행동→중첩 분석 순서를 확인했다. 새 본문 표5개·도식1개·가로 넘침 없음, 390px 게임플레이 Balancing+0.71855 본문 검색의 새 글1편과 모바일 표/페이지 폭을 확인했다. 공개 글은 77편이다. 기록은 .verification/movement-speed-stacking/에 둔다. main push 후 Actions와 공개 글·목록을 별도로 확인한다.

## 2026-10-19 영어 메뉴와 Reading 목록

사용자 요청으로 공통 상단 메뉴를 Home·About·Portfolio·Writing·GitHub, 모드 전환을 View·Edit로 바꿨다. 주제 이름은 Gameplay·Graphics·Tools & Systems·AI Collaboration·Notes·Mathematics·Reading으로 표시한다. 지원용 포트폴리오 상단 메뉴도 영어로 맞췄고 본문은 한국어를 유지한다. 기존 페이지 구성과 Home 고정 순서는 유지했다.

새 Reading 주제(`/topics/reading/`)는 책 제목·저자·완독일(선택)·짧은 감상을 목록으로 보여주고 개별 독서 메모로 연결한다. 책 제목·저자·감상·본문 검색과 URL 검색어 유지를 지원한다. 완독일이 없으면 작성일을 ‘기록’으로, 감상이 없으면 기존 description을 ‘기록 요약’으로 표시한다. 공개된 시지프 신화 글만 reading 폴더/주제로 옮기고 책 제목·저자 메타데이터를 추가했다. 날짜·slug·본문·보관 원본은 유지하며 새 감상이나 완독 사실을 만들지 않았다. 날짜 조사/이관 문서의 파일 경로를 함께 갱신했다. 예전 `/book/`은 Reading으로 연결한다.

Edit의 ‘독서 기록 추가’ 또는 Topic Reading 선택으로 책 입력란을 연다. book.title은 필수이고 author·finished·note는 선택이며 note는 최대 280자다. 짧은 감상은 목록과 본문 상단에 표시한다. GitHub 작성과 CLI 모두 같은 필드를 받아 kind reading·draft true로 생성하며, 본문에는 추가 독후감용 절을 둔다. 잘못된 완독 날짜·빈 책 제목·길이 제한을 검사하고 실제 저장은 기존 GitHub 인증 편집 흐름을 사용한다. 사이트에서 인증 정보는 수집하지 않는다.

npm run verify의 테스트 35개·Astro 42개 파일 진단 0개·102개 경로 빌드·108개 HTML 검사를 통과했다. 이후 /book 연결 변경의 재빌드에서 한 차례 .astro 임시 파일 rename EPERM이 발생했으며 재시도한 build와 check:site는 통과했다. 브라우저에서 Home, 긴 하네스 본문, Reading 목록/저자 검색/검색 결과 없음, Edit의 독서 필드 및 주제 전환, 일반 검색의 Reading 태그 범위, 390px 모바일 목록·검색·양식·긴 글·지원용 상단 메뉴의 가로 넘침 없음을 확인했다. /book/의 실제 Reading 이동도 확인했다. 화면은 `.verification/reading-navigation/reading-desktop.png`에 보관한다. 커밋·push·배포는 하지 않았다.

## 2026-10-20 영어 메뉴·Reading 게시 검토와 현재 글 편집

사용자 요청으로 영어 메뉴와 Reading 문구·동작을 다시 검토하고 게시 대상으로 정했다. 글 본문 상단의 Edit는 실제 article.filePath로 만든 GitHub /edit/main 경로를 새 탭으로 연다. slug에서 파일명을 추정하지 않으므로 Reading으로 옮긴 글과 파일명·slug가 다른 글도 같은 경로 검증을 사용한다. Home·글 목록의 Edit는 기존 관리 화면, DCB 소개의 Edit는 영상 설정을 유지한다. GitHub 로그인·쓰기 권한·Commit changes로 저장하며 사이트는 인증 정보를 수집하지 않는다.

빌드 검사는 공개 글 모두의 Edit가 실제 원본 경로·새 탭·noopener noreferrer를 사용하는지 확인한다. 작업 트리의 npm run verify에서 테스트 35개·Astro 42개 파일 진단 0개·102개 경로 빌드·108개 HTML 검사를 통과했다. 게시할 파일만 분리한 빌드와 브라우저 확인 후 main에 push하고 같은 커밋의 Actions·공개 페이지를 확인한다. 별도 소개 페이지·기여 표·촬영 계획·포트폴리오 계획의 로컬 작업은 이번 게시에 포함하지 않는다.


게시 결과: 이번 요청의 26개 파일을 f57a6debae204d9682faaa29732a2408956d9c1f로 main에 push했다. 분리한 게시 대상은 테스트 35개·Astro 41개 파일 진단 0개·101개 경로 빌드·108개 HTML 검사를 통과했다. 같은 커밋의 Actions https://github.com/imjae/imjae.github.io/actions/runs/39337818283 이 success이며, 공개 Reading 목록·카뮈 검색·Reading 작성 양식·시지프와 트래버설 본문의 실제 원본 Edit 링크를 확인했다. 실제 Edit 클릭은 GitHub 로그인 화면으로 열렸고 return_to가 트래버설 파일의 /edit/main 주소임을 확인했다. 로그인 후 본문 편집·저장은 실행하지 않았다. 작업 트리와 origin/main의 커밋 차이는 0/0이며 별도 소개·기여 표·촬영/포트폴리오 계획 WIP는 남겼다. 공개 화면은 `.verification/reading-publish/reading-live.png`에 보관한다.

## 2026-10-20 노션 독서 기록 이관

사용자 요청으로 독서 폴더·독서 데이터베이스와 Clean Code·C#·게임수학의 책 기록을 조사했다. 30권을 Reading으로 묶고 실제 독서·관람 메모는 8편(시지프 기존 글 보완 1편, 새 글 7편), 감상 미작성 목록은 22권으로 정리했다. 시지프는 기존 날짜 2024-02-23·slug·Jekyll 원문을 유지하며 노션 생성일 2023-09-22를 별도 출처로 남겼다. 죄와벌 2/죄와벌(1~3)은 하나의 목록으로 합쳤다. 눈물을 마시는 새 감상은 고도를 기다리며 관람기에서 해당 책으로 모아 연결했다. 노션 원문은 변경하지 않았다.

작성일은 중심 원문 생성일로 확인했다. 일반 페이지 40건은 created_date_range를 좁힌 후 같은 날짜 조회로 확인했고, DB 2건은 createdTime UTC를 한국 날짜로 변환했다. 관람일 2023-12-22와 관람기 생성일 2023-12-24, 비극의 탄생 목차 2023-03-10과 실제 1장 메모 2024-01-09를 구분했다. 근거와 책별 처리는 docs/READING-MIGRATION.md·json에 남기고 ARTICLE-DATES에도 새 7편을 추가했다. 책 인용·예제 코드는 요약으로 정리했으며, 실제 감상이 없는 페이지에서 경험·완독일을 만들지 않았다. C#·게임수학은 책 목록으로 연결하고 장별 기술 내용을 다시 복제하지 않았다.

제목·저자만 있는 항목은 content/reading-list JSON 컬렉션으로 관리한다. Reading은 이 목록과 공개 글을 slug로 합쳐 한 번만 보여주고 전체 권수·실제 메모 수를 나눈다. Writing/RSS에는 실제 글만 포함한다. 감상 남기기는 책 제목·저자·주소를 채운 새 글 양식으로 연결하고, 감상을 게시하면 목록을 대체한다. 읽기 목록과 새 글은 초안으로 시작한 뒤 원문 대조·문구 검토를 마치고 사용자 이관 요청의 게시 대상으로 전환했다. 기존 About·기여 표·촬영/포트폴리오 계획 WIP는 게시 대상에서 제외한다.

작업 트리에서 테스트 38개·Astro 진단 0개·109개 경로 빌드·115개 HTML 검사를 통과했다. 이후 추가한 개발서 두 항목까지 포함한 선택 빌드와 브라우저를 확인한 뒤, main push·동일 커밋 Actions·공개 Reading을 별도로 확인한다. 첫 빌드에서 같은 basename의 .mjs/.ts 모듈 선택 충돌을 발견해 서버 로더를 reading-shelf.server.ts로 명확히 나눴다.

선택한 게시 대상에서도 테스트 38개·Astro 43개 파일 진단 0개·108개 경로 빌드·115개 HTML 검사를 통과했다. 브라우저에서 30권/메모 8편/감상 미작성 22권, 죄와벌 원래 제목 검색 1건, 감상 남기기의 제목·저자·slug 채움과 빈 감상, 390px 필터·본문 날짜·Reading 본문 검색과 가로 넘침 없음, Home 고정 12편을 확인했다. source-digest와 검증 로그는 .verification/notion-reading/에 보관한다.

## 2026-10-20 ShrineZone 조명·안개와 돌탑 기도 초안

사용자가 GameScene의 ShrineZone 에디터 화면을 전달하고 빛·안개 연출과 돌탑·나무 상호작용 글을 추가하도록 요청했다. graphics/shrine-light-and-fog.md와 gameplay/shrine-prayer-interaction.md 두 편을 date 2026-10-20/authored, DCB order 24·25, draft true로 추가했다. 서로 연결하고 촬영 계획에 CAP-14·15와 사례별 지시를 추가했다. 기존 촬영 우선순위·다른 로컬 WIP는 유지한다. 새 글은 공개 기능 목록에 연결하지 않은 로컬 초안이다.

DCB imjae HEAD 09a951625의 GameScene_01 → 05_Shrine → 지역 조명·안개/기도 트리거·축복 프리팹을 읽기 전용으로 대조했다. 기본 체크아웃의 미커밋 씬 변경도 포함해 인스턴스 오버라이드를 확인했으며 게임 파일은 수정하지 않았다. 조명 글은 안개 전용 조명의 확산/정반사 OFF·볼류메트릭 ON, 3D 밀도·축별/거리 페이드, Multiply 걷어내기와 존의 크기 덮어쓰기, 저작 도구와 현재 WaterRendering만 저장된 ShrineMoodVolumeProfile의 차이를 설명한다. 상호작용 글은 구역 진입·체류·재진입, 존 회전 0.5초, 입력/무적/루트 모션/레이어와 카메라 복구, 명시된 나무/기도 트리거 연결, 모션 시간에 따른 나무·수면·몸 잔광과 소리를 설명한다. 나무 2200·수면 364·streamShare 0.36은 설정값이며 측정 성과가 아니다. onBlessingBurst 저장 호출 목록이 비어 있어 회복·버프·영구 보상과 물리 돌 적층을 완료로 소개하지 않았다.

첨부 에디터 화면은 구간 식별에만 사용했고 공개 미디어로 복사하지 않았다. Unity 컴파일·EditMode·Play Mode·Player·청음·성능 측정·새 게임 촬영은 하지 않았다. 구현 당시 직접 기여·AI 보조와 재사용 자산 출처는 공개 전 원기록과 함께 보완할 항목으로 남겼다. private 전체 소스·로컬 경로·개인 데이터는 본문에 넣지 않았다.

현재 작업 트리의 npm run verify는 테스트 46개·Astro 44개 파일 진단 0개·110개 경로 빌드·116개 HTML 검사를 통과했다. 새 두 slug가 공개 경로·HTML·검색 데이터·RSS·sitemap 어디에도 없는 것을 별도 검사했다. 브라우저에서 공개 Home 고정 12편, 긴 물 본문, 새 두 글의 표 각 3개·도식 각 1개와 초안 표시·상호 링크를 확인했다. 390px 새 본문의 문서/스크롤 폭은 375px로 가로 넘침이 없으며 공개 검색 ShrineZone은 0건, RMC는 기존 2건이다. 로그·화면은 .verification/shrine-drafts/에 보관한다. 검증은 기존 별도 WIP를 포함한 작업 트리 기준이며 커밋·push·배포하지 않았다. 4330 로컬 dev의 상호작용 초안 미리보기를 남긴다.

## 2026-10-20 DCB 실제 촬영·편집 초안

사용자의 직접 촬영 요청으로 별도 DCB 배치 Editor에서 실제 게임을 실행하고 대표 영상 90초와 ShrineZone 영상 26초를 로컬 MP4로 만들었다. 앞 절의 새 촬영 미실시 기록 이후에 진행한 작업이다. 두 파일은 1920×1080 H.264/AAC이며, 길이·양쪽 스트림과 전체 디코딩 오류 없음·대표 프레임·한글 자막을 확인했다. 청음·사용자 승인·공개 재생 검증은 하지 않았다. 미디어·편집 타임코드·촬영 조건·원본·비공개 로그는 git에서 제외된 media-inbox에 보관한다. 글의 draft 상태와 공개 영상 등록은 유지했다.

대표본에는 지게·다리·SideStep·파츠 조합·지게 막대 전투·물·불·Shrine 전경·기도를 넣었다. Climb·StepUp 실패 테이크는 제외했다. 조합은 촬영용 카탈로그 파츠를 준비한 별도 시연이며, 장착·드랍·회수·저장 재실행이나 조합한 검의 전투를 증명하지 않는다. 일부 컷은 30fps 고정 시뮬레이션 렌더로 만들었으므로 실행 성능 근거로 쓰지 않는다. 장비 UI는 밝기를 보정했으며 HUD 중첩이 남는다. 세부 범위와 첨부 전 단계는 DCB-CAPTURE-PLAN.md의 로컬 촬영 초안 절을 따른다.

촬영용 Editor는 종료하고 배치 슬롯을 원래 기준과 맞춘 뒤 claim을 반납했다. 촬영 도구는 별도 Git 브랜치와 비공개 미디어 폴더에 보관했고, 원본 작업용 Unity에는 적용하지 않았다. 이번 촬영 후 블로그 커밋·push·배포는 하지 않았다.


## 2026-10-21 DCB 전체 소개·기능별 영상 재설계

사용자가 기존 90초 대표본을 다시 구성하고 오늘 포트폴리오 각 부분의 영상도 마무리하려 하여, `docs/DCB-VIDEO-STORYBOARD-20261021.md`에 새 컨셉·컷별 시간·촬영 순서·선별 기준·본문 연결 위치를 작성했다. 현재 기준 링크만 `DCB-CAPTURE-PLAN.md` 상단에 추가하고 기존 CAP 번호·촬영 조건·10월 20일 기록은 그대로 보존했다. 기존 문서의 미커밋 변경은 되돌리지 않았다.

전체본은 지게를 멘 인물의 산길 이동 → 한 번의 지형 통과 → 적 발견과 막대 꺼내기 → 수동 전투 → 자세 복귀·수납·보행 → 다리 → 신사 자동 진입·기도 → 이동 재개의 약 110초 게임플레이 소개다. 적은 약 21초에 제시하고 트레버설은 한 동작만 완결한다. 전투는 사용자 직접 촬영이며, 지게를 진 채 Tab으로 막대를 꺼내는 현재 조작과 종료 뒤 Idle·Move 복귀를 반영했다. 기도 회전·연출에 17초와 종료·이동에 7초를 배정하되 실제 동작이 길면 시간표보다 완결을 우선한다.

기본 산출물은 전체본 1개와 전투 42초·트레버설 42초·장비 조합/실제 장착 40초·물 25초·불 25초의 상세본 5개다. 현재 여섯 영상 슬롯과 공개 글 위치에 대응하며 새 URL을 만들지 않았다. 짐·다리·신사 원본은 본편용 필수 촬영, 그 원본의 독립 편집본 16초·18초·32초와 조합 UI 12초는 추가 추출로 구분했다. 장비 조합 결과를 지게 막대 전투와 같은 무기로 연결하지 않으며 신사 두 글은 draft true를 유지한다.

새 실행·촬영·편집 파일 생성·청음·업로드·본문 영상 등록·커밋·push·공개는 하지 않았다. 문서 검토에서 MAIN 10개 구간의 연속성과 합계 110초, 상대 파일 링크 17개를 확인했다. 기존 WIP를 포함한 작업 트리에서 `npm run verify`의 테스트 46개 통과, Astro 44개 파일 오류·경고·힌트 0개, 110개 경로 빌드와 116개 HTML 검사를 통과했다. 로그는 `.verification/storyboard-20261021/verify.log`다. 사이트 코드·본문·영상 등록 변경이 없어 새 브라우저 시각 검증은 수행하지 않았다.
