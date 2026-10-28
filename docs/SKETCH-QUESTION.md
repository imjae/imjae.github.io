# SketchBrowser 일회용 영역 질문 서버

2026-10-28. 소유자가 펜으로 선택한 이미지에 한 번 답하는 기능이다. API 키 없이 개인 PC의 Codex에 로그인한 ChatGPT 구독 계정으로 답한다. 공개 글·포트폴리오 문구는 변경하지 않는다. 기존 APK 0.2.2에는 질문 도구가 없으며 앱 빌드는 사용자 요청에 따라 별도로 진행한다.

## 연결 구조

앱의 보호된 답변 패널 → 기존 GitHub 소유자 인증 Worker → 현재 연결된 개인 PC 질문 실행기 → 로컬 Codex app-server 순서다. 서버는 선택 이미지와 결과를 중계한다. ChatGPT 인증은 PC에만 있고 서버나 앱으로 복사하지 않는다. 이 구성은 개인 로컬 Codex의 원격 사용이며 공개·다중 사용자 추론 서비스가 아니다. [Codex 인증](https://learn.chatgpt.com/docs/auth), [app-server 사용 범위](https://learn.chatgpt.com/docs/app-server)를 따른다.

- `GET /sketch/ask/`: 소유자용 일회용 답변 화면.
- `POST /api/sketch/ask`: UUID·PNG 이미지로 질문. 소유자 세션, 같은 Origin, `X-Sketch-Request: 1` 검사.
- `POST /api/sketch/ask/cancel`: 해당 질문 취소. 먼저 도착한 취소도 2분 동안 ID로 기억해 늦은 업로드를 막는다.
- `GET /api/sketch/ask/status`: 소유자에게 실행기 연결·처리 상태 반환.
- `GET /api/sketch/question-runner/connect`: 기존 내부 `SKETCH_RUNNER_TOKEN`으로 인증하는 WebSocket. 브라우저 소유자 세션을 대체하지 않는다.

`wrangler.authoring.jsonc`의 `SKETCH_QUESTIONS` 바인딩과 `v3-sketch-questions` 마이그레이션을 배포한다. Durable Object는 하나의 소유자 연결을 유지하지만 `state.storage`를 사용하지 않는다. 기존 GitHub 인증과 내부 실행기 토큰을 유지하며 `OPENAI_API_KEY`·별도 API 요금제는 필요 없다.

## PC 실행

SketchBrowser 저장소에서 `pnpm question:start` / `pnpm question:stop`으로 관리한다. 기존 글 수정 실행기와 별도 프로세스·로그다. 기존 DPAPI 보호 설정을 재사용하고 `config.json`의 `questionModel`을 `gpt-6.1-sol`로 지정했다. Codex CLI 0.164.0의 로컬 ChatGPT 로그인을 검사하며 API 키 로그인은 거절한다. 구독 사용량·모델 접근 제한을 따른다.

PC가 켜져 있고 실행기가 연결되어야 한다. 재부팅 후 수동으로 다시 시작하며 자동 시작·절전 설정은 바꾸지 않는다. 연결이 끊기면 실행기가 자동 재연결하고 대기 중 질문은 실패 처리한다. 오프라인 질문은 보관·예약하지 않는다.

## 처리와 수명

PNG base64 최대 4MB, 동시에 한 질문, 메모리 카운터 기준 분당 5회다. 재시작하면 카운터는 초기화된다. 로컬 실행기는 매 요청마다 stdio app-server를 시작하고 `ephemeral: true`와 이미지 data URL로 질문한다. 작업 공간·셸·MCP·브라우저 등 도구를 비활성화하며 승인 요청을 거절한다. 모델에 2~4문장의 JSON 결과를 요청하고 최대 1,800자 평문으로 검증한다. `no_content`와 `unreadable`은 서버의 고정 한국어 안내로 바꾼다.

모델 답변 제한 75초, 중계 90초, 화면 100초다. 패널 종료·요청 취소·연결 종료는 진행 중 질문을 해제하고 PC 질문 프로세스를 종료한다. 이미 소비한 구독 사용량까지 취소하는 것은 아니다. 명시적 재시도는 새 ID의 새 요청이다.

이미지·답변은 앱·Worker 저장소·PC 파일이나 로그에 기록하지 않는다. HTTP는 `private, no-store`, WebView 캐시는 비활성화다. 임시 Codex 스레드는 로컬 대화 기록을 남기지 않는다. 질문 런타임 폴더는 실행 위치일 뿐 이미지·답변 저장 위치가 아니다. 로그인 세션은 기존 정책대로 유지한다. OpenAI 측 데이터 처리·보관은 ChatGPT 계정 설정과 정책을 따르며 이 기능의 무저장 보장과 구분한다.

## 검사와 배포

`npm test`, `npm run check`, `npm run author:build`로 서버 배포 전 검사한다. SketchBrowser의 `pnpm test:question`은 실제 처리기·UI와 Miniflare WebSocket 런타임을 사용한다. 인증·CSRF·입력 크기·오프라인·취소 선도착·타임아웃·늦은 응답·한도·고정 안내·저장소 미사용을 확인한다. 자동 검사의 모델은 테스트 대역이다.

별도 실제 ChatGPT 구독 호출에서 합성 “1 + 1은?” 이미지의 답 2와 흰색 400×300 이미지의 `no_content`를 확인했다. 다양한 손글씨·수식과 Android WebView 로그인·캡처는 실물 검증 대상이다. 서버 배포는 `main`의 기존 owner-only editor 워크플로를 사용한다. 앱 빌드 워크플로는 실행하지 않는다.
