# 노션에서 블로그로 옮길 글 후보

2026년 10월 17일 연결된 노션과 현재 블로그를 대조했다. **집필 후보 37개: P1 13개, P2 22개, P3 2개**를 정리했다. 아래 제목은 제안이며 진행 상태는 개별 항목에 기록한다. 후속 요청에 따라 37개 후보를 모두 글로 작성·검토해 공개했다. [공개 학습 목차](https://imjae.github.io/writing/notion-study-reading-order/)에서 순서대로 읽을 수 있다.

문제 해결 경험을 먼저 보강하려면 **Spine 마스크 배칭(N13) → Azure 콘텐츠 CI(N10) → 패키지 다운로드 실패 분석(N12) → 다중 저장소 checkout(N11) → 오브젝트 풀(N01)** 순서가 적합하다. 개념 학습용으로는 벡터(N02), UI 좌표(N03), OpenGL 버퍼·셰이더·텍스처(N04~N08)의 활용도가 높다.

이는 노션 자료의 이전 우선순위다. 기존에 합의한 자료구조 학습 순서를 바꾸지 않는다. 동적 배열 A02도 게시했고, 자료구조 학습은 이후 A03부터 이어갈 수 있다. [기술 학습 목록](TECH-STUDY-ROADMAP.md)의 21개 영역·189개 후보에 아래 37개를 단순히 더하지 않는다. 대부분 기존 ID에 사용할 자료이며, Spine·Azure의 구체적인 과거 사례와 DynamoDB는 확장 범위를 표시했다.

## 확인한 범위와 판단 기준

- 노션 페이지·색인 107건을 가져왔으며, 그중 기술 관련 문서의 구조와 본문을 중심으로 비교했다. 최상위 목록과 개발·그래픽스·Unity·디자인 패턴·수학·DevOps·웹·일부 게임 백엔드 하위 문서, 검색으로 찾은 관련 페이지를 대상으로 했다. 긴 강의 노트는 목차와 필요한 본문을 중심으로 확인했으며 모든 문장을 기술 감수한 것은 아니다.
- 현재 저장소의 공개 글 13개와 초안 2개, [작성 계획](DCB-WRITING-PLAN.md), [기술 학습 목록](TECH-STUDY-ROADMAP.md)을 대조했다. “계획에 있음”과 “이미 공개됨”을 구분했다.
- 원문의 이미지 자체, 첨부 파일, 일부 외부 블록은 확인하지 않았다. Design Pattern/Technic, Spine 텍스처 알파값 설정, Hello Window는 커넥터가 일부 블록 누락을 표시했다. 확인한 본문으로 후보를 판단했으며 누락 자료를 근거로 결과를 만들지 않았다.
- 하네스 작업 데이터베이스는 색인·구조만 확인했다. 전체 작업 행과 세션 기록은 조회하지 않아 새로운 하네스 성과를 추출했다고 볼 수 없다.
- 현재 작업에서 Unity·C++·셰이더·클라우드 서비스를 실행하거나 성능을 측정하지 않았다. 노션에 적힌 당시 관찰과 이번에 확인한 자료의 존재를 구분한다.
- C# 문법 입문, 개인 일정·연락처·편지 등은 후보에서 제외했다. 기존 블로그 카테고리만 사용하며, 주제별 연결은 시리즈로 한다.

| 우선순위 | 의미 |
| --- | --- |
| P1 | 본문이나 문제 해결 기록이 충분하고 기존 프로젝트·학습 글과 연결이 강하다. 먼저 집필 준비를 할 자료다. |
| P2 | 주제는 유용하지만 기술 설명 수정, 버전 정리, 실행 예제·비교 자료 추가가 많이 필요하다. |
| P3 | 연결은 가능하지만 원문이 짧거나 현재 환경·인증 구조를 새로 확인할 비중이 크다. |

P1도 바로 게시할 수 있다는 뜻은 아니다. 실제 글에는 개념 → 최소 예제 → 프로젝트 연결 → 실습 → 풀이 → 확인 범위를 넣는다. 과거 업무·학습 자료와 DCB의 현재 구현을 섞지 않는다. 책·공식 튜토리얼·외부 가이드의 요약은 원 출처를 확인하고 자신의 설명·예제·그림으로 다시 구성한다.

## 기존 글에 합칠 내용

| 노션 자료 | 중복되는 글 | 처리와 보완 |
| --- | --- | --- |
| [간단한 자료구조 BigO](https://app.notion.com/p/9df347cca9e14fe3b825e6f9480fd110) | [자료구조 선택하기](../content/articles/notes/data-structures-collections.md), [동적 배열 초안](../content/articles/notes/dynamic-array-list-growth-removal.md) | 이미지 두 장 중심이다. 별도 Big-O 글로 복제하지 않는다. 이미지 내용은 미감수이며 필요한 설명은 직접 만든 연산 수 표로 보강한다. |
| [최적화](https://app.notion.com/p/0b093dce460e45c4adcf69fbd6ed4cec) | 동적 배열 초안의 Count·Capacity·사전 용량 | List 용량 설명은 A02에 합친다. 나머지 Transform·LINQ·Mathf 등의 비용 단정은 측정 없이 옮기지 않는다. 필요하면 P08의 측정 실습 자료로 새로 작성한다. |
| OpenGL 시작하기·삼각형·셰이더·텍스처 노트 | [OpenGL 학습 기록](../content/articles/graphics/opengl-vertex-texture-pipeline.md) | 공개 글은 현재 코드·이력·미확인 항목의 개요로 유지한다. N04~N08·N14~N16은 독립 실행 예제와 실습을 제공하는 후속 글로 연결한다. 한국어·영어 노트를 병렬 시리즈로 중복 이전하지 않는다. |
| [시지프 신화](https://app.notion.com/p/557923c1a4d04d05b3a09102179997ec) | [시지프 신화 독서 메모](../content/articles/notes/the-myth-of-sisyphus.md) | 같은 책·장과 내용이 겹친다. 새 글보다 기존 글 보완을 검토한다. 긴 번역문·인용을 통째로 이전하지 않고 원래 날짜·slug와 보관 원본을 유지한다. |
| [tag](https://app.notion.com/p/66eae1edfd844e51a74378c5e9ad6e99) | Git 기초 Q01, N10·N11의 버전 고정 | Pro Git 설명을 옮긴 성격이 강하다. 독립 복제 글을 만들지 않고 태그 생성·조회·checkout 실습과 원 출처를 필요한 글에 넣는다. |
| [하네스DB](https://app.notion.com/p/3673b61361d18042a44bcd0e4a34f06c) | [CLI 하네스](../content/articles/ai/cli-agent-harness.md), [AI 병행 작업](../content/articles/ai/parallel-ai-worktrees.md) | 색인만으로 새 사례를 만들지 않는다. 향후 선택한 작업 행·실패·수정·검사 증거를 확인한 뒤 기존 글 보완 또는 R 영역 상세 글을 판단한다. |
| [Expect](https://app.notion.com/p/eae1a37260704b02a83dd482463ab88a) | 스키마·Vitest 검사 R11 | Expect 일부와 하위 링크만 확인했다. 현재 프로젝트의 검사 도구와 실패 사례를 중심으로 새 예제를 만들고, matcher 번역 목록을 별도 글로 복제하지 않는다. |
| [그래픽스 API](https://app.notion.com/p/ed57dc25e642462ab07eeac7b8b55d81), [렌더링 파이프라인](https://app.notion.com/p/15684a8e7e0f436da96a3a138ff6bf2e) | 렌더링 기초 K01·OpenGL U01·N08 | API 노트는 배경 설명으로 활용한다. 렌더링 파이프라인 노트는 도입 정도여서 완성 글로 취급하지 않는다. 기존 OpenGL과 필요한 그래픽스 기초 절에 합친다. |

## P1 먼저 집필할 후보

### N01 오브젝트 풀의 생성·대여·반환과 중복 반환 방지

- 진행: [게시 완료](https://imjae.github.io/writing/object-pool-lease-return/), `d635da1`. 본문의 순수 C# 컴파일·실행과 별도 32개 검사·고정 시드 연산 1,000회 확인. Unity 컴파일·콜백·씬 종료·성능은 미검증. 원문을 버그 수정 완료 기록으로 취급하지 않는다.
- 분류: `tools` · 기존 학습 목록: E04·E05·M05
- 원문: [Object Pool](https://app.notion.com/p/b26c1a9fb20b49e8927453549cba2030)
- 중복 판단: 장비 파츠·불 이펙트 글에 풀 사용이 등장하지만, 풀 자체의 계약을 설명하는 학습 글은 없다. 자료구조 글의 Queue·Stack 설명을 선행으로 연결한다.
- 가져올 내용: Dictionary와 Queue를 사용한 사전 생성, SpawnFromPool, OnDisable 반환, CancelInvoke 등의 예제가 있다.
- 보완·검증: 작은 독립 예제로 다시 작성한다. OnDisable과 명시 반환이 겹치는 이중 반환, 이벤트·타이머·참조 초기화, 최대 크기와 파괴 정책을 실습한다. 과거 Queue 구현과 DCB의 현재 풀 구조를 동일하다고 쓰지 않는다.

### N02 벡터의 길이·정규화·내적·외적을 게임 판정에 쓰기

- 진행: [게시 완료](https://imjae.github.io/writing/vector-length-dot-cross/), 벡터·동적 배열 공개 커밋 `14be2a0`. 순수 C# 예제·수치 검사 49개 항목·고정 시드 벡터 쌍 1,000개 확인. Unity·DCB·GPU·성능은 미검증.


- 분류: `notes` · 기존 학습 목록: B01·B02
- 원문: [벡터 수학](https://app.notion.com/p/3835c49926f740bd9e79034a7159c7a0), [벡터의 내적과 외적](https://app.notion.com/p/cc2887ab622b4f378e2d09d8a6604bca), [물체의 수학 3: 벡터의 내적과 외적](https://app.notion.com/p/6eb70c7ac1964221b1271b9196b91e3d)
- 중복 판단: 몬스터·IK·OpenGL 글에서 사용하는 수학의 선행 설명이다. 노션의 벡터 관련 세 페이지는 한 묶음으로 합쳐 중복을 줄인다.
- 가져올 내용: 거리와 방향, 정규화, 시야각 판정, 평면과 카메라 축을 설명한 본문이 있다.
- 보완·검증: 영벡터와 정규화 조건, 내적의 범위·각도, 외적의 순서를 명확히 한다. 직접 그린 그림, 수치 계산, 시야 판정과 법선 실습·풀이를 넣는다. 책에서 옮긴 설명과 그림은 출처를 확인하고 독립 예제로 다시 쓴다.

### N03 화면 좌표를 월드로, 월드 위치를 UI로 옮기기

- 진행: [게시 완료](https://imjae.github.io/writing/unity-screen-world-ui-coordinates/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: F03·F09·B04
- 원문: [UGUI](https://app.notion.com/p/2dedcd0be37142609e6e076c6d6aef76)
- 중복 판단: 현재 별도 글이 없다. 락온·HUD와 연결할 수 있지만, 노션 예제를 DCB의 실제 호출 경로로 간주하지 않는다.
- 가져올 내용: ScreenPointToRay와 Raycast를 이용한 배치, WorldToScreenPoint를 이용한 UI 추적 예제가 있다.
- 보완·검증: 원근·직교 카메라, 카메라 뒤의 대상, 깊이 값, Canvas 모드와 RectTransform 로컬 변환을 구분한다. 클릭 배치와 머리 위 UI 예제에 해상도·Canvas 배율 변경 실습을 붙인다.

### N04 VBO·VAO·EBO와 정점 속성의 stride·offset

- 진행: [게시 완료](https://imjae.github.io/writing/opengl-vertex-layout-stride-offset/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `graphics` · 기존 학습 목록: U02·U03
- 원문: [2-4, Hello Triangle (2)](https://app.notion.com/p/f2adc4fc52d14d0a92646d015dd1b2d2)
- 중복 판단: 공개 OpenGL 글의 버퍼 설명과 부분 중복이다. 공개 글은 구현 개요로 두고 이 글은 완성 예제·계산·오류 재현을 맡긴다.
- 가져올 내용: 정점 입력, 속성 연결, VAO, EBO, 삼각형·사각형과 연습 문제가 상세히 정리돼 있다.
- 보완·검증: 현재 C++ 프로젝트에서 실행되는 최소 예제와 바이트 배치 그림을 만든다. 잘못된 stride·offset·인덱스 형식·개수를 각각 재현하고 수정한다. 노션의 설명만으로 GPU 실행이 확인됐다고 쓰지 않는다.

### N05 GLSL 컴파일·링크 오류와 uniform 갱신

- 진행: [게시 완료](https://imjae.github.io/writing/opengl-shader-errors-uniforms/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `graphics` · 기존 학습 목록: U04·U06·U10
- 원문: [2-5, Shaders](https://app.notion.com/p/361921119b954fb2ad51834ff987c002)
- 중복 판단: 공개 OpenGL 글의 new vec2 문제와 겹친다. 기존 글의 문제 목록을 복제하기보다 오류를 직접 재현하고 로그를 해석하는 학습 글로 확장한다.
- 가져올 내용: GLSL 자료형, swizzle, 셰이더 입출력, uniform, 파일을 읽는 Shader 도우미와 연습 문제가 있다.
- 보완·검증: 셰이더 단계별 컴파일과 프로그램 링크를 분리한다. 소스 파일 경로·입출력 불일치·생성자 오류·uniform 위치를 바꾸는 실습과 풀이를 제공한다. 사용 버전과 실제 출력·화면을 새로 확인한다.

### N06 텍스처 객체·텍스처 유닛·sampler와 이미지 포맷

- 진행: [게시 완료](https://imjae.github.io/writing/opengl-texture-units-formats/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `graphics` · 기존 학습 목록: U06·U07
- 원문: [2-6, Textures](https://app.notion.com/p/09cffc4abe964bc89989e30e866b84ae)
- 중복 판단: 공개 OpenGL 글의 두 텍스처 혼합 설명과 부분 중복이다. 바인딩·포맷·알파를 독자가 직접 바꾸는 상세 실습으로 분리한다.
- 가져올 내용: stb_image 로딩, 텍스처 생성, UV, 이미지 형식, 여러 텍스처 연결과 연습 문제가 있다.
- 보완·검증: 텍스처 이름과 유닛 번호, sampler의 정수 값, RGB·RGBA·행 정렬·상하 뒤집기를 나눠 설명한다. 직접 만든 이미지와 완성 프로그램으로 단위별 실패를 확인하고 혼합 결과를 캡처한다.

### N07 텍스처 반복·필터링·mipmap을 같은 화면에서 비교하기

- 진행: [게시 완료](https://imjae.github.io/writing/opengl-filtering-mipmaps/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `graphics` · 기존 학습 목록: U08
- 원문: [2-6, Textures](https://app.notion.com/p/09cffc4abe964bc89989e30e866b84ae)
- 중복 판단: N06과 같은 원문에서 나누되 N06은 연결·데이터 형식, N07은 샘플링과 거리 변화에 집중한다. 기존 OpenGL 글에는 설정 확인 항목만 있다.
- 가져올 내용: Wrapping, 확대·축소 필터, mipmap 생성과 선택을 설명한 본문이 있다.
- 보완·검증: Repeat·Clamp, Nearest·Linear, mipmap 유무를 동일 텍스처·카메라 경로에서 비교한다. 생성과 실제 필터 사용을 구분하고 축소·경계·거리 변화 실습과 풀이를 넣는다.

### N08 Local·World·View·Clip·NDC·Screen 좌표를 구분하기

- 진행: [게시 완료](https://imjae.github.io/writing/local-world-clip-ndc-screen/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `graphics` · 기존 학습 목록: B04·K02·U09
- 원문: [2-8, 좌표 시스템](https://app.notion.com/p/de3bfcadaeb84991918d744a9b1bd553), [물체의 수학 1 : 이동 변환의 구현 원리](https://app.notion.com/p/db1946199b2e42bc8916c3ed86314b1a)
- 중복 판단: OpenGL 개요와 좌표 변환 계획의 상세 학습 글이다. N03은 Unity UI API의 사용, N08은 렌더링 좌표의 원리를 맡는다.
- 가져올 내용: 공간별 변환과 모델·뷰·투영의 순서를 설명한 노트가 있다.
- 보완·검증: 원문에서 섞인 clip 좌표와 NDC를 바로잡고 원근 나눗셈, w, viewport를 직접 계산한다. 도식·수치 예제·깊이 검사 실습을 새로 만든다. 현재 LearnOpenGL 코드가 카메라·깊이 실습까지 완료했다고 확대하지 않는다.

### N09 직접 참조·Resources·AssetBundle·Addressables 선택하기

- 진행: [게시 완료](https://imjae.github.io/writing/unity-asset-loading-choices/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: E01·E02·E07
- 원문: [에셋 관리](https://app.notion.com/p/a7922dd7d82444628d80f8575ce3a141), [리소스 시스템](https://app.notion.com/p/736f59c4ec454b7eba591678cb9b27a8), [에셋 번들](https://app.notion.com/p/c1c544d92c454f0a885da23da70dc918), [개발 고려 사항](https://app.notion.com/p/57c308a328ea4ef19ec5650a2674fdde)
- 중복 판단: 현재 자원 로딩을 한 편에서 비교하는 글은 없다. 이미 계획한 E 영역의 자료로 합치고 새로 별도 시리즈를 중복 생성하지 않는다.
- 가져올 내용: 리소스 폴더, 번들 구조, Addressables 전환 때 고려할 씬·StreamingAssets·AssetReference와 중복 자산 문제가 정리돼 있다.
- 보완·검증: 참조·로드·인스턴스·메모리 수명을 구분한다. 근거가 약한 시간 복잡도와 메모리 단정은 제거하고 같은 프리팹을 네 방식으로 다루는 예제를 만든다. 문서의 검토 항목을 완료한 마이그레이션 성과로 쓰지 않는다.

### N10 Azure DevOps로 Addressables 콘텐츠를 빌드·배포한 과정

- 진행: [게시 완료](https://imjae.github.io/writing/azure-devops-content-build-deploy/), `92ac047`. 가상 파일의 PowerShell 검사와 YAML 파싱 확인, Unity·Azure 실행은 미검증.
- 분류: `tools` · 기존 학습 목록: E07·Q02, 기존 목록보다 구체적인 과거 CI 사례
- 원문: [Azure DevOps CI/CD 구현](https://app.notion.com/p/6b4009e0624e4162bb05136e0834261b), [DevOps](https://app.notion.com/p/49e52b6b0fcb40ae9f0b1819a7529636), [빌드/배포 작업 순서](https://app.notion.com/p/8634dae5619e41bdaee2cc075f7be6c5)
- 중복 판단: 현재 블로그의 GitHub Pages 배포나 AI 워크트리 글과 다른 작업이다. DCB의 현재 CI라고 쓰지 않고 과거 콘텐츠 빌드 경험으로 분리한다.
- 가져올 내용: 자가 호스팅 Windows·macOS 에이전트, 태그와 빌드 파라미터, Unity 실행, 산출물과 Blob Storage 업로드를 다룬 설계·작업 기록이 있다.
- 보완·검증: Unity Player와 콘텐츠 번들 빌드를 명확히 구분한다. 조직명·내부 경로·서비스 연결 정보 없이 작은 YAML과 산출물 예제를 다시 만든다. 당시 수행 범위와 새로 시험할 실패·재시도·롤백을 나눠 적고 현재 도구 버전을 확인한다.

### N11 태그를 고정한 다중 저장소 checkout으로 빌드 입력 맞추기

- 진행: [게시 완료](https://imjae.github.io/writing/tag-pinned-multi-repo-checkout/), `76d2e9e`. 로컬 Git 실험 19개 항목과 YAML 일반 파싱·PowerShell 구문 확인, Azure 인증·템플릿 확장·실제 checkout·Unity 실행은 미검증.
- 분류: `tools` · 기존 학습 목록: Q01·Q02·E07
- 원문: [서브모듈 적용](https://app.notion.com/p/e06c1f59bc814ee8ad82aadb813cd34b)
- 중복 판단: 현재 워크트리 글의 여러 작업 공간 운영과는 별개다. N10에서는 전체 흐름만 설명하고 이 글에서 실패·수정 과정을 다룬다.
- 가져올 내용: 태그 fetch의 인증 실패를 겪고 Azure의 repositories 선언과 여러 checkout으로 바꾼 기록이 있다.
- 보완·검증: Git submodule과 CI의 다중 저장소 checkout을 구분한다. 독립 샘플 저장소와 태그를 사용해 재현하고 커밋 고정·경로·권한·태그 누락을 확인한다. 원문 제목이 서브모듈 적용이라고 해서 submodule 방식으로 해결했다고 쓰지 않는다.

### N12 Unity CI 로그에서 라이선스 메시지와 패키지 다운로드 실패 구분하기

- 진행: [게시 완료](https://imjae.github.io/writing/unity-ci-package-download-failure/), `6475fb9`. 가상 로그·manifest 예제의 PowerShell 19개 항목 확인, 실제 Unity·Azure·패키지 다운로드·네트워크 원인 검증은 미실행.
- 분류: `tools` · 기존 학습 목록: P10·E07
- 원문: [어드레서블 버전](https://app.notion.com/p/ab1b0ca0622b4514b3926b4a0fd82fe1)
- 중복 판단: N10의 정상 경로와 연결되는 문제 해결 사례다. 새 초안은 로그 판독과 의존성 변경 분석을 다룬다.
- 가져올 내용: Addressables 1.21.18에서 1.21.19로 바꾼 뒤 실패한 기록, 라이선스 메시지와 패키지 의존성 ETIMEDOUT, 버전을 되돌린 뒤 통과했다는 관찰이 있다.
- 보완·검증: 관찰된 순서와 원인 추정을 분리한다. 해당 버전의 결함으로 확정하지 않는다. 비민감 예시 로그로 최초 실패·후속 오류·종료 코드를 읽는 법, 네트워크와 캐시 조건, manifest·lock 고정을 설명한다. 당시 성공 기록과 현재 재현 여부를 구분한다.

### N13 Spine 마스크에서 머티리얼이 나뉘어 배칭이 깨진 문제

- 진행: [게시 완료](https://imjae.github.io/writing/spine-mask-material-batching/), `5c0a35a`. 콘솔 참조 모델 실행 확인, Unity 컴파일·화면·배칭·성능은 미검증.
- 분류: `graphics` · 기존 학습 목록: F11 확장·Spine 과거 사례
- 원문: [스파인 드로우콜 최적화](https://app.notion.com/p/5ee92b3fd3044af2b3d6fa6ad875a07f)
- 중복 판단: 현재 공개 글에 없는 문제 해결 사례다. DCB의 장비나 HDRP 이펙트를 구현한 사례와 혼합하지 않는다.
- 가져올 내용: MaskInteraction의 재질 복제와 배칭, CustomMaterialOverride, 공유 마스크 머티리얼을 다루는 컴포넌트의 문제·해결 기록이 있다.
- 보완·검증: 사용한 Spine·Unity 버전과 최소 재현 장면을 복원한다. Frame Debugger에서 같은 조건의 배치·드로우콜을 확인하고 마스크 순서, 공유 재질 변경, 활성화·비활성화 후 복원을 시험한다. 현재 측정되지 않은 FPS나 감소율은 넣지 않는다.

## P2 설명 수정과 새 실습이 필요한 후보

### N14 GLFW·GLAD·컨텍스트와 첫 렌더 루프 만들기

- 진행: [게시 완료](https://imjae.github.io/writing/opengl-context-render-loop/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `graphics` · 기존 학습 목록: U01·U10
- 원문: [2-1, OpenGL](https://app.notion.com/p/053f9f0c4fc24fe98807fb8f7bddec11), [2-2, Window 생성](https://app.notion.com/p/c73955f31a904b6dbf933438eedfc702), [2-3, Hello Window](https://app.notion.com/p/f57cae548a8d433086bb02894e9e19c1)
- 중복 판단: 공개 OpenGL 글에서 역할을 짧게 설명한다. 처음부터 실행 환경을 만드는 상세 글로 연결한다.
- 가져올 내용: OpenGL의 상태·객체, GLFW와 GLAD, CMake·Visual Studio, 창·viewport·입력·버퍼 교환이 정리돼 있다.
- 보완·검증: 서로 다른 과거 Visual Studio·라이브러리 버전 설명을 한 가지 재현 환경으로 정리한다. 최신 버전이라는 오래된 표현을 고치고 초기화 실패·컨텍스트·리사이즈·자원 정리를 실행한다. 번역·강의 요약의 원 출처를 확인한다.

### N15 이동·회전·크기 행렬과 변환 순서 직접 계산하기

- 진행: [게시 완료](https://imjae.github.io/writing/matrix-transform-order/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `graphics` · 기존 학습 목록: B04·U09
- 원문: [2-7, 변환(Transformations)](https://app.notion.com/p/7cac09ec960344eba90c283a115cfbf7), [물체의 수학 1 : 이동 변환의 구현 원리](https://app.notion.com/p/db1946199b2e42bc8916c3ed86314b1a)
- 중복 판단: N08은 공간 사이의 파이프라인, N15는 행렬의 계산과 곱셈 순서를 설명한다. 짧아지면 N08의 선행 편으로 합친다.
- 가져올 내용: 아핀 변환, 동차 좌표, 변환 행렬 그림과 GLM 조각 코드가 있다.
- 보완·검증: 이미지 속 수식을 직접 다시 쓰고 점 w=1과 방향 w=0을 계산한다. 행·열 및 곱셈 규약, 회전 후 이동과 이동 후 회전의 차이를 설명한다. GLM 완성 예제를 새로 실행한다.

### N16 카메라의 기준축과 LookAt 행렬 만들기

- 진행: [게시 완료](https://imjae.github.io/writing/camera-basis-lookat/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `graphics` · 기존 학습 목록: B02·B04·U09
- 원문: [2-9, 카메라](https://app.notion.com/p/196f7909977640da8373586d4b5f1bfa)
- 중복 판단: 현재 공개 OpenGL 글의 완료 범위를 넘어서는 후속 학습이다. Unity 쿼터뷰 카메라 구현 완료의 근거로 사용하지 않는다.
- 가져올 내용: 카메라 위치·방향, up·right 벡터와 외적으로 기준축을 만드는 설명이 있다.
- 보완·검증: glm::cross 등의 오타를 고치고 평행 벡터·정규화·행렬 역변환을 설명한다. 원문에 없는 이동·마우스 입력은 새 구현으로 구분하고 궤도 카메라부터 실행·검증한다.

### N17 FSM의 Enter·Execute·Exit와 전이·중단 규칙

- 진행: [게시 완료](https://imjae.github.io/writing/fsm-transition-interruption/). 독립 C# 콘솔 컴파일·출력 확인. Unity·게임 실행은 미검증.

- 분류: `gameplay` · 기존 학습 목록: C05·H06·H07
- 원문: [FSM (유한 상태 머신)](https://app.notion.com/p/08e6af888c814d488d7692a7be55b8eb), [FSM 03](https://app.notion.com/p/3e4529998da646639846adc9947f3950)
- 중복 판단: 공개 몬스터 글은 DSL과 전투 사례다. 이 글은 상태 머신의 기초와 작은 실행 예제를 맡긴다.
- 가져올 내용: enum 상태 예시와 제네릭 상태 머신, 전역 상태, 상태 블립, singleton 상태의 주의점이 정리돼 있다.
- 보완·검증: 비어 있는 ChangeState를 완성하고 Enter·Exit 호출 순서, 동일 상태 재진입, 실행 도중 전이·중단을 실습한다. 상태 공유와 개체별 데이터 수명을 구분하고 DCB의 현재 스케줄러와 일대일로 같다고 설명하지 않는다.

### N18 Behavior Tree의 Sequence·Selector·Running과 중단

- 진행: [게시 완료](https://imjae.github.io/writing/behavior-tree-running-abort/). 독립 C# 콘솔 컴파일·출력 확인. Unity·게임 실행은 미검증.

- 분류: `gameplay` · 기존 학습 목록: H06·H07의 비교 학습
- 원문: [Behavior Tree (행동 트리)](https://app.notion.com/p/314d3083c419405287541604be499729)
- 중복 판단: 몬스터 전투 글의 보충 이론이다. DCB가 노션의 일반 BT 구조를 그대로 사용한다고 주장하지 않는다.
- 가져올 내용: FSM·HFSM과의 비교, Action·Composite·Decorator·조건 중단을 설명한 긴 노트가 있다.
- 보완·검증: Success·Failure·Running을 일관되게 정의하고 프레임 사이 실행 상태와 abort를 보이는 작은 트리를 만든다. 구현에 따라 달라지는 스택·탐색 규칙을 일반 사실처럼 쓰지 않는다. 원본 도식의 출처를 확인하고 자체 그림·실습을 만든다.

### N19 캐릭터 방향과 이동 벡터를 같은 좌표계로 맞추기

- 진행: [게시 완료](https://imjae.github.io/writing/movement-facing-coordinate-space/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `gameplay` · 기존 학습 목록: B03·G01
- 원문: [오브젝트 회전](https://app.notion.com/p/2ff48514531147a7a34e83370aa3dca8), [유니티 상식](https://app.notion.com/p/2c83b61361d180bcab16f64a3676626a)
- 중복 판단: 현재 별도 글은 없다. AI 사용 사례를 덧붙일 수 있지만 우선은 회전·좌표 문제를 해결하는 기술 글로 정리한다.
- 가져올 내용: 마우스로 바라보는 방향과 키보드 이동을 Blend Tree에 연결하면서 앞뒤가 바뀐 문제, AI 답변을 반복 적용한 과정이 남아 있다.
- 보완·검증: Quaternion이 언제나 한 방향으로 회전한다는 결론과 부호 설명은 그대로 쓰지 않는다. 월드·로컬 벡터, 역회전, 각도 단위와 기준축을 명시하고 0·90·180도 입력 표로 검증한다. 원문에서 실제로 해결한 범위도 재확인한다.

### N20 Addressables 로드 핸들의 수명과 해제 책임

- 진행: [게시 완료](https://imjae.github.io/writing/addressables-handle-lifetime/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: E02
- 원문: [TIP](https://app.notion.com/p/8196f0c10b5f4eeb87e032069ba1a1ea), [개발 고려 사항](https://app.notion.com/p/57c308a328ea4ef19ec5650a2674fdde)
- 중복 판단: 로드 방식 비교 N09의 다음 글이다. 기존 학습 목록 E02에 합친다.
- 가져올 내용: 참조 카운트·Release와 AssetReference를 짚은 메모가 있으나 본문은 짧다.
- 보완·검증: 새로 작성할 비중이 크다. 성공·실패·중복 로드·씬 종료·인스턴스 해제의 책임을 독립 예제에서 설명하고 실제 핸들 수명·메모리 관찰을 추가한다. 메모만으로 누수 해결을 증명하지 않는다.

### N21 AssetBundle 구조와 LZMA·LZ4의 로딩 비용 비교

- 진행: [게시 완료](https://imjae.github.io/writing/assetbundle-compression-costs/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: E07·P08
- 원문: [에셋 번들](https://app.notion.com/p/c1c544d92c454f0a885da23da70dc918)
- 중복 판단: N09의 선택 기준에서 번들 내부와 압축을 분리한 심화 글이다. 짧게 끝나면 N09의 절로 합친다.
- 가져올 내용: 번들의 헤더·데이터, 압축, 번들 개수의 비용과 WebExtract·binary2text 도구가 정리돼 있다.
- 보완·검증: 사용한 Unity 버전에서 생성한 작은 번들을 비교한다. 다운로드 크기·디스크 크기·로드 시간·메모리를 구분하며 압축 방식의 우열을 단정하지 않는다. 도구의 현재 지원 여부와 공식 문서를 확인한다.

### N22 Addressables 카탈로그 옵션을 줄이기 전에 확인할 것

- 진행: [게시 완료](https://imjae.github.io/writing/addressables-catalog-key-options/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: E07
- 원문: [어드레서블 관리 팁](https://app.notion.com/p/eb44c410f42b451f95252113acb3cb4f)
- 중복 판단: 카탈로그 설정을 다룬 공개 글은 없다. 비어 있는 별도 카탈로그 페이지를 독립 근거로 세지 않는다.
- 가져올 내용: 카탈로그 압축, Internal Asset·Bundle Naming Mode, 주소·GUID·Label 포함 설정을 설명한 본문이 있다.
- 보완·검증: 키·GUID·Label로 로드하는 경로부터 확인하고 옵션을 한 개씩 바꾼다. 크기와 로드 성공을 함께 검사한다. 콘텐츠 업데이트 사이의 설정 변경 조건과 현재 패키지 버전별 메뉴를 확인한다.

### N23 스크립트와 Addressables 콘텐츠의 버전 호환성

- 진행: [게시 완료](https://imjae.github.io/writing/addressables-player-content-compatibility/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: E07·Q02
- 원문: [어드레서블 관리 팁](https://app.notion.com/p/eb44c410f42b451f95252113acb3cb4f), [어드레서블 빌드](https://app.notion.com/p/84031fd94b9a4f3bb071bba99b9b7e34), [빌드/배포 작업 순서](https://app.notion.com/p/8634dae5619e41bdaee2cc075f7be6c5)
- 중복 판단: N10에서는 버전 파라미터를 소개하고 이 글에서 Player·콘텐츠의 호환 조건을 다룬다.
- 가져올 내용: MonoScript 관련 이름·어셈블리·namespace 변경, 스크립트 버전과 리소스 버전, 변경 번들과 이전 버전 보존 메모가 있다.
- 보완·검증: 단순 콘텐츠 갱신과 Player 재빌드가 필요한 변경을 실제 예제로 분리한다. content state·카탈로그·캐시·롤백을 시험한다. 원문 설명을 모든 직렬화 변경의 완전한 규칙으로 확대하지 않는다.

### N24 Addressables 커스텀 빌드 스크립트의 호출 단계

- 진행: [게시 완료](https://imjae.github.io/writing/addressables-custom-build-stages/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: E07
- 원문: [빌드 커스텀 스크립트](https://app.notion.com/p/e1094b62f6c645f7898e95507eaac7d1), [BuildScriptBase](https://app.notion.com/p/d1bf4c1b4f8c482ab0afd98d03a400ca), [DoBuild 단계](https://app.notion.com/p/d5ac17b636de41a8ba66176946312876)
- 중복 판단: N10의 CI에서 실행할 콘텐츠 빌드 작업을 설명하는 선행 도구 글이다.
- 가져올 내용: BuildScriptBase·IDataBuilder, BuildData·BuildDataImplementation·그룹 처리와 DoBuild의 일부 분석이 있다.
- 보완·검증: 빈 제목과 링크만 있는 단계가 있어 전체 빌드 과정이 완성된 분석은 아니다. 현재 패키지에서 최소 커스텀 빌더를 작성하고 성공·실패 결과·플랫폼 파라미터를 검증한다. 문서상 당시 구현은 번들 빌드까지이며 전체 배포 자동화 완료로 쓰지 않는다.

### N25 Unity 배치 빌드가 끝나지 않을 때: 종료 인수와 첫 빌드 비용

- 진행: [게시 완료](https://imjae.github.io/writing/unity-batch-exit-cold-build/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: E07·P07·P10
- 원문: [빌드 시간 초과](https://app.notion.com/p/49a3baf2d6c64db48bb2c54dc3615c0b)
- 중복 판단: N10·N12와 연결되는 짧은 오류 사례다. 독립 재현 분량이 부족하면 CI 글의 실패 절로 합친다.
- 가져올 내용: -quit 누락, 플랫폼 전환 후 첫 빌드의 긴 소요, 재시도 성공이 기록돼 있다.
- 보완·검증: 프로세스가 종료되지 않은 경우와 정상적으로 오래 걸리는 경우를 구분한다. 종료 코드·로그 진행·콜드/웜 상태·시간 제한을 표시한다. 재시도 성공만으로 특정 원인을 확정하거나 속도 향상률을 만들지 않는다.

### N26 Spine 텍스처의 PMA·Straight Alpha·색 공간 맞추기

- 진행: [게시 완료](https://imjae.github.io/writing/spine-alpha-color-space/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `graphics` · 기존 학습 목록: K04·U07·F11 확장
- 원문: [스파인 텍스처 알파값 설정](https://app.notion.com/p/03524cd5da6e474b985ca057f71420b4)
- 중복 판단: 공개 OpenGL 글의 이미지 형식 설명과 개념만 연결한다. Spine UI의 별도 과거 문제이며 DCB의 현재 텍스처 설정으로 옮기지 않는다.
- 가져올 내용: 밉맵 경고와 알파 경계, Gamma·Linear·sRGB, SkeletonGraphic 재질 문제를 조사한 기록이 있다.
- 보완·검증: Alpha Is Transparency가 PMA 변환이라는 설명을 바로잡는다. 내보내기 알파 형식·재질 블렌딩·색 공간·임포트 설정을 조합표로 분리하고 새 캡처를 만든다. sRGB를 무조건 끄라는 결론을 재사용하지 않는다. 원문 일부 외부 블록과 이미지는 별도 확인이 필요하다.

### N27 화면 텍스처 왜곡과 충격파: UV 오프셋에서 렌더 파이프라인까지

- 진행: [게시 완료](https://imjae.github.io/writing/screen-distortion-shockwave-uv/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `graphics` · 기존 학습 목록: K05·M06
- 원문: [왜곡](https://app.notion.com/p/1363b61361d18071a8fac0a1efe06f70), [충격파](https://app.notion.com/p/1363b61361d180f4baabce9945942b26)
- 중복 판단: 불·물 글의 그래픽스와 연결되지만 실제 공개 사례에 같은 화면 왜곡이 구현됐다고 단정하지 않는다.
- 가져올 내용: GrabPass, 노멀·마스크 기반 UV 오프셋, 방사형 파형의 셰이더 코드가 있다.
- 보완·검증: 코드만 있어 목적·수식·실행 증거를 새로 써야 한다. Built-in 예제와 HDRP 화면 색 접근 방식을 구분한다. 좌표·굴절 강도·마스크·깊이 경계를 실습하고 재사용 텍스처와 직접 작성한 부분을 표시한다.

### N28 텍스처를 여러 번 샘플링해 블러 만들기

- 진행: [게시 완료](https://imjae.github.io/writing/texture-blur-kernel-texel/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `graphics` · 기존 학습 목록: K01·K05 보충
- 원문: [블러](https://app.notion.com/p/1363b61361d18028bb07c5df82b4689d)
- 중복 판단: 현재 별도 글은 없다. N27의 화면 텍스처 접근과 연결하되 블러의 샘플 위치·가중치를 다룬다. 분량이 적으면 N27 선행 절로 합친다.
- 가져올 내용: 중앙·대각 방향을 포함한 다중 샘플 셰이더 코드가 있다.
- 보완·검증: 일반적인 가우시안 블러라고 이름 붙이기 전에 커널과 가중치를 확인한다. 텍셀 크기·해상도·경계·패스 수를 설명하고 자체 테스트 이미지를 사용한다. 실행 화면과 비용은 새로 확인한다.

### N29 노이즈 임계값으로 Dissolve와 발광 경계 만들기

- 진행: [게시 완료](https://imjae.github.io/writing/dissolve-threshold-edge/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `graphics` · 기존 학습 목록: K08·M02
- 원문: [소환](https://app.notion.com/p/1363b61361d180ae960af8f2997b8266)
- 중복 판단: 불 이펙트 글의 노이즈·레이어와 개념이 이어진다. 과거 소환 셰이더 자체를 DCB의 불 이펙트로 설명하지 않는다.
- 가져올 내용: 노이즈·알파·경계 발광을 사용한 소환 셰이더 코드가 있다.
- 보완·검증: threshold·경계 폭·색·노이즈 스케일을 수식과 그림으로 설명한다. 파이프라인·투명도·깊이 처리와 재질 수명을 확인한다. 작은 공개 예제와 시작·중간·종료 화면, 실습·풀이를 새로 만든다.

### N30 AA 방식과 움직일 때의 계단·흐림·잔상 비교

- 진행: [게시 완료](https://imjae.github.io/writing/anti-aliasing-static-motion/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `graphics` · 기존 학습 목록: K01 보충
- 원문: [Anti-aliasing](https://app.notion.com/p/1481dc86e8024d2eab5f23ebd7dfcb35), [AA](https://app.notion.com/p/3a43b61361d180718a2ee9da8190ffcd)
- 중복 판단: AA 두 노트는 하나로 합친다. 현재 독립 글은 없다.
- 가져올 내용: FXAA·SMAA·TAA 개요와 MSAA에 관한 짧은 메모가 있다.
- 보완·검증: 과거 Post Processing Stack과 현재 프로젝트의 렌더 파이프라인 지원을 구분한다. MSAA의 샘플링 설명을 다듬고 같은 정지·이동 장면의 가장자리·잔상·비용을 비교한다. 아직 비교 화면과 측정값은 없다.

### N31 Bloom과 노출을 분리해서 발광 조절하기

- 진행: [게시 완료](https://imjae.github.io/writing/bloom-exposure-emission/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `graphics` · 기존 학습 목록: K03·M01
- 원문: [Bloom](https://app.notion.com/p/3bc274ba4f974068b1e661f6eecac793)
- 중복 판단: 불 이펙트 글의 레이어·품질과 연결하는 학습 글이다. 설정 설명을 기존 글에 모두 반복하지 않는다.
- 가져올 내용: Bloom의 설정 항목과 짧은 사용 메모가 있다.
- 보완·검증: 과거 설정 이름을 그대로 옮기기보다 대상 파이프라인을 고정한다. 발광 값·노출·Bloom을 분리한 예제와 같은 노출 조건의 비교가 필요하다. AO·DOF의 짧은 노트는 이 글의 성능 근거로 합치지 않는다.

### N32 React useEffect로 작업 상태를 동기화하고 정리하기

- 진행: [게시 완료](https://imjae.github.io/writing/react-effect-task-cleanup/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `notes` · 기존 학습 목록: R03
- 원문: [useEffect 완벽 가이드_1](https://app.notion.com/p/3801f85868094581b9dff3ed27f52826), [UI 런타임으로서의 React_1](https://app.notion.com/p/0f3fab6a743d4c2ea2510d7e51f65e2b)
- 중복 판단: 하네스 글은 CLI·프로세스·판정 구조다. 이 글은 작업 화면의 React 상태와 외부 동기화를 설명한다.
- 가져올 내용: Effect·의존성·stale closure·반복 실행, 엘리먼트·호스트 트리·렌더러에 관한 학습 본문이 있다. 이번에는 각 1편을 확인했다.
- 보완·검증: 원문 가이드의 번역을 복제하지 않고 하네스와 분리한 작은 상태 화면을 만든다. cleanup·StrictMode·늦게 도착한 응답·중복 구독을 확인한다. 현재 하네스의 실제 구현은 집필할 때 따로 대조한다.

### N33 TypeScript interface와 실행 중 데이터 검증을 구분하기

- 진행: [게시 완료](https://imjae.github.io/writing/typescript-interface-runtime-validation/). TypeScript strict 컴파일·콘솔 출력 확인. 실제 하네스·API 연동은 미검증.

- 분류: `notes` · 기존 학습 목록: R02·R11
- 원문: [타입스크립트의 Interface 정리](https://app.notion.com/p/b6213ce8acbb45958e96077a6fc2f8c4)
- 중복 판단: 기존 하네스 글의 JSON 판정·스키마 경계와 연결된다. 사용자 요청에서 제외한 C# 문법 입문을 다시 추가하지 않는다.
- 가져올 내용: 구조적 타입, 선택 속성, 함수·클래스 인터페이스와 상속을 설명한 노트가 있다.
- 보완·검증: 오타를 수정하고 작업 결과 타입을 예제로 사용한다. 타입이 붙은 코드와 외부 JSON의 런타임 검증을 비교하고 잘못된 필드·누락·상태 조합 실습을 만든다. 프로젝트의 실제 검증 도구는 현재 소스를 확인한 뒤 연결한다.

### N34 CSS Grid·Flex와 긴 코드·표의 가로 넘침 해결

- 진행: [게시 완료](https://imjae.github.io/writing/css-grid-flex-overflow/). 문서·원문 대조와 사이트 표시 확인. 외부 런타임 실행은 글별 미검증 범위 참고.

- 분류: `tools` · 기존 학습 목록: S03
- 원문: [#2.XX GRID](https://app.notion.com/p/8dfcc5f9dfbc416793d07aafc3126f3a), [#1 FLEXBOX](https://app.notion.com/p/54552d8fd76e41e79f7377ed6ab3647c)
- 중복 판단: 이미 계획한 블로그 모바일 문서 폭 사례에 합친다. Grid·Flex 입문과 실제 수정 사례를 별도 중복 시리즈로 만들지 않는다.
- 가져올 내용: Grid의 track·line·minmax·auto-fit·auto-fill, Flex의 축·정렬·grow·shrink·basis 노트가 비교적 상세하다.
- 보완·검증: 속성 오타와 auto·fr·정렬에 대한 단정을 고친다. min-content와 자동 최소 크기를 중심으로 긴 코드·표를 재현하고 min-width: 0·minmax(0, 1fr)·내부 스크롤을 비교한다. 화면 폭별로 다시 확인한다.

### N35 DynamoDB의 Partition Key·Sort Key와 조회 패턴 설계

- 진행: [게시 완료](https://imjae.github.io/writing/dynamodb-keys-query-patterns/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `notes` · 기존 학습 목록: 새 확장: 과거 게임 백엔드 실험, R05의 SQLite와 별개
- 원문: [DynamoDB 설계 예시](https://app.notion.com/p/71571eaafa394f82849288319a59d906), [Partition Key, Sort Key C# 적용 테스트](https://app.notion.com/p/bcbc3a319d334fe08e9a2dcae18a1ef9)
- 중복 판단: 현재 블로그에 없는 백엔드 학습이다. DCB의 저장 시스템이나 현재 멀티플레이 구현으로 소개하지 않는다.
- 가져올 내용: 사용자·게임 데이터를 조회 패턴으로 나눈 설계 예시와 begins_with를 사용하는 QueryRequest 테스트 코드가 있다.
- 보완·검증: RDB와 NoSQL의 성능을 일반화한 문장을 고친다. 자체 퀘스트 샘플로 키·조건·정렬·페이지네이션·오류를 설명하고 현재 SDK에서 실행한다. 원래 서비스의 계정·사용자 데이터는 사용하지 않는다.

## P3 후순위 후보

### N36 HTTP 요청·응답·실패·취소를 작업 API로 이해하기

- 진행: [게시 완료](https://imjae.github.io/writing/http-response-failure-cancellation/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `notes` · 기존 학습 목록: R01·R12
- 원문: [HTTP](https://app.notion.com/p/3427b0bc1ead41f8bb221b8868318552)
- 중복 판단: 하네스·블로그 웹 기초를 보완하지만 현재 노션 본문은 짧고, 하위 HTTP 개요 본문은 이번에 읽지 않았다.
- 가져올 내용: HTTP의 클라이언트·서버, 상태 없음, 요청·응답에 관한 개요가 있다.
- 보완·검증: 현재 프로토콜을 TCP 하나로 설명하는 문장을 수정한다. 실제 상태 코드·헤더·body·인증 경계·취소·재시도 예제를 새로 작성해야 한다. 다른 P1·P2보다 원문 활용도가 낮아 후순위로 둔다.

### N37 Unity에서 클라우드 데이터에 접근할 때의 인증·SDK 경계

- 진행: [게시 완료](https://imjae.github.io/writing/unity-cloud-auth-sdk-boundary/). 독립 JavaScript 모델의 본문 출력 확인. Unity·GPU·실서비스 실행과 성능은 미검증.

- 분류: `tools` · 기존 학습 목록: 새 확장: 과거 DynamoDB 연동, R12 보충
- 원문: [Amazon DynamoDB 연동 테스트](https://app.notion.com/p/490a8b0a1d9f4859919f48fa9a6a36f0)
- 중복 판단: 현재 DCB·imjaess의 실서비스 인증 구현 근거는 아니다. N35를 읽은 뒤 선택해서 다룰 주제다.
- 가져올 내용: Unity와 DynamoDB·Cognito·SDK를 연결하려고 시험한 단계가 있다.
- 보완·검증: 현재 지원 SDK·인증 흐름과 클라이언트·서버 책임을 다시 설계하고 실행해야 한다. 예전 권한 설정·계정 정보·접속 값을 복사하지 않는다. 실제 계정 접근이 필요한 실습은 공개 샘플과 로컬 검증 범위를 먼저 정한다.

## 독립 글로 옮기기 전 보류할 자료

| 원문 | 보류 이유와 처리 |
| --- | --- |
| [자료구조 프로젝트](https://app.notion.com/p/73ade64048fb408b8ea9b8c0733abe3d) | C++ 선행 문법과 학습 계획에 가깝다. 자료구조를 구현·실행한 증거로 사용하지 않는다. C# 문법 입문도 다시 추가하지 않는다. A03 이후는 현재 목록의 독립 예제로 작성한다. |
| [행동트리 구조](https://app.notion.com/p/1f73b61361d1802290f9e2abb47506df) 아래 몬스터 페이지 | 확인한 몬스터 본문이 비어 있다. 이미 공개한 DCB 몬스터 글을 보완할 실제 구현·작업 기록의 대체 근거가 되지 않는다. |
| [카탈로그 줄이기](https://app.notion.com/p/4d8c2cd2f9464652853ce19e43d67c8b), [카탈로그 파일과 로드](https://app.notion.com/p/832ab782b548489e9a842cf9fe9c548c) | 제목 또는 거의 빈 본문이다. N22 등의 관리 팁 본문을 활용하되 이 두 문서를 완성된 추가 원고로 세지 않는다. |
| [포물선 공식](https://app.notion.com/p/d6a79b1acc034bf28e8cee0e3e4b919f) | 삼각함수·피타고라스 설명 도중에 끝나며 포물선 운동식을 다룬 완성 노트가 아니다. 실제 투사체 예제와 공식을 작성한 뒤 별도 후보로 판단한다. |
| [플레이어 빌드 후 앱 꺼짐 현상](https://app.notion.com/p/0e1c6e22ea8a4be4830e480e580025d8) | 에뮬레이터에서 APK 시작이 멈춘 관찰과 외부 해결책의 추정이 있다. 자신의 환경에서 Optimized Frame Pacing 변경으로 해결됐다는 증거는 부족하다. 현재 상태로 해결 사례를 게시하지 않는다. |
| [AWS EC2 와 Photon 서버 연동하기(Amazon Linux 버전)](https://app.notion.com/p/64f85fca50784e719af7718f1eadb845), [AWS EC2 와 Photon 서버 연동하기(Window Server 버전)](https://app.notion.com/p/b9f9f499380840af9e1d31dfdfeca21e) | Linux에서 예상한 SDK를 찾지 못해 Windows로 옮긴 기록이며 Linux 서버 배포 완료 사례가 아니다. 원문에 접속정보가 포함돼 그대로 이전하지 않는다. 현재 제품·운영체제 지원과 해결 경로를 다시 확인하기 전에는 설치 가이드로 쓰지 않는다. |
| [네트워크 테스트 과정](https://app.notion.com/p/a8d3cdad5a2a4451bfafde544b16b9b5) | 연결 실험의 색인에 가깝고 비용·동접·성능 설명은 현재 검증되지 않았다. DCB 멀티플레이 성과나 운영 수치로 사용하지 않는다. |
| [액션 RPG](https://app.notion.com/p/63413315df3f4998bc39a8c279b90f07) | 과거 게임 아이디어다. 현재 DCB의 운반·공급·귀환 중심 설계와 같은 문서로 취급하지 않는다. 필요하면 기획 변경 기록으로 별도 조사한다. |
| [Ambient Occlusion](https://app.notion.com/p/e2604e3d5d61435484f5fd5b5a39b6bc), [Depth of Field](https://app.notion.com/p/18719c44d6b94b198a334df262bff336) | AO·DOF의 짧은 설정 메모다. 현재 파이프라인에서 장면·조건·비교 자료를 새로 만들기 전에는 독립 완성 글로 보지 않는다. |
| 읽기 목록의 다른 책, 웹 목록의 나머지 강의·하위 문서 | 이번에 일부 색인만 확인했다. 본문과 출처를 확인하지 않은 항목은 완성 후보에 넣지 않았다. 이후 독서·웹 학습 범위를 넓힐 때 추가 조사한다. |

## 그대로 이전하기 전에 바로잡을 설명

1. **Spine 알파:** 원문은 Alpha Is Transparency와 PMA 처리를 혼동한 부분이 있다. Unity의 해당 옵션은 투명 영역 주변 RGB를 확장해 필터 경계 문제를 줄이는 기능이다. PMA 내보내기·셰이더 블렌딩과 별도로 설명해야 한다. Spine은 사용 버전에 맞는 PMA·Straight Alpha와 재질 조합을 확인한다. 근거: [Unity TextureImporter 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/TextureImporter-alphaIsTransparency.html), [Spine 렌더링 문서](https://esotericsoftware.com/spine-unity-rendering).
2. **회전:** 원문의 Quaternion 회전 방향에 대한 결론을 일반 규칙으로 쓰지 않는다. 좌표계·곱셈 순서·월드와 로컬 변환을 명시하고 입력 표와 실제 화면으로 판정한다.
3. **OpenGL 좌표:** clip 좌표와 NDC, 원근 나눗셈과 viewport를 분리한다. 노션에 변환·카메라 노트가 있다는 사실은 현재 저장소의 실행 완료 증거가 아니다.
4. **CI 패키지 오류:** 버전 변경 뒤 ETIMEDOUT이 발생하고 되돌린 뒤 성공했다는 관찰은 남긴다. 그 기록만으로 특정 패키지 버전 자체의 결함을 확정하지 않는다.
5. **최적화:** 재질 수·배치 수·번들 크기·로딩 시간·메모리·FPS는 다른 관찰 대상이다. 어느 하나를 확인했다고 나머지가 개선됐다고 쓰지 않는다.

## 집필할 때의 공통 완료 조건

- 원문에서 실제로 발생한 문제, 시도, 바꾼 점, 당시 결과를 먼저 정리한다. 빈칸은 추정으로 채우지 않는다.
- 노션이 학습 정리인지 직접 수행한 작업인지 밝힌다. 현재 프로젝트 적용을 주장할 때는 실제 호출·데이터·자산 경로를 다시 조사한다.
- 비공개 소스 대신 작은 예제를 새로 작성한다. 회사·서버·계정·접속정보, 개인 데이터와 원본 로그를 공개 문서에 복사하지 않는다.
- 독자가 준비할 환경과 예상 결과를 적고, 잘못된 입력·실패 조건을 포함한 실습과 풀이를 제공한다.
- 당시 노트에 적힌 결과, 이번 소스 조사, 새 컴파일·실행·화면·측정을 따로 기록한다. 이번 목록 작성으로 추가 실행 검증이 이뤄진 것은 없다.
- 외부 책·튜토리얼·그림의 원 출처와 재사용 조건을 확인한다. 인용·참조를 표시하고 설명·예제·도식을 직접 구성한다.
- 실제 새 글은 `draft: true`로 작성하고 사용자가 게시를 요청한 범위만 공개한다.

최초 목록 작성 뒤의 게시 요청에 따라 후보 37개를 모두 공개했다. 노션 원문은 변경하지 않았으며 보류 자료와 189개 전체 기술 학습 후보는 별도 후속 범위다.
