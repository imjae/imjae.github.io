# SketchBrowser 필기 수정 연동

2026-10-25. 공개 글의 필기를 접수하고 소유자가 승인한 AI 수정안을 배포한다. 앱·PC 실행기 사용법과 제한은 SketchBrowser 저장소의 `docs/blog-review-flow.md`를 따른다.

## 운영 경로

- 소유자 화면: `https://imjae-blog-author.imjae-game-dev-notes.workers.dev/sketch/`
- 기존 GitHub 로그인과 허용 계정 ID를 그대로 사용한다. 공개 Pages에는 수정 UI나 필기 자료가 없다.
- `server/author-auth.mjs`가 인증한 소유자만 `server/sketch-review.mjs`의 owner API를 사용한다. 실행기는 별도 Worker secret으로 runner API에 접근하며 승인 권한은 없다.
- `SketchReviews` SQLite Durable Object가 요청·임대·승인 영수증과 분할된 이미지·미리보기를 보관한다. `wrangler.authoring.jsonc`의 `v2-sketch-reviews` 마이그레이션이 생성한다. 기존 로그인 세션 저장소와 별개다.
- PC 실행기는 사용자 전용 폴더에 별도 clone/worktree를 만든다. AI는 이미지와 원문으로 구조화된 문장 교체 제안만 반환한다. 대상 글의 본문만 실행기가 교체하고 실제 빌드·브라우저 검사를 수행한다.

## 원본 연결

`scripts/sketch-source.mjs`는 URL의 slug를 고정 Git 커밋의 공개 Markdown frontmatter에서 찾아 경로·기반 커밋·LF 정규화 SHA-256을 반환한다. draft, 외부 URL, 없는 ref, 중복 slug, 심볼릭 링크를 거절한다. 기본 체크아웃의 미저장 변경은 읽지 않는다.

```powershell
npm run sketch:resolve -- --url https://imjae.github.io/writing/cli-agent-harness/ --ref HEAD
```

`src/lib/sketch-source.server.mjs`가 빌드 원문에 같은 해시를 적용한다. 공개 글에는 `data-sketch-source`만 넣으며 로컬 경로는 노출하지 않는다. 필기한 버전과 최신 main의 원문이 달라지면 새 캡처가 필요하다. 이전 앱의 필기는 현재 화면과 위치가 맞는지 사용자가 확인하고 전송한다.

## 실제 API

| 경로 | 주체와 역할 |
| --- | --- |
| `GET /sketch/` | 소유자 검토 화면 |
| `GET /api/sketch/jobs` | 소유자 요청 목록·PC 연결 상태 |
| `POST /api/sketch/jobs` | 소유자 캡처 제출, 같은 UUID 재시도 |
| `GET /api/sketch/jobs/:id/{image,review,preview}` | 소유자 자료 조회 |
| `POST /api/sketch/jobs/:id/{revise,reject,approve,delete}` | 소유자 추가 요청·폐기·정확한 결과 승인·완료 자료 삭제 |
| `POST /api/sketch/runner/claim` | 실행기 단일 작업 임대 |
| `GET /api/sketch/runner/jobs/:id/{input,review}` | 실행기 입력·승인 결과 조회 |
| `POST /api/sketch/runner/jobs/:id/{heartbeat,result}` | 임대 연장·세대가 일치하는 결과 제출 |
| `GET /api/sketch/runner/published/:slug` | 실행기의 보호된 편집 자산 원문 해시 확인 |

소유자 POST에는 같은 Origin과 `X-Sketch-Request: 1`이 필요하다. runner token·GitHub OAuth 토큰을 공개 글이나 앱 JavaScript에 전달하지 않는다. 앱은 별도 WebView의 HttpOnly 소유자 쿠키로 요청한다. HTTP 입력 형식·용량 검사는 `server/sketch-protocol.mjs`가 담당한다.

## 승인과 배포

