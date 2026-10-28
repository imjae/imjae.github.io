// Keep browser code as source: Wrangler adds server-only __name helpers to
// function.toString(), which would stop initialization inside the WebView.
export const questionClientSource = String.raw`function questionClient() {
  const status=document.getElementById('status'), answer=document.getElementById('answer');
  const retry=document.getElementById('retry');
  let input=null,controller=null,disposed=false,generation=0,acceptedId=null;
  function notify(value) {window.ReactNativeWebView?.postMessage(JSON.stringify(value));}
  function cancelRemote(id) {void fetch('/api/sketch/ask/cancel',{method:'POST',credentials:'same-origin',cache:'no-store',keepalive:true,
    headers:{'Content-Type':'application/json','X-Sketch-Request':'1'},body:JSON.stringify({id})}).catch(()=>{});}
  function text(message,kind) { status.textContent=message;status.setAttribute('role',kind==='error'?'alert':'status'); }
  async function submit() {
    if(!input||controller||disposed)return;
    const current=++generation;
    const abort=new AbortController();controller=abort;retry.hidden=true;
    answer.textContent='';answer.hidden=true;text('이미지를 읽고 답변하고 있어요.','loading');
    const timer=setTimeout(()=>{if(input)cancelRemote(input.id);abort.abort();},100000);
    try {
      const response=await fetch('/api/sketch/ask',{method:'POST',credentials:'same-origin',cache:'no-store',signal:abort.signal,
        headers:{'Content-Type':'application/json','X-Sketch-Request':'1'},body:JSON.stringify(input)});
      if(disposed||generation!==current)return;
      if(response.status===401)throw new Error('로그인이 만료됐어요. 닫은 뒤 다시 질문해 주세요.');
      const value=await response.json();
      if(disposed||generation!==current)return;
      if(!response.ok)throw new Error(typeof value.error==='string'?value.error:'답변을 가져오지 못했어요.');
      if(value.id!==input.id||!['answer','notice'].includes(value.kind)||typeof value.message!=='string'||value.message.length>1800)throw new Error('답변을 확인하지 못했어요.');
      input=null; // No image retained after a successful result, including notices.
      if(value.kind==='notice')text(value.message,'notice');
      else {text('짧은 답변','answer');answer.textContent=value.message;answer.hidden=false;}
    } catch(e) {
      if(!disposed&&generation===current){text(abort.signal.aborted?'응답이 지연됐어요. 다시 시도해 주세요.':e.message,'error');retry.hidden=false;}
    } finally {clearTimeout(timer);if(controller===abort)controller=null;}
  }
  window.receiveSketchQuestion=value=>{
    if(disposed||!value||typeof value.id!=='string'||! /^[0-9a-f-]{36}$/i.test(value.id)||typeof value.image!=='string'||value.image.length>4000000)return;
    if(acceptedId){if(value.id===acceptedId)notify({type:'sketch-question-received',id:acceptedId});return;}
    acceptedId=value.id;input={id:value.id,image:value.image};
    notify({type:'sketch-question-received',id:acceptedId});void submit();
  };
  window.disposeSketchQuestion=()=>{
    if(disposed)return;
    if(input&&controller)cancelRemote(input.id);
    disposed=true;generation++;controller?.abort();controller=null;input=null;answer.textContent='';answer.hidden=true;retry.hidden=true;text('질문을 종료했어요.','notice');
  };
  window.addEventListener('pagehide',window.disposeSketchQuestion);
  window.addEventListener('pageshow',event=>{if(event.persisted)window.disposeSketchQuestion();});
  retry.addEventListener('click',()=>{if(input&&!controller&&!disposed){input.id=crypto.randomUUID();void submit();}});
  notify({type:'sketch-question-ready'});
}`;

export function questionPage() {
  const nonce=crypto.randomUUID();
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>영역 질문</title>
<style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#fbfaf6;color:#29352d;font:17px/1.75 system-ui,sans-serif}main{padding:24px;max-width:640px;margin:auto}#status{margin:0 0 18px;color:#52674d}#answer{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}button{font:inherit;color:#fff;background:#48694f;border:0;border-radius:8px;min-height:48px;padding:8px 18px;margin-top:20px}button:focus-visible{outline:3px solid #c58a24;outline-offset:3px}[hidden]{display:none!important}</style></head><body><main>
<p id="status" role="status" aria-live="polite">선택한 영역을 기다리고 있어요.</p><p id="answer" hidden></p><button id="retry" hidden>다시 시도</button>
<noscript>질문을 표시하려면 JavaScript가 필요합니다.</noscript></main><script nonce="${nonce}">(${questionClientSource})();</script></body></html>`,{
    headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive',
      'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`},
  });
}
