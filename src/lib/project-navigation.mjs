import { projectLinks } from '../data/projects.mjs';

const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const lock = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.2" aria-label="비공개" role="img"><rect x="3.5" y="7" width="9" height="7" rx="1.5"/><path d="M5.5 7V4a2.5 2.5 0 0 1 5 0v3"/></svg>';

// Static pages and owner-only document pages use the same navigation.
export function renderProjectNavigation(project, selected = 'intro', current = 'page') {
  const links = projectLinks(project).map(link => `<a href="${escape(link.href)}"${link.id === selected ? ` aria-current="${current === 'location' ? 'location' : 'page'}"` : ''}><span>${escape(link.title)}</span>${link.private ? lock : ''}</a>`).join('');
  return `<div class="project-navigation"><a class="project-back" href="/projects/">← Projects</a><div class="project-context"><a class="project-name" href="/projects/${escape(project.id)}/">${escape(project.title)}</a>${project.status ? `<span class="project-status">${escape(project.status)}</span>` : ''}</div><nav class="project-nav" aria-label="${escape(project.title)} 프로젝트">${links}</nav></div>`;
}

export const projectNavigationStyles = `
  .project-navigation { margin: 0 0 36px; }
  .project-context { display: flex; align-items: baseline; gap: 18px; min-width: 0; margin: 8px 0 22px; }
  .project-navigation a { text-decoration: none; }
  .project-navigation .project-back { display: inline-flex; align-items: center; min-height: 44px; flex-shrink: 0; font-size: 12px; color: var(--muted); }
  .project-navigation .project-name { color: var(--ink); font-size: 38px; font-weight: 650; line-height: 1.3; letter-spacing: -.04em; word-break: keep-all; }
  .project-status { font-size: 12px; color: var(--muted); }
  .project-nav { display: flex; align-items: center; gap: 30px; border-bottom: 1px solid var(--line); }
  .project-nav a { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 46px; padding: 0 2px; margin-bottom: -1px; border-bottom: 2px solid transparent; color: #63716a; font-size: 13px; line-height: 1.4; white-space: nowrap; }
  .project-nav a:hover { color: var(--green); }
  .project-nav a[aria-current] { color: var(--green); border-bottom-color: var(--green); font-weight: 650; }
  .project-nav svg { flex-shrink: 0; opacity: .8; }
  .project-navigation a:focus-visible { outline: 2px solid var(--green); outline-offset: 3px; }
  .project-navigation .project-back:hover, .project-navigation .project-name:hover { color: var(--green); text-decoration: underline; text-underline-offset: 4px; }
  @media (max-width: 760px) {
    .project-navigation { margin-bottom: 28px; }
    .project-context { gap: 16px; }
    .project-nav { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 2px; }
    .project-nav a { min-height: 44px; padding: 0 5px; gap: 4px; font-size: 12px; }
    .project-navigation .project-name { font-size: 32px; }
  }
`;
