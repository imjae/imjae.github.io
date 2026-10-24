export function reviewPage() {
  const nonce = crypto.randomUUID();
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>필기로 블로그 수정</title>
  <style>body{margin:0;background:#f6f7f2;color:#29352d;font:16px/1.65 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:28px 20px}h1{font-size:26px;margin:0}h2{font-size:20px}p{margin:8px 0}button,textarea{font:inherit}button{cursor:pointer;border:1px solid #becabb;border-radius:8px;background:white;padding:10px 15px;color:#294a32}button.primary{background:#375b42;color:white}button:disabled{opacity:.45;cursor:wait}textarea{box-sizing:border-box;width:100%;min-height:105px;border:1px solid #becabb;border-radius:8px;padding:12px;background:white}section,.card{padding:20px;background:white;border:1px solid #dde3d8;border-radius:12px;margin:20px 0}.muted{color:#697569;font-size:14px}.error{color:#a5362d;white-space:pre-wrap}img{display:block;max-width:100%;max-height:65vh;object-fit:contain;margin:12px auto;border:1px solid #ddd}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}#jobs{display:grid;gap:10px}#jobs button{text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5f6f2;padding:16px;border-radius:8px;font-size:13px}iframe{width:100%;height:75vh;border:1px solid #ccd7c8;border-radius:8px;background:white}.status{font-weight:600;color:#48694f}a{color:#375b42}label{display:block;margin:10px 0}</style></head>
  <body><main><h1>필기로 블로그 수정</h1><p class="muted">필기를 보내면 PC가 수정안을 만듭니다. 미리보기와 변경 내용을 확인하고 승인하면 배포합니다.</p><p id="connection" class="muted"></p><p id="error" role="alert" class="error"></p>
  <section id="capture" hidden><h2>이 화면의 필기를 보낼까요?</h2><p id="capture-title"></p><img id="capture-image" alt="전송할 원문과 필기"><label for="instruction">추가 설명 (선택)</label><textarea id="instruction" maxlength="4000" placeholder="필기한 내용에 따라 문장을 다듬어 주세요."></textarea><p class="muted">화면에 보이는 필기와 원문 문맥을 전송합니다. 원래 필기는 기기에 남습니다.</p><div class="actions"><button id="submit" class="primary">AI로 수정안 만들기</button><button id="discard">전송 취소</button></div></section>
  <h2>수정 요청</h2><div id="jobs"></div><section id="detail" hidden></section></main>
  <script nonce="${nonce}">
  const $=id=>document.getElementById(id), labels={queued:'PC 연결 대기',preparing:'수정·검사 중','awaiting-approval':'검토 대기',approved:'승인·배포 대기',deploying:'배포 중',deployed:'배포 완료','needs-clarification':'추가 설명 필요','needs-recapture':'다시 캡처 필요',failed:'수정 실패','deployment-failed':'배포 확인 필요',rejected:'폐기'};
  let capture=null, selected=null, detailVersion='', busy=false, persisted=null;
  window.sketchPersisted=id=>{if(persisted?.id===id){persisted.resolve();persisted=null;}};
  async function persistCapture(){if(!window.ReactNativeWebView)return;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{persisted=null;reject(new Error('전송 전 기기 저장에 실패했어요. 다시 시도해 주세요.'));},7000);persisted={id:capture.id,resolve:()=>{clearTimeout(timer);resolve();}};notify({type:'sketch-save',id:capture.id,instruction:capture.instruction,reanchored:capture.reanchored===true});});}
  function notify(value){window.ReactNativeWebView?.postMessage(JSON.stringify(value));}
  function text(tag,value,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;}
  async function api(path,body){const r=await fetch('/api/sketch/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json','X-Sketch-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)});const value=await r.json().catch(()=>({error:'로그인이 만료됐거나 서버에 연결하지 못했습니다. 새로고침해 주세요.'}));if(!r.ok)throw new Error(value.error||'요청 실패');return value;}
  function error(e){$('error').textContent=e.message;}
  window.receiveSketchCapture=value=>{if(capture?.id===value.id)return;if(capture)return;capture=value;$('capture').hidden=false;$('capture-title').textContent=value.context.title;$('capture-image').src='data:image/png;base64,'+value.image;$('instruction').value=value.instruction||'';};
  $('discard').onclick=()=>{if(!capture||busy)return;notify({type:'sketch-discarded',id:capture.id});capture=null;$('capture').hidden=true;};
  $('submit').onclick=async()=>{if(!capture||busy)return;busy=true;$('submit').disabled=true;$('error').textContent='';try{if(capture.context.sourceHash!==capture.context.currentSourceHash&&!capture.reanchored){if(!confirm('이전 필기와 현재 원문의 버전을 연결할 수 없습니다. 위 이미지에서 필기 위치와 현재 문장이 맞는지 확인했나요?'))return;capture.reanchored=true;}capture.reanchored=capture.reanchored===true;capture.instruction=$('instruction').value;await persistCapture();const job=await api('jobs',capture);notify({type:'sketch-submitted',id:capture.id});capture=null;$('capture').hidden=true;selected=job.id;detailVersion='';await refresh();}catch(e){error(e);}finally{busy=false;$('submit').disabled=false;}};
  async function mutate(id,action,body){if(busy)return;busy=true;$('error').textContent='';try{await api('jobs/'+id+'/'+action,body);detailVersion='';await refresh();}catch(e){error(e);}finally{busy=false;}}
  function action(parent,label,fn,primary=false){const b=text('button',label,primary?'primary':'');b.onclick=fn;parent.append(b);return b;}
  async function show(job){
    const key=job.id+':'+job.updatedAt;if(detailVersion===key)return;detailVersion=key;
    const box=$('detail');box.hidden=false;box.replaceChildren(text('h2',job.title),text('p',labels[job.status]||job.status,'status'),text('p',job.message));
    const image=document.createElement('img');image.src='/api/sketch/jobs/'+job.id+'/image';image.alt='요청한 원문과 필기';const original=document.createElement('details');original.append(text('summary','보낸 필기 보기'),image);box.append(original);
    if(job.review){const r=await api('jobs/'+job.id+'/review');if(selected!==job.id)return;
      box.append(text('h3','AI가 해석한 요청과 변경 내용'),text('pre',r.summary));
      const d=document.createElement('details');d.open=true;d.append(text('summary','실제 Markdown 변경 비교'),text('pre',r.diff));box.append(d);
      box.append(text('h3','수정된 글 미리보기'),text('p','검사한 글의 정적 미리보기입니다. 영상 재생과 사이트 이동은 제공하지 않습니다.','muted'));
      const frame=document.createElement('iframe');frame.title='승인할 글 미리보기';frame.setAttribute('sandbox','');frame.src='/api/sketch/jobs/'+job.id+'/preview';box.append(frame);
      box.append(text('p','사이트 검사 · 편집 서버 빌드 · 브라우저 검사 통과 / 변경 버전 '+r.headCommit.slice(0,12),'muted'));
      if(job.status==='awaiting-approval'){
        const label=document.createElement('label'), tick=document.createElement('input');tick.type='checkbox';label.append(tick,document.createTextNode(' 미리보기와 변경 내용을 확인했습니다.'));box.append(label);
        const buttons=text('div','','actions');const approve=action(buttons,'이 수정안 승인·배포',()=>mutate(job.id,'approve',{reviewId:job.review.id,digest:job.review.digest}),true);approve.disabled=true;tick.onchange=()=>approve.disabled=!tick.checked;box.append(buttons);
      }
    }
    if(['awaiting-approval','approved','needs-clarification','failed'].includes(job.status)){
      box.append(text('h3','추가 요청'));const input=document.createElement('textarea');input.maxLength=4000;input.value=job.instruction||'';input.placeholder='어떤 부분을 다시 수정할지 적어 주세요.';box.append(input);action(box,'이 설명으로 다시 수정',()=>mutate(job.id,'revise',{instruction:input.value}));
    }
    const buttons=text('div','','actions');if(!['deploying','deployed','rejected'].includes(job.status))action(buttons,'요청 폐기',()=>{if(confirm('이 요청을 폐기할까요?'))mutate(job.id,'reject',{});});
    if(['deployed','rejected','failed','deployment-failed','needs-recapture'].includes(job.status))action(buttons,'보관 자료 삭제',()=>{if(confirm('필기 이미지와 요청 기록을 삭제할까요?'))mutate(job.id,'delete',{});});box.append(buttons);
    if(job.status==='deployed'){const a=text('a','공개 글 열기');a.href=job.url;a.target='_blank';a.rel='noopener';box.append(a);}
  }
  async function refresh(){const data=await api('jobs');$('connection').textContent=data.runnerSeenAt&&Date.now()-data.runnerSeenAt<120000?'PC 실행기가 연결돼 있습니다.':'PC 연결을 기다리고 있습니다. 요청과 승인은 보관됩니다.';
    $('jobs').replaceChildren();if(!data.jobs.length)$('jobs').append(text('p','아직 보낸 요청이 없습니다. 글 화면에서 필기를 전송해 주세요.','muted'));
    for(const job of data.jobs){action($('jobs'),(labels[job.status]||job.status)+' · '+job.title,()=>{selected=job.id;detailVersion='';show(job).catch(error);});}
    const job=data.jobs.find(j=>j.id===selected);if(job)await show(job);else{$('detail').hidden=true;selected=null;detailVersion='';}
  }
  refresh().catch(error);setInterval(()=>{if(!busy)refresh().catch(error);},8000);notify({type:'sketch-ready'});
  </script></body></html>`;
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'self'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`}});
}
