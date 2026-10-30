import { aboutFields, aboutCopyIssues, prepareAboutSaves, restoreAboutDraft } from '../lib/about-copy.mjs';

const state = document.querySelector('#about-edit-state');
if (state) {
  const fields = JSON.parse(state.textContent!) as Record<string, string>;
  const root = document.querySelector<HTMLElement>('#about-editor')!;
  const form = document.querySelector<HTMLFormElement>('#about-edit-form')!;
  const preview = document.querySelector<HTMLElement>('#about-profile-view')!;
  const view = document.querySelector<HTMLButtonElement>('[data-page-view]')!;
  const edit = document.querySelector<HTMLButtonElement>('[data-page-edit]')!;
  const status = document.querySelector<HTMLElement>('#about-edit-status')!;
  const errors = document.querySelector<HTMLUListElement>('#about-edit-errors')!;
  const saves = document.querySelector<HTMLElement>('#about-edit-saves')!;
  const reset = document.querySelector<HTMLButtonElement>('#about-edit-reset')!;
  const restore = document.querySelector<HTMLButtonElement>('#about-edit-restore')!;
  const storageKey = 'about-copy:v1';
  let changes: Record<string, string> = {};
  let previous: Record<string, string> | null = null;
  let editing = false;
  let sessionAvailable = !document.querySelector('#author-session-error');
  const valueFor = (key: string) => changes[key] ?? fields[key];
  const inputs = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')];

  function remember() {
    try {
      if (Object.keys(changes).length || previous) sessionStorage.setItem(storageKey, JSON.stringify({ base: fields, changes, previous }));
      else sessionStorage.removeItem(storageKey);
    } catch { /* 저장소를 사용할 수 없어도 현재 화면에서 편집할 수 있다. */ }
  }
  function paint() {
    inputs.forEach(input => { input.value = valueFor(input.name); });
  }
  function render() {
    const dirty = Object.keys(changes).length;
    root.hidden = !editing && !dirty && !previous;
    form.hidden = !editing; preview.hidden = editing;
    document.body.dataset.sketchDirty = String(Boolean(dirty || previous));
    view.setAttribute('aria-pressed', String(!editing)); edit.setAttribute('aria-pressed', String(editing));
    reset.disabled = !dirty && !previous; restore.hidden = !previous;
    edit.disabled = !sessionAvailable;
    inputs.forEach(input => { input.disabled = !sessionAvailable; });
    preview.querySelectorAll<HTMLElement>('[data-about-value]').forEach(node => {
      const key = node.dataset.aboutValue!;
      node.textContent = valueFor(key) || `[${aboutFields[key as keyof typeof aboutFields].label}]`;
    });
    const emailContainer = preview.querySelector<HTMLElement>('[data-about-email]')!;
    const email = valueFor('email');
    const emailNode = document.createElement(email && !aboutCopyIssues({ email }).length ? 'a' : 'span');
    emailNode.textContent = email || '[이메일 입력]';
    if (emailNode instanceof HTMLAnchorElement) emailNode.href = `mailto:${email}`;
    else emailNode.className = 'empty-link';
    emailContainer.replaceChildren(emailNode);
    const github = preview.querySelector<HTMLAnchorElement>('[data-about-github]')!;
    const githubValue = valueFor('github');
    github.textContent = `${githubValue.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗`;
    github.setAttribute('aria-label', `${githubValue} (새 탭)`);
    if (!aboutCopyIssues({ github: githubValue }).length) github.href = githubValue; else github.removeAttribute('href');
    const issues = aboutCopyIssues(changes);
    errors.replaceChildren(); errors.hidden = !issues.length;
    inputs.forEach(input => { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); });
    issues.forEach((issue: { key: string; message: string }, index: number) => {
      const item = document.createElement('li'); item.id = `about-field-error-${index}`;
      item.textContent = `${aboutFields[issue.key as keyof typeof aboutFields]?.label ?? issue.key}: ${issue.message}`;
      errors.append(item);
      const input = inputs.find(input => input.name === issue.key);
      input?.setAttribute('aria-invalid', 'true'); input?.setAttribute('aria-describedby', item.id);
    });
    status.textContent = previous ? '게시된 내용이 바뀌었습니다. 이전 임시 편집을 복원할 수 있습니다.' : dirty ? `저장 전 변경 ${dirty}개 · View에서 미리 볼 수 있습니다.` : 'About의 내용을 수정할 수 있습니다.';
    const disabled = document.createElement('button'); disabled.type = 'button'; disabled.disabled = true; disabled.textContent = '변경 저장 ↗';
    saves.replaceChildren(disabled);
    if (!sessionAvailable) { status.textContent = '로그인 상태를 확인할 수 없습니다. 다시 접속해 주세요.'; return; }
    if (!dirty || issues.length) return;
    try {
      const batches = prepareAboutSaves(changes);
      saves.replaceChildren(...batches.map((batch: { url: string }, index: number) => {
        const link = document.createElement('a'); link.href = batch.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = batches.length > 1 ? `변경 저장 ${index + 1}/${batches.length} ↗` : '변경 저장 ↗';
        return link;
      }));
      if (batches.length > 1) status.textContent += ` 저장 ${batches.length}개를 각각 확정해 주세요.`;
    } catch (error) { status.textContent = error instanceof Error ? error.message : '입력 내용을 확인해 주세요.'; }
  }
  function setMode(value: boolean, updateUrl = true) {
    editing = value;
    if (updateUrl) {
      const url = new URL(location.href);
      if (value) url.searchParams.set('edit', '1'); else url.searchParams.delete('edit');
      history.replaceState(history.state, '', url);
    }
    render();
  }
  for (const input of inputs) input.addEventListener('input', () => {
    const value = input.value.replaceAll('\r\n', '\n');
    if (value === fields[input.name]) delete changes[input.name]; else changes[input.name] = value;
    remember(); render();
  });
  form.addEventListener('submit', event => event.preventDefault());
  edit.addEventListener('click', () => setMode(true));
  window.addEventListener('author-session-unavailable', () => { sessionAvailable = false; render(); });
  view.addEventListener('click', () => setMode(false));
  window.addEventListener('popstate', () => setMode(new URLSearchParams(location.search).get('edit') === '1', false));
  reset.addEventListener('click', () => { changes = {}; previous = null; remember(); paint(); render(); });
  restore.addEventListener('click', () => { changes = { ...previous, ...changes }; previous = null; remember(); paint(); setMode(true); });
  try { ({ changes, previous } = restoreAboutDraft(JSON.parse(sessionStorage.getItem(storageKey) || 'null'), fields)); }
  catch { /* 손상된 임시 기록은 적용하지 않는다. */ }
  paint(); view.disabled = edit.disabled = false;
  setMode(new URLSearchParams(location.search).get('edit') === '1', false);
}
