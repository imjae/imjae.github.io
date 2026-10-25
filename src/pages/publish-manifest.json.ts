import type { APIRoute } from 'astro';
import { publishManifest } from '../lib/publish-manifest.server.mjs';
export const GET: APIRoute = async () => {
  const { version, revision, files } = await publishManifest();
  return Response.json({ version, revision, files }, { headers: { 'Cache-Control': 'no-cache' } });
};
