---
title: "노션 학습 기록에서 이어 읽는 게임 개발 글 37편"
description: "노션 이전 후보의 문제 해결·수학·OpenGL·Unity·웹·백엔드 글을 순서대로 연결한다. 독립 예제의 확인 범위와 실제 프로젝트 검증을 구분한다."
slug: "notion-study-reading-order"
date: "2026-10-17"
topic: "notes"
kind: "note"
tags: ["Study", "Unity", "OpenGL", "Verification"]
draft: false
---

## 이 목록으로 공부하는 순서

노션에 정리한 자료에서 고른 37개 주제를 블로그 글로 구성했다. 먼저 작성한 문제 해결 사례 다섯 편 뒤에 벡터·UI·OpenGL을 잇고 Unity 동작·자원 관리, 그래픽스 효과와 웹·백엔드로 이어진다. 각 글에는 개념, 새 예제, 실습과 풀이, 확인 범위를 적었다.

이번 목록은 노션 이전 후보 37개를 다룬다. 프로젝트 전체의 189개 기술 학습 후보는 별도 목록에서 후속 주제로 관리한다. 각 글에서 실제 프로젝트 작업과 독립 학습 예제의 범위를 확인할 수 있다.

OpenGL을 처음 시작한다면 N14의 컨텍스트 준비를 먼저 한 뒤 N04로 돌아온다. 행렬이 낯설다면 N15를 N08보다 먼저 읽어도 된다. 자료구조는 [컬렉션 선택](/writing/data-structures-collections/) → [동적 배열·List의 확장과 삭제](/writing/dynamic-array-list-growth-removal/) 순으로 별도 연결했다.

