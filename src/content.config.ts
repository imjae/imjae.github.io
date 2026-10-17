import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/articles' }),
  schema: z.object({
    title: z.string().min(1).max(110),
    description: z.string().min(1).max(220),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    topic: z.enum(['gameplay', 'graphics', 'tools', 'ai', 'notes']),
    kind: z.enum(['case-study', 'devlog', 'note', 'reading']).default('note'),
    tags: z.array(z.string()).default([]),
    project: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    series: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    order: z.number().int().positive().optional(),
    draft: z.boolean().default(true),
    legacy: z.boolean().default(false),
  }),
});

export const collections = { articles };
