# GitHub 소유자 로그인과 화면 편집

## 구조

공개 주소 `https://imjae.github.io`는 기존 블로그를 유지하고 View·Sign in을 제공한다. 공개 `/editor/`는 로그인 안내이며 글·고정·영상 관리 양식과 포트폴리오 편집 도구를 렌더링하지 않는다. `?edit=1`로도 편집 도구를 만들지 않는다.

Cloudflare Worker에는 같은 사이트의 **편집용 빌드**를 따로 배포한다. 로그인하면 기존 문구·영상·레이아웃이 있는 편집 주소로 이동한다. 서버가 GitHub `/user`의 고유 ID를 `37284282`와 비교한다. 이는 2026-10-23 공개 GitHub API로 확인한 `imjae` 계정 ID다. 로그인 이름만으로 허용하지 않는다.

Worker는 모든 요청에서 자산보다 먼저 실행한다(`assets.run_worker_first: true`). 로그인하지 않은 사람과 다른 계정은 관리 HTML·JavaScript·정적 자산을 받을 수 없다. 공개 저장소에 있는 코드를 복사해 개인 브라우저에서 바꾸는 것과 블로그의 관리 권한은 구분한다. 공개 저장은 기존 GitHub 쓰기 권한과 Commit changes를 계속 사용하며 로그인 서버에 저장소 쓰기 권한을 주지 않는다.

편집 서버 주소는 `https://imjae-blog-author.imjae-game-dev-notes.workers.dev`이며 OAuth 콜백은 이 주소의 `/auth/callback`입니다. 2026-10-23 Wrangler의 최소 권한 로그인을 마치고 보호된 빌드를 배포했습니다. GitHub OAuth 앱 `imjae Blog Editor`(설정 ID `3957530`)의 Client ID를 연결하고 Secret은 Cloudflare에만 등록했습니다. 실제 imjae 로그인·문구 편집·View·새로고침 복원·취소와 로그아웃 후 세션 차단을 확인했습니다. 다른 실제 GitHub 계정은 사용하지 않았으며 타 계정 ID·위조·만료·재사용 거부는 자동 검사로 확인했습니다.

## 로그인과 세션

### 소유자 글 저장소

`OWNER_POSTS` / `OwnerPosts`는 세션 저장소와 별도인 SQLite Durable Object입니다. `/notes/edit/`, `/api/notes`와 글 수정·미리보기·이전 API는 기존 소유자 세션 및 같은 origin POST 검사를 통과해야 합니다. 토큰 권한·보관 정책은 바꾸지 않습니다. 새 글은 항상 private이며 Markdown의 draft/visibility 값을 접근 권한으로 사용하지 않습니다. 글 저장과 공개 범위 변경은 버전 비교와 트랜잭션으로 처리합니다.

로그인 앞에서 허용되는 예외는 GET/HEAD `/api/notes/public`과 **현재 public 상태인** `/notes/<slug>/`의 읽기뿐입니다. 목록과 본문 모두 저장소에서 공개 상태를 검사합니다. 비공개 글의 제목·요약·본문은 익명 응답에 포함하지 않으며, 관리 API·기존 자산·다른 계정 허용 범위는 확장하지 않습니다. 공개 글 응답도 no-store로 내려 토글 후 오래된 서버 캐시가 본문을 제공하지 않게 합니다. 로그인 없는 목록의 CORS는 공개 블로그 origin만 허용합니다.

원문은 GitHub·정적 빌드·공개 manifest에 넣지 않습니다. 이전 설정인 `content/managed-posts/<slug>.json`에는 version과 이미 공개된 slug만 넣습니다. 공개 경로는 원본 Markdown 파일이 제거돼도 유지합니다. GitHub 원본 제거와 양쪽 배포·실제 이전 주소를 확인하기 전에는 이전 완료로 표시하지 않습니다. 이전 커밋의 원문은 과거 공개 기록으로 남습니다. 새 서버 글의 공개·비공개 전환에는 GitHub 쓰기 권한이나 배포가 필요하지 않습니다.

본문은 remark/rehype 파싱·HTML 허용 목록을 거치고, 실행 가능한 URL·스크립트·임의 iframe을 제거합니다. KaTeX trust는 false, Mermaid securityLevel은 strict입니다. 표시 도구만 공개 정적 자산에서 읽으며 비공개 원문을 표시 도구에 전송하지 않습니다. 로그인 만료·탭 복귀 시 소유자 세션을 다시 검사합니다. 원문 백업은 소유자가 내려받는 Markdown이며 Git에 자동 추가하지 않습니다.

