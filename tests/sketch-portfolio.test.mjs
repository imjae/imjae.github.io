import test from 'node:test';
import assert from 'node:assert/strict';
import { readSketchPortfolio, applyPortfolioReplacements, portfolioSourceHash } from '../src/lib/sketch-portfolio.server.mjs';
import { selectPortfolioText } from '../src/lib/portfolio-copy.mjs';
import { canonicalSketchTarget } from '../server/sketch-target.mjs';
import { fixture, submission } from './fixtures/sketch.mjs';

const snapshot = await readSketchPortfolio(process.cwd());
const options = {id:'12345678-1234-1234-1234-123456789abc',generation:1,now:Date.now()};
const result = () => ({summary:'상단 소개를 다듬었습니다.',questions:[],replacements:[{key:'profile.intro',before:snapshot.fields['profile.intro'],after:'포트폴리오 문구 수정 시험입니다.'}]});

test('공개·편집 포트폴리오는 같은 고정 대상으로 연결하고 임의 출처·경로를 거절한다',()=>{
  for(const origin of ['https://imjae.github.io','https://imjae-blog-author.imjae-game-dev-notes.workers.dev']) {
    for(const slug of ['2027', 'krafton-2027']) for(const suffix of ['', '/', '/?edit=1#ai']) {
      assert.deepEqual(canonicalSketchTarget(`${origin}/portfolio/${slug}${suffix}`),{kind:'portfolio',path:'/portfolio/2027/',url:'https://imjae.github.io/portfolio/2027/'});
    }
  }
  for(const url of ['https://evil.test/portfolio/2027/','https://imjae.github.io/portfolio/other/','https://user@imjae.github.io/portfolio/2027/']) assert.throws(()=>canonicalSketchTarget(url));
});

test('새 주소와 이전 실행기 주소 모두 현재 포트폴리오의 배포 해시를 읽는다',async()=>{
  const f=fixture(), paths=[], sourceHash='a'.repeat(64);
  f.env.ASSETS={fetch:async request=>{
    paths.push(new URL(request.url).pathname);
    return new Response(`<main data-sketch-source="${sourceHash}"></main>`);
  }};
  for(const slug of ['2027','krafton-2027']) {
    const response=await f.call(`/api/sketch/runner/published/portfolio/${slug}`,{runner:true});
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{sourceHash});
  }
  assert.deepEqual(paths,['/portfolio/2027/','/portfolio/2027/']);
});

test('표시 중인 원문 키만 새 JSON에 저장하고 이전 문구·순서·기본 파일을 보존한다',()=>{
  const before = JSON.stringify(snapshot);
  const applied = applyPortfolioReplacements(snapshot,result(),options);
  const record = JSON.parse(applied.source);
  assert.deepEqual(Object.keys(record.values),['profile.intro']);
  assert.equal(applied.afterHash,portfolioSourceHash(selectPortfolioText([record],snapshot.fields)));
  assert.ok(Date.parse(record.createdAt)>snapshot.latestTimestamp);
  assert.equal(JSON.stringify(snapshot),before);
  assert.match(applied.sourcePath,/^content\/portfolio-copy\/sketch-[a-f0-9-]+-1\.json$/);
  assert.equal(applied.changes[0].before[0],snapshot.fields['profile.intro']);
});

test('다른 키·원문 불일치·중복·긴 문구·새 링크·HTML·순서 변경은 거절한다',()=>{
  for(const edit of [
    {key:'profile.contact',before:'',after:'secret'},
    {key:'paragraphOrder.hero.123',before:'0',after:'1'},
    {key:'profile.intro',before:'틀린 원문',after:'수정'},
    {key:'profile.intro',before:snapshot.fields['profile.intro'],after:'가'.repeat(601)},
    {key:'profile.intro',before:snapshot.fields['profile.intro'],after:'https://evil.test/'},
    {key:'profile.intro',before:snapshot.fields['profile.intro'],after:'<script>alert(1)</script>'},
  ]) assert.throws(()=>applyPortfolioReplacements(snapshot,{...result(),replacements:[edit]},options));
  const proposal=result();proposal.replacements.push(proposal.replacements[0]);
  assert.throws(()=>applyPortfolioReplacements(snapshot,proposal,options));
  assert.deepEqual(applyPortfolioReplacements(snapshot,{...result(),questions:['어떤 문구인가요?']},options),{questions:['어떤 문구인가요?']});
});

test('포트폴리오 요청을 접수하고 일반 글 결과로 위장한 준비 완료를 거절한다',async()=>{
  const f=fixture(), input=submission();
  input.context.url='https://imjae-blog-author.imjae-game-dev-notes.workers.dev/portfolio/2027/?edit=1';
  const response=await f.call('/api/sketch/jobs',{body:input});assert.equal(response.status,201);
  const job=await response.json();assert.equal(job.url,'https://imjae.github.io/portfolio/2027/');
  const lease=await f.claim();
  const review={generation:1,baseCommit:'b'.repeat(40),headCommit:'c'.repeat(40),sourceHash:'a'.repeat(64),afterHash:'d'.repeat(64),summary:'소개 수정',diff:'+문구',checks:{verify:true,authoring:true,browser:true}};
  const publish=body=>f.call('/api/sketch/runner/jobs/'+job.id+'/result',{runner:true,body:{lease:lease.lease.token,kind:'ready',preview:'<!doctype html><h1>포트폴리오</h1>',review:body}});
  assert.equal((await publish(review)).status,400);
  const ready=await publish({...review,targetKind:'portfolio',sourcePath:`content/portfolio-copy/sketch-${job.id}-1.json`,displayChanges:[{label:'상단 소개',before:['원문'],after:['수정문']}]});
  assert.equal(ready.status,200);assert.equal((await ready.json()).status,'awaiting-approval');
  assert.equal(await f.claim(),null);
});
