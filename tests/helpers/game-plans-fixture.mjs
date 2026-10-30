import { OwnerPosts } from '../../server/owner-posts.mjs';
import { handleAuthorRequest } from '../../server/author-auth.mjs';

class Storage {
  data = new Map(); queue = Promise.resolve();
  async get(key) { return structuredClone(this.data.get(key)); }
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) { this.data.delete(key); }
  async list({ prefix = '' } = {}) { return new Map([...this.data].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key, structuredClone(value)])); }
  transaction(fn) { const result = this.queue.then(fn); this.queue = result.catch(() => {}); return result; }
}

export function gamePlansFixture() {
  const stores = new Map(); let assetCalls = 0;
  const env = {
    GITHUB_CLIENT_ID: 'fixture-client', GITHUB_CLIENT_SECRET: 'fixture-secret', ALLOWED_GITHUB_ID: '37284282',
    AUTHOR_SESSIONS: { idFromName: name => name, get: () => ({ fetch: async (_url, init) => {
      const { key } = JSON.parse(init.body);
      return Response.json(key === 'session:' + 'a'.repeat(43) ? { id: '37284282', login: 'fixture-owner', expiresAt: Date.now() + 100000 } : key === 'session:' + 'b'.repeat(43) ? { id: '123', expiresAt: Date.now() + 100000 } : key === 'session:' + 'c'.repeat(43) ? { id: '37284282', expiresAt: 1 } : null);
    } }) },
    OWNER_POSTS: { idFromName: name => name, get: name => {
      if (!stores.has(name)) stores.set(name, new Storage());
      // Reconstruct the object for every request to exercise persisted state.
      return { fetch: request => new OwnerPosts({ storage: stores.get(name) }).fetch(request) };
    } },
    ASSETS: { fetch: async () => { assetCalls++; return new Response('protected assets'); } },
  };
  const call = (path, { body, owner = true, method = body === undefined ? 'GET' : 'POST', origin = 'https://author.test', headers = {} } = {}) => handleAuthorRequest(new Request('https://author.test' + path, {
    method, headers: { ...(owner ? { Cookie: '__Host-imjae_author=' + (owner === 'other' ? 'b' : owner === 'expired' ? 'c' : 'a').repeat(43) } : {}), Origin: origin, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
  return { call, env, stores, assetCalls: () => assetCalls };
}
