import assert from 'node:assert/strict';
import {SketchReviews,handleSketchRequest} from '../../server/sketch-review.mjs';
export class MemoryStorage {
  data=new Map(); queue=Promise.resolve();
  async put(k,v){this.data.set(k,structuredClone(v));}
  async get(k){return structuredClone(this.data.get(k));}
  async delete(k){for(const item of Array.isArray(k)?k:[k])this.data.delete(item);}
  async list({prefix='',limit=Infinity}={}){return new Map([...this.data].filter(([k])=>k.startsWith(prefix)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)]));}
  async setAlarm(time){this.alarm=time;}
  transaction(fn){const result=this.queue.then(fn);this.queue=result.catch(()=>{});return result;}
}
export const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a59sAAAAASUVORK5CYII=';
export function submission(){return {version:1,id:'12345678-1234-1234-1234-123456789abc',capturedAt:'2026-10-25T01:00:00Z',instruction:'문장을 줄여 주세요.',image:png,context:{documentId:'d1',revision:1,url:'https://imjae.github.io/writing/sample/',title:'예시',sourceHash:'a'.repeat(64),visibleText:'원문입니다.',viewport:{x:0,y:0,width:100,height:100,scale:1},strokes:[{id:'s1',tool:'pen',color:'#315de8',width:3,points:[{x:1,y:1,pressure:.5}],anchor:null}]}};}
export function fixture(){
  const storage=new MemoryStorage(), env={ALLOWED_GITHUB_ID:'37284282',SKETCH_RUNNER_TOKEN:'test-runner-token'};
  const state=new SketchReviews({storage},env);env.SKETCH_REVIEWS={idFromName:n=>n,get:()=>({fetch:r=>state.fetch(r)})};
  const call=async(path,{body,runner=false,origin='https://author.test',token='test-runner-token',owner='37284282'}={})=>handleSketchRequest(new Request('https://author.test'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'X-Sketch-Request':'1',Authorization:'Bearer '+token},body:body===undefined?undefined:JSON.stringify(body)}),env,{runner,ownerId:owner});
  const create=async()=>{const r=await call('/api/sketch/jobs',{body:submission()});assert.equal(r.status,201);return r.json();};
  const claim=async()=> (await (await call('/api/sketch/runner/claim',{body:{},runner:true})).json()).job;
  const ready=async()=>{
    const job=await create(),lease=await claim();
    const result=await call('/api/sketch/runner/jobs/'+job.id+'/result',{runner:true,body:{lease:lease.lease.token,kind:'ready',preview:'<!doctype html><h1>수정안</h1>',review:{generation:1,baseCommit:'b'.repeat(40),headCommit:'c'.repeat(40),sourceHash:'a'.repeat(64),afterHash:'d'.repeat(64),summary:'문장을 줄였습니다.',diff:'-원문\n+수정문',checks:{verify:true,authoring:true,browser:true}}}});
    assert.equal(result.status,200);return result.json();
  };
  return {storage,state,env,call,create,claim,ready};
}
