import { z } from "zod";

export const blogCategorySchema = z.enum(["cv", "ats", "lettre", "emploi", "etudes", "ia"]);

export const blogFaqSchema = z.object({
  question: z.string().trim().min(8).max(200),
  answer: z.string().trim().min(20).max(800),
});

export const blogPostInputSchema = z.object({
  title: z.string().trim().min(10).max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide"),
  description: z.string().trim().min(50).max(220),
  excerpt: z.string().trim().min(40).max(280),
  category: blogCategorySchema,
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  keywords: z.array(z.string().trim().min(1).max(60)).max(20),
  focusKeyword: z.string().trim().max(80).optional().nullable(),
  featured: z.boolean(),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hex invalide")
    .default("#2563EB"),
  authorName: z.string().trim().min(2).max(80).default("Équipe Veyala"),
  authorRole: z.string().trim().min(2).max(120).default("Experts CV, ATS & candidature"),
  bodyMarkdown: z.string().trim().min(80),
  faq: z.array(blogFaqSchema).max(8).default([]),
});

export type BlogPostInput = z.infer<typeof blogPostInputSchema>;