- OAuth에는 추가 scope를 요청하지 않는다. GitHub 토큰은 Worker에서 계정 확인에만 사용한 뒤 버리며 브라우저·쿠키·세션 저장소에 보관하지 않는다.
- OAuth state는 브라우저의 HttpOnly 쿠키와 대조하고 Durable Object에서 원자적으로 한 번만 소비한다. PKCE S256과 10분 만료를 적용한다.
- 로그인 성공 후 8시간의 무작위 서버 세션을 새로 발급한다. 세션 쿠키는 `__Host-`·Secure·HttpOnly·SameSite=Lax를 사용한다. 이전 세션은 폐기한다.
- 로그아웃은 같은 origin의 POST만 허용하며 서버의 세션을 삭제한다. 삭제된 세션은 다시 사용할 수 없다.
- 보호된 응답은 `private, no-store`이며 검색 수집을 막는다. 인증 설정 누락·GitHub 오류·세션 저장소 오류는 편집을 허용하지 않는다.
- 로그인 뒤에도 같은 화면의 Edit에서 문구를 고치고 View에서 미리 본다. 새로고침·임시 편집 복원·GitHub 저장은 기존 방식이다. 세션이 만료되면 다시 로그인한다.

## main 저장과 자동 배포

GitHub에서 글이나 포트폴리오 문구를 `main`에 저장하면 다음 두 워크플로가 같은 커밋으로 실행된다.

- `Publish game development notes`: 검사 후 공개 GitHub Pages에 `dist/`를 배포한다.
- `Publish owner-only editor`: 검사 후 보호된 편집 빌드 `.authoring-dist/`와 로그인 Worker를 Cloudflare에 배포한다.

사용자는 GitHub의 Commit changes로 저장하고 두 워크플로가 완료될 때까지 기다리면 된다. 로컬 Wrangler 로그인이나 수동 편집 서버 배포는 필요하지 않다. 공개 화면과 편집 화면은 배포 완료 시간이 잠시 다를 수 있으며, 실패한 워크플로는 Actions에서 원인을 확인한 뒤 다시 실행한다. 두 빌드를 섞거나 `.authoring-dist/`를 Pages에 업로드하지 않는다.

