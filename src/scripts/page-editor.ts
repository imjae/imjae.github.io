import { pageModeUrl } from '../lib/page-editor.mjs';

const panel = document.querySelector<HTMLElement>('#page-editor');
if (panel) {
  const view = document.querySelector<HTMLButtonElement>('[data-page-view]')!;
  const edit = document.querySelector<HTMLButtonElement>('[data-page-edit]')!;
  let blocked = !!document.querySelector('#author-session-error');
  function render(editing: boolean, focus = false) {
    panel!.hidden = !editing;
    edit.setAttribute('aria-pressed', String(editing));
    view.setAttribute('aria-pressed', String(!editing));
    if (focus && editing) panel!.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
  function setMode(editing: boolean) {
    if (blocked && editing) return;
    history.replaceState(null, '', pageModeUrl(location.href, editing));
    render(editing, true);
  }
  edit.disabled = blocked; view.disabled = false;
  edit.addEventListener('click', () => setMode(true));
  view.addEventListener('click', () => setMode(false));
  const picker = panel.querySelector<HTMLSelectElement>('#page-article-source');
  const link = panel.querySelector<HTMLAnchorElement>('#page-article-edit');
  picker?.addEventListener('change', () => {
    if (!link) return;
    link.hidden = !picker.value;
    if (picker.value) link.href = picker.value; else link.removeAttribute('href');
  });
  function block() {
    blocked = true; edit.disabled = true;
    panel!.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>('input, button, select').forEach(node => { node.disabled = true; });
    panel!.querySelectorAll<HTMLAnchorElement>('a').forEach(node => { node.setAttribute('aria-disabled', 'true'); node.removeAttribute('href'); });
  }
  panel.addEventListener('click', event => { if (blocked) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  addEventListener('author-session-unavailable', block);
  addEventListener('popstate', () => render(new URLSearchParams(location.search).get('edit') === '1'));
  render(new URLSearchParams(location.search).get('edit') === '1');
  if (blocked) block();
}
