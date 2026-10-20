import { normalizeVideoUrl } from './project-video.mjs';

const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const privateEmbedHosts = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com']);
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

function isPrivateIpv4(host) {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const [first, second] = host.split('.').map(Number);
  return first === 0 || first === 10 || first === 127 || first >= 224
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 100 && second >= 64 && second <= 127);
}

function isLocalHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || /\.(localhost|local|internal)$/.test(host)) return true;
  if (isPrivateIpv4(host)) return true;
  if (!host.startsWith('[')) return !host.includes('.');

  const address = host.slice(1, -1);
  if (address === '::' || address === '::1' || /^(fc|fd|fe[89ab])/i.test(address)) return true;
  const mappedIpv4 = /^::ffff:([\da-f]{1,4}):([\da-f]{1,4})$/i.exec(address);
  if (!mappedIpv4) return false;
  const high = parseInt(mappedIpv4[1], 16);
  const low = parseInt(mappedIpv4[2], 16);
  return isPrivateIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
}

function readYoutubeId(url) {
  if (url.hostname === 'youtu.be') return /^\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
  if (privateEmbedHosts.has(url.hostname)) return /^\/embed\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
  if (/^\/watch\/?$/.test(url.pathname)) {
    const ids = url.searchParams.getAll('v');
    return ids.length === 1 && videoIdPattern.test(ids[0]) ? ids[0] : undefined;
  }
  return /^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
}

/**
 * @param {{ videoUrl: string } | undefined} savedVideo
 * @param {{ url: string, title: string, caption: string, startSeconds?: number, endSeconds?: number } | undefined} media
 * @param {{ title: string, caption: string }} defaults
 */
export function selectProjectPortfolioMedia(savedVideo, media, defaults) {
  if (!savedVideo) return media;
  if (!savedVideo.videoUrl) return undefined;
  const details = media?.url.trim() === savedVideo.videoUrl ? media : defaults;
  return { ...details, url: savedVideo.videoUrl };
}

/**
 * @param {{ url?: unknown, title?: unknown, caption?: unknown, startSeconds?: unknown, endSeconds?: unknown } | null | undefined} media
 * @returns {{ url: string, title: string, caption: string, embedUrl?: string, videoSrc?: string, gifSrc?: string } | undefined}
 */
export function resolvePortfolioMedia(media) {
  if (!media || typeof media.url !== 'string' || typeof media.title !== 'string' || typeof media.caption !== 'string') return undefined;
  const text = media.url.trim();
  const title = media.title.trim();
  const caption = media.caption.trim();
  if (!text || text.length > 2048 || !title || !caption) return undefined;

  let normalized;
  let url;
  try {
    normalized = normalizeVideoUrl(text);
    url = new URL(normalized, 'https://imjae.github.io');
  }
  catch { return undefined; }
  if (isLocalHost(url.hostname)) return undefined;

  const result = { url: normalized, title, caption };
  const isYoutube = youtubeHosts.has(url.hostname) || privateEmbedHosts.has(url.hostname) || url.hostname === 'youtu.be';
  if (!isYoutube) {
    if (/\.gif$/i.test(url.pathname)) return { ...result, gifSrc: normalized };
    return /\.(?:mp4|webm)$/i.test(url.pathname) ? { ...result, videoSrc: normalized } : result;
  }
  const id = readYoutubeId(url);
  if (!id || url.port) return undefined;

  const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  embed.searchParams.set('rel', '0');
  embed.searchParams.set('playsinline', '1');
  const start = typeof media.startSeconds === 'number' && Number.isSafeInteger(media.startSeconds) && media.startSeconds >= 0
    ? media.startSeconds : undefined;
  const end = typeof media.endSeconds === 'number' && Number.isSafeInteger(media.endSeconds) && media.endSeconds > (start ?? 0)
    ? media.endSeconds : undefined;
  if (start !== undefined) embed.searchParams.set('start', String(start));
  if (end !== undefined) embed.searchParams.set('end', String(end));
  return { ...result, embedUrl: embed.href };
}
