import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['入门', '操作', '机型', '进阶', '还原', '排查']),
    order: z.number().default(99),
    updated: z.preprocess(
      (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
      z.string(),
    ),
    readingTime: z.number().default(5),
    keywords: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { guides };
