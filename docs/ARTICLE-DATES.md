# 전체 글의 날짜 조사

2026-10-18 사용자 요청으로 공개 글 62편과 초안 1편, 총 63편의 본문과 출처를 대조했다. 56편의 작성일을 원문·작업 이력 기준으로 바꿨다. 글 주소, 본문, 실행 검증의 과거 날짜와 공개 상태는 유지했다.

## 날짜를 고른 기준

- 노션을 옮긴 46편은 본문에서 중심 원문으로 먼저 제시한 페이지의 생성일을 사용했다. 보조 자료는 별도로 기록하고, 더 오래되었다는 이유만으로 중심 원문을 바꾸지 않았다.
- 작업 기록 기반 10편은 본문 내용에 해당하는 대표 커밋의 AuthorDate를 한국 날짜로 변환했다. 체리픽·리베이스·병합의 CommitDate와 구분했다. 관련 없는 최신 커밋은 선택하지 않았다. 여러 변경을 묶은 글은 본문에서 다룬 중심 변경과 마무리 기록을 함께 대조했다.
- 새로 작성한 학습 글·블로그 목차·아직 빈 초안 5편은 블로그 초판 작성일을 유지했다. 비슷한 제목의 노션 메모를 새 글의 원문이라고 추정하지 않았다.
- Jekyll 원본 2편은 2024년 2월 23일과 기존 주소를 유지했다.
- 작성일을 바꾼 글에는 이번 수정일을 updated로 기록했다. 글 화면의 ‘노션 원문’·‘작업 기록’ 날짜와 수정일을 구분해 과거에 현재 예제나 검사를 실행했다는 인상을 피한다.

## 노션 생성일 확인 방법과 한계

현재 연결 도구의 fetch는 마지막 수정일을 제공하지만 원시 생성 시각을 제공하지 않는다. 마지막 수정일을 작성일로 대용하지 않았다. Notion의 지원되는 created_date_range 검색 조건으로 범위를 좁히고, 시작일·종료일을 같은 날짜로 설정해 해당 페이지 자체가 검색되는지 확인했다. 이 과정에서 본문이 참조한 노션 70개의 생성일을 확인했다.

노션 날짜는 연결 도구의 생성일 조건에 해당하는 일자다. 원시 생성 시각과 시간대 정보가 없어 별도의 시각 변환을 했다고 주장하지 않는다. Git은 ISO 시각과 오프셋을 확보했으므로 Asia/Seoul 변환을 적용했다. 노션 원문과 다른 프로젝트의 파일은 수정하지 않았다.

## 전체 63편

