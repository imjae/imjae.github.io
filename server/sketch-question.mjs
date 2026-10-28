import { check, readJson, decodePng, UUID, digest } from './sketch-protocol.mjs';
import { questionPage } from './sketch-question-ui.mjs';

export const questionJson = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export function questionResult(result) {
  check(result && ['answer','no_content','unreadable'].includes(result.status) && typeof result.answer==='string' && result.answer.length<=1800,
    '답변 형식을 확인하지 못했어요. 다시 시도해 주세요.',502);
  if(result.status==='no_content')return {kind:'notice',message:'선택한 영역에서 질문이나 설명할 내용을 찾지 못했어요.'};
  if(result.status==='unreadable')return {kind:'notice',message:'내용을 읽기 어려워요. 영역을 다시 지정해 주세요.'};
  check(result.answer.trim(),'답변을 완료하지 못했어요. 다시 시도해 주세요.',502);
  return {kind:'answer',message:result.answer.trim()};
}

// Private remote control relay for the owner's local Codex. ChatGPT credentials
// and inference stay on the personal PC, never in this service.
export async function handleQuestionRequest(request,env,{ownerId,runner=false}={}) {
  try {
    const path=new URL(request.url).pathname;
    if(runner) {
      const value=request.headers.get('Authorization');
      check(env.SKETCH_RUNNER_TOKEN && value?.startsWith('Bearer ') &&
        await digest(value.slice(7))===await digest(env.SKETCH_RUNNER_TOKEN),'실행기 인증이 필요합니다.',401);
      check(path==='/api/sketch/question-runner/connect' && request.method==='GET' && request.headers.get('Upgrade')?.toLowerCase()==='websocket','잘못된 연결 요청입니다.',400);
    } else {
      check(ownerId && ownerId===env.ALLOWED_GITHUB_ID,'소유자 로그인이 필요합니다.',403);
      if(path==='/sketch/ask/' && request.method==='GET')return questionPage();
      check((path==='/api/sketch/ask/status' && request.method==='GET') ||
        (['/api/sketch/ask','/api/sketch/ask/cancel'].includes(path) && request.method==='POST'),'요청한 기능을 찾을 수 없어요.',404);
      if(request.method==='POST') {
        check(request.headers.get('Origin')===new URL(request.url).origin && request.headers.get('X-Sketch-Request')==='1','요청 출처를 확인해 주세요.',403);
        check(request.headers.get('Content-Type')?.split(';')[0].trim()==='application/json','요청 형식을 확인해 주세요.',400);
      }
    }
    check(env.SKETCH_QUESTIONS,'PC 질문 연결이 아직 설정되지 않았어요.',503);
    const headers=new Headers(request.headers);headers.delete('Authorization');headers.delete('Cookie');
    headers.set('X-Question-Role',runner?'runner':'owner');
    return await env.SKETCH_QUESTIONS.get(env.SKETCH_QUESTIONS.idFromName('personal-question')).fetch(new Request(request,{headers}));
  } catch(e) {return questionJson({error:e.status?e.message:'PC 질문 연결을 확인하지 못했어요.'},e.status||503);}
}

