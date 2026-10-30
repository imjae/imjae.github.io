// Serialized only into the identity-protected document response. No private browser storage.
export function projectDocumentClient() {
  let authenticated = false;
  async function checkOwner() {
    try {
      const response = await fetch('/auth/session', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) {
        authenticated = false; document.body.style.visibility = 'hidden';
        location.replace('/auth/login?return_to=' + encodeURIComponent(location.pathname + location.search)); return;
      }
      authenticated = true; document.body.style.visibility = 'visible';
    } catch { authenticated = false; document.body.style.visibility = 'hidden'; }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) document.body.style.visibility = 'hidden'; else void checkOwner(); });
  window.addEventListener('pagehide', () => { document.body.style.visibility = 'hidden'; });
  window.addEventListener('pageshow', () => void checkOwner());
  setInterval(() => { if (!document.hidden) void checkOwner(); }, 60000);
  const shell = document.getElementById('document-shell');
  if (shell) {
    const sidebar = document.getElementById('document-tree');
    if (sidebar && window.matchMedia('(max-width:760px)').matches) sidebar.open = false;
    const search = document.getElementById('document-search');
    if (search && sidebar) {
      const rows = [...sidebar.querySelectorAll('[data-document-search]')];
      const folders = [...sidebar.querySelectorAll('details')], previous = new Map();
      search.addEventListener('input', () => {
        const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
        sidebar.open = true;
        for (const row of rows) row.hidden = !words.every(word => row.dataset.documentSearch.includes(word));
        for (const folder of [...folders].reverse()) {
          if (words.length && !previous.has(folder)) previous.set(folder, folder.open);
          folder.hidden = ![...folder.querySelectorAll('[data-document-search]')].some(row => !row.hidden);
          if (words.length) folder.open = true;
          else if (previous.has(folder)) { folder.open = previous.get(folder); previous.delete(folder); }
        }
        const count = rows.filter(row => !row.hidden).length;
        document.getElementById('search-result').textContent = words.length ? `${count}편` : '';
        document.getElementById('empty-search').hidden = count > 0;
      });
    }
    for (const image of shell.querySelectorAll('img[data-resource-image]')) {
      const unavailable = () => {
        image.hidden = true;
        const fallback = image.parentElement.querySelector('[data-image-fallback]');
        if (fallback) fallback.hidden = false;
      };
      image.addEventListener('error', unavailable);
      if (image.complete && !image.naturalWidth) unavailable();
    }
  }
  const form = document.getElementById('plan-form');
  if (!form) return;
  const status = document.getElementById('save-status'), button = form.querySelector('button[type="submit"]');
  const read = () => Object.fromEntries([...form.querySelectorAll('[name]')].map(input => [input.name, input.value]));
  let saved = JSON.stringify(read()), version = Number(form.dataset.version), saving = false;
  form.addEventListener('input', () => { status.textContent = JSON.stringify(read()) === saved ? '' : '저장하지 않은 변경 사항'; });
  window.addEventListener('beforeunload', event => {
    if (authenticated && JSON.stringify(read()) !== saved) { event.preventDefault(); event.returnValue = ''; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (saving || !authenticated) return;
    saving = true; button.disabled = true; status.textContent = '저장 중…';
    const fields = read();
    try {
      const response = await fetch(form.dataset.endpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, version }) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) { await checkOwner(); return; }
        throw new Error(result.message || '저장하지 못했습니다.');
      }
      version = result.version; saved = JSON.stringify(fields);
      const view = new URL(form.dataset.viewUrl, location.origin);
      for (const link of document.querySelectorAll('[data-document-view]')) link.href = view.pathname + view.search;
      if (JSON.stringify(read()) === saved) {
        view.searchParams.set('edit', '1'); view.searchParams.set('saved', '1'); view.hash = 'document';
        location.replace(view.pathname + view.search + view.hash);
      } else status.textContent = '저장했습니다. 이후 변경 사항은 아직 저장되지 않았습니다.';
    } catch (error) { status.textContent = error.message || '저장하지 못했습니다. 연결을 확인해 주세요.'; }
    finally { saving = false; button.disabled = false; }
  });
}
