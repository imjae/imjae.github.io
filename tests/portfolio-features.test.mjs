import test from 'node:test';
import assert from 'node:assert/strict';
import { featureUrl, selectFeatureArticles, groupFeatureArticles } from '../src/lib/portfolio-features.mjs';

const article = (slug, data = {}) => ({ data: { slug, project: 'dcb', draft: false, ...data } });

test('기능 제목과 주소를 글 제목과 분리하고 지정한 읽기 순서로 여러 글을 묶는다', () => {
  const feature = { slug: 'equipment-system', title: '장비 조합', overviewSlug: 'usage', articleSlugs: ['assembly', 'usage', 'effects'] };
  const articles = [article('effects'), article('assembly'), article('usage')];
  assert.equal(featureUrl(feature), '/portfolio/dcb/features/equipment-system/');
  assert.deepEqual(selectFeatureArticles(feature, articles).map(a => a.data.slug), ['usage', 'assembly', 'effects']);
  assert.deepEqual(articles.map(a => a.data.slug), ['effects', 'assembly', 'usage']);
  const groups = groupFeatureArticles(feature, articles);
  assert.equal(groups.overview.data.slug, 'usage');
  assert.deepEqual(groups.analyses.map(a => a.data.slug), ['assembly', 'effects']);
  assert.throws(() => featureUrl({ slug: '../outside' }));
});

test('기능 설명이 초안이거나 없어도 분석 글은 유지하고 로컬에서만 초안 설명을 보여 준다', () => {
  const feature = { overviewSlug: 'usage', articleSlugs: ['usage', 'analysis', 'missing'] };
  const articles = [article('usage', { draft: true }), article('analysis')];
  const production = groupFeatureArticles(feature, articles);
  assert.equal(production.overview, undefined);
  assert.deepEqual(production.analyses.map(a => a.data.slug), ['analysis']);
  const local = groupFeatureArticles(feature, articles, true);
  assert.equal(local.overview.data.slug, 'usage');
  assert.deepEqual(local.analyses.map(a => a.data.slug), ['analysis']);
  assert.equal(groupFeatureArticles(feature, []).overview, undefined);
});

test('초안·삭제된 글·미지정 글·중복을 제외하고 로컬 초안은 명시한 경우에만 보여 준다', () => {
  const feature = { articleSlugs: ['missing', 'draft', 'public', 'public'] };
  const articles = [article('draft', { draft: true }), article('other', { project: 'imjaess' }), article('public')];
  assert.deepEqual(selectFeatureArticles(feature, articles).map(a => a.data.slug), ['public']);
  assert.deepEqual(selectFeatureArticles(feature, articles, true).map(a => a.data.slug), ['draft', 'public']);
  assert.deepEqual(selectFeatureArticles({ articleSlugs: ['other'] }, articles).map(a => a.data.slug), ['other']);
  assert.deepEqual(selectFeatureArticles(feature, []), []);
});
