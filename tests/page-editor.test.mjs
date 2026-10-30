import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { pageEditorContext, pageEditorArticles, pageModeUrl } from '../src/lib/page-editor.mjs';
import { dcbFeatures } from '../src/data/dcb-features.mjs';
import { dcbVideos } from '../src/data/dcb-videos.mjs';
import { studyCourses } from '../src/data/study-courses.mjs';
import { postEditorPage, postPage } from '../server/owner-post-ui.mjs';

test('each list and project page edits its own source, without a general-manager fallback', async () => {
  const cases = [
    ['/', 'src/data/home-covers.ts'], ['/writing/', 'src/pages/writing/index.astro'],
    ['/portfolio/', 'src/pages/portfolio/index.astro'], ['/games/', 'src/data/games.mjs'],
    ['/projects/dcb/', 'src/pages/projects/dcb.astro'],
    ...['gameplay', 'graphics', 'tools', 'ai', 'notes', 'math', 'reading', 'study'].map(id => [`/topics/${id}/`, 'src/data/site.ts']),
    ...studyCourses.map(course => [`/series/${course.id}/`, 'src/data/study-courses.mjs']),
    ['/series/dcb/', 'src/data/site.ts'],
    ...dcbFeatures.map(feature => [`/projects/dcb/features/${feature.slug}/`, 'src/data/dcb-features.mjs']),
  ];
  for (const [path, expected] of cases) {
    const context = pageEditorContext(path);
    assert.ok(context.sources.some(source => source.path === expected), path);
    for (const source of context.sources) {
      const url = new URL(source.href);
      assert.equal(url.hostname, 'github.com');
      assert.ok(decodeURIComponent(url.pathname).endsWith('/' + source.path));
      assert.ok(await stat(source.path));
    }
  }
  for (const path of ['/404/', '/login/', '/unknown/', '/about/', '/games/dcb/', '/writing/ik-traversal/']) assert.equal(pageEditorContext(path), null);
});

test('feature editing includes only that feature videos and published articles', () => {
  const articles = [{ data: { slug: 'one', topic: 'graphics', series: 'dcb' } }, { data: { slug: 'two', topic: 'gameplay' } }, { data: { slug: 'draft', topic: 'graphics', draft: true } }];
  assert.deepEqual(pageEditorArticles(articles, { topic: 'graphics' }), [articles[0]]);
  assert.deepEqual(pageEditorArticles(articles, { series: 'dcb' }), [articles[0]]);
  assert.deepEqual(pageEditorArticles(articles, { slugs: ['two', 'draft'] }), [articles[1]]);
  assert.deepEqual(pageEditorArticles(articles, {}), articles.slice(0, 2));
  assert.deepEqual(pageEditorArticles(articles), []);
  for (const feature of dcbFeatures) {
    const context = pageEditorContext(`/projects/dcb/features/${feature.slug}/`);
    assert.deepEqual(context.articles.slugs, [feature.overviewSlug, ...feature.articleSlugs].filter(Boolean));
    assert.deepEqual(context.videoSlots, dcbVideos.filter(video => video.featureSlugs.includes(feature.slug)).map(video => video.slot));
  }
});

test('Edit and View retain the page, filters and fragment', () => {
  const href = 'https://example.com/topics/graphics/?q=water&tag=Unity#result';
  const editing = pageModeUrl(href, true);
  assert.equal(editing, '/topics/graphics/?q=water&tag=Unity&edit=1#result');
  assert.equal(pageModeUrl(new URL(editing, href).href, false), '/topics/graphics/?q=water&tag=Unity#result');
  assert.equal(pageModeUrl('https://example.com/?edit=1', true), '/?edit=1');
});

test('server post Edit preserves the selected document, including inside its editor', async () => {
  const editor = await postEditorPage().text();
  assert.match(editor.match(/<header[\s\S]*?<\/header>/)[0], /href="#form">Edit/);
  const reader = await (await postPage({ title: 'Test', slug: 'current-note', visibility: 'private', description: '', date: '2026-10-30', topic: 'notes', body: 'Test' })).text();
  assert.match(reader.match(/<header[\s\S]*?<\/header>/)[0], /href="\/notes\/edit\/\?post=current-note">Edit/);
});
