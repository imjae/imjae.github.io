import type { APIRoute } from 'astro';
import { publishManifest } from '../lib/publish-manifest.server.mjs';
export const GET: APIRoute = async () => {
  return Response.json(await publishManifest(), { headers: { 'Cache-Control': 'no-cache' } });
};