| 글 | 이전 날짜 | 반영 날짜 | 날짜 기준 | 대표 근거 |
| --- | --- | --- | --- | --- |
| [API 호출을 Codex CLI로 바꾼 로컬 AI 하네스](../content/articles/ai/cli-agent-harness.md) | 2026-10-17 | 2026-05-21 | 커밋 작성일 | imjaess `e85ea6222` |
| [Git 워크트리로 AI 작업을 병행하고 통합한 과정](../content/articles/ai/parallel-ai-worktrees.md) | 2026-10-17 | 2026-10-02 | 커밋 작성일 | DCB `f638b2ae5` |
| [AI를 사용한 구현과 검증 과정](../content/articles/ai/working-with-ai.md) | 2026-10-17 | 2026-10-02 | 커밋 작성일 | DCB `f638b2ae5` |
| [Behavior Tree의 Sequence·Selector·Running과 중단](../content/articles/gameplay/behavior-tree-running-abort.md) | 2026-10-17 | 2022-04-08 | 노션 생성일 | [Behavior Tree (행동 트리)](https://app.notion.com/p/314d3083c419405287541604be499729) |
| [FSM의 Enter·Execute·Exit와 전이·중단 규칙](../content/articles/gameplay/fsm-transition-interruption.md) | 2026-10-17 | 2022-03-22 | 노션 생성일 | [FSM (유한 상태 머신)](https://app.notion.com/p/08e6af888c814d488d7692a7be55b8eb) |
| [IK 트레버설 구현: StepUp, Climb, SideStep](../content/articles/gameplay/ik-traversal.md) | 2026-10-17 | 2026-10-02 | 커밋 작성일 | DCB `20a7acfc4` |
| [지게 운반의 이동 속도와 스태미너 계산 구조](../content/articles/gameplay/jige-carry-burden.md) | 2026-10-17 | 2026-10-02 | 커밋 작성일 | DCB `c2ea50f96` |
| [몬스터 행동 DSL과 그룹 전투 구현](../content/articles/gameplay/monster-combat.md) | 2026-10-17 | 2026-08-14 | 커밋 작성일 | DCB `b7c32b18b` |
| [AA 방식과 움직일 때의 계단·흐림·잔상 비교](../content/articles/graphics/anti-aliasing-static-motion.md) | 2026-10-17 | 2024-05-05 | 노션 생성일 | [Anti-aliasing](https://app.notion.com/p/1481dc86e8024d2eab5f23ebd7dfcb35) |
| [Bloom과 노출을 분리해서 발광 조절하기](../content/articles/graphics/bloom-exposure-emission.md) | 2026-10-17 | 2024-05-05 | 노션 생성일 | [Bloom](https://app.notion.com/p/3bc274ba4f974068b1e661f6eecac793) |
| [노이즈 임계값으로 Dissolve와 발광 경계 만들기](../content/articles/graphics/dissolve-threshold-edge.md) | 2026-10-17 | 2024-11-06 | 노션 생성일 | [소환](https://app.notion.com/p/1363b61361d180ae960af8f2997b8266) |
| [불 이펙트의 레이어와 품질 단계](../content/articles/graphics/fire-vfx.md) | 2026-10-17 | 2026-10-01 | 커밋 작성일 | DCB `4d8926e73` |
| [GLFW·GLAD·컨텍스트와 첫 렌더 루프 만들기](../content/articles/graphics/opengl-context-render-loop.md) | 2026-10-17 | 2023-06-14 | 노션 생성일 | [2-1, OpenGL](https://app.notion.com/p/053f9f0c4fc24fe98807fb8f7bddec11) |
| [텍스처 반복·필터링·mipmap을 같은 조건에서 비교하기](../content/articles/graphics/opengl-filtering-mipmaps.md) | 2026-10-17 | 2023-06-25 | 노션 생성일 | [2-6, Textures](https://app.notion.com/p/09cffc4abe964bc89989e30e866b84ae) |
| [GLSL 컴파일·링크 오류와 uniform 갱신](../content/articles/graphics/opengl-shader-errors-uniforms.md) | 2026-10-17 | 2023-06-20 | 노션 생성일 | [2-5, Shaders](https://app.notion.com/p/361921119b954fb2ad51834ff987c002) |
| [텍스처 객체·텍스처 유닛·sampler와 이미지 포맷](../content/articles/graphics/opengl-texture-units-formats.md) | 2026-10-17 | 2023-06-25 | 노션 생성일 | [2-6, Textures](https://app.notion.com/p/09cffc4abe964bc89989e30e866b84ae) |
| [VBO·VAO·EBO와 정점 속성의 stride·offset](../content/articles/graphics/opengl-vertex-layout-stride-offset.md) | 2026-10-17 | 2023-06-17 | 노션 생성일 | [2-4, Hello Triangle (2)](https://app.notion.com/p/f2adc4fc52d14d0a92646d015dd1b2d2) |
| [OpenGL 학습 기록: 정점 버퍼에서 텍스처 혼합까지](../content/articles/graphics/opengl-vertex-texture-pipeline.md) | 2026-10-17 | 2026-03-11 | 커밋 작성일 | LearnOpenGL `bc9d85f98` |
| [화면 텍스처 왜곡과 충격파: UV 오프셋부터 계산하기](../content/articles/graphics/screen-distortion-shockwave-uv.md) | 2026-10-17 | 2024-11-06 | 노션 생성일 | [왜곡](https://app.notion.com/p/1363b61361d18071a8fac0a1efe06f70) |
| [Spine 텍스처의 PMA·Straight Alpha·색 공간 맞추기](../content/articles/graphics/spine-alpha-color-space.md) | 2026-10-17 | 2024-07-05 | 노션 생성일 | [스파인 텍스처 알파값 설정](https://app.notion.com/p/03524cd5da6e474b985ca057f71420b4) |
| [Spine 마스크의 머티리얼 복제로 배칭이 나뉜 문제](../content/articles/graphics/spine-mask-material-batching.md) | 2026-10-17 | 2024-05-02 | 노션 생성일 | [스파인 드로우콜 최적화](https://app.notion.com/p/5ee92b3fd3044af2b3d6fa6ad875a07f) |
| [텍스처를 여러 번 샘플링해 블러 만들기](../content/articles/graphics/texture-blur-kernel-texel.md) | 2026-10-17 | 2024-11-06 | 노션 생성일 | [블러](https://app.notion.com/p/1363b61361d18028bb07c5df82b4689d) |
| [물의 깊이와 지형 접점 확인](../content/articles/graphics/water-depth-study.md) · 초안 | 2026-10-17 | 2026-10-17 | 새 글 작성일 | 블로그 `a47810e` |
| [물 캐시 재생과 메시 업로드](../content/articles/graphics/water-playback.md) | 2026-10-17 | 2026-09-27 | 커밋 작성일 | DCB `fd5397e1c` |
| [카메라의 기준축과 LookAt 행렬 만들기](../content/articles/math/camera-basis-lookat.md) | 2026-10-17 | 2023-07-05 | 노션 생성일 | [2-9, 카메라](https://app.notion.com/p/196f7909977640da8373586d4b5f1bfa) |
| [함수·합성·역함수와 되돌릴 수 없는 계산](../content/articles/math/functions-composition-inverse.md) | 2026-10-18 | 2022-10-02 | 노션 생성일 | [2.2.1 함수의 개념과 종류](https://app.notion.com/p/2d95780ade1342629bb221766e365a2f) |
| [게임 수학 읽기 순서: 수와 함수부터 좌표·회전까지](../content/articles/math/game-math-reading-order.md) | 2026-10-18 | 2026-10-18 | 새 글 작성일 | 블로그 `ac1ee74` |
| [Local·World·View·Clip·NDC·Screen 좌표를 구분하기](../content/articles/math/local-world-clip-ndc-screen.md) | 2026-10-17 | 2023-07-04 | 노션 생성일 | [2-8, 좌표 시스템](https://app.notion.com/p/de3bfcadaeb84991918d744a9b1bd553) |
| [이동·회전·크기 행렬과 변환 순서 직접 계산하기](../content/articles/math/matrix-transform-order.md) | 2026-10-17 | 2023-07-01 | 노션 생성일 | [2-7, 변환(Transformations)](https://app.notion.com/p/7cac09ec960344eba90c283a115cfbf7) |
| [캐릭터 방향과 이동 벡터를 같은 좌표계로 맞추기](../content/articles/math/movement-facing-coordinate-space.md) | 2026-10-17 | 2023-12-12 | 노션 생성일 | [오브젝트 회전](https://app.notion.com/p/2ff48514531147a7a34e83370aa3dca8) |
| [수직선과 부동소수점: 이동·배율·오차](../content/articles/math/number-line-floating-point.md) | 2026-10-18 | 2022-10-02 | 노션 생성일 | [2.1.3 수의 표현](https://app.notion.com/p/2bf395fb8bbd40c99c99b08259348c83) |
| [수의 집합과 연산: 닫힘·항등원·역원·체](../content/articles/math/number-sets-operations-field.md) | 2026-10-18 | 2022-10-02 | 노션 생성일 | [2.1.1 연산과 수의 구조](https://app.notion.com/p/d0916a57c8954e04b6ad538dd92c38b4) |
| [평면 방정식과 반공간으로 앞뒤·거리·영역 판정하기](../content/articles/math/plane-equation-halfspaces.md) | 2026-10-18 | 2022-01-20 | 노션 생성일 | [공간의 수학 : 게임수학의 개요](https://app.notion.com/p/b03c7afde7414da1aa32aa7495570a70) |
| [시간에 따른 포물선 운동과 일정 가속도](../content/articles/math/projectile-parabola-time.md) | 2026-10-18 | 2022-01-20 | 노션 생성일 | [포물선 공식](https://app.notion.com/p/d6a79b1acc034bf28e8cee0e3e4b919f) |
| [쿼터니언의 축·각과 회전 합성 순서](../content/articles/math/quaternion-rotation-composition.md) | 2026-10-18 | 2022-01-20 | 노션 생성일 | [벡터 수학](https://app.notion.com/p/3835c49926f740bd9e79034a7159c7a0) |
| [삼각형의 방향·넓이·무게중심 좌표와 보간](../content/articles/math/triangle-barycentric-interpolation.md) | 2026-10-18 | 2022-01-20 | 노션 생성일 | [물체의 수학 2 : 삼각형과 정점](https://app.notion.com/p/7441463202a1429db96c6dfd7b8c7bd8) |
| [삼각함수·라디안·Atan2로 방향과 각도 구하기](../content/articles/math/trigonometry-radians-atan2.md) | 2026-10-18 | 2022-05-23 | 노션 생성일 | [float Atan2(float y, float x)](https://app.notion.com/p/0d0b5038df1d42739da82697eb1967d4) |
| [벡터의 길이·정규화·내적·외적을 게임 판정에 쓰기](../content/articles/math/vector-length-dot-cross.md) | 2026-10-17 | 2022-01-20 | 노션 생성일 | [벡터 수학](https://app.notion.com/p/3835c49926f740bd9e79034a7159c7a0) |
| [벡터 공간·선형 결합·기저와 좌표의 의미](../content/articles/math/vector-space-basis-coordinates.md) | 2026-10-18 | 2022-10-10 | 노션 생성일 | [3장, 벡터: 가상 공간의 탄생](https://app.notion.com/p/c488dcc264164a06bca0f64667d1e1f7) |
| [자료구조 선택하기: 배열, List, Dictionary, HashSet, Queue, Stack](../content/articles/notes/data-structures-collections.md) | 2026-10-17 | 2026-10-17 | 새 글 작성일 | 블로그 `6e5d39f` |
| [동적 배열과 List의 확장·삭제 구현](../content/articles/notes/dynamic-array-list-growth-removal.md) | 2026-10-17 | 2026-10-17 | 새 글 작성일 | 블로그 `14be2a0` |
| [DynamoDB의 Partition Key·Sort Key와 조회 패턴 설계](../content/articles/notes/dynamodb-keys-query-patterns.md) | 2026-10-17 | 2022-01-20 | 노션 생성일 | [DynamoDB 설계 예시](https://app.notion.com/p/71571eaafa394f82849288319a59d906) |
| [HTTP 요청·응답·실패·취소를 작업 API로 이해하기](../content/articles/notes/http-response-failure-cancellation.md) | 2026-10-17 | 2022-01-18 | 노션 생성일 | [HTTP](https://app.notion.com/p/3427b0bc1ead41f8bb221b8868318552) |
| [노션 학습 기록에서 이어 읽는 게임 개발 글 37편](../content/articles/notes/notion-study-reading-order.md) | 2026-10-17 | 2026-10-17 | 새 글 작성일 | 블로그 `4e27313` |
| [React useEffect로 작업 상태를 동기화하고 정리하기](../content/articles/notes/react-effect-task-cleanup.md) | 2026-10-17 | 2022-01-18 | 노션 생성일 | [useEffect 완벽 가이드_1](https://app.notion.com/p/3801f85868094581b9dff3ed27f52826) |
| [시지프 신화 독서 메모](../content/articles/reading/the-myth-of-sisyphus.md) | 2024-02-23 | 2024-02-23 | 기존 작성일 | 보관한 Jekyll 원본 |
| [TypeScript interface와 실행 중 데이터 검증을 구분하기](../content/articles/notes/typescript-interface-runtime-validation.md) | 2026-10-17 | 2022-01-18 | 노션 생성일 | [타입스크립트의 Interface 정리](https://app.notion.com/p/b6213ce8acbb45958e96077a6fc2f8c4) |
| [Jekyll 블로그 게시 테스트](../content/articles/notes/welcome-to-jekyll.md) | 2024-02-23 | 2024-02-23 | 기존 작성일 | 보관한 Jekyll 원본 |
| [Addressables 카탈로그 옵션을 줄이기 전에 확인할 것](../content/articles/tools/addressables-catalog-key-options.md) | 2026-10-17 | 2023-09-11 | 노션 생성일 | [어드레서블 관리 팁](https://app.notion.com/p/eb44c410f42b451f95252113acb3cb4f) |
| [Addressables 커스텀 빌드 스크립트의 호출 단계](../content/articles/tools/addressables-custom-build-stages.md) | 2026-10-17 | 2024-03-23 | 노션 생성일 | [빌드 커스텀 스크립트](https://app.notion.com/p/e1094b62f6c645f7898e95507eaac7d1) |
| [Addressables 로드 핸들의 수명과 해제 책임](../content/articles/tools/addressables-handle-lifetime.md) | 2026-10-17 | 2023-11-08 | 노션 생성일 | [TIP](https://app.notion.com/p/8196f0c10b5f4eeb87e032069ba1a1ea) |
| [스크립트와 Addressables 콘텐츠의 버전 호환성](../content/articles/tools/addressables-player-content-compatibility.md) | 2026-10-17 | 2023-09-11 | 노션 생성일 | [어드레서블 관리 팁](https://app.notion.com/p/eb44c410f42b451f95252113acb3cb4f) |
| [AssetBundle 구조와 LZMA·LZ4의 로딩 비용 비교](../content/articles/tools/assetbundle-compression-costs.md) | 2026-10-17 | 2023-08-24 | 노션 생성일 | [에셋 번들](https://app.notion.com/p/c1c544d92c454f0a885da23da70dc918) |
| [Azure DevOps로 Addressables 콘텐츠를 빌드·배포한 과정](../content/articles/tools/azure-devops-content-build-deploy.md) | 2026-10-17 | 2023-12-12 | 노션 생성일 | [Azure DevOps CI/CD 구현](https://app.notion.com/p/6b4009e0624e4162bb05136e0834261b) |
| [CSS Grid·Flex와 긴 코드·표의 가로 넘침 해결](../content/articles/tools/css-grid-flex-overflow.md) | 2026-10-17 | 2022-01-18 | 노션 생성일 | [#2.XX GRID](https://app.notion.com/p/8dfcc5f9dfbc416793d07aafc3126f3a) |
| [2D·3D 장비 파츠 조합 구현](../content/articles/tools/modular-equipment.md) | 2026-10-17 | 2026-08-11 | 커밋 작성일 | DCB `c28411403` |
| [오브젝트 풀의 생성·대여·반환과 중복 반환 방지](../content/articles/tools/object-pool-lease-return.md) | 2026-10-17 | 2022-01-20 | 노션 생성일 | [Object Pool](https://app.notion.com/p/b26c1a9fb20b49e8927453549cba2030) |
| [태그를 고정한 다중 저장소 checkout으로 빌드 입력 맞추기](../content/articles/tools/tag-pinned-multi-repo-checkout.md) | 2026-10-17 | 2024-04-29 | 노션 생성일 | [서브모듈 적용](https://app.notion.com/p/e06c1f59bc814ee8ad82aadb813cd34b) |
| [직접 참조·Resources·AssetBundle·Addressables 선택하기](../content/articles/tools/unity-asset-loading-choices.md) | 2026-10-17 | 2023-08-29 | 노션 생성일 | [에셋 관리](https://app.notion.com/p/a7922dd7d82444628d80f8575ce3a141) |
| [Unity 배치 빌드가 끝나지 않을 때: 종료 인수와 첫 빌드 비용](../content/articles/tools/unity-batch-exit-cold-build.md) | 2026-10-17 | 2024-04-29 | 노션 생성일 | [빌드 시간 초과](https://app.notion.com/p/49a3baf2d6c64db48bb2c54dc3615c0b) |
| [Unity CI에서 라이선스 메시지와 패키지 다운로드 실패를 구분한 과정](../content/articles/tools/unity-ci-package-download-failure.md) | 2026-10-17 | 2024-04-29 | 노션 생성일 | [어드레서블 버전](https://app.notion.com/p/ab1b0ca0622b4514b3926b4a0fd82fe1) |
| [Unity에서 클라우드 데이터에 접근할 때의 인증·SDK 경계](../content/articles/tools/unity-cloud-auth-sdk-boundary.md) | 2026-10-17 | 2021-12-17 | 노션 생성일 | [Amazon DynamoDB 연동 테스트](https://app.notion.com/p/490a8b0a1d9f4859919f48fa9a6a36f0) |
| [화면 좌표를 월드로, 월드 위치를 UI로 옮기기](../content/articles/tools/unity-screen-world-ui-coordinates.md) | 2026-10-17 | 2022-03-17 | 노션 생성일 | [UGUI](https://app.notion.com/p/2dedcd0be37142609e6e076c6d6aef76) |

## 근거 데이터와 검증

[날짜 근거 데이터](ARTICLE-DATES.json)에 63편의 이전·반영 날짜, 선택 이유, 중심·보조 노션 페이지, Git 작성·반영 시각을 기록했다. 비공개 저장소의 원본 코드·작업 로그·작성자 연락처·로컬 경로는 포함하지 않는다. 상세 조회 응답과 범위 탐색 기록은 ignored `.verification/article-dates/`에 보관한다.

날짜 기록과 현재 글의 메타데이터, 노션의 선택된 생성일, 커밋 작성 시각의 한국 날짜 변환을 테스트한다. 사이트 검사에서 목록·RSS·sitemap·내부 링크·초안 제외를 확인하고 브라우저에서 표시와 정렬을 확인한다.

`npm run verify`의 테스트 11개, Astro 24개 파일의 진단 0개, 빌드와 82개 HTML 검사를 통과했다. 별도 검사로 63편의 본문·slug·공개 상태와 관련 없는 메타데이터가 유지됐음을 대조했다. 공개 빌드의 62편 날짜·출처 표시·수정일, Home·목록·RSS 정렬과 피드의 날짜, sitemap의 기존 주소와 초안 제외도 확인했다. Home, 긴 하네스 글의 Mermaid, Spine 원문·수정일 표시, 390px 모바일 검색과 날짜 정렬을 브라우저에서 확인했고 가로 넘침은 없었다.