// Never reads/writes state.storage. Images/results exist only while an HTTP
// request waits; disconnect, cancellation or timeout discards them.
export class SketchQuestions {
  constructor(state,env) {
    this.state=state;this.pending=null;this.starts=[];this.cancelled=new Map();this.timeoutMs=90000;
    if(typeof WebSocketRequestResponsePair!=='undefined')state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));
  }
  socket(){return this.state.getWebSockets('runner').find(s=>s.readyState===1);}
  async fetch(request) {
    try {
      const path=new URL(request.url).pathname,role=request.headers.get('X-Question-Role');
      check(role==='owner'||role==='runner','인증이 필요합니다.',401);
      if(role==='runner') {
        check(path==='/api/sketch/question-runner/connect' && request.method==='GET' && request.headers.get('Upgrade')?.toLowerCase()==='websocket','연결할 수 없습니다.',400);
        check(!this.socket(),'이미 PC 질문 실행기가 연결되어 있어요.',409);
        const pair=new WebSocketPair();this.state.acceptWebSocket(pair[1],['runner']);
        return new Response(null,{status:101,webSocket:pair[0]});
      }
      if(path==='/api/sketch/ask/status' && request.method==='GET')return questionJson({online:Boolean(this.socket()),busy:Boolean(this.pending)});
      check(request.method==='POST','요청한 기능을 찾을 수 없어요.',404);
      if(path==='/api/sketch/ask/cancel') {
        const input=await readJson(request,300);check(input && UUID.test(input.id),'질문 정보를 확인해 주세요.');
        for(const [id,expires] of this.cancelled)if(expires<=Date.now())this.cancelled.delete(id);
        if(this.cancelled.size>=100)this.cancelled.delete(this.cancelled.keys().next().value);
        this.cancelled.set(input.id,Date.now()+120000);
        if(this.pending?.id===input.id)this.finish({error:'질문이 취소됐어요.'},499,true);
        return questionJson({ok:true});
      }
      check(path==='/api/sketch/ask','요청한 기능을 찾을 수 없어요.',404);
      const input=await readJson(request,4_001_000);
      check(input && UUID.test(input.id) && Object.keys(input).every(k=>['id','image'].includes(k)),'질문 정보를 확인해 주세요.');decodePng(input.image);
      check((this.cancelled.get(input.id)||0)<=Date.now(),'질문이 취소됐어요.',499);
      const socket=this.socket();check(socket,'PC 질문 실행기가 연결되어 있지 않아요. PC에서 실행한 뒤 다시 시도해 주세요.',503);
      check(!this.pending,'이미 답변을 준비하고 있어요. 잠시 후 다시 시도해 주세요.',429);
      const now=Date.now();this.starts=this.starts.filter(t=>now-t<60000);
      check(this.starts.length<5,'질문이 많아요. 잠시 후 다시 시도해 주세요.',429);
      check(!request.signal.aborted,'질문이 취소됐어요.',499);this.starts.push(now);
      return await new Promise(resolve=>{
        const cancel=()=>this.finish({error:'질문이 취소됐어요.'},499,true);
        const timer=setTimeout(()=>this.finish({error:'응답이 지연됐어요. 다시 시도해 주세요.'},504,true),this.timeoutMs);
        this.pending={id:input.id,resolve,socket,timer,cleanup:()=>request.signal.removeEventListener('abort',cancel)};
        request.signal.addEventListener('abort',cancel,{once:true});
        try {socket.send(JSON.stringify({type:'question',id:input.id,image:input.image}));}
        catch {this.finish({error:'PC 질문 연결이 끊겼어요. 다시 시도해 주세요.'},503);}
      });
    } catch(e) {return questionJson({error:e.status?e.message:'질문을 처리하지 못했어요. 다시 시도해 주세요.'},e.status||503);}
  }
  finish(body,status=200,cancel=false) {
    const p=this.pending;if(!p)return;this.pending=null;clearTimeout(p.timer);p.cleanup();
    if(cancel)try{p.socket.send(JSON.stringify({type:'cancel',id:p.id}));}catch{}
    p.resolve(questionJson(body,status));
  }
  webSocketMessage(socket,raw) {
    if(!this.pending || this.pending.socket!==socket)return;
    try {
      check(typeof raw==='string' && raw.length<=12000,'잘못된 답변입니다.',502);
      const m=JSON.parse(raw);if(m.type!=='result'||m.id!==this.pending.id)return;
      if(m.error) {
        const messages={usage:'ChatGPT 사용량 한도에 도달했어요. 잠시 후 다시 시도해 주세요.',auth:'PC에서 Codex의 ChatGPT 로그인을 확인해 주세요.',cancelled:'질문이 취소됐어요.',timeout:'응답이 지연됐어요. 다시 시도해 주세요.'};
        this.finish({error:messages[m.error]||'PC에서 답변을 만들지 못했어요. 다시 시도해 주세요.'},m.error==='usage'?429:503);return;
      }
      this.finish({id:m.id,...questionResult(m.result)});
    }catch{this.finish({error:'답변 형식을 확인하지 못했어요. 다시 시도해 주세요.'},502);}
  }
  webSocketClose(socket){if(this.pending?.socket===socket)this.finish({error:'PC 질문 연결이 끊겼어요. 다시 시도해 주세요.'},503);try{socket.close(1000);}catch{}}
  webSocketError(socket){this.webSocketClose(socket);}
}
