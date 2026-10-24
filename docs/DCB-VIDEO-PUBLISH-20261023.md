# DCB 포트폴리오 영상 등록 — 2026-10-23

상태: **2026-10-24 YouTube 12개 일부 공개, 옥귀·지게 독립 영상 교체와 공개 배포 확인 완료.**

전체 요약과 기능 영상 11개를 YouTube에 일부 공개로 업로드하고 12개 슬롯에 연결했다. 10월 23일에는 업로드 한도로 옥귀·지게 적재에 기존 영상의 발췌 구간을 사용했고, 10월 24일 준비된 독립 영상을 재편집 없이 업로드해 교체했다. 기존 10개 슬롯과 원본 영상은 유지했다. 이 문서는 등록 데이터와 유지보수 방법을 기록한다.

## 2026-10-24 독립 영상 교체 완료

임재경 채널 `UCsZucPGS40GkWw44DTvRYDg`의 업로드 목록을 먼저 확인해 두 영상이 없는 상태에서 각각 한 번씩 업로드했다. 두 영상 모두 일부 공개, SD·HD 처리 완료와 재생을 확인했다. 공개 제목·설명만 업로드 양식에 사용했다.

새 설정은 `20261024-okgwi.json`과 `20261024-cargo-loading.json`이다. 최신 `createdAt`으로 이전 기록을 대체하며 `startSeconds`, `endSeconds`, `clipVariant`, URL의 `t` 매개변수를 넣지 않았다. 지게 캡션은 원속도 설명으로 돌아갔다. 이전 JSON은 이력으로 보존했다.

