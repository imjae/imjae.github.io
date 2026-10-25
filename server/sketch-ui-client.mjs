// Kept as source so Worker bundling cannot inject server-only helpers into the browser.
// User/model text is always assigned through textContent.
export const reviewClientSource = String.raw`function reviewClient(parseDiff) {
  const $ = id => document.getElementById(id);
  const labels = {queued:'PC 연결 대기',preparing:'수정·검사 중','awaiting-approval':'검토 대기',approved:'승인·배포 대기',deploying:'배포 중',deployed:'배포 완료','needs-clarification':'추가 설명 필요','needs-recapture':'다시 캡처 필요',failed:'수정 실패','deployment-failed':'배포 확인 필요',rejected:'폐기'};
  let capture = null, selected = null, detailVersion = '', busy = false, persisted = null, renderId = 0;
  const drafts = new Map();
  function text(tag, value, className) {
    const el = document.createElement(tag); el.textContent = value;
    if (className) el.className = className;
    return el;
  }
  function action(parent, label, fn, primary = false) {
    const b = text('button', label, primary ? 'primary' : ''); b.type = 'button'; b.onclick = fn; parent.append(b); return b;
  }
  function notify(value) { window.ReactNativeWebView?.postMessage(JSON.stringify(value)); }
  function error(e) { $('error').textContent = e.message; }
  async function api(path, body) {
    const r = await fetch('/api/sketch/' + path, {method:body === undefined ? 'GET' : 'POST', headers:body === undefined ? {} : {'Content-Type':'application/json','X-Sketch-Request':'1'}, body:body === undefined ? undefined : JSON.stringify(body)});
    const value = await r.json().catch(() => ({error:'로그인이 만료됐거나 서버에 연결하지 못했습니다. 새로고침해 주세요.'}));
    if (!r.ok) throw new Error(value.error || '요청 실패');
    return value;
  }
  function listOpen(open) {
    $('workspace').classList.toggle('list-open', open);
    $('requests-toggle').setAttribute('aria-expanded', String(open));
    $('requests-toggle').textContent = open ? '목록 닫기' : '요청 목록';
  }
  $('requests-toggle').onclick = () => listOpen(!$('workspace').classList.contains('list-open'));
  window.sketchPersisted = id => { if (persisted?.id === id) { persisted.resolve(); persisted = null; } };
  async function persistCapture() {
    if (!window.ReactNativeWebView) return;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { persisted = null; reject(new Error('전송 전 기기 저장에 실패했어요. 다시 시도해 주세요.')); }, 7000);
      persisted = {id:capture.id, resolve:() => { clearTimeout(timer); resolve(); }};
      notify({type:'sketch-save', id:capture.id, instruction:capture.instruction, reanchored:capture.reanchored === true});
    });
  }
  function captureVisible(visible) {
    $('capture').hidden = !visible; $('workspace').hidden = visible; $('requests-toggle').hidden = visible;
  }
  window.receiveSketchCapture = value => {
    if (capture) return;
    capture = value; captureVisible(true);
    $('capture-title').textContent = value.context.title;
    $('capture-image').src = 'data:image/png;base64,' + value.image;
    $('instruction').value = value.instruction || '';
  };
  $('discard').onclick = () => {
    if (!capture || busy) return;
    notify({type:'sketch-discarded', id:capture.id}); capture = null; captureVisible(false);
  };
  $('submit').onclick = async () => {
    if (!capture || busy) return;
    busy = true; $('submit').disabled = true; $('error').textContent = '';
    try {
      if (capture.context.sourceHash !== capture.context.currentSourceHash && !capture.reanchored) {
        if (!confirm('이전 필기와 현재 원문의 버전을 연결할 수 없습니다. 위 이미지에서 필기 위치와 현재 문장이 맞는지 확인했나요?')) return;
        capture.reanchored = true;
      }
      capture.reanchored = capture.reanchored === true; capture.instruction = $('instruction').value;
      await persistCapture();
      const job = await api('jobs', capture);
      notify({type:'sketch-submitted', id:capture.id}); capture = null; captureVisible(false);
      selected = job.id; detailVersion = ''; listOpen(false); await refresh();
    } catch (e) { error(e); } finally { busy = false; $('submit').disabled = false; }
  };
  async function mutate(id, operation, body) {
    if (busy) return;
    busy = true; $('error').textContent = ''; $('detail').setAttribute('aria-busy', 'true');
    try {
      await api('jobs/' + id + '/' + operation, body);
      if (operation === 'revise') drafts.delete(id);
      detailVersion = ''; await refresh();
    } catch (e) { error(e); }
    finally { busy = false; $('detail').removeAttribute('aria-busy'); }
  }
  function comparePanel(panel, diff) {
    panel.classList.add('compare-panel'); panel.dataset.side = 'after';
    const changes = parseDiff(diff);
    if (!changes.length) {
      panel.append(text('p', '문장 비교를 만들 수 없어 원본 변경 내용을 표시합니다.', 'muted'), text('pre', diff)); return;
    }
    const nav = text('div', '', 'compare-nav'); nav.setAttribute('aria-label', '변경 위치 이동');
    const previous = action(nav, '← 이전', () => move(index - 1));
    const select = document.createElement('select'); select.setAttribute('aria-label', '변경 위치');
    changes.forEach((_, i) => { const option = text('option', '변경 ' + (i + 1) + ' / ' + changes.length); option.value = String(i); select.append(option); });
    nav.append(select);
    const next = action(nav, '다음 →', () => move(index + 1));
    const sides = text('div', '', 'side-switch'); sides.setAttribute('aria-label', '수정 전후 전환');
    for (const [side, label] of [['before','수정 전'], ['after','수정 후']]) {
      const button = action(sides, label, () => {
        panel.dataset.side = side;
        for (const b of sides.children) b.setAttribute('aria-pressed', String(b === button));
      });
      button.setAttribute('aria-pressed', String(side === 'after'));
    }
    nav.append(sides); panel.append(nav);
    const cards = changes.map((change, i) => {
      const card = text('section', '', 'change-card'); card.id = 'change-' + i; card.setAttribute('aria-label', '변경 ' + (i + 1));
      card.append(text('h3', '변경 ' + (i + 1), 'change-title'));
      const columns = text('div', '', 'change-columns');
      for (const [side, label] of [['before','수정 전'], ['after','수정 후']]) {
        const content = text('div', '', 'change-side ' + side);
        const lines = change[side];
        content.append(text('h3', label), text('div', lines.length ? lines.join('\n') || '(빈 줄)' : side === 'before' ? '새로 추가한 내용입니다.' : '삭제한 내용입니다.', 'change-copy' + (lines.length ? '' : ' blank')));
        columns.append(content);
      }
      card.append(columns); panel.append(card); return card;
    });
    let index = 0;
    function update() { select.value = String(index); previous.disabled = index === 0; next.disabled = index === cards.length - 1; }
    function move(i) {
      index = Math.max(0, Math.min(cards.length - 1, i));
      panel.scrollTo({top:panel.scrollTop + cards[index].getBoundingClientRect().top - panel.getBoundingClientRect().top - nav.offsetHeight - 10}); update();
    }
    select.onchange = () => move(Number(select.value));
    panel.onscroll = () => {
      let nearest = 0;
      const top = panel.getBoundingClientRect().top + nav.offsetHeight + 24;
      cards.forEach((card, i) => { if (card.getBoundingClientRect().top <= top) nearest = i; });
      index = nearest; update();
    };
    update();
  }
  async function show(job) {
    // Heartbeat timestamps alone must not reset scroll, feedback or confirmation.
    const key = JSON.stringify([job.id, job.status, job.generation, job.review?.digest, job.message]);
    if (detailVersion === key) return;
    const request = ++renderId;
    const box = $('detail'); box.hidden = false; $('empty').hidden = true;
    box.classList.remove('revision-open'); box.replaceChildren(text('p', '수정안을 불러오고 있습니다…', 'loading'));
    const r = job.review ? await api('jobs/' + job.id + '/review') : null;
    if (request !== renderId || selected !== job.id) return;
    if (r && (r.id !== job.review.id || r.digest !== job.review.digest)) { detailVersion = ''; return refresh(); }
    detailVersion = key;
    box.replaceChildren();
    const heading = text('header', '', 'review-heading');
    const title = text('div', '', 'title-row'); title.append(text('h2', job.title), text('span', labels[job.status] || job.status, 'status'));
    heading.append(title, text('p', job.message, 'muted')); box.append(heading);
    const tabs = text('div', '', 'tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', '수정안 검토');
    const panels = text('div', '', 'panels');
    const buttons = [], views = [];
    let activeTab = 0;
    function activate(index, focus = false) {
      activeTab = index;
      buttons.forEach((b, i) => { b.setAttribute('aria-selected', String(i === index)); b.tabIndex = i === index ? 0 : -1; views[i].hidden = i !== index; });
      if (focus) buttons[index].focus();
    }
    function addTab(label, name) {
      const index = buttons.length;
      const b = action(tabs, label, () => activate(index)); b.id = 'tab-' + name; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'panel-' + name);
      b.onkeydown = event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault(); activate(event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (activeTab + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length, true);
      };
      const view = text('div', '', 'panel ' + name + '-panel'); view.id = 'panel-' + name; view.setAttribute('role', 'tabpanel'); view.setAttribute('aria-labelledby', b.id); view.tabIndex = 0;
      buttons.push(b); views.push(view); panels.append(view); return view;
    }
    if (r) {
      comparePanel(addTab('변경 비교', 'compare'), r.diff);
      const preview = addTab('글 미리보기', 'preview');
      preview.append(text('p', '수정 후 글입니다. 영상 재생과 다른 페이지 이동은 지원하지 않습니다.', 'preview-note'));
      const frame = document.createElement('iframe'); frame.title = '승인할 글 미리보기'; frame.setAttribute('sandbox', ''); frame.src = '/api/sketch/jobs/' + job.id + '/preview'; preview.append(frame);
    }
    const notes = addTab('보낸 필기', 'notes');
    if (r) notes.append(text('h3', 'AI가 해석한 요청과 변경 내용'), text('p', r.summary, 'summary-copy'));
    notes.append(text('h3', '보낸 필기'));
    const image = document.createElement('img'); image.src = '/api/sketch/jobs/' + job.id + '/image'; image.alt = '요청한 원문과 필기'; notes.append(image);
    if (job.instruction) notes.append(text('h3', '내가 보낸 설명'), text('p', job.instruction, 'summary-copy'));
    if (r) {
      const raw = document.createElement('details'); raw.append(text('summary', 'Markdown 원본 변경 보기'), text('pre', r.diff)); notes.append(raw);
      const checks = document.createElement('details'); checks.append(text('summary', '검사 결과와 수정 버전'), text('p', '사이트 검사 · 편집 서버 빌드 · 브라우저 검사 통과 / 변경 버전 ' + r.headCommit.slice(0, 12))); notes.append(checks);
    }
    const maintenance = text('div', '', 'actions');
    if (!['deploying','deployed','rejected'].includes(job.status)) action(maintenance, '요청 폐기', () => { if (confirm('이 요청을 폐기할까요?')) mutate(job.id, 'reject', {}); });
    if (['deployed','rejected','failed','deployment-failed','needs-recapture'].includes(job.status)) action(maintenance, '보관 자료 삭제', () => { if (confirm('필기 이미지와 요청 기록을 삭제할까요?')) mutate(job.id, 'delete', {}); });
    notes.append(maintenance); box.append(tabs, panels); activate(0);
    const dock = text('footer', '', 'review-dock');
    const copy = text('div', '', 'approval-copy'); const controls = text('div', '', 'dock-buttons');
    if (['awaiting-approval','approved','needs-clarification','failed'].includes(job.status)) {
      const revision = text('div', '', 'panel revision-panel'); revision.hidden = true;
      const label = text('label', '추가 수정 요청'); label.htmlFor = 'revision-instruction';
      const input = document.createElement('textarea'); input.id = label.htmlFor; input.maxLength = 4000; input.value = drafts.get(job.id) ?? job.instruction ?? ''; input.placeholder = '어떤 부분을 다시 수정할지 적어 주세요.'; input.oninput = () => drafts.set(job.id, input.value);
      revision.append(label, text('p', '추가 요청을 보내면 새 수정안을 만듭니다. 새 결과를 확인한 뒤 다시 승인해 주세요.', 'muted'), input);
      const revisionButtons = text('div', '', 'actions');
      const reviseButton = action(controls, '추가 수정 요청', () => { views.forEach(v => { v.hidden = true; }); tabs.hidden = true; revision.hidden = false; dock.hidden = true; box.classList.add('revision-open'); input.focus(); });
      action(revisionButtons, '검토로 돌아가기', () => { revision.hidden = true; tabs.hidden = false; dock.hidden = false; box.classList.remove('revision-open'); activate(activeTab); reviseButton.focus(); });
      action(revisionButtons, '이 설명으로 다시 수정', () => mutate(job.id, 'revise', {instruction:input.value}), true);
      revision.append(revisionButtons); panels.append(revision);
    }
    if (r && job.status === 'awaiting-approval') {
      const label = text('label', '', 'check-label'); const tick = document.createElement('input'); tick.type = 'checkbox';
      label.append(tick, document.createTextNode('미리보기와 변경 내용을 확인했습니다.'));
      copy.append(label, text('p', '승인하면 이 수정안으로 공개 글이 바뀝니다.', 'muted'));
      const approve = action(controls, '승인하고 배포', () => mutate(job.id, 'approve', {reviewId:r.id, digest:r.digest}), true);
      approve.setAttribute('aria-label', '이 수정안 승인·배포');
      approve.disabled = true; tick.onchange = () => { approve.disabled = !tick.checked; };
    } else copy.append(text('p', job.message || labels[job.status], 'muted'));
    if (job.status === 'deployed') {
      const a = text('a', '공개 글 열기'); a.href = job.url; a.target = '_blank'; a.rel = 'noopener'; controls.append(a);
    }
    dock.append(copy, controls); box.append(dock);
  }
  async function refresh() {
    const data = await api('jobs');
    $('connection').textContent = data.runnerSeenAt && Date.now() - data.runnerSeenAt < 120000 ? 'PC 연결됨' : 'PC 연결 대기 · 요청과 승인은 보관됩니다.';
    $('jobs').replaceChildren();
    if (!data.jobs.length) $('jobs').append(text('p', '아직 보낸 요청이 없습니다.', 'muted'));
    for (const job of data.jobs) {
      const b = action($('jobs'), (labels[job.status] || job.status) + ' · ' + job.title, () => {
        selected = job.id; detailVersion = ''; listOpen(false);
        for (const button of $('jobs').children) button.setAttribute('aria-pressed', String(button === b));
        show(job).catch(error);
      });
      b.setAttribute('aria-pressed', String(job.id === selected));
    }
    const job = data.jobs.find(j => j.id === selected);
    if (job) await show(job);
    else {
      renderId++; $('detail').hidden = true; $('empty').hidden = false; selected = null; detailVersion = '';
      listOpen(data.jobs.length > 0);
    }
  }
  refresh().catch(error);
  setInterval(() => { if (!busy) refresh().catch(error); }, 8000);
  notify({type:'sketch-ready'});
}`;
