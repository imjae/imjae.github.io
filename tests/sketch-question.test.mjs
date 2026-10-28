import test from 'node:test';
import assert from 'node:assert/strict';
import { handleQuestionRequest, SketchQuestions, questionResult } from '../server/sketch-question.mjs';
const image='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZAAAAABJRU5ErkJggg==';
const id='22222222-2222-4222-8222-222222222222';
const request=(path='/api/sketch/ask',options={})=>new Request('https://owner.test'+path,{method:'POST',headers:{Origin:'https://owner.test','X-Sketch-Request':'1','Content-Type':'application/json'},body:JSON.stringify({id,image}),...options});
function fixture(){
  const sent=[];const socket={readyState:1,send(raw){sent.push(JSON.parse(raw));},close(){this.readyState=3;}};
  const hub=new SketchQuestions({getWebSockets:()=>[socket],get storage(){throw Error('Question data must not be stored');}});
  let forwarded=0;
  const env={ALLOWED_GITHUB_ID:'1',SKETCH_RUNNER_TOKEN:'fixture-secret',SKETCH_QUESTIONS:{idFromName:x=>x,get:()=>({fetch:r=>{forwarded++;assert.equal(r.headers.get('Cookie'),null);assert.equal(r.headers.get('Authorization'),null);return hub.fetch(r);}})}};
  const call=(r=request(),options={})=>handleQuestionRequest(r,env,{ownerId:'1',...options});
  const reply=result=>hub.webSocketMessage(socket,JSON.stringify({type:'result',id,result}));
  const ready=async()=>{for(let n=0;n<30&&!hub.pending;n++)await new Promise(r=>setTimeout(r,1));assert.ok(hub.pending);};
  return {hub,env,socket,sent,call,reply,ready,forwarded:()=>forwarded};
}
test('private relay sends only the selected image and releases its memory after a response',async()=>{
  const f=fixture(),pending=f.call();await f.ready();assert.deepEqual(f.sent,[{type:'question',id,image}]);
  f.reply({status:'answer',answer:'짧은 답변입니다.'});const response=await pending;
  assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.deepEqual(await response.json(),{id,kind:'answer',message:'짧은 답변입니다.'});assert.equal(f.hub.pending,null);
});
test('owner and runner authentication are separate; CSRF and arbitrary runner paths are rejected',async()=>{
  const f=fixture();
  for(const [r,options,status] of [
    [request(),{ownerId:'2'},403],
    [request('/api/sketch/ask',{headers:{Origin:'https://other.test','X-Sketch-Request':'1','Content-Type':'application/json'}}),{},403],
    [request('/api/sketch/question-runner/connect',{method:'GET',body:undefined,headers:{Upgrade:'websocket',Authorization:'Bearer wrong'}}),{runner:true},401],
    [request('/api/sketch/ask',{headers:{Authorization:'Bearer fixture-secret'}}),{runner:true},400],
  ])assert.equal((await f.call(r,options)).status,status);
  assert.equal(f.forwarded(),0);
});
test('invalid/oversized images and unknown fields never reach the PC',async()=>{
  const f=fixture();for(const [body,status] of [[{id,image:'bad'},400],[{id,image,url:'https://other.test'},400],['x'.repeat(4_001_001),413]]){
    assert.equal((await f.call(request('/api/sketch/ask',{body:typeof body==='string'?body:JSON.stringify(body)}))).status,status);
  }assert.equal(f.sent.length,0);
});
test('offline PC gives an immediate notice and never queues an image',async()=>{
  const f=fixture();f.socket.readyState=3;const r=await f.call();assert.equal(r.status,503);assert.match((await r.json()).error,/PC 질문 실행기/);assert.equal(f.hub.pending,null);
});
test('empty and unreadable content becomes fixed notices; malformed output stays an error',()=>{
  assert.match(questionResult({status:'no_content',answer:'ignored'}).message,/찾지 못했어요/);
  assert.match(questionResult({status:'unreadable',answer:''}).message,/읽기 어려워요/);
  for(const v of [null,{status:'other',answer:''},{status:'answer',answer:''},{status:'answer',answer:'x'.repeat(1801)}])assert.throws(()=>questionResult(v));
});
test('concurrency, cancellation, timeout and disconnect dispose pending requests',async()=>{
  for(const cause of ['cancel','timeout','disconnect','abort']){
    const f=fixture(),controller=new AbortController();if(cause==='timeout')f.hub.timeoutMs=20;
    const pending=f.call(request('/api/sketch/ask',{signal:controller.signal}));await f.ready();
    assert.equal((await f.call()).status,429);
    if(cause==='cancel')assert.equal((await f.call(request('/api/sketch/ask/cancel',{body:JSON.stringify({id})}))).status,200);
    if(cause==='disconnect')f.hub.webSocketClose(f.socket);
    if(cause==='abort')controller.abort();
    assert.equal((await pending).status,cause==='timeout'?504:cause==='disconnect'?503:499);assert.equal(f.hub.pending,null);
    if(cause!=='disconnect')assert.ok(f.sent.some(m=>m.type==='cancel'));
    f.reply({status:'answer',answer:'late'});assert.equal(f.hub.pending,null);
  }
});
test('cancel arriving before upload completes prevents a later model invocation',async()=>{
  const f=fixture();await f.call(request('/api/sketch/ask/cancel',{body:JSON.stringify({id})}));assert.equal((await f.call()).status,499);assert.equal(f.sent.length,0);
});
test('rate limit bounds calls and raw runner errors are never displayed',async()=>{
  const f=fixture();for(let i=0;i<5;i++){const p=f.call();await f.ready();f.hub.webSocketMessage(f.socket,JSON.stringify({type:'result',id,error:'private upstream detail'}));const r=await p;assert.equal(r.status,503);assert.ok(!(await r.text()).includes('private'));}
  assert.equal((await f.call()).status,429);assert.equal(f.hub.pending,null);
});
