import { isPortfolioParagraphKey, portfolioCopyIssues, portfolioParagraphSlots, portfolioParagraphs, preparePortfolioCopySaves } from '../lib/portfolio-copy.mjs';

const stateElement = document.querySelector('#portfolio-copy-state');
if (stateElement) {
  const fields = JSON.parse(stateElement.textContent!) as Record<string, string>;
  const defaults = JSON.parse(document.querySelector('#portfolio-copy-defaults')!.textContent!) as Record<string, string>;
  const nodes: HTMLElement[] = [];
  const fieldInfo = new Map<string, { node: HTMLElement; label: string }>();
  const originalDescriptions = new Map<HTMLElement, string | null>();
  const view = document.querySelector<HTMLButtonElement>('[data-portfolio-view]')!;
  const edit = document.querySelector<HTMLButtonElement>('[data-portfolio-edit]')!;
  const toolbar = document.querySelector<HTMLElement>('#portfolio-copy-toolbar')!;
  const status = document.querySelector<HTMLElement>('#portfolio-copy-status')!;
  const saves = document.querySelector<HTMLElement>('#portfolio-copy-saves')!;
  const errors = document.querySelector<HTMLUListElement>('#portfolio-copy-errors')!;
  const reset = document.querySelector<HTMLButtonElement>('#portfolio-copy-reset')!;
  const restore = document.querySelector<HTMLButtonElement>('#portfolio-copy-restore')!;
  const selection = document.querySelector<HTMLElement>('#portfolio-copy-selection')!;
  const selectedLabel = document.querySelector<HTMLElement>('#portfolio-copy-selected-label')!;
  const remove = document.querySelector<HTMLButtonElement>('#portfolio-copy-remove')!;
  const removed = document.querySelector<HTMLDetailsElement>('#portfolio-copy-removed')!;
  const removedTitle = removed.querySelector('summary')!;
  const removedList = document.querySelector<HTMLElement>('#portfolio-copy-removed-list')!;
  const storageKey = 'portfolio-copy:krafton-2027';
  let changes: Record<string, string> = {};
  let removedValues: Record<string, string> = {};
  let previous: Record<string, string> | undefined;
  let editing = false;
  let selectedKey: string | undefined;
  let notice = '';
  const openEmpty = new Set<string>();
  let lastParagraphTime = 0;
  const valueFor = (key: string) => changes[key] ?? fields[key] ?? '';
  const allowedKey = (key: string) => Object.hasOwn(fields, key) || isPortfolioParagraphKey(key);

  function remember() {
    try {
      if (Object.keys(changes).length) sessionStorage.setItem(storageKey, JSON.stringify({ base: fields, changes, removedValues }));
      else if (!previous) sessionStorage.removeItem(storageKey);
    } catch { /* 현재 탭의 편집과 GitHub 저장은 계속 사용할 수 있다. */ }
  }

  function setValue(key: string, text: string) {
    const value = text.trim() ? text : '';
    if (!value && valueFor(key).trim()) removedValues[key] = valueFor(key);
    if (value === fields[key]) delete changes[key]; else changes[key] = value;
    notice = '';
  }

  function renderSelection() {
    selection.hidden = !editing || !selectedKey;
    selectedLabel.textContent = selectedKey ? `선택: ${fieldInfo.get(selectedKey)?.label ?? '새 문단'}` : '';
    remove.disabled = !selectedKey || !valueFor(selectedKey).trim();
  }

  function registerNode(node: HTMLElement) {
    nodes.push(node);
    const key = node.dataset.portfolioCopy!;
    originalDescriptions.set(node, node.getAttribute('aria-describedby'));
    if (!fieldInfo.has(key) || (fieldInfo.get(key)!.node.closest('.rp-selection') && !node.closest('.rp-selection'))) {
      const context = node.closest('[aria-labelledby]');
      const heading = document.getElementById(context?.getAttribute('aria-labelledby')?.split(' ')[0] ?? '');
      let section = node.closest('.rp-selection') ? '목차' : node.closest('.rp-hero-copy') ? '상단 소개' : heading?.textContent?.trim();
      const detail = node.closest('.rp-case-facts > div')?.querySelector('dt')?.textContent?.trim();
      let excerpt = (fields[key] || defaults[key] || '').replace(/\s+/g, ' ').trim();
      if (isPortfolioParagraphKey(key)) {
        const slot = key.split('.')[1] as keyof typeof portfolioParagraphSlots;
        section = portfolioParagraphSlots[slot];
        const index = portfolioParagraphs({ ...fields, ...changes }, slot).findIndex(item => item.key === key);
        excerpt = `추가 문단 ${index + 1}${excerpt ? `: ${excerpt}` : ''}`;
      }
      const label = [section, detail, excerpt ? `“${excerpt.slice(0, 36)}${excerpt.length > 36 ? '…' : ''}”` : '문구'].filter(Boolean).join(' · ');
      fieldInfo.set(key, { node, label });
    }
    node.addEventListener('focus', () => { selectedKey = key; renderSelection(); });
    node.addEventListener('blur', () => {
      if (!valueFor(key).trim()) {
        openEmpty.delete(key);
        for (const other of nodes) if (other.dataset.portfolioCopy === key) other.classList.remove('rp-copy-open-empty');
        renderEmptyContainers();
      }
    });
    node.addEventListener('input', () => {
      setValue(key, node.innerText.replaceAll('\r\n', '\n'));
      if (!valueFor(key)) openEmpty.add(key); else openEmpty.delete(key);
      for (const other of nodes) if (other !== node && other.dataset.portfolioCopy === key) other.textContent = valueFor(key);
      remember(); render();
    });
  }

  function syncParagraphs() {
    for (const slot of Object.keys(portfolioParagraphSlots)) {
      const container = document.querySelector<HTMLElement>(`[data-portfolio-paragraphs="${slot}"]`);
      if (!container) continue;
      for (const { key, text } of portfolioParagraphs({ ...fields, ...changes }, slot)) {
        if (fieldInfo.has(key)) continue;
        const node = document.createElement('p'); node.dataset.portfolioCopy = key; node.textContent = text;
        container.insertBefore(node, container.querySelector('[data-add-paragraph]'));
        registerNode(node);
      }
    }
    for (const node of [...nodes]) {
      const key = node.dataset.portfolioCopy!;
      if (isPortfolioParagraphKey(key) && !Object.hasOwn(fields, key) && !Object.hasOwn(changes, key)) {
        node.remove(); nodes.splice(nodes.indexOf(node), 1); fieldInfo.delete(key); originalDescriptions.delete(node);
      }
    }
  }

  function paint() {
    syncParagraphs();
    for (const node of nodes) node.textContent = valueFor(node.dataset.portfolioCopy!);
  }

  function renderEmptyContainers() {
    document.querySelectorAll<HTMLElement>('.rp-stack, .rp-tags, .rp-case-impl, .rp-case-facts > div, .rp-project-facts > div, .rp-hero h1').forEach(container => {
      const children = [...container.querySelectorAll<HTMLElement>('[data-portfolio-copy]')];
      container.classList.toggle('rp-copy-container-empty', children.length > 0 && children.every(node => {
        const key = node.dataset.portfolioCopy!;
        return !valueFor(key).trim() && (!editing || !openEmpty.has(key));
      }));
    });
    document.querySelector('.rp-hero h1')?.classList.toggle('rp-without-name', !valueFor('profile.name').trim());
  }

  function focusField(key: string) {
    setMode(true);
    const node = fieldInfo.get(key)?.node;
    node?.focus({ preventScroll: true }); node?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  function renderRemoved() {
    const emptyFields = [...fieldInfo].filter(([key]) => !valueFor(key).trim());
    removed.hidden = !editing || !emptyFields.length;
    removedTitle.textContent = `삭제한 문구 추가 (${emptyFields.length})`;
    removedList.replaceChildren();
    for (const [key, info] of emptyFields) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = `${info.label} 다시 추가`;
      button.addEventListener('click', () => {
        setValue(key, removedValues[key] || fields[key] || defaults[key] || '');
        if (!valueFor(key)) openEmpty.add(key);
        paint(); remember(); focusField(key);
      });
      removedList.append(button);
    }
  }

  function showIssues(issues: { key: string; message: string }[]) {
    errors.replaceChildren(); errors.hidden = !issues.length;
    const issueIds = new Map<string, string>();
    issues.forEach((issue, index) => {
      const item = document.createElement('li'); item.id = `portfolio-copy-error-${index}`;
      issueIds.set(issue.key, item.id);
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = `${fieldInfo.get(issue.key)?.label ?? '문구'}: ${issue.message} 해당 항목으로 이동`;
      button.addEventListener('click', () => focusField(issue.key));
      item.append(button); errors.append(item);
    });
    for (const node of nodes) {
      const errorId = issueIds.get(node.dataset.portfolioCopy!);
      if (errorId) node.setAttribute('aria-invalid', 'true'); else node.removeAttribute('aria-invalid');
      const description = [originalDescriptions.get(node), errorId].filter(Boolean).join(' ');
      if (description) node.setAttribute('aria-describedby', description); else node.removeAttribute('aria-describedby');
    }
  }

  function render() {
    syncParagraphs();
    const dirty = Object.keys(changes).length;
    toolbar.hidden = !editing && !dirty && !previous;
    document.body.classList.toggle('rp-copy-editing', editing);
    document.body.classList.toggle('rp-copy-pending', !toolbar.hidden);
    view.setAttribute('aria-pressed', String(!editing)); edit.setAttribute('aria-pressed', String(editing));
    reset.disabled = !dirty && !previous; restore.hidden = !previous;
    for (const node of nodes) {
      const key = node.dataset.portfolioCopy!;
      node.classList.toggle('rp-copy-empty', !valueFor(key).trim());
      node.classList.toggle('rp-copy-open-empty', openEmpty.has(key));
      node.dataset.copyPlaceholder = '새 문구 입력 · 비워 두면 숨깁니다';
      const mode = editing ? 'plaintext-only' : 'false';
      if (node.contentEditable !== mode) node.contentEditable = mode;
      if (editing) {
        node.setAttribute('role', 'textbox'); node.setAttribute('aria-label', `문구: ${fieldInfo.get(key)?.label ?? '새 문단'}`);
        node.setAttribute('aria-multiline', 'true'); node.tabIndex = 0;
      } else {
        node.removeAttribute('role'); node.removeAttribute('aria-label'); node.removeAttribute('aria-multiline'); node.removeAttribute('tabindex');
      }
    }
    renderEmptyContainers(); renderSelection(); renderRemoved();
    const disabledSave = document.createElement('button'); disabledSave.type = 'button'; disabledSave.disabled = true;
    disabledSave.textContent = '변경 저장 ↗'; disabledSave.setAttribute('aria-describedby', 'portfolio-copy-status');
    saves.replaceChildren(disabledSave);
    status.textContent = notice || (dirty ? `저장 전 변경 ${dirty}개 · View는 현재 편집의 미리보기입니다.` : '게시된 문구와 같습니다.');
    const issues = portfolioCopyIssues(changes, fields); showIssues(issues);
    if (issues.length) { status.textContent = `수정이 필요한 항목 ${issues.length}개 · 아래 항목을 선택해 고치면 저장할 수 있습니다.`; return; }
    if (!dirty) return;
    try {
      const batches = preparePortfolioCopySaves(changes, fields);
      saves.replaceChildren();
      batches.forEach((batch: { url: string }, index: number) => {
        const link = document.createElement('a'); link.href = batch.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = batches.length === 1 ? '변경 저장 ↗' : `변경 저장 ${index + 1}/${batches.length} ↗`;
        link.addEventListener('click', () => { status.textContent = 'GitHub에서 Commit changes로 저장하면 배포 후 공개 페이지에 반영됩니다.'; });
        saves.append(link);
      });
      if (batches.length > 1) status.textContent += ` 내용이 길어 저장 ${batches.length}개로 나눴습니다. 각 저장을 확정해 주세요.`;
    } catch (error) {
      saves.replaceChildren(disabledSave); status.textContent = error instanceof Error ? error.message : '문구를 확인해 주세요.';
    }
  }

  function setMode(value: boolean) {
    editing = value;
    const url = new URL(location.href);
    if (editing) url.searchParams.set('edit', '1'); else url.searchParams.delete('edit');
    history.replaceState(null, '', url); render();
  }

  for (const node of document.querySelectorAll<HTMLElement>('[data-portfolio-copy]')) registerNode(node);
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (editing && target?.closest('[data-portfolio-copy]')?.closest('a')) event.preventDefault();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-add-paragraph]').forEach(button => button.addEventListener('click', () => {
    const slot = button.dataset.addParagraph!;
    lastParagraphTime = Math.max(Date.now(), lastParagraphTime + 1, ...Object.keys(fields).filter(isPortfolioParagraphKey).map(key => Number(key.split('.')[2].slice(0, 13)) + 1));
    const key = `paragraphs.${slot}.${lastParagraphTime}-${crypto.randomUUID()}`;
    changes[key] = ''; openEmpty.add(key); notice = ''; paint(); remember(); focusField(key);
  }));
  remove.addEventListener('click', () => {
    if (!selectedKey) return;
    setValue(selectedKey, ''); openEmpty.delete(selectedKey); paint(); remember(); render();
  });
  view.addEventListener('click', () => setMode(false)); edit.addEventListener('click', () => setMode(true));
  reset.addEventListener('click', () => {
    changes = {}; removedValues = {}; previous = undefined; selectedKey = undefined; openEmpty.clear(); notice = '';
    remember(); paint(); render();
  });
  restore.addEventListener('click', () => { changes = { ...previous, ...changes }; previous = undefined; notice = ''; paint(); remember(); setMode(true); });
  try {
    const draft = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (draft?.changes && typeof draft.changes === 'object') {
      const pending = Object.fromEntries(Object.entries(draft.changes).filter(([key, value]) => allowedKey(key) && typeof value === 'string' && value !== fields[key])) as Record<string, string>;
      if (JSON.stringify(draft.base) === JSON.stringify(fields)) changes = pending;
      else if (Object.keys(pending).length) { previous = pending; notice = '게시된 내용이 바뀌었습니다. 이전 임시 편집을 복원하려면 복원 버튼을 누릅니다.'; }
      if (draft.removedValues && typeof draft.removedValues === 'object') removedValues = Object.fromEntries(Object.entries(draft.removedValues).filter(([key, value]) => allowedKey(key) && typeof value === 'string')) as Record<string, string>;
    }
  } catch { /* 손상된 임시 데이터는 게시된 문구에 적용하지 않는다. */ }
  view.disabled = edit.disabled = false; paint(); setMode(new URLSearchParams(location.search).get('edit') === '1');
}
