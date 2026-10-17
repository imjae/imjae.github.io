---
title: "HTTP 요청·응답·실패·취소를 작업 API로 이해하기"
description: "상태 코드와 네트워크 실패, 요청 취소와 서버 작업 취소를 구분한다. 내장 Response를 사용하는 실행 예제와 재시도 실습·풀이를 제공한다."
slug: "http-response-failure-cancellation"
date: "2022-01-18"
dateBasis: "notion"
updated: "2026-10-18"
topic: "notes"
kind: "note"
tags: ["HTTP", "JavaScript", "API", "Async"]
draft: false
---

## 응답을 받았는데 작업은 실패할 수 있다

[HTTP 노트](https://app.notion.com/p/3427b0bc1ead41f8bb221b8868318552)는 짧은 개요다. 하위 문서 전체를 읽은 것처럼 쓰지 않고, 요청·응답과 실패 경계를 설명하는 새 예제를 작성했다. 노트의 ‘무상태는 서버가 상태를 전혀 보관하지 않는다’는 해석을 보완한다. 세션·DB·작업 상태를 서버가 저장할 수 있으며 HTTP의 요청 의미와 별개다.

HTTP/1.1·HTTP/2를 TCP 기반으로 보는 설명을 HTTP 전체의 유일한 전송으로 일반화하지 않는다. HTTP/3는 QUIC을 사용한다. 여기서는 전송 구현보다 애플리케이션 요청·응답에 집중한다. [MDN HTTP 개요](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview), [HTTP/3 RFC 9114](https://www.rfc-editor.org/rfc/rfc9114)

| 관찰 | 의미 |
| --- | --- |
| HTTP 200 | 요청 처리가 해당 응답 의미로 성공, body의 작업 상태는 별도 |
| HTTP 202 | 처리를 받아들였음, 작업 완료 보장 아님 |
| HTTP 404·500 | HTTP 응답은 받았음, 성공 상태와 다름 |
| fetch reject | 네트워크·취소·정책 오류 등, HTTP 상태가 없을 수 있음 |

## 응답 검사 모델

Node.js 24의 내장 Response를 사용한다. 외부 서버나 실제 계정에 연결하지 않는다. `http.mjs`로 저장해 실행한다.

```javascript
async function readTask(response) {
  if (!response.ok) throw new Error('HTTP ' + response.status);
  if (!(response.headers.get('content-type') || '').includes('application/json'))
    throw new Error('content type');
  const body = await response.json();
  if (!body || typeof body !== 'object' || typeof body.status !== 'string')
    throw new Error('body');
  return body.status;
}
console.log(await readTask(Response.json({status:'running'},{status:202})));
try { await readTask(new Response('missing',{status:404})); }
catch (error) { console.log(error.message); }
```

```text
running
HTTP 404
```

fetch는 404·500 응답을 받았다는 이유만으로 반드시 reject하지 않는다. response.ok·status를 검사하고 본문 스키마도 검사한다. 유효한 JSON은 작업 결과 타입까지 유효하다는 뜻이 아니다. [Fetch 사용 설명](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

## 취소와 재시도는 서버의 계약까지 본다

AbortController는 클라이언트가 응답을 더 기다리지 않도록 할 수 있다. 이미 서버에서 시작한 빌드·결제를 되돌린다는 뜻은 아니다. 가상의 작업 취소 API가 있다면 권한·중복 요청·이미 완료된 경우의 결과를 별도로 정의한다.

네트워크가 끊겼을 때 서버가 요청을 받았는지 알 수 없는 경우도 있다. 변경 요청을 무조건 재전송하면 작업이 두 번 생길 수 있다. 서버의 idempotency key나 동일 작업 식별 계약을 사용하고, 조회 재시도도 제한·backoff·취소를 둔다. API에 그런 계약이 없다면 클라이언트만으로 중복을 완전히 막는다고 설명하지 않는다.

## 실습과 풀이

1. 200 응답 body를 status=failed로 바꾼다. **풀이:** HTTP 조회 성공과 조회한 작업의 실패는 별개다. UI는 body의 작업 상태를 표시해야 한다.
2. 응답을 application/json이지만 잘못된 문자열로 만든다. **풀이:** JSON 파싱 오류를 처리한다. content-type 검사만으로 내용이 정상이라고 보지 않는다.
3. POST 직후 응답이 끊겼다. **풀이:** 무조건 새 작업을 만들지 말고 요청 식별자로 처리 여부를 조회하거나 서버가 정한 멱등성 계약으로 재시도한다. 실제 서버 없이 그 보장을 확인했다고 쓰지 않는다.

## 확인한 범위

2026년 10월 17일 본문의 JavaScript를 추출해 Node.js 24.15.0에서 실행했고, 표시한 입력의 출력과 일치했다. 이 확인은 독립 수치·응답 모델의 해당 예제 입력을 대상으로 한다.

노션 개요와 공개 HTTP·Fetch 문서를 대조해 내장 응답 예제를 작성했다. 실제 서버·브라우저 CORS·인증·네트워크 취소·재시도·HTTP/3 연결은 미검증이다. 콘솔 모델은 응답 판독 경계만 다룬다. AI를 작성 보조에 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [Unity에서 클라우드 데이터에 접근할 때의 인증·SDK 경계](/writing/unity-cloud-auth-sdk-boundary/)
