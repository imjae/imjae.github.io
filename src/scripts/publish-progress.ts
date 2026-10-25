import { githubSaveTarget, progressTargets, sourceDigest } from '../lib/publish-progress.mjs';

type Target = { path: string; expectedHash?: string; beforeCommit?: string; commit?: string; state?: string };
type Position = { path: string; hash: string; y: number; key?: string; id?: string; offset?: number };
type Result = { phase: string; message: string; targets: Target[]; workflows: { state: string; url?: string }[] };
type Job = { id: string; label: string; createdAt: number; targets: Target[]; position: Position; prepared?: boolean; needsOpen?: boolean; result?: Result; error?: string; nextAt?: number };
const root = document.querySelector<HTMLElement>('#publish-progress');
if (root) {
  const storageKey = 'publish-progress:v1';
  const returnKey = 'publish-position:v1';
  const select = root.querySelector<HTMLSelectElement>('#publish-job')!;
  const message = root.querySelector<HTMLElement>('[data-publish-message]')!;
  const returnLink = root.querySelector<HTMLAnchorElement>('[data-publish-return]')!;
  const reopen = root.querySelector<HTMLAnchorElement>('[data-publish-reopen]')!;
  const checkButton = root.querySelector<HTMLButtonElement>('[data-publish-check]')!;
  const collapse = root.querySelector<HTMLButtonElement>('[data-publish-collapse]')!;
  const body = root.querySelector<HTMLElement>('[data-publish-body]')!;
  const articles = JSON.parse(document.querySelector('#publish-articles')!.textContent!) as Record<string, { url: string; title: string }>;
  const saveUrls = new Map<string, string>();
  let jobs: Job[] = [];
  let active = '';
  let checking = false;
  let starting = false;
  const terminal = new Set(['complete', 'conflict', 'draft']);
  const current = () => jobs.find(job => job.id === active);
  function persist() { try { sessionStorage.setItem(storageKey, JSON.stringify({ active, jobs })); } catch { /* 현재 화면의 확인은 계속한다. */ } }
  function capture(path: string): Position {
    if (path !== location.pathname) return { path, hash: '', y: 0 };
    const candidates = [...document.querySelectorAll<HTMLElement>('main [data-portfolio-copy], main [id]')].filter(node => node.getBoundingClientRect().height > 0);
    const target = candidates.filter(node => node.getBoundingClientRect().top <= 140).sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];
    return { path: location.pathname + location.search, hash: location.hash, y: scrollY, ...(target ? { key: target.dataset.portfolioCopy, id: target.id || undefined, offset: target.getBoundingClientRect().top } : {}) };
  }
  function validPosition(value: Position) {
    return value && typeof value.path === 'string' && /^\/(?!\/)/.test(value.path) && !/[\\\r\n]/.test(value.path) && new URL(value.path, location.origin).origin === location.origin && Number.isFinite(value.y) && value.y >= 0 && typeof value.hash === 'string' && (!value.hash || value.hash.startsWith('#'));
  }
  async function request(kind: string, targets: Target[]) {
    const response = await fetch('/api/publish-progress/' + kind, { method: 'POST', credentials: 'same-origin', redirect: 'error', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targets }), signal: AbortSignal.timeout(20000) });
    if (response.status === 401) { location.assign('/auth/login?return_to=' + encodeURIComponent(location.pathname + location.search + location.hash)); throw new Error('다시 로그인해 주세요.'); }
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.message || '진행 상태를 확인하지 못했습니다.'), { retryAfter: data.retryAfter });
    return data;
  }
  function render() {
    const job = current(); root!.hidden = !job;
    if (!job) return;
    select.replaceChildren(...jobs.map(item => { const option = document.createElement('option'); option.value = item.id; option.textContent = item.label; return option; }));
    select.value = job.id;
    const result = job.result;
    root!.dataset.phase = result?.phase ?? 'waiting';
    const remaining = job.targets.some(target => !target.commit);
    const text = job.error || (job.needsOpen && remaining ? '새 창이 제한됐습니다. 아래 GitHub 저장 화면 열기를 눌러 주세요. ' : '') + (result?.message || 'GitHub 저장 화면을 준비하고 있습니다.');
    if (message.textContent !== text) message.textContent = text;
    const count = job.targets.filter(target => target.commit).length;
    const labels: Record<string, string> = { waiting: '대기', running: '배포 중', success: '완료', failed: '실패', superseded: '다음 배포 확인 중' };
    for (const [index, name] of ['commit', 'pages', 'authoring'].entries()) {
      const row = root!.querySelector<HTMLElement>(`[data-publish-stage="${name}"]`)!;
      const state = index === 0 ? count === job.targets.length ? 'success' : 'waiting' : result?.workflows[index - 1]?.state ?? 'waiting';
      row.dataset.state = state;
      row.querySelector('span')!.textContent = index === 0 ? `${count}/${job.targets.length}개 저장` : labels[state] ?? '확인 중';
      row.querySelector('a')?.remove();
      const href = index > 0 && result?.workflows[index - 1]?.url;
      if (href && /^https:\/\/github\.com\/imjae\/imjae\.github\.io\/actions\/runs\/\d+$/.test(href)) { const link = document.createElement('a'); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = '기록 ↗'; row.append(link); }
    }
    returnLink.hidden = result?.phase !== 'complete';
    returnLink.href = job.position.path + job.position.hash;
    returnLink.dataset.returnScroll = String(job.position.y);
    reopen.hidden = !saveUrls.has(job.id); reopen.href = saveUrls.get(job.id) ?? '#';
    checkButton.disabled = checking || starting || !job.prepared;
  }
  async function poll(force = false) {
    if (checking || starting || document.visibilityState === 'hidden') return;
    const job = current();
    if (!job?.prepared || !force && (terminal.has(job.result?.phase ?? '') || Date.now() < (job.nextAt ?? 0))) return;
    if (Date.now() - job.createdAt > 2 * 60 * 60 * 1000 && !force) { job.error = '자동 확인을 잠시 멈췄습니다. 다시 확인을 눌러 주세요.'; render(); return; }
    checking = true; render();
    try { const result = await request('status', job.targets) as Result; job.result = result; job.targets = result.targets; delete job.error; job.nextAt = Date.now() + 30000; }
    catch (error) { const e = error as Error & { retryAfter?: number }; job.error = e.message || '연결을 확인한 뒤 다시 시도해 주세요.'; job.nextAt = Date.now() + Math.max(30, e.retryAfter ?? 30) * 1000; }
    finally { checking = false; persist(); render(); }
  }
  document.addEventListener('click', async event => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link === reopen || link.getAttribute('aria-disabled') === 'true') return;
    const target = githubSaveTarget(link.href);
    if (!target) return;
    event.preventDefault();
    if (starting) return;
    const popup = window.open('about:blank', '_blank', 'popup,width=960,height=780,resizable=yes,scrollbars=yes');
    if (popup) { popup.opener = null; popup.document.title = 'GitHub 저장 준비'; popup.document.body.textContent = 'GitHub 저장 화면을 준비하고 있습니다. 이 창에서 커밋을 완료한 뒤 닫아 주세요.'; }
    const url = link.href;
    const article = articles[target.path];
    const position = capture(article?.url ?? location.pathname);
    let job = jobs.find(item => item.prepared && item.targets.some(t => t.path === target.path));
    starting = true;
    try {
      if (!job) {
        const group = link.closest('#portfolio-copy-saves');
        const saves = group ? [...group.querySelectorAll<HTMLAnchorElement>('a[href]')].map(a => githubSaveTarget(a.href)).filter(Boolean) : [target];
        const targets = await Promise.all(saves.map(async item => ({ path: item!.path, ...('content' in item! && typeof item!.content === 'string' ? { expectedHash: await sourceDigest(item!.content) } : {}) })));
        job = { id: crypto.randomUUID(), label: article?.title ?? `설정 저장 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`, createdAt: Date.now(), targets, position };
        const prepared = await request('start', targets);
        job.targets = prepared.targets;
        job.prepared = true;
        jobs = [...jobs, job].slice(-6);
      }
      active = job.id; saveUrls.set(job.id, url); body.hidden = false; collapse.textContent = '접기'; collapse.setAttribute('aria-expanded', 'true');
      if (popup && !popup.closed) { popup.location.replace(url); job.needsOpen = false; }
      else job.needsOpen = true;
      persist(); render();
    } catch (error) {
      popup?.close();
      if (!job) job = { id: crypto.randomUUID(), label: article?.title ?? '저장 준비', createdAt: Date.now(), targets: [target], position };
      job.error = error instanceof Error ? error.message : '저장 화면을 준비하지 못했습니다.';
      // 준비 실패 시에는 저장 창을 열지 않으므로 원래 저장 버튼을 다시 누를 수 있다.
      active = job.id; if (!jobs.some(item => item.id === job!.id)) jobs.push(job); render();
    } finally { starting = false; render(); void poll(true); }
  });
  collapse.addEventListener('click', () => { body.hidden = !body.hidden; collapse.textContent = body.hidden ? '펼치기' : '접기'; collapse.setAttribute('aria-expanded', String(!body.hidden)); });
  select.addEventListener('change', () => { active = select.value; persist(); render(); void poll(true); });
  checkButton.addEventListener('click', () => void poll(true));
  reopen.addEventListener('click', () => { const job = current(); if (job) { job.needsOpen = false; persist(); render(); } });
  root.querySelector('[data-publish-remove]')!.addEventListener('click', () => { jobs = jobs.filter(job => job.id !== active); active = jobs.at(-1)?.id ?? ''; persist(); render(); });
  returnLink.addEventListener('click', () => {
    const job = current(); if (!job || job.result?.phase !== 'complete') return;
    let remembered = false;
    try { sessionStorage.setItem(returnKey, JSON.stringify({ ...job.position, expiresAt: Date.now() + 10 * 60 * 1000 })); remembered = true; } catch { /* 링크의 원래 위치는 유지한다. */ }
    // 공개 반영을 확인한 뒤에도 새 편집은 지우지 않는다. 기존 편집기의 임시 복원이 그대로 동작한다.
    // 초기 fragment 이동이 복원한 스크롤을 다시 덮지 않게 hash는 복원 후 replaceState로 돌린다.
    const destination = new URL(job.position.path + (remembered ? '' : job.position.hash), location.origin);
    if (remembered) destination.searchParams.set('publish_return', job.id);
    returnLink.href = destination.href;
  });
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
    jobs = (Array.isArray(saved?.jobs) ? saved.jobs : []).filter((job: Job) => job.prepared && typeof job.id === 'string' && Date.now() - job.createdAt < 24 * 60 * 60 * 1000 && validPosition(job.position) && (() => { try { progressTargets(job.targets, !job.targets.some(t => t.beforeCommit)); return true; } catch { return false; } })()).slice(-6);
    active = jobs.some(job => job.id === saved?.active) ? saved.active : jobs.at(-1)?.id ?? '';
  } catch { /* 손상된 진행 기록은 복원하지 않는다. */ }
  const parameters = new URLSearchParams(location.search);
  if (parameters.has('publish_return')) {
    let restoredHash: string | undefined;
    try {
      const position = JSON.parse(sessionStorage.getItem(returnKey) ?? 'null') as Position & { expiresAt: number };
      sessionStorage.removeItem(returnKey);
      const wanted = new URL(position.path, location.origin);
      if (validPosition(position) && position.expiresAt > Date.now() && wanted.pathname === location.pathname) {
        restoredHash = position.hash;
        const apply = () => {
          const node = position.key ? [...document.querySelectorAll<HTMLElement>('[data-portfolio-copy]')].find(n => n.dataset.portfolioCopy === position.key && n.getBoundingClientRect().height > 0) : position.id ? document.getElementById(position.id) : null;
          scrollTo({ top: node ? scrollY + node.getBoundingClientRect().top - (position.offset ?? 100) : position.y, behavior: 'instant' });
        };
        void document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(apply)));
      }
    } catch { /* 위치 정보가 없으면 일반 링크처럼 표시한다. */ }
    const clean = new URL(location.href); clean.searchParams.delete('publish_return');
    if (restoredHash !== undefined) clean.hash = restoredHash;
    history.replaceState(null, '', clean);
  }
  addEventListener('focus', () => void poll());
  addEventListener('pageshow', () => void poll());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void poll(); });
  setInterval(() => void poll(), 5000);
  render(); void poll();
}
