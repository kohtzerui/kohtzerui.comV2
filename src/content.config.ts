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

const reflections = defineCollection({
  loader: glob({ base: './src/content/reflections', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const sideProjects = defineCollection({
  loader: glob({ base: './src/content/side-projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    year: z.number(),
    publishedAt: z.coerce.date().optional(),
    status: z.enum(['Idea', 'In progress', 'Shipped', 'Archived']),
    format: z.enum(['prose', 'cornell']).default('prose'),
    tags: z.array(z.string()).default([]),
    url: z.string().url().optional(),
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const portfolio = defineCollection({
  loader: glob({ base: './src/content/portfolio', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    status: z.enum(['In progress', 'Shipped', 'Archived']),
    tags: z.array(z.string()).default([]),
    cover: z.string(),
    externalUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    stage: z.enum(['Question', 'Reading trail', 'Experiment', 'Published']),
    tags: z.array(z.string()).default([]),
    cover: z.string(),
    externalUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, reflections, sideProjects, portfolio, research };