편집 서버의 자동 배포는 저장소 변수 `AUTHORING_DEPLOY_ENABLED=true`와 Actions Secrets의 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`를 사용한다. 토큰은 해당 계정의 `imjae-blog-author` Worker를 갱신할 수 있는 Editor 권한으로 제한하고, GitHub 저장소 파일·워크플로 본문·빌드 결과에는 넣지 않는다. 인증 값이 없으면 편집 서버 워크플로는 배포 전 명확한 오류로 종료한다. 토큰을 폐기하거나 만료한 경우 Actions Secret만 교체한다.

## 저장 후 진행 확인

보호된 화면의 저장·배포 진행창은 `/api/publish-progress/start`에서 공개 글의 수정 전 커밋을 고정하고 `/api/publish-progress/status`에서 해당 파일의 커밋·원문과 두 Actions·실제 배포를 확인한다. 설정 JSON은 고유 파일 경로와 예상 내용 해시로 연결한다. 두 빌드의 `publish-manifest.json`이 같은 배포 커밋과 대상 원문을 포함하고 두 워크플로가 성공해야 완료다. 후속 배포는 원래 저장을 포함하는 후속 커밋인지 대조한다. 분할 저장은 모든 파일을 확인한다.

API는 기존 소유자 세션과 같은 origin POST 뒤에서만 동작한다. GitHub 공개 리소스를 읽으며 로그인 토큰·저장소 쓰기 권한·새 자격 증명을 추가하지 않는다. 조회 요청은 30초 간격으로 수행하고 숨긴 탭은 멈추며 서버 조회 제한에는 재시도 안내를 표시한다. 배포 확인용 공개 JSON에는 공개 글·공개 설정의 경로와 원문 해시만 들어가며 초안 본문이나 비밀 값은 포함하지 않는다. 새 글 초안 작성·삭제는 기존 흐름을 유지한다.

## 연결 순서

비밀번호·Client Secret·Cloudflare API 토큰은 채팅·Git·문서·명령 인자로 전달하지 않는다.

1. Cloudflare 계정에서 Workers 사용을 준비한다. 로컬 CLI는 `npx wrangler login --scopes account:read user:read workers_scripts:write --use-keyring`으로 로그인한다. Windows keyring 의존성이 필요하면 Wrangler가 안내하는 공식 패키지를 설치한다. 기본 승인 만료가 짧을 경우 `--device`를 사용한다. 계정·사용자 조회와 Worker 배포 외의 추가 scope를 요청하지 않으며, CLI의 로그인 유지는 Cloudflare가 요구하는 Background Access를 사용한다. 새 이용약관·결제·권한 승인이 나타나면 내용을 확인한 뒤 본인이 결정한다.
2. `npm run author:build`로 편집용 `.authoring-dist/`를 만든다. `npx wrangler deploy --config wrangler.authoring.jsonc`로 Worker 주소를 확보한다. OAuth 설정을 채우기 전에는 503으로 닫혀 있으므로 편집 화면이 공개되지 않는다.
3. GitHub **Settings → Developer settings → OAuth Apps → New OAuth App**에서 앱을 등록한다. Homepage URL은 `https://imjae.github.io`, Authorization callback URL은 **실제 Worker origin 뒤의 `/auth/callback`**으로 지정한다. 기기 인증 흐름과 추가 scope는 사용하지 않는다.
4. 공개 정보인 Client ID는 `wrangler.authoring.jsonc`의 `GITHUB_CLIENT_ID`에 넣는다. 이 값은 공개 앱 식별자이며 로그인 비밀 값이 아니다. Client Secret은 Cloudflare 대시보드의 Worker **Settings → Variables and Secrets**에서 **Secret** 타입의 `GITHUB_CLIENT_SECRET`으로 직접 등록한다. Client Secret은 명령 인자·저장소 파일에 적지 않는다.
5. GitHub 저장소의 Actions **Variables**에 `AUTHORING_ORIGIN`을 실제 Worker origin으로 설정한다. origin에는 HTTPS 주소만 쓰고 경로·쿼리·마지막 항목은 붙이지 않는다.
6. 자동 동기화에는 `imjae-blog-author` Worker의 Editor 권한을 가진 Cloudflare API 토큰을 만든다. GitHub Actions **Secrets**에 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`를 등록하고 **Variable** `AUTHORING_DEPLOY_ENABLED=true`를 지정한다. 토큰은 배포 명령의 환경 변수로만 전달하며 브라우저나 블로그 빌드에 전달하지 않는다.
7. `Publish owner-only editor`를 실행해 최신 본문과 편집 도구를 Worker에 배포한다. 공개 Pages 워크플로도 실행해 Sign in 링크를 연결한다. 이후 main 변경은 두 배포로 동기화한다. Worker 배포는 기존 Client Secret을 유지한다.
8. 실제 GitHub 로그아웃 상태·다른 계정·imjae 계정에서 각각 확인한다. imjae 로그인 뒤 직접 문구 편집·View·임시 복원·GitHub 저장을 확인하고, 로그아웃 뒤 보호된 주소와 자산을 다시 열어 거부되는지 확인한다.

`AUTHORING_ORIGIN`은 실제 편집 서버 주소로 설정했고 자동 배포 인증과 활성화 변수를 연결했다. main의 글·문구 변경은 두 워크플로로 동기화한다. 수동 복구가 필요한 경우에는 최신 main만 담은 작업 공간에서 `npm ci`, `npm run author:build`, `npx wrangler deploy --config wrangler.authoring.jsonc`를 실행한다. `.authoring-dist/`를 Pages에 올려 대신하지 않는다.

## 로컬 검사

```sh
npm run verify
npm run author:build
npx wrangler deploy --config wrangler.authoring.jsonc --dry-run
```

Cloudflare Workers는 외부 fetch의 `redirect: error`를 지원하지 않으므로 `manual`을 사용하고 3xx·비정상 응답을 거부한다. Client Secret과 GitHub 토큰이 다른 주소로 전달되는 자동 리디렉션은 사용하지 않는다.

기존 사이트 검사에 공개 빌드의 Edit·관리 양식 제외와 보호 빌드의 직접 편집 유지 검사를 나눴다. 인증 테스트는 state·PKCE·소유자 ID·세션 위조와 만료·CSRF·로그아웃·오류 시 차단·자산 접근을 다룬다. GitHub 응답을 대체한 자동 검사는 실제 GitHub OAuth나 Cloudflare 배포 검증을 대신하지 않는다.

참고: [GitHub OAuth 흐름](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [Worker 우선 실행](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [Durable Object 저장소](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).
