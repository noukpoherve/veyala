import { z } from "zod";

/**
 * Schéma du CV structuré — la « source de vérité » stockée dans BaseProfile.data
 * et le format échangé avec le LLM (import comme adaptation).
 */

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

export const experienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().default(""),
  place: z.string().default(""),
  dates: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  stack: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  degree: z.string().min(1),
  school: z.string().default(""),
  place: z.string().default(""),
  dates: z.string().default(""),
  details: z.string().default(""),
});

export const skillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string()).default([]),
});

export const languageSchema = z.object({
  name: z.string().min(1),
  level: z.string().default(""),
});

export const cvSchema = z.object({
  identity: z.object({
    fullName: z.string().min(1),
    headline: z.string().default(""),
    photoUrl: z.string().default(""),
  }),
  contact: z.object({
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    links: z.array(linkSchema).default([]),
  }),
  summary: z.string().default(""),
  experiences: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  languages: z.array(languageSchema).default([]),
  interests: z.array(z.string()).default([]),
});

export type CVData = z.infer<typeof cvSchema>;
export type CVExperience = z.infer<typeof experienceSchema>;
export type CVEducation = z.infer<typeof educationSchema>;
export type CVSkillGroup = z.infer<typeof skillGroupSchema>;

/** Valide des données LLM/formulaire ; lève une ZodError descriptive sinon. */
export function parseCV(data: unknown): CVData {
  return cvSchema.parse(data);
}

/** Version texte du schéma, injectée dans les prompts pour cadrer la sortie JSON. */
export const CV_JSON_SHAPE = `{
  "identity": { "fullName": string, "headline": string, "photoUrl": string },
  "contact": {
    "email": string, "phone": string, "location": string,
    "links": [{ "label": string, "url": string }]
  },
  "summary": string,
  "experiences": [{
    "title": string, "company": string, "place": string, "dates": string,
    "bullets": [string], "stack": [string]
  }],
  "education": [{ "degree": string, "school": string, "place": string, "dates": string, "details": string }],
  "skills": [{ "category": string, "items": [string] }],
  "languages": [{ "name": string, "level": string }],
  "interests": [string]
}`;
