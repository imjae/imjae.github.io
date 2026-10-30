import { escapeHtml as escape, renderPostBody } from './owner-posts.mjs';
import { findProjectDocument } from '../src/data/projects.mjs';
import { renderProjectNavigation, projectNavigationStyles } from '../src/lib/project-navigation.mjs';
import { postStyles } from './owner-post-style.mjs';
import { projectDocumentStyles } from './project-document-style.mjs';
import { projectDocumentClientSource } from './project-document-client.mjs';

const documentUrl = (path, id, editing = false) => path + (id && id !== 'main' ? '?doc=' + encodeURIComponent(id) + (editing ? '&edit=1' : '') : editing ? '?edit=1' : '');
function treeMarkup(documents, selected, path) {
  const root = { folders: new Map(), documents: [] };
  for (const document of documents) {
    let node = root;
    for (const name of document.folder.split('/').filter(Boolean)) {
      if (!node.folders.has(name)) node.folders.set(name, { folders: new Map(), documents: [] });
      node = node.folders.get(name);
    }
    node.documents.push(document);
  }
  const contains = node => node.documents.some(document => document.id === selected.id) || [...node.folders.values()].some(contains);
  const count = node => node.documents.length + [...node.folders.values()].reduce((sum, child) => sum + count(child), 0);
  const render = node => node.documents.map(document => `<a class="document-link" href="${escape(documentUrl(path, document.id))}#document" data-document-search="${escape((document.title + ' ' + document.folder).toLocaleLowerCase())}"${document.id === selected.id ? ' aria-current="page"' : ''}>${escape(document.title)}</a>`).join('') + [...node.folders].map(([name, child]) => `<details class="folder"${contains(child) ? ' open' : ''}><summary>${escape(name)}<small>${count(child)}</small></summary><div class="folder-children">${render(child)}</div></details>`).join('');
  return `<aside class="plans-sidebar"><label class="document-search" for="document-search"><span>기획서 찾기</span><input id="document-search" type="search" placeholder="제목·폴더로 검색" autocomplete="off"></label><p id="search-result" role="status" aria-live="polite"></p><details id="document-tree" open><summary>기획서 목록 · ${documents.length}편</summary><nav aria-label="기획서 폴더와 문서">${render(root)}</nav><p id="empty-search" class="empty-plan"${documents.length ? ' hidden' : ''}>표시할 기획서가 없습니다.</p></details></aside>`;
}
function imageMarkup(document, thumbnail = false) {
  const placeholder = `<span class="image-placeholder" data-image-fallback${document.imageUrl ? ' hidden' : ''}>${thumbnail ? '이미지 없음' : '대표 이미지가 없습니다.'}</span>`;
  return document.imageUrl ? `<img data-resource-image src="${escape(document.imageUrl)}" alt="${thumbnail ? '' : escape(document.caption || document.title)}"${thumbnail ? ' loading="lazy"' : ''} referrerpolicy="no-referrer">${placeholder}` : placeholder;
}
function resourceNavigation(documents, selected, path, requestedPage) {
  const size = 12, selectedIndex = documents.findIndex(document => document.id === selected.id);
  const page = Math.max(0, Math.min(Number.isSafeInteger(requestedPage) ? requestedPage : Math.floor(Math.max(0, selectedIndex) / size), Math.max(0, Math.ceil(documents.length / size) - 1)));
  const pageUrl = index => documentUrl(path, selected.id) + (selected.id !== 'main' ? '&' : '?') + 'page=' + index;
  const navigation = documents.length > size ? `<div class="resource-links">${page > 0 ? `<a href="${escape(pageUrl(page - 1))}">← 이전</a>` : '<span></span>'}<span>${page + 1} / ${Math.ceil(documents.length / size)}</span>${(page + 1) * size < documents.length ? `<a href="${escape(pageUrl(page + 1))}">다음 →</a>` : '<span></span>'}</div>` : '';
  return `<nav class="resource-thumbnails" aria-label="리소스 목록"><p>${documents.length}편</p>${documents.slice(page * size, (page + 1) * size).map(document => `<a class="resource-choice" href="${escape(documentUrl(path, document.id))}#document"${document.id === selected.id ? ' aria-current="page"' : ''}><span>${imageMarkup(document, true)}</span><span>${escape(document.title)}</span></a>`).join('')}${navigation}</nav>`;
}
function editorMarkup(game, section, document, path, saved) {
  const view = documentUrl(path, document.id);
  return `<form id="plan-form" data-endpoint="/api/project-documents/${game.id}/${section.id}/items/${escape(document.id)}" data-version="${document.version}" data-view-url="${escape(view)}"><label for="document-title">제목<input id="document-title" name="title" value="${escape(document.title)}" maxlength="110" required></label>${section.id === 'plans' ? `<label for="document-folder">폴더<input id="document-folder" name="folder" value="${escape(document.folder)}" maxlength="300" placeholder="예: 게임플레이/전투"><small>/로 하위 폴더를 나눕니다. 비워 두면 목록 맨 위에 표시합니다.</small></label>` : `<label for="document-image">대표 이미지 주소<input id="document-image" name="imageUrl" value="${escape(document.imageUrl)}" maxlength="2000" placeholder="https://… 또는 /media/…"><small>이미지 파일 주소를 연결합니다.</small></label><label for="document-caption">이미지 설명<input id="document-caption" name="caption" value="${escape(document.caption)}" maxlength="280"></label>`}<label for="plan-body">본문 <small>Markdown</small><textarea id="plan-body" name="body" class="body-input" spellcheck="false">${escape(document.body)}</textarea></label><div class="plan-actions"><button type="submit">저장</button><a data-document-view href="${escape(view)}">본문 보기</a><span id="save-status" role="status" aria-live="polite">${saved ? '저장했습니다.' : ''}</span></div></form>`;
}
export async function gamePlanPage(game, document, editing = false, section = findProjectDocument('plans'), documents = [], options = {}) {
  const nonce = crypto.randomUUID(), path = `/projects/${game.id}/${section.id}/`;
  const view = options.creating ? path : documentUrl(path, document.id), edit = options.creating ? path + '?new=1&edit=1' : documentUrl(path, document.id, true);
  const resource = section.id === 'resources';
  const title = `<header class="document-title">${document.folder ? `<p>${escape(document.folder.split('/').join(' / '))}</p>` : ''}<h2>${escape(document.title || (resource ? '새 리소스' : '새 기획서'))}</h2>${document.updatedAt ? `<time datetime="${escape(document.updatedAt)}">${escape(document.updatedAt.slice(0, 10))} 수정</time>` : ''}</header>`;
  const cover = resource ? `<figure class="resource-cover">${imageMarkup(document)}${document.caption ? `<figcaption>${escape(document.caption)}</figcaption>` : ''}${document.imageUrl ? `<a class="resource-original" href="${escape(document.imageUrl)}" target="_blank" rel="noopener noreferrer">원본 이미지 보기 ↗</a>` : ''}</figure>` : '';
  const body = !editing && documents.length ? `<article class="prose${resource ? ' resource-body' : ''}">${document.body.trim() ? await renderPostBody(document.body) : '<p class="empty-plan">아직 본문을 작성하지 않았습니다.</p>'}</article>` : '';
  const article = documents.length ? (resource ? cover + title : title + body) : `<p class="empty-plan">아직 ${resource ? '등록한 리소스' : '작성한 기획서'}가 없습니다.</p><a href="${path}?new=1&edit=1">${resource ? '리소스' : '기획서'} 추가 →</a>`;
  const content = `<div class="document-content" id="document">${editing ? editorMarkup(game, section, document, path, options.saved) : article}</div>`;
  const layout = resource ? `<div class="resource-layout">${content}${resourceNavigation(documents, document, path, options.page)}${body}</div>` : `<div class="plans-layout">${treeMarkup(documents, document, path)}${content}</div>`;
  const script = projectDocumentClientSource;
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(game.title)} · ${escape(section.title)} — imjae</title><style>${postStyles}\n${projectNavigationStyles}\n${projectDocumentStyles}</style></head><body><header class="top"><a href="https://imjae.github.io/">imjae.</a><nav aria-label="Main navigation"><a href="https://imjae.github.io/writing/">Writing</a><a href="https://imjae.github.io/portfolio/">Portfolio</a><a href="/projects/" aria-current="location">Projects</a><a href="https://imjae.github.io/about/">About</a><form action="/auth/logout" method="post"><button>Sign out</button></form></nav></header><main class="reader project-reader" id="document-shell">${renderProjectNavigation(game, section.id)}<header class="document-heading"><div><h1>${escape(section.title)}</h1><p class="private-label">비공개 · 나만 보기</p></div><nav class="document-modes" aria-label="문서 모드"><a data-document-view href="${escape(view)}"${editing ? '' : ' aria-current="page"'}>View</a><a href="${escape(edit)}"${editing ? ' aria-current="page"' : ''}>Edit</a><a class="document-create" href="${path}?new=1&edit=1">+ ${resource ? '리소스' : '기획서'} 추가</a></nav></header>${layout}</main><script nonce="${nonce}">${script}</script></body></html>`;
  return new Response(html, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' https: data:; font-src data:; media-src https:; frame-src https://www.youtube-nocookie.com https://www.youtube.com; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
  } });
}
