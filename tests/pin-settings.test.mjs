import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyPinSettings, selectPinnedArticles, validatePinSettings } from '../src/lib/pinned-articles.mjs';
import { readPinSettings } from '../src/lib/pin-settings.server.mjs';
import { preparePinSettings } from '../src/lib/github-authoring.mjs';

const now = new Date('2026-10-18T01:00:00.000Z');
const id = '12345678-1234-1234-1234-123456789abc';
const article = (slug, data = {}) => ({data:{slug,date:'2026-10-18',draft:false,...data}});

test('고정 순서와 전체 해제를 GitHub 새 파일 화면에 정확하게 전달한다', () => {
  for (const pins of [['second','first'],[]]) {
    const result = preparePinSettings(pins,{now,id});
    const url = new URL(result.url);
    assert.equal(url.origin,'https://github.com');
    assert.equal(url.pathname,'/imjae/imjae.github.io/new/main');
    assert.equal(url.searchParams.get('filename'),result.path);
    assert.equal(url.searchParams.get('value'),result.content);
    assert.deepEqual(JSON.parse(result.content),{version:1,createdAt:now.toISOString(),pins});
    assert.match(result.path,/^content\/pins\/[^/]+\.json$/);
  }
});

test('주소 탈출·중복·잘못된 날짜와 버전을 거절한다', () => {
  for (const pins of [['../secret'],['same','same'],['<script>'],[1]]) assert.throws(()=>preparePinSettings(pins,{now,id}));
  for (const change of [{version:2},{createdAt:'2026-02-30T00:00:00.000Z'},{createdAt:'no-date'},{pins:'first'}]) assert.throws(()=>validatePinSettings({version:1,createdAt:now.toISOString(),pins:[],...change}));
  assert.throws(()=>preparePinSettings([],{now,id:'../../outside'}));
});

test('새 고정 설정을 적용하고 삭제·초안 글을 안전하게 제외하며 기존 자료는 보존한다', () => {
  const original = [article('old',{pinned:true,pinOrder:1}),article('second'),article('first'),article('draft',{draft:true})];
  const saved = JSON.stringify(original);
  const updated = applyPinSettings(original,['missing','first','draft','second']);
  assert.deepEqual(selectPinnedArticles(updated).map(a=>a.data.slug),['first','second']);
  assert.equal(JSON.stringify(original),saved);
  assert.deepEqual(selectPinnedArticles(applyPinSettings(original,[])),[]);
  assert.equal(applyPinSettings(original,undefined),original);
});

test('가장 최근의 저장 설정을 빌드와 같은 경로에서 읽고 빈 목록도 반영한다', async () => {
  const root = await mkdtemp(join(tmpdir(),'imjae-pins-'));
  try {
    assert.equal(await readPinSettings(root),undefined);
    await mkdir(join(root,'content/pins'),{recursive:true});
    await writeFile(join(root,'content/pins/a.json'),JSON.stringify({version:1,createdAt:'2026-10-17T00:00:00.000Z',pins:['first']}));
    await writeFile(join(root,'content/pins/b.json'),JSON.stringify({version:1,createdAt:now.toISOString(),pins:[]}));
    assert.deepEqual((await readPinSettings(root)).pins,[]);
    await writeFile(join(root,'content/pins/invalid.json'),'{}');
    await assert.rejects(()=>readPinSettings(root));
  } finally { await rm(root,{recursive:true,force:true}); }
});
