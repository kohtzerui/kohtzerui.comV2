import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()),
    chapter: z.string().optional(),
    readTime: z.string().optional(),
    summary: z.string(),
    draft: z.boolean().default(false),
    references: z.array(z.object({
      type: z.enum(['V', 'B', 'P']),
      title: z.string(),
      url: z.string().url(),
    })).default([]),
  }),
});

export const collections = { blog };