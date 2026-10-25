import { parseReviewDiff } from './sketch-diff.mjs';
import { reviewClientSource } from './sketch-ui-client.mjs';
import { reviewStyles } from './sketch-ui-style.mjs';

export function reviewPage() {
  const nonce = crypto.randomUUID();
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>필기로 블로그 수정</title>
  <style>${reviewStyles}</style></head><body><main class="app-shell">
  <header class="topbar"><div><h1>필기로 블로그 수정</h1><p id="connection" class="muted"></p></div><button id="requests-toggle" aria-controls="request-list" aria-expanded="false">요청 목록</button></header>
  <p id="error" role="alert" class="error"></p>
  <section id="capture" hidden><h2>이 화면의 필기를 보낼까요?</h2><p id="capture-title"></p><img id="capture-image" alt="전송할 원문과 필기"><label for="instruction">추가 설명 (선택)</label><textarea id="instruction" maxlength="4000" placeholder="필기한 내용에 따라 문장을 다듬어 주세요."></textarea><p class="muted">화면에 보이는 필기와 원문 문맥을 전송합니다. 원래 필기는 기기에 남습니다.</p><div class="actions"><button id="submit" class="primary">AI로 수정안 만들기</button><button id="discard">전송 취소</button></div></section>
  <div id="workspace" class="workspace"><aside id="request-list" class="requests" aria-label="수정 요청 목록"><h2>수정 요청</h2><div id="jobs"></div></aside><div id="empty" class="empty">요청을 선택하면 수정 전후를 비교할 수 있습니다.<br>새 요청은 글 화면에서 필기를 전송해 주세요.</div><section id="detail" aria-label="선택한 수정 요청" hidden></section></div>
  </main><script nonce="${nonce}">(${reviewClientSource})(${parseReviewDiff.toString()});</script></body></html>`;
  return new Response(html, {headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'self'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`}});
}
