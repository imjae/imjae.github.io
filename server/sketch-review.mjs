import { MAX_BODY, UUID, SHA, COMMIT, check, readJson, digest, validateSubmission, decodePng, putBlob, getBlob } from './sketch-protocol.mjs';
import { reviewPage } from './sketch-ui.mjs';

const TERMINAL = ['deployed','rejected','failed','deployment-failed','needs-recapture'];
const leaseMs = 15 * 60 * 1000;
const cleanJob = job => { const { lease, ...safe } = job; return safe; };

export async function handleSketchRequest(request, env, { runner = false, ownerId } = {}) {
  try {
    check(env.SKETCH_REVIEWS, '수정 요청 서버가 준비되지 않았습니다.', 503);
    const url = new URL(request.url);
    if (runner) {
      check(env.SKETCH_RUNNER_TOKEN && request.headers.get('Authorization')?.startsWith('Bearer '), '실행기 인증이 필요합니다.',401);
      check(await digest(request.headers.get('Authorization').slice(7)) === await digest(env.SKETCH_RUNNER_TOKEN), '실행기 인증이 필요합니다.',401);
      const published = /^\/api\/sketch\/runner\/published\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(url.pathname);
      if (published && request.method === 'GET') {
        const asset = await env.ASSETS.fetch(new Request(`${url.origin}/writing/${published[1]}/`));
        check(asset.ok, '배포된 편집 글이 없습니다.',404);
        return Response.json({ sourceHash: /data-sketch-source="([a-f0-9]{64})"/.exec(await asset.text())?.[1] || null });
      }
    } else {
      check(ownerId === env.ALLOWED_GITHUB_ID, '소유자 로그인이 필요합니다.',403);
      if (request.method !== 'GET' && request.method !== 'HEAD') check(request.headers.get('Origin') === url.origin && request.headers.get('X-Sketch-Request') === '1', '요청 출처를 확인해 주세요.',403);
      if (url.pathname === '/sketch/' && request.method === 'GET') return reviewPage();
    }
    const state = env.SKETCH_REVIEWS.get(env.SKETCH_REVIEWS.idFromName('owner-inbox'));
    const headers = new Headers(request.headers); headers.delete('Authorization'); headers.delete('Cookie');
    headers.set('X-Internal-Role', runner ? 'runner' : 'owner');
    headers.set('X-Internal-Owner', ownerId || '');
    return await state.fetch(new Request(request, { headers }));
  } catch (e) { return Response.json({error:e.status ? e.message : '수정 요청 서버에 연결하지 못했습니다.'},{status:e.status || 503}); }
}

