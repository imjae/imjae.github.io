interface HomeIndex {
  articles: { slug: string; topic: string; text: string }[];
  pinned: string[];
  topics: { id: string; title: string }[];
}

const home = document.querySelector<HTMLElement>('.home-covers');
if (home) {
  const data: HomeIndex = JSON.parse(home.querySelector('#home-index')?.textContent ?? '{}');
  const search = home.querySelector<HTMLInputElement>('#home-search')!;
  const results = home.querySelector<HTMLElement>('#home-results')!;
  const list = home.querySelector<HTMLElement>('#home-article-list')!;
  const grid = home.querySelector<HTMLElement>('.home-cover-grid')!;
  const pinsButton = home.querySelector<HTMLButtonElement>('#home-pins');
  const rows = new Map([...list.querySelectorAll<HTMLElement>('[data-home-entry]')].map(row => [row.dataset.homeEntry, row]));
  const topicNames = new Map(data.topics.map(topic => [topic.id, topic.title]));
  const pinOrder = new Map(data.pinned.map((slug, index) => [slug, index]));
  let topic = '', pins = false;

  function readLocation() {
    const params = new URLSearchParams(location.search);
    topic = topicNames.has(params.get('topic') ?? '') ? params.get('topic')! : '';
    pins = params.get('view') === 'pinned';
    search.value = params.get('q') ?? '';
  }
  function render() {
    const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let matches = data.articles.filter(article => (!topic || article.topic === topic) && (!pins || pinOrder.has(article.slug)) && words.every(word => article.text.includes(word)));
    if (pins) matches = matches.sort((a, b) => pinOrder.get(a.slug)! - pinOrder.get(b.slug)!);
    const filtered = !!topic || pins || words.length > 0;
    const visible = filtered ? matches : matches.slice(0, 5);
    const shown = new Set(visible.map(article => article.slug));
    rows.forEach((row, slug) => { row.hidden = !slug || !shown.has(slug); });
    // Keep visual and keyboard order in sync with the owner's pin settings.
    visible.forEach(article => { const row = rows.get(article.slug); if (row) list.append(row); });
    grid.hidden = words.length > 0;
    home!.querySelector('#home-list-title')!.textContent = words.length ? '검색 결과' : pins ? '고정 글' : topicNames.get(topic) ?? '최근 글';
    home!.querySelector<HTMLElement>('.home-result-meta')!.hidden = !filtered;
    home!.querySelector('#home-result-count')!.textContent = `${matches.length}편`;
    home!.querySelector<HTMLElement>('#home-empty')!.hidden = matches.length > 0;
    pinsButton?.setAttribute('aria-pressed', String(pins));
    home!.querySelectorAll<HTMLAnchorElement>('[data-home-topic]').forEach(link => {
      if (link.dataset.homeTopic === topic) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    const params = new URLSearchParams();
    if (topic) params.set('topic', topic);
    if (search.value.trim()) params.set('q', search.value.trim());
    home!.querySelector<HTMLAnchorElement>('#home-more')!.href = '/writing/' + (params.size ? `?${params}` : '');
  }
  function updateUrl(push: boolean, anchor = false) {
    const url = new URL(location.href);
    for (const key of ['topic', 'q', 'view']) url.searchParams.delete(key);
    if (topic) url.searchParams.set('topic', topic);
    if (search.value.trim()) url.searchParams.set('q', search.value.trim());
    if (pins) url.searchParams.set('view', 'pinned');
    if (anchor) url.hash = 'home-results';
    const next = url.pathname + url.search + url.hash;
    if (next !== location.pathname + location.search + location.hash) history[push ? 'pushState' : 'replaceState'](null, '', next);
  }
  home.querySelectorAll<HTMLAnchorElement>('[data-home-topic]').forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const isCover = link.hasAttribute('data-home-cover');
    topic = isCover && topic === link.dataset.homeTopic ? '' : link.dataset.homeTopic ?? '';
    pins = false;
    render(); updateUrl(true, isCover);
    if (isCover) { results.scrollIntoView({ block: 'start', behavior: 'instant' }); results.focus({ preventScroll: true }); }
  }));
  search.addEventListener('input', () => { render(); updateUrl(false); });
  pinsButton?.addEventListener('click', () => { pins = !pins; topic = ''; render(); updateUrl(true); });
  home.querySelector('#home-reset')?.addEventListener('click', () => { topic = ''; pins = false; search.value = ''; render(); updateUrl(true); search.focus(); });
  window.addEventListener('popstate', () => { readLocation(); render(); });
  home.querySelector<HTMLElement>('.home-search')!.hidden = false;
  if (pinsButton) pinsButton.hidden = false;
  readLocation(); render();
}
