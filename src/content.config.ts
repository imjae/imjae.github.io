import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isCalendarDate } from './lib/reading-record.mjs';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/articles' }),
  schema: z.object({
    title: z.string().min(1).max(110),
    description: z.string().min(1).max(220),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateBasis: z.enum(['authored', 'notion', 'commit', 'legacy']).default('authored'),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    topic: z.enum(['gameplay', 'graphics', 'tools', 'ai', 'notes', 'math', 'reading']),
    kind: z.enum(['case-study', 'devlog', 'note', 'reading']).default('note'),
    book: z.object({
      title: z.string().trim().min(1).max(160),
      author: z.string().trim().min(1).max(120).optional(),
      finished: z.string().refine(isCalendarDate, '다 읽은 날짜는 YYYY-MM-DD 형식의 실제 날짜여야 합니다.').optional(),
      note: z.string().trim().min(1).max(280).optional(),
    }).optional(),
    tags: z.array(z.string()).default([]),
    project: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    series: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    order: z.number().int().positive().optional(),
    pinned: z.boolean().default(false),
    pinOrder: z.number().int().positive().optional(),
    draft: z.boolean().default(true),
    legacy: z.boolean().default(false),
  }).superRefine((data, context) => {
    if (data.topic === 'reading' && !data.book) {
      context.addIssue({ code: 'custom', path: ['book'], message: 'Reading 기록에는 book.title이 필요합니다.' });
    }
    if (data.topic === 'reading' && data.kind !== 'reading') {
      context.addIssue({ code: 'custom', path: ['kind'], message: 'Reading 기록의 kind는 reading이어야 합니다.' });
    }
  }),
});

export const collections = { articles };