| 순서 | 글 | 분류 |
| --- | --- | --- |
| 1 | [Spine 마스크의 머티리얼 복제로 배칭이 나뉜 문제](/writing/spine-mask-material-batching/) | 그래픽스 |
| 2 | [Azure DevOps로 Addressables 콘텐츠를 빌드·배포한 과정](/writing/azure-devops-content-build-deploy/) | 도구와 구조 |
| 3 | [Unity CI에서 라이선스 메시지와 패키지 다운로드 실패를 구분한 과정](/writing/unity-ci-package-download-failure/) | 도구와 구조 |
| 4 | [태그를 고정한 다중 저장소 checkout으로 빌드 입력 맞추기](/writing/tag-pinned-multi-repo-checkout/) | 도구와 구조 |
| 5 | [오브젝트 풀의 생성·대여·반환과 중복 반환 방지](/writing/object-pool-lease-return/) | 도구와 구조 |
| 6 | [벡터의 길이·정규화·내적·외적을 게임 판정에 쓰기](/writing/vector-length-dot-cross/) | 학습 메모 |
| 7 | [화면 좌표를 월드로, 월드 위치를 UI로 옮기기](/writing/unity-screen-world-ui-coordinates/) | 도구와 구조 |
| 8 | [VBO·VAO·EBO와 정점 속성의 stride·offset](/writing/opengl-vertex-layout-stride-offset/) | 그래픽스 |
| 9 | [GLSL 컴파일·링크 오류와 uniform 갱신](/writing/opengl-shader-errors-uniforms/) | 그래픽스 |
| 10 | [텍스처 객체·텍스처 유닛·sampler와 이미지 포맷](/writing/opengl-texture-units-formats/) | 그래픽스 |
| 11 | [텍스처 반복·필터링·mipmap을 같은 조건에서 비교하기](/writing/opengl-filtering-mipmaps/) | 그래픽스 |
| 12 | [Local·World·View·Clip·NDC·Screen 좌표를 구분하기](/writing/local-world-clip-ndc-screen/) | 그래픽스 |
| 13 | [직접 참조·Resources·AssetBundle·Addressables 선택하기](/writing/unity-asset-loading-choices/) | 도구와 구조 |
| 14 | [GLFW·GLAD·컨텍스트와 첫 렌더 루프 만들기](/writing/opengl-context-render-loop/) | 그래픽스 |
| 15 | [이동·회전·크기 행렬과 변환 순서 직접 계산하기](/writing/matrix-transform-order/) | 그래픽스 |
| 16 | [카메라의 기준축과 LookAt 행렬 만들기](/writing/camera-basis-lookat/) | 그래픽스 |
| 17 | [FSM의 Enter·Execute·Exit와 전이·중단 규칙](/writing/fsm-transition-interruption/) | 게임플레이 |
| 18 | [Behavior Tree의 Sequence·Selector·Running과 중단](/writing/behavior-tree-running-abort/) | 게임플레이 |
| 19 | [캐릭터 방향과 이동 벡터를 같은 좌표계로 맞추기](/writing/movement-facing-coordinate-space/) | 게임플레이 |
| 20 | [Addressables 로드 핸들의 수명과 해제 책임](/writing/addressables-handle-lifetime/) | 도구와 구조 |
| 21 | [AssetBundle 구조와 LZMA·LZ4의 로딩 비용 비교](/writing/assetbundle-compression-costs/) | 도구와 구조 |
| 22 | [Addressables 카탈로그 옵션을 줄이기 전에 확인할 것](/writing/addressables-catalog-key-options/) | 도구와 구조 |
| 23 | [스크립트와 Addressables 콘텐츠의 버전 호환성](/writing/addressables-player-content-compatibility/) | 도구와 구조 |
| 24 | [Addressables 커스텀 빌드 스크립트의 호출 단계](/writing/addressables-custom-build-stages/) | 도구와 구조 |
| 25 | [Unity 배치 빌드가 끝나지 않을 때: 종료 인수와 첫 빌드 비용](/writing/unity-batch-exit-cold-build/) | 도구와 구조 |
| 26 | [Spine 텍스처의 PMA·Straight Alpha·색 공간 맞추기](/writing/spine-alpha-color-space/) | 그래픽스 |
| 27 | [화면 텍스처 왜곡과 충격파: UV 오프셋부터 계산하기](/writing/screen-distortion-shockwave-uv/) | 그래픽스 |
| 28 | [텍스처를 여러 번 샘플링해 블러 만들기](/writing/texture-blur-kernel-texel/) | 그래픽스 |
| 29 | [노이즈 임계값으로 Dissolve와 발광 경계 만들기](/writing/dissolve-threshold-edge/) | 그래픽스 |
| 30 | [AA 방식과 움직일 때의 계단·흐림·잔상 비교](/writing/anti-aliasing-static-motion/) | 그래픽스 |
| 31 | [Bloom과 노출을 분리해서 발광 조절하기](/writing/bloom-exposure-emission/) | 그래픽스 |
| 32 | [React useEffect로 작업 상태를 동기화하고 정리하기](/writing/react-effect-task-cleanup/) | 학습 메모 |
| 33 | [TypeScript interface와 실행 중 데이터 검증을 구분하기](/writing/typescript-interface-runtime-validation/) | 학습 메모 |
| 34 | [CSS Grid·Flex와 긴 코드·표의 가로 넘침 해결](/writing/css-grid-flex-overflow/) | 도구와 구조 |
| 35 | [DynamoDB의 Partition Key·Sort Key와 조회 패턴 설계](/writing/dynamodb-keys-query-patterns/) | 학습 메모 |
| 36 | [HTTP 요청·응답·실패·취소를 작업 API로 이해하기](/writing/http-response-failure-cancellation/) | 학습 메모 |
| 37 | [Unity에서 클라우드 데이터에 접근할 때의 인증·SDK 경계](/writing/unity-cloud-auth-sdk-boundary/) | 도구와 구조 |

## 예제와 확인 범위를 읽는 방법

수치·콘솔 예제의 성공은 그 함수나 모델의 확인이다. Unity의 에셋·Animator·씬, GPU의 실제 셰이더·화면, Azure·AWS의 계정·서비스 실행과 같은 뜻으로 읽지 않는다. 미실행 항목은 각 글 끝에 적었다. 실습에서 제시한 예상 결과도 실제 캡처·측정값과 구분했다.

새 글의 짧은 코드는 원리를 설명하는 구간일 수 있다. 해당 글에서 요구하는 컨텍스트·패키지·호출자와 소유권 조건을 먼저 준비한다. 외부 환경이 필요한 실습은 전용 샘플에서 수행하고 기존 프로젝트의 캐시·권한·데이터를 임의로 바꾸지 않는다.

노션의 긴 번역문·외부 그림·비공개 소스를 통째로 복제하지 않았다. 공식 문서를 대조하고 설명·표·예제를 새로 구성했으며 작성과 검사에 AI를 사용했다.
