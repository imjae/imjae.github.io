import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';

const require=createRequire(import.meta.resolve('wrangler'));
const {build}=require('esbuild');

test('question UI initializes after Worker bundling and acknowledges duplicate delivery without resubmitting',async()=>{
  const bundle=await build({entryPoints:[fileURLToPath(new URL('../server/sketch-question-ui.mjs',import.meta.url))],bundle:true,keepNames:true,write:false,format:'esm',platform:'browser'});
  const {questionPage}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  const html=await questionPage().text(),script=html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)?.[1];
  assert(script);const elements=new Map(),messages=[],requests=[];
  const document={getElementById(id){if(!elements.has(id))elements.set(id,{textContent:'',hidden:true,setAttribute(){},addEventListener(){}});return elements.get(id);}};
  const window={addEventListener(){},ReactNativeWebView:{postMessage:raw=>messages.push(JSON.parse(raw))}};
  runInNewContext(script,{document,window,crypto,setTimeout,clearTimeout,AbortController,fetch:async(_url,options)=>{
    const input=JSON.parse(options.body);requests.push(input);return Response.json({id:input.id,kind:'answer',message:'2입니다.'});
  }},{timeout:1000});
  assert.equal(messages[0]?.type,'sketch-question-ready');assert.equal(typeof window.receiveSketchQuestion,'function');
  const value={id:crypto.randomUUID(),image:'fixture-image'};
  window.receiveSketchQuestion(value);window.receiveSketchQuestion(value);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests.length,1);assert.equal(messages.filter(m=>m.type==='sketch-question-received'&&m.id===value.id).length,2);
  assert.equal(elements.get('answer').textContent,'2입니다.');
  window.disposeSketchQuestion();assert.equal(elements.get('answer').textContent,'');
});
