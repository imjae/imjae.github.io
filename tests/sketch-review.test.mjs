import test from 'node:test';
import assert from 'node:assert/strict';
import { SketchReviews, handleSketchRequest } from '../server/sketch-review.mjs';
import { validateSubmission, decodePng, getBlob, putBlob } from '../server/sketch-protocol.mjs';

import {MemoryStorage,png,submission,fixture} from './fixtures/sketch.mjs';

test('인증·CSRF·실행기 권한을 분리한다',async()=>{
  const f=fixture();
  assert.equal((await f.call('/api/sketch/jobs',{owner:'wrong'})).status,403);
  assert.equal((await f.call('/api/sketch/jobs',{body:submission(),origin:'https://evil.test'})).status,403);
  assert.equal((await f.call('/api/sketch/runner/claim',{body:{},runner:true,token:'wrong'})).status,401);
  const job=await f.create();
  assert.equal((await f.call('/api/sketch/runner/jobs/'+job.id+'/approve',{body:{},runner:true})).status,403);
});
test('외부 글·없는 버전·과도한 이미지·좌표를 거절한다',()=>{
  for(const mutate of [s=>s.context.url='https://evil.test/writing/x/',s=>s.context.sourceHash=null,s=>s.context.strokes[0].points[0].x=Infinity,s=>s.image='not-png',s=>s.instruction='x'.repeat(4001)]){const s=submission();mutate(s);assert.throws(()=>validateSubmission(s));}
  assert.ok(decodePng(png).length>32);
});
test('옛 필기의 원문 연결은 현재 버전 확인을 명시해야 한다',()=>{
  const s=submission();s.context.currentSourceHash='f'.repeat(64);
  assert.throws(()=>validateSubmission(s));s.reanchored=true;
  assert.equal(validateSubmission(s).context.currentSourceHash,'f'.repeat(64));
  s.context.sourceHash=null;assert.ok(validateSubmission(s));
});
test('만료된 승인은 검토 대기로 돌리고 화면 갱신 시각도 변경한다',async()=>{
  const f=fixture(),job=await f.ready();
  await f.storage.put('job:'+job.id,{...job,status:'approved',updatedAt:1,approval:{expiresAt:1}});
  assert.equal(await f.claim(),null);
  const expired=await f.storage.get('job:'+job.id);
  assert.equal(expired.status,'awaiting-approval');assert.ok(expired.updatedAt>1);assert.equal(expired.approval,undefined);
});
test('분할 파일을 해시로 검증하고 손상되면 거절한다',async()=>{
  const storage=new MemoryStorage(),value='한글'.repeat(100000);
  await putBlob(storage,'test',value,'text/plain');
  assert.equal(new TextDecoder().decode((await getBlob(storage,'test')).bytes),value);
  await storage.put('test:0',new Uint8Array(60000));
  await assert.rejects(getBlob(storage,'test'),/검증/);
});
test('재전송은 같은 요청이고 충돌한 요청이 기존 파일을 덮어쓰지 않는다',async()=>{
  const f=fixture(),job=await f.create();
  assert.equal((await f.call('/api/sketch/jobs',{body:submission()})).status,200);
  const other=submission();other.instruction='다른 요청';
  assert.equal((await f.call('/api/sketch/jobs',{body:other})).status,409);
  const input=await (await f.call('/api/sketch/runner/jobs/'+job.id+'/input',{runner:true})).json();
  assert.equal(input.instruction,submission().instruction);
});
test('동시에 두 실행기가 같은 작업을 받지 않는다',async()=>{
  const f=fixture();await f.create();const claims=await Promise.all([f.claim(),f.claim()]);assert.equal(claims.filter(Boolean).length,1);
});
test('폐기한 작업의 늦은 결과와 잘못된 임대는 저장하지 않는다',async()=>{
  const f=fixture(),job=await f.create(),claim=await f.claim();
  assert.equal((await f.call('/api/sketch/runner/jobs/'+job.id+'/heartbeat',{runner:true,body:{lease:'wrong'}})).status,409);
  await f.call('/api/sketch/jobs/'+job.id+'/reject',{body:{}});
  assert.equal((await f.call('/api/sketch/runner/jobs/'+job.id+'/result',{runner:true,body:{lease:claim.lease.token,kind:'failed'}})).status,409);
});
test('검사 실패한 수정안을 승인 대기에 올리지 않는다',async()=>{
  const f=fixture(),job=await f.create(),claim=await f.claim();
  const r=await f.call('/api/sketch/runner/jobs/'+job.id+'/result',{runner:true,body:{lease:claim.lease.token,kind:'ready',preview:'x',review:{generation:1,baseCommit:'b'.repeat(40),headCommit:'c'.repeat(40),sourceHash:'a'.repeat(64),afterHash:'d'.repeat(64),diff:'diff',summary:'s',checks:{verify:false}}}});
  assert.equal(r.status,400);assert.equal((await f.storage.get('job:'+job.id)).status,'preparing');
});
test('승인 전 배포 임대가 없고 미리보기의 실행 코드를 격리한다',async()=>{
  const f=fixture(),job=await f.ready();assert.equal(await f.claim(),null);
  const preview=await f.call('/api/sketch/jobs/'+job.id+'/preview');
  assert.match(preview.headers.get('content-security-policy'),/^sandbox;/);
  assert.doesNotMatch(preview.headers.get('content-security-policy'),/allow-same-origin|allow-scripts/);
  assert.equal((await f.call('/api/sketch/jobs/'+job.id+'/approve',{body:{reviewId:'wrong',digest:job.review.digest}})).status,409);
});
test('정확한 결과 승인만 배포하고 두 배포·실제 확인이 있어야 완료한다',async t=>{
  const f=fixture(),job=await f.ready();
  t.mock.method(globalThis,'fetch',async()=>Response.json({object:{sha:job.review.baseCommit}}));
  const approved=await f.call('/api/sketch/jobs/'+job.id+'/approve',{body:{reviewId:job.review.id,digest:job.review.digest}});assert.equal(approved.status,200);
  assert.equal((await f.call('/api/sketch/jobs/'+job.id+'/approve',{body:{reviewId:job.review.id,digest:job.review.digest}})).status,409);
  const lease=await f.claim();assert.equal(lease.lease.kind,'deploy');
  const base={lease:lease.lease.token,kind:'deployed',headCommit:job.review.headCommit,pages:true,authoring:true,live:false};
  assert.equal((await f.call('/api/sketch/runner/jobs/'+job.id+'/result',{runner:true,body:base})).status,409);
  assert.equal((await f.call('/api/sketch/runner/jobs/'+job.id+'/result',{runner:true,body:{...base,live:true,deployment:{}}})).status,200);
  assert.equal((await f.storage.get('job:'+job.id)).status,'deployed');
});
test('main 경쟁 변경과 오래된 검토 결과의 승인을 거절한다',async t=>{
  const f=fixture(),job=await f.ready();
  t.mock.method(globalThis,'fetch',async()=>Response.json({object:{sha:'f'.repeat(40)}}));
  assert.equal((await f.call('/api/sketch/jobs/'+job.id+'/approve',{body:{reviewId:job.review.id,digest:job.review.digest}})).status,409);
  assert.equal((await f.call('/api/sketch/jobs/'+job.id+'/revise',{body:{instruction:'더 짧게'}})).status,200);
  const changed=await f.storage.get('job:'+job.id);assert.equal(changed.generation,2);assert.equal(changed.review,undefined);assert.equal(changed.approval,undefined);
});
