export const privateAuthoring = process.env.AUTHORING_MODE === 'private';
export const authoringConfigured = Boolean(process.env.PUBLIC_AUTHORING_ORIGIN);

export function authorLoginUrl(path = '/') {
  const configured = process.env.PUBLIC_AUTHORING_ORIGIN;
  if (!configured) return '/login/';
  const origin = new URL(configured);
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('PUBLIC_AUTHORING_ORIGIN에는 HTTPS 인증 서버의 origin만 지정합니다.');
  const url = new URL('/auth/login', origin);
  url.searchParams.set('return_to', path);
  return url.href;
}
