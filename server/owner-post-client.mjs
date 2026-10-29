// Kept as source text: Wrangler keepNames must not insert runtime-only __name calls.
export const postEditorClient = String.raw`async function () {
  const $ = id => document.getElementById(id), form = $('form');
  const initialParams = new URLSearchParams(location.search);
  let current = null, posts = [], dirty = false, busy = false, importSource = '', generation = 0;
  const field = name => form.elements.namedItem(name);
  const status = (message, error = false) => { $('status').textContent = message; $('status').classList.toggle('error', error); };
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  async function api(path = '', body) {
    const response = await fetch('/api/notes' + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (response.status === 401) throw new Error('로그인이 만료됐습니다. 입력 내용을 복사한 뒤 다시 로그인해 주세요.');
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '요청을 처리하지 못했습니다.');
    return result;
  }
  function confirmAction(title, text) {
    return new Promise(resolve => {
      $('confirm-title').textContent = title; $('confirm-text').textContent = text;
      const done = value => { $('confirm').close(); resolve(value); };
      $('confirm-yes').onclick = () => done(true); $('confirm-no').onclick = () => done(false);
      $('confirm').oncancel = event => { event.preventDefault(); done(false); };
      $('confirm').showModal();
    });
  }
  async function run(action) {
    if (busy) return;
    busy = true; form.querySelectorAll('button,input,textarea,select').forEach(input => input.disabled = true); $('visibility').disabled = true;
    try { await action(); } catch (error) { status(error.message || '다시 시도해 주세요.', true); }
    finally { busy = false; form.querySelectorAll('button,input,textarea,select').forEach(input => input.disabled = false); controls(); }
  }
  function controls() {
    const published = current?.visibility === 'public', pending = current?.migration?.pending;
    $('visibility-label').textContent = pending ? '이전 대기 · 기존 페이지는 공개' : current ? (published ? '공개' : '비공개 · 나만 보기') : '새 글 · 비공개';
    $('visibility').textContent = published ? '공개' : '비공개';
    $('visibility').setAttribute('aria-checked', String(published));
    $('visibility').disabled = busy || !current || pending || dirty;
    $('visibility').title = dirty ? '글을 먼저 저장해 주세요.' : '';
    $('view').hidden = !current; $('download').hidden = !current; $('delete').hidden = !current || pending;
    if (current) $('view').href = '/notes/' + current.slug + '/';
    $('migration').hidden = !pending;
    field('slug').readOnly = Boolean(current);
  }
  function show(post) {
    current = post?.version ? post : null; importSource = post?.source || ''; dirty = Boolean(post && !post.version);
    for (const name of ['title', 'description', 'slug', 'date', 'topic', 'body']) field(name).value = post?.[name] || (name === 'date' ? today() : name === 'topic' ? 'notes' : '');
    field('tags').value = (post?.tags || []).join(', ');
    $('preview').hidden = true; controls(); list();
    const url = new URL(location.href); url.search = current ? '?post=' + encodeURIComponent(current.slug) : ''; history.replaceState(null, '', url);
  }
  function list() {
    $('posts').replaceChildren(); const query = $('filter').value.toLocaleLowerCase();
    for (const post of posts.filter(post => post.title.toLocaleLowerCase().includes(query))) {
      const li = document.createElement('li'), button = document.createElement('button'), title = document.createElement('span'), meta = document.createElement('small');
      title.textContent = post.title; meta.textContent = (post.migration?.pending ? '이전 대기' : post.visibility === 'public' ? '공개' : '비공개') + ' · ' + post.date;
      button.append(title, meta); button.setAttribute('aria-current', String(post.slug === current?.slug));
      button.onclick = () => run(async () => { if (dirty && !(await confirmAction('다른 글로 이동', '저장하지 않은 내용을 버리고 이동할까요?'))) return; await load(post.slug); });
      li.append(button); $('posts').append(li);
    }
    $('empty').hidden = posts.length > 0;
  }
  async function refresh() { posts = (await api()).posts; list(); }
  async function load(slug) {
    const post = await api('/' + encodeURIComponent(slug)); show(post);
    if (post.migration?.pending) await checkMigration();
  }
  async function checkMigration() {
    const result = await api('/migration', { slug: current.slug });
    if (result.migrationUrl) $('migration-link').href = result.migrationUrl;
    if (result.removalUrl) $('migration-remove').href = result.removalUrl;
    if (!dirty) show(result);
    status(result.pendingMessage || '이전이 완료됐습니다. 공개·비공개 토글을 사용할 수 있습니다.');
    await refresh();
  }
  const fields = () => ({ title: field('title').value, description: field('description').value, slug: field('slug').value, date: field('date').value, topic: field('topic').value, tags: field('tags').value.split(',').map(value => value.trim()).filter(Boolean), body: field('body').value });
  form.addEventListener('input', () => { dirty = true; generation++; controls(); });
  form.addEventListener('submit', event => { event.preventDefault(); run(async () => {
    const before = generation;
    const post = await api('/' + encodeURIComponent(field('slug').value), { action: 'save', version: current?.version || 0, fields: fields(), importSource });
    if (generation === before) show(post); else { current = post; controls(); }
    await refresh(); status(post.visibility === 'public' ? '공개 글을 저장했습니다.' : '비공개로 저장했습니다. 로그인한 본인만 볼 수 있습니다.');
  }); });
  $('visibility').onclick = () => run(async () => {
    const visibility = current.visibility === 'public' ? 'private' : 'public';
    if (visibility === 'public' && !(await confirmAction('글을 공개할까요?', '제목과 본문이 로그인 없이 보이고 Writing 목록에 표시됩니다.'))) return;
    const post = await api('/' + current.slug, { action: 'visibility', version: current.version, visibility });
    show(post); await refresh(); status(visibility === 'public' ? '공개했습니다.' : '비공개로 전환했습니다. 이제 로그인한 본인만 볼 수 있습니다.');
  });
  $('new').onclick = () => run(async () => { if (dirty && !(await confirmAction('새 글 작성', '저장하지 않은 내용을 버릴까요?'))) return; show(null); status('새 글은 비공개로 저장됩니다.'); });
  $('reload').onclick = () => run(async () => { await refresh(); status('목록을 새로 불러왔습니다.'); });
  $('filter').oninput = list;
  $('preview-button').onclick = () => run(async () => { if (!form.reportValidity()) return; const result = await api('/preview', { fields: fields() }); $('preview').innerHTML = result.html; $('preview').hidden = false; });
  $('delete').onclick = () => run(async () => {
    if (!(await confirmAction('글 삭제', '이 저장소에서 글을 삭제합니다. 필요하면 먼저 저장본을 내려받아 주세요.'))) return;
    await api('/' + current.slug, { action: 'delete', version: current.version }); show(null); await refresh(); status('글을 삭제했습니다.');
  });
  $('download').onclick = () => { if (!current) return; const url = URL.createObjectURL(new Blob([current.source], { type: 'text/markdown;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = current.slug + '.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  $('migration-check').onclick = () => run(checkMigration);
  $('import-file').onchange = () => run(async () => {
    const file = $('import-file').files[0]; if (!file) return;
    if (file.size > 200000) throw new Error('200KB 이하의 Markdown 파일을 선택해 주세요.');
    if (dirty && !(await confirmAction('파일 가져오기', '저장하지 않은 내용을 버리고 파일을 불러올까요?'))) return;
    const result = await api('/parse', { source: await file.text() }); show(result); status('파일을 불러왔습니다. 글 저장을 누르면 비공개로 저장됩니다.'); $('import-file').value = '';
  });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) $('preview').hidden = true; });
  show(null);
  await run(async () => {
    await refresh(); const selected = initialParams.get('post'), path = initialParams.get('import');
    if (path) {
      if (!(await confirmAction('기존 글을 비공개 저장소로 이전', '원문을 복사한 뒤 GitHub에서 이전 설정을 확정합니다. 배포 전에는 기존 페이지가 공개되어 있으며 GitHub의 과거 원문은 남습니다.'))) return;
      const result = await api('/import', { path }); show(result.post); $('migration-link').href = result.url; $('migration-remove').href = result.removalUrl; await refresh(); status('원문을 보관했습니다. GitHub에서 이전 설정과 공개 원본 제거를 확정해 주세요.');
    } else if (selected) await load(selected);
  });
}`;