export class SketchReviews {
  constructor(state, env) { this.storage = state.storage; this.env = env; }
  async fetch(request) {
    try { return await this.route(request); }
    catch (e) { return Response.json({error:e.status ? e.message : '작업을 완료하지 못했습니다. 다시 시도해 주세요.'},{status:e.status || 503}); }
  }
  async route(request) {
    const path = new URL(request.url).pathname;
    const role = request.headers.get('X-Internal-Role');
    check(role === 'runner' || role === 'owner','인증이 필요합니다.',401);
    const now = Date.now();
    if (role === 'owner' && path === '/api/sketch/jobs') {
      if (request.method === 'GET') {
        const jobs = [...(await this.storage.list({prefix:'job:'})).values()].sort((a,b) => b.createdAt-a.createdAt);
        return Response.json({ jobs:jobs.map(cleanJob), runnerSeenAt:await this.storage.get('runner-seen') || null });
      }
      check(request.method === 'POST','지원하지 않는 요청입니다.',405);
      const input = validateSubmission(await readJson(request));
      const raw = JSON.stringify(input), hash = await digest(raw);
      const old = await this.storage.get(`job:${input.id}`);
      if (old) { check(old.inputHash === hash,'같은 요청 ID에 다른 내용이 있습니다.',409); return Response.json(cleanJob(old)); }
      const list = await this.storage.list({prefix:'job:'}); check(list.size < 100,'보관 요청이 100개입니다. 완료한 요청을 정리해 주세요.',409);
      await putBlob(this.storage,`blob:${input.id}:input:${hash}`,raw,'application/json');
      await putBlob(this.storage,`blob:${input.id}:image:${hash}`,decodePng(input.image),'image/png');
      const job = { id:input.id, inputHash:hash, title:input.context.title, url:input.context.url, sourceHash:input.context.currentSourceHash ?? input.context.sourceHash,
        instruction:input.instruction, status:'queued', generation:1, createdAt:now, updatedAt:now, message:'PC 실행기를 기다리고 있습니다.' };
      await this.storage.transaction(async () => { const existing = await this.storage.get(`job:${input.id}`); check(!existing || existing.inputHash === hash,'동일 요청 충돌',409); if (!existing) await this.storage.put(`job:${input.id}`,job); });
      await this.storage.setAlarm(now + 24*60*60*1000);
      return Response.json(cleanJob(job),{status:201});
    }
    if (role === 'runner' && path === '/api/sketch/runner/claim' && request.method === 'POST') {
      await this.storage.put('runner-seen',now);
      const value = await this.storage.transaction(async () => {
        const jobs = [...(await this.storage.list({prefix:'job:'})).values()].sort((a,b) => a.createdAt-b.createdAt);
        // A live lease serializes work across accidentally duplicated runners.
        if (jobs.some(j => ['preparing','deploying'].includes(j.status) && j.lease?.expiresAt > now)) return null;
        const job = jobs.find(j => ['approved','deploying'].includes(j.status) || j.status === 'queued' || (j.status === 'preparing' && j.lease?.expiresAt <= now));
        if (!job) return null;
        const kind = ['approved','deploying'].includes(job.status) ? 'deploy' : 'prepare';
        if (kind === 'deploy' && job.status === 'approved' && job.approval.expiresAt <= now) {
          job.status='awaiting-approval'; delete job.approval; job.message='승인이 만료됐습니다. 결과를 다시 확인해 주세요.'; await this.storage.put(`job:${job.id}`,job); return null;
        }
        job.status = kind === 'deploy' ? 'deploying' : 'preparing';
        job.lease = { token:crypto.randomUUID(), expiresAt:now+leaseMs, kind };
        job.message = kind === 'deploy' ? '승인한 결과를 배포하고 있습니다.' : 'AI 수정안을 만들고 있습니다.';
        job.updatedAt=now; await this.storage.put(`job:${job.id}`,job); return job;
      });
      return Response.json({job:value});
    }
    const match = /^\/api\/sketch\/(runner\/)?jobs\/([a-f0-9-]{36})(?:\/(input|image|preview|review|approve|reject|revise|heartbeat|result|delete))?$/.exec(path);
    check(match && UUID.test(match[2]) && Boolean(match[1]) === (role === 'runner'),'요청을 찾을 수 없습니다.',404);
    const [, ,id, action=''] = match;
    const key = `job:${id}`;
    let job = await this.storage.get(key); check(job,'요청이 없습니다.',404);
    if (request.method === 'GET') {
      if (!action) return Response.json(cleanJob(job));
      check(['image','preview','review'].includes(action) || (role === 'runner' && action === 'input'),'지원하지 않는 자료입니다.',404);
      if (['preview','review'].includes(action)) check(job.review,'미리보기가 아직 없습니다.',404);
      const suffix = ['preview','review'].includes(action) ? `${action}:${job.review.id}` : `${action}:${job.inputHash}`;
      const blob = await getBlob(this.storage,`blob:${id}:${suffix}`); check(blob,'자료가 없습니다.',404);
      const headers = { 'Content-Type':blob.type, 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff' };
      if (action === 'preview') headers['Content-Security-Policy'] = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; font-src data: https://imjae.github.io; media-src https:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
      return new Response(blob.bytes,{headers});
    }
    check(request.method === 'POST','지원하지 않는 요청입니다.',405);
    const body = await readJson(request, action === 'result' ? 12_000_000 : 8000);
    if (role === 'owner') {
      if (action === 'approve') {
        check(job.status === 'awaiting-approval' && job.review && body.reviewId === job.review.id && body.digest === job.review.digest,'새 미리보기를 확인해 주세요.',409);
        const response = await fetch('https://api.github.com/repos/imjae/imjae.github.io/git/ref/heads/main',{headers:{'User-Agent':'SketchBrowser-owner-review',Accept:'application/vnd.github+json'},redirect:'manual'});
        check(response.ok,'현재 블로그 버전을 확인하지 못했습니다. 다시 시도해 주세요.',503);
        const current = await response.json(); check(current.object?.sha === job.review.baseCommit,'블로그 원본이 바뀌었습니다. 다시 수정을 요청해 주세요.',409);
        await this.storage.transaction(async () => {
          job = await this.storage.get(key);
          check(job.status === 'awaiting-approval' && job.review.id === body.reviewId && job.review.digest === body.digest,'검토 결과가 바뀌었습니다.',409);
          job.approval = {ownerId:request.headers.get('X-Internal-Owner'), reviewId:job.review.id, digest:job.review.digest, approvedAt:now, expiresAt:now+24*60*60*1000};
          job.status='approved'; job.updatedAt=now; job.message='승인됐습니다. PC가 연결되면 배포합니다.'; await this.storage.put(key,job);
        });
      } else if (action === 'reject') {
        await this.storage.transaction(async () => { job=await this.storage.get(key); check(!['deploying','deployed'].includes(job.status),'배포가 시작된 요청은 폐기할 수 없습니다.',409); job.status='rejected'; delete job.approval; delete job.lease; job.updatedAt=now; job.message='폐기한 요청입니다.'; await this.storage.put(key,job); });
      } else if (action === 'revise') {
        check(typeof body.instruction === 'string' && body.instruction.trim() && body.instruction.length <= 4000,'추가 요청을 4,000자 이내로 적어 주세요.');
        await this.storage.transaction(async () => {
          job=await this.storage.get(key); check(['awaiting-approval','approved','needs-clarification','failed'].includes(job.status),'현재 상태에서는 다시 수정할 수 없습니다.',409);
          job.instruction=body.instruction; job.generation++; job.status='queued'; job.updatedAt=now; job.message='추가 요청으로 다시 수정합니다.'; delete job.approval; delete job.review; delete job.lease; await this.storage.put(key,job);
        });
      } else if (action === 'delete') {
        check(TERMINAL.includes(job.status),'완료하거나 폐기한 요청만 삭제할 수 있습니다.',409);
        await this.removeJob(id); return Response.json({deleted:true});
      } else check(false,'허용되지 않은 작업입니다.',403);
      return Response.json(cleanJob(job));
    }
    check(['heartbeat','result'].includes(action),'실행기에게 허용되지 않은 작업입니다.',403);
    const validLease = current => current?.lease?.token === body.lease && current.lease.expiresAt > Date.now() && ['preparing','deploying'].includes(current.status);
    check(validLease(job),'작업 임대가 만료됐습니다.',409);
    if (action === 'heartbeat') {
      await this.storage.transaction(async () => { job=await this.storage.get(key); check(validLease(job),'작업 임대가 만료됐습니다.',409); job.lease.expiresAt=now+leaseMs; if (typeof body.message === 'string') job.message=body.message.slice(0,300); job.updatedAt=now; await this.storage.put(key,job); });
      await this.storage.put('runner-seen',now); return Response.json({ok:true});
    }
    let ready;
    if (body.kind === 'ready') {
      check(job.status === 'preparing' && body.review?.generation === job.generation,'이전 수정 결과입니다.',409);
      const r=body.review;
      check(COMMIT.test(r.baseCommit) && COMMIT.test(r.headCommit) && r.baseCommit !== r.headCommit && SHA.test(r.sourceHash) && r.sourceHash === job.sourceHash && SHA.test(r.afterHash),'원본과 수정 버전을 확인해 주세요.');
      check(typeof body.preview === 'string' && body.preview.length <= 3_000_000 && typeof r.diff === 'string' && r.diff.length <= 600000 && r.diff.length && typeof r.summary === 'string' && r.summary.length <= 12000,'미리보기 정보를 확인해 주세요.');
      check(r.checks?.verify === true && r.checks?.authoring === true && r.checks?.browser === true,'사이트 검사를 완료해야 합니다.');
      ready = {...r,id:crypto.randomUUID(),createdAt:now};
      const preview = await putBlob(this.storage,`blob:${id}:preview:${ready.id}`,body.preview,'text/html; charset=utf-8');
      ready.previewSha256=preview.sha256; ready.diffSha256=await digest(r.diff);
      ready.digest=await digest(JSON.stringify(ready));
      await putBlob(this.storage,`blob:${id}:review:${ready.id}`,JSON.stringify(ready),'application/json');
    }
    await this.storage.transaction(async () => {
      job=await this.storage.get(key); check(validLease(job),'작업 임대가 만료됐습니다.',409);
      if (ready) { check(job.generation === ready.generation,'이전 수정 결과입니다.',409); job.status='awaiting-approval'; job.review={id:ready.id,digest:ready.digest,baseCommit:ready.baseCommit,headCommit:ready.headCommit,previewSha256:ready.previewSha256,diffSha256:ready.diffSha256}; job.message='미리보기와 변경 내용을 확인해 주세요.'; }
      else if (body.kind === 'deployed') {
        check(job.status === 'deploying' && body.headCommit === job.review.headCommit && body.pages === true && body.authoring === true && body.live === true,'승인한 배포 결과가 아닙니다.',409);
        job.status='deployed'; job.message='공개 블로그와 편집 서버에 반영됐습니다.'; job.deployment=body.deployment;
      } else {
        const allowed=job.status === 'preparing' ? ['failed','needs-clarification','needs-recapture'] : ['deployment-failed'];
        check(allowed.includes(body.kind),'결과 상태를 확인해 주세요.'); job.status=body.kind;
        job.message=typeof body.message === 'string' ? body.message.slice(0,3000) : '처리 중 오류가 발생했습니다.';
      }
      delete job.lease; job.updatedAt=now; await this.storage.put(key,job);
    });
    return Response.json(cleanJob(job));
  }
  async removeJob(id) {
    const values = await this.storage.list({prefix:`blob:${id}:`});
    const keys=[...values.keys()]; for(let i=0;i<keys.length;i+=100) await this.storage.delete(keys.slice(i,i+100));
    await this.storage.delete(`job:${id}`);
  }
  async alarm() {
    for (const job of (await this.storage.list({prefix:'job:'})).values()) if (TERMINAL.includes(job.status) && job.updatedAt < Date.now()-30*24*60*60*1000) await this.removeJob(job.id);
    if ((await this.storage.list({prefix:'job:',limit:1})).size) await this.storage.setAlarm(Date.now()+24*60*60*1000);
  }
}
