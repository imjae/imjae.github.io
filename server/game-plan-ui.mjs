import { escapeHtml, renderPostBody } from './owner-posts.mjs';
import { postStyles } from './owner-post-style.mjs';

export async function gamePlanPage(game, plan, editing = false) {
  const nonce = crypto.randomUUID();
  const path = `/games/${game.id}/`;
  const content = editing
    ? `<form id="plan-form" data-id="${game.id}" data-version="${plan.version}"><label for="plan-body">기획 내용 <span class="muted">· Markdown</span></label><textarea id="plan-body" class="body-input" spellcheck="false">${escapeHtml(plan.body)}</textarea><div class="plan-actions"><button type="submit">저장</button><a href="${path}">본문 보기</a><span id="save-status" role="status" aria-live="polite"></span></div></form>`
    : `<article class="prose">${plan.body.trim() ? await renderPostBody(plan.body) : '<p class="empty-plan">아직 본문을 작성하지 않았습니다.</p>'}</article>`;
  const script = `
    let authenticated = true;
    async function checkOwner() {
      try {
        const response = await fetch('/auth/session', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) { authenticated = false; document.body.style.visibility = 'hidden'; location.replace('/auth/login?return_to=' + encodeURIComponent(location.pathname + location.search)); return; }
        document.body.style.visibility = 'visible';
      } catch { document.body.style.visibility = 'hidden'; }
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) document.body.style.visibility = 'hidden'; else void checkOwner(); });
    window.addEventListener('pagehide', () => { document.body.style.visibility = 'hidden'; });
    window.addEventListener('pageshow', () => void checkOwner());
    setInterval(() => { if (!document.hidden) void checkOwner(); }, 60000);
    const form = document.getElementById('plan-form');
    if (form) {
      const input = document.getElementById('plan-body'), status = document.getElementById('save-status');
      const button = form.querySelector('button[type="submit"]');
      let saved = input.value, version = Number(form.dataset.version), saving = false;
      input.addEventListener('input', () => { status.textContent = input.value === saved ? '' : '저장하지 않은 변경 사항'; });
      window.addEventListener('beforeunload', event => { if (authenticated && input.value !== saved) { event.preventDefault(); event.returnValue = ''; } });
      form.addEventListener('submit', async event => {
        event.preventDefault(); if (saving) return;
        saving = true; button.disabled = true; status.textContent = '저장 중…';
        const body = input.value;
        try {
          const response = await fetch('/api/game-plans/' + form.dataset.id, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, version }) });
          const result = await response.json();
          if (!response.ok) throw new Error(response.status === 401 ? '로그인이 만료됐습니다. 입력한 내용을 복사한 뒤 다시 로그인해 주세요.' : result.message || '저장하지 못했습니다.');
          version = result.version; saved = body;
          status.textContent = input.value === saved ? '저장했습니다.' : '저장했습니다. 이후 변경 사항은 아직 저장되지 않았습니다.';
        } catch (error) { status.textContent = error.message || '저장하지 못했습니다. 연결을 확인해 주세요.'; }
        finally { saving = false; button.disabled = false; }
      });
    }
  `;
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(game.title)} — imjae</title><style>${postStyles}
    .plan-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:30px;border-bottom:1px solid var(--line);padding-bottom:26px}.plan-heading h1{margin:8px 0 0}.plan-heading .badge{margin:0}.plan-heading a{white-space:nowrap}.plan-actions{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-top:18px}.plan-actions button{padding:10px 22px}#plan-form label{display:block;margin-bottom:12px}#plan-body{min-height:55vh;resize:vertical;line-height:1.8}.empty-plan{color:var(--muted);padding:30px 0}.top nav{flex-wrap:wrap}#save-status{font-size:13px}body{visibility:hidden}@media(max-width:600px){.top{align-items:flex-start;gap:16px}.top nav{gap:14px}.plan-heading{gap:12px}.plan-heading h1{font-size:28px}}
  </style></head><body><header class="top"><a href="https://imjae.github.io/">imjae.</a><nav aria-label="Main navigation"><a href="https://imjae.github.io/writing/">Writing</a><a href="https://imjae.github.io/portfolio/">Portfolio</a><a href="/games/" aria-current="location">Games</a><a href="https://imjae.github.io/about/">About</a><form action="/auth/logout" method="post"><button>Sign out</button></form></nav></header><main class="reader"><p><a href="/games/">← Games</a></p><header class="plan-heading"><div><p class="badge">비공개 기획서 · 나만 보기</p><h1>${escapeHtml(game.title)}</h1></div>${editing ? '' : `<a href="${path}?edit=1">${plan.body.trim() ? '수정' : '기획 작성'}</a>`}</header>${content}</main><script nonce="${nonce}">${script}</script></body></html>`;
  return new Response(html, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; img-src https: data:; font-src data:; media-src https:; frame-src https://www.youtube-nocookie.com https://www.youtube.com; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
  } });
}