검토 화면은 **변경 비교 / 글 미리보기 / 보낸 필기**로 나눈다. 변경 비교는 900px 이상에서 수정 전후를 나란히, 좁은 화면에서 전환해 표시한다. 변경 위치 선택과 이전/다음으로 긴 비교를 이동한다. 미리보기는 별도 스크롤 영역이고, 하단 확인 체크와 **승인하고 배포**는 검토 중 유지된다. **추가 수정 요청**은 별도 입력 화면에서 보낸다. 자동 상태 조회로 같은 수정안의 입력·스크롤·체크를 초기화하지 않으며, 새 수정안은 다시 확인해야 한다. 원본 diff·검사 결과는 보낸 필기의 상세에서 확인한다.

`sketch-ui.mjs`는 인증 뒤 HTML/CSP를 제공하고, `sketch-ui-client.mjs`는 브라우저 코드를 문자열로 보존해 Worker 번들러의 서버 전용 보조 함수가 섞이지 않게 한다. `sketch-diff.mjs`는 승인 대상인 원본 diff에서 비교 표시만 추출한다. 본문은 textContent로 표시하므로 HTML·코드를 실행하지 않는다. 표시용 변환은 승인 digest·원본 diff를 바꾸지 않는다.

검토 결과는 기반/결과 커밋, source/after 해시, 미리보기·diff 해시, 검사 결과 및 요청 세대에 묶인 digest로 고정된다. 서버는 소유자가 본 review ID·digest와 현재 main을 확인해 24시간 승인 영수증을 만든다. 추가 수정은 이전 결과·승인을 제거한다.

PC는 승인한 로컬 커밋·diff·미리보기·원문과 깨끗한 작업 공간을 재확인한다. main이 기반과 같을 때 그 head를 일반 fast-forward push한다. `.github/workflows/deploy.yml`과 `authoring.yml`이 같은 커밋으로 성공하고 공개/편집 글의 해시가 모두 일치해야 배포 완료다. 실제 글의 변경은 사용자 승인 전에는 main에 올리지 않는다.

미리보기는 실제 렌더 결과에서 실행 코드·폼·영상·페이지 이동을 제거한 정적 HTML이다. CSS·렌더된 Mermaid를 포함하고, 기존 공개 이미지·폰트만 공개 사이트에서 불러온다. 인증된 응답과 iframe 모두 sandbox를 적용해 동일 출처 API 접근을 차단한다. R2·별도 호스트는 사용하지 않는다.

## 배포·운영

기존 authoring Actions가 Worker 코드·DO 마이그레이션·보호된 자산을 함께 배포한다. PC의 `review:setup`은 Wrangler로 `SKETCH_RUNNER_TOKEN` secret을 등록한다. 값은 Git·문서·출력·명령 인자에 넣지 않는다. 기존 `GITHUB_CLIENT_SECRET`과 허용 계정 설정은 유지한다.

요청 100개, 이미지 base64 4MB, 미리보기 HTML 3MB, 설명 4,000자로 제한한다. 파일은 60KB 단위로 나누고 복원 시 SHA-256을 대조한다. 완료·폐기·실패 자료는 UI에서 삭제하거나 30일 후 정리한다. PC 작업 폴더는 별도로 보관한다.

배포 작업의 프로세스가 종료되면 임대 만료 후 동일 승인 커밋을 이어서 확인한다. 명시적 실패는 화면에 표시하고 Actions/로컬 로그로 원인을 확인한다. 실패한 Actions 자동 재실행·롤백은 제공하지 않는다. main이 바뀌면 새 미리보기·승인이 필요하다.

## 검사 범위

`npm run verify`, `npm run author:build`와 SketchBrowser의 `pnpm test:review`를 실행한다. 테스트는 인증·CSRF·중복 접수·임대·오래된 결과·무승인 배포·main 경쟁 변경·두 배포 확인을 검사한다. 브라우저 테스트는 실제 UI와 메모리 저장소를 사용하며 공개 글을 승인·수정하지 않는다. Galaxy Tab의 로그인·물리 화면 캡처와 사용자가 실제 글을 승인하는 과정은 별도 실사용 확인이다.