연결 커밋은 [`5ad2cc63c5617b3c963d839e77500f8a0b22fdb7`](https://github.com/imjae/imjae.github.io/commit/5ad2cc63c5617b3c963d839e77500f8a0b22fdb7)이다. 해당 커밋의 [공개 Pages 배포](https://github.com/imjae/imjae.github.io/actions/runs/40061804363)와 [보호된 편집 서버 배포](https://github.com/imjae/imjae.github.io/actions/runs/40061804342)가 모두 성공했다. 공개 기능 페이지의 새 임베드 재생과 390px 너비의 영상·캡션 배치를 확인했다. DCB의 현재 경로는 `/projects/dcb/`이며 이전 `/portfolio/dcb/` 주소도 새 경로로 이동한다.

이번 `npm run verify`는 테스트 78개, Astro 진단 0개, 122개 경로 빌드와 128개 HTML 검사를 통과했다. 슬롯 대조에서 교체 대상 2개 외 10개가 동일했고, Home 고정 12편·긴 물 글·390px 모바일 AI 분야의 `CLI 지연` 검색 1편을 확인했다. 작업 증빙은 `.verification/dedicated-videos-20261024/`, 로컬 업로드 결과는 녹화 편집 작업 폴더의 업로드 진행·패키지 JSON에 보관한다.

## 2026-10-23 최초 등록 검증

게시 대상만 분리한 `npm run verify`에서 테스트 59개, Astro 진단 0개, 109개 경로 빌드와 116개 HTML 검사를 통과했다. 브라우저에서 본편 재생, 지게 발췌의 111초 종료, 390px 기능·지원용 페이지의 영상 배치, Home 고정 글 12편과 긴 글·본문 검색을 확인했다. 공개 배포 상태는 해당 커밋의 Actions 결과와 실제 페이지를 함께 확인한다.

## 영상과 목적지

주소와 구간은 [등록 데이터](../content/project-videos/)에서 읽는다. 제목·캡션·기능 목적지는 [공통 영상 데이터](../src/data/dcb-videos.mjs)에서 관리한다.

| 등록 슬롯 | 영상 | YouTube | 재생 범위 | DCB 연결 위치 |
| --- | --- | --- | --- | --- |
| [project](../content/project-videos/20261023-project.json) | 전체 요약 | [V-E3P6LaJVI](https://youtu.be/V-E3P6LaJVI) | 전체 | [프로젝트 소개](https://imjae.github.io/portfolio/dcb/) |
| [combat](../content/project-videos/20261023-combat.json) | 일반 교전과 옥귀 처치 | [SSKJ9ebjWMc](https://youtu.be/SSKJ9ebjWMc) | 전체 | [몬스터 전투](https://imjae.github.io/portfolio/dcb/features/monster-combat/) |
| [traversal](../content/project-videos/20261023-traversal.json) | StepUp·SideStep·Climb | [XDN3Hop_X1c](https://youtu.be/XDN3Hop_X1c) | 전체 | [IK 트레버설](https://imjae.github.io/portfolio/dcb/features/ik-traversal/) |
| [equipment](../content/project-videos/20261023-equipment.json) | 파츠 조합·장착·공격 | [vG2cybe3c4U](https://youtu.be/vG2cybe3c4U) | 전체 | [장비 조합](https://imjae.github.io/portfolio/dcb/features/modular-equipment/) |
| [water](../content/project-videos/20261023-water.json) | 계곡 수면과 폭포 | [VK9egNs7rXg](https://youtu.be/VK9egNs7rXg) | 전체 | [물](https://imjae.github.io/portfolio/dcb/features/water-playback/) |
| [fire](../content/project-videos/20261023-fire.json) | 마을 화염과 연기 | [6mC9stO5yZ0](https://youtu.be/6mC9stO5yZ0) | 전체 | [불 이펙트](https://imjae.github.io/portfolio/dcb/features/fire-vfx/) |
| [rope-bridge](../content/project-videos/20261023-rope-bridge.json) | 출렁다리 통과 | [erILYq-fVrs](https://youtu.be/erILYq-fVrs) | 전체 | [출렁다리](https://imjae.github.io/portfolio/dcb/features/rope-bridge/) |
| [cinematic](../content/project-videos/20261023-cinematic.json) | 구간 진입 연출과 조작 복귀 | [rvr7vHGnxbs](https://youtu.be/rvr7vHGnxbs) | 전체 | [시네마틱](https://imjae.github.io/portfolio/dcb/features/cinematic/) |
| [cargo-loading](../content/project-videos/20261024-cargo-loading.json) | 세 상자 적재와 운반 | [cwioqPE3WBo](https://youtu.be/cwioqPE3WBo) | 독립 영상 전체, 약 17초 | [지게와 짐의 움직임](https://imjae.github.io/projects/dcb/features/jige-cargo-motion/) |
| [gather-repair](../content/project-videos/20261023-gather-repair.json) | 채집·지게 수리·다시 메기 | [5qSsfoFM6DM](https://youtu.be/5qSsfoFM6DM) | 전체 | [지게와 짐의 움직임](https://imjae.github.io/portfolio/dcb/features/jige-cargo-motion/) |
| [shrine](../content/project-videos/20261023-shrine.json) | 신단 기도와 빛 연출 | [m57pwK81DsQ](https://youtu.be/m57pwK81DsQ) | 전체 | [프로젝트 소개](https://imjae.github.io/portfolio/dcb/)의 신단 효과 |
| [okgwi](../content/project-videos/20261024-okgwi.json) | 옥귀 공격과 최종 처치 | [PlPyW9IJ2Eo](https://youtu.be/PlPyW9IJ2Eo) | 독립 영상 전체, 약 25초 | [몬스터 전투](https://imjae.github.io/projects/dcb/features/monster-combat/) |

[지원용 포트폴리오](https://imjae.github.io/portfolio/krafton-2027/)에는 `project`, `combat`, `traversal`, `equipment`, `water`, `fire`의 6개 대표 영상을 연결한다. 몬스터 전투 페이지에서는 `combat` 다음에 `okgwi`, 지게 페이지에서는 `cargo-loading` 다음에 `gather-repair`를 표시한다. 신단 영상은 프로젝트 소개에 연결하며, 관련 초안 글의 공개 상태는 바꾸지 않는다.

## 이전 발췌 슬롯의 설정 — 10월 24일 교체됨

아래는 업로드 한도가 걸렸던 기간의 설정 기록이다. 현재는 위의 독립 영상 전체를 재생한다.

`cargo-loading`은 전체 요약의 104–111초를 사용한다. 등록 데이터에 `startSeconds: 104`, `endSeconds: 111`, `clipVariant: "main-cargo-excerpt"`를 저장했다. 제목은 지게 적재 영상의 제목을 유지하고 캡션은 다음 고정 문구를 선택한다.

> 전체 요약에서 세 상자의 적재 장면과 지게를 메고 이동하는 부분을 발췌했습니다. 지게 메기는 1.6배, 이동은 1.3배입니다.

`okgwi`는 전투 영상의 20–45초를 사용한다. `startSeconds: 20`, `endSeconds: 45`를 저장하며 기존 옥귀 영상의 제목과 원속도 하이라이트 캡션을 사용한다.

두 구간 모두 초 단위 정수로 설정한다. 페이지 안의 YouTube 플레이어에는 시작·종료 시각을 전달한다. 원본 링크의 `?t=104`와 `?t=20`은 시작 위치를 지정하며, 원본 YouTube 페이지에서는 이후 영상이 계속 재생될 수 있다.

## 이후 영상 교체 방법

옥귀 또는 지게 적재의 독립 영상을 업로드한 뒤, [영상 수정 화면](https://imjae.github.io/editor/#project-video)에서 해당 슬롯의 주소를 새 영상 주소로 바꾸고 저장한다. 이 화면은 새 등록 기록을 만들어 GitHub 저장 화면으로 전달한다. 새 기록에는 이전 발췌 구간과 `clipVariant`가 들어가지 않는다.

등록 JSON을 직접 작성할 때도 기존 발췌 기록을 남기고 `content/project-videos/`에 새 파일을 추가한다. 다음 값만 저장한다.

| 필드 | 값 |
| --- | --- |
| `version` | `1` |
| `project` | `"dcb"` |
| `createdAt` | 저장 시점의 ISO UTC 시각. 같은 슬롯의 기존 기록보다 이후여야 한다. |
| `slot` | `"cargo-loading"` 또는 `"okgwi"` |
| `videoUrl` | 업로드를 완료한 독립 영상의 실제 공유 주소 |

`startSeconds`, `endSeconds`, `clipVariant`는 새 기록에서 제외한다. 전체 독립 영상의 주소에는 기존 발췌용 `?t=`도 붙이지 않는다. `createdAt`은 `new Date().toISOString()` 형식을 사용하며, 현재 등록 기록의 시각은 `2026-10-23T01:03:00.000Z`이다. 파일명과 관계없이 슬롯별 `createdAt`이 가장 최근인 기록을 선택한다.

지게 슬롯은 `clipVariant`가 없는 새 기록을 읽으면 공통 데이터의 원속도 캡션으로 돌아간다. 제목과 캡션을 등록 JSON에 복사할 필요는 없다. 영상을 해제할 때는 구간·variant 없이 `videoUrl: ""`인 최신 기록을 저장한다.

## 배포와 확인

등록 데이터 준비 이후 `npm run verify`와 브라우저 확인을 진행한다. 대표 영상과 기능별 목적지, 독립 영상의 전체 재생 및 원속도 캡션을 확인한다. `main` 배포와 GitHub Actions 성공 이후 공개 주소에서도 재생과 모바일 표시를 확인하고 이 문서의 상태를 갱신한다.

관련 구현은 [설정 검증·최신 기록 선택](../src/lib/project-video.mjs), [영상 표시 컴포넌트](../src/components/DcbVideos.astro), [목적지 검사](../scripts/check-site.mjs)에 있다.
