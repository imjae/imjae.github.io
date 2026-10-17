import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseFrontmatter} from '../scripts/frontmatter.mjs';

const ledger=JSON.parse(await readFile('docs/ARTICLE-DATES.json','utf8'));
const day=iso=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));

test('날짜 조사 기록과 현재 남아 있는 글의 작성일·출처 구분이 일치한다',async()=>{
  assert.equal(new Set(ledger.articles.map(row=>row.slug)).size,ledger.articles.length);
  for(const row of ledger.articles){
    // 삭제된 글은 과거 조사 기록만 남길 수 있다.
    const raw=await readFile(row.file,'utf8').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    if(raw===null)continue;
    const {data}=parseFrontmatter(raw);
    assert.equal(data.slug,row.slug);
    assert.equal(data.date,row.date,row.slug);
    assert.equal(data.dateBasis??'authored',row.dateBasis,row.slug);
    assert.equal(new Date(`${data.date}T00:00:00Z`).toISOString().slice(0,10),data.date);
    if(data.updated)assert.ok(data.updated>=data.date,row.slug);
  }
});

test('노션 날짜는 중심 원문의 생성일 근거를 갖고 수정일을 대용하지 않는다',async()=>{
  for(const row of ledger.articles.filter(row=>row.dateBasis==='notion')){
    const selected=row.evidence.filter(source=>source.selected);
    assert.equal(selected.length,1,row.slug);
    assert.equal(selected[0].type,'notion');
    assert.equal(selected[0].date,row.date);
    assert.equal(selected[0].method,'native-created-date-range');
    assert.equal(selected[0].dayConfirmed,true);
    assert.match(selected[0].url,/^https:\/\/app\.notion\.com\/p\/[a-f0-9]{32}$/);
  }
});

test('작업 글의 날짜는 선택한 커밋의 작성 시각을 한국 날짜로 변환한 값이다',()=>{
  for(const row of ledger.articles.filter(row=>row.dateBasis==='commit')){
    const selected=row.evidence.filter(source=>source.selected);
    assert.equal(selected.length,1,row.slug);
    assert.match(selected[0].sha,/^[a-f0-9]{40}$/);
    assert.equal(day(selected[0].authoredAt),row.date,row.slug);
    assert.equal(selected[0].date,row.date);
  }
});
