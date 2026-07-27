import { z } from "zod";

/**
 * Structured CV schema — the "source of truth" stored in BaseProfile.data
 * and the format exchanged with the LLM (both import and tailoring).
 */

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

/** Free-form info without a URL, e.g. "Permis" → "B", "Nationalité" → "…". */
export const detailSchema = z.object({
  label: z.string().min(1),
  value: z.string().default(""),
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
    photoUrl: z
      .string()
      .default("")
      .refine((v) => !v || v.startsWith("data:image/") || v.startsWith("/api/files/"), {
        message: "Photo invalide (upload local uniquement).",
      }),
  }),
  contact: z.object({
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    links: z.array(linkSchema).default([]),
    details: z.array(detailSchema).default([]),
  }),
  summary: z.string().default(""),
  experiences: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  /** Soft skills chosen from the predefined catalog (profile). */
  softSkills: z.array(z.string()).default([]),
  languages: z.array(languageSchema).default([]),
  interests: z.array(z.string()).default([]),
});

export type CVData = z.infer<typeof cvSchema>;
export type CVExperience = z.infer<typeof experienceSchema>;
export type CVEducation = z.infer<typeof educationSchema>;
export type CVSkillGroup = z.infer<typeof skillGroupSchema>;

/** Validates LLM/form data; throws a descriptive ZodError otherwise. */
export function parseCV(data: unknown): CVData {
  return cvSchema.parse(data);
}

/**
 * Copy of the CV safe to embed in LLM prompts: the photo (base64 data URL,
 * enormous in tokens) is stripped — it is re-attached after tailoring.
 */
export function cvForLLM(cv: CVData): CVData {
  return { ...cv, identity: { ...cv.identity, photoUrl: "" } };
}

/** Text version of the schema, injected into prompts to constrain JSON output. */
export const CV_JSON_SHAPE = `{
  "identity": { "fullName": string, "headline": string, "photoUrl": string },
  "contact": {
    "email": string, "phone": string, "location": string,
    "links": [{ "label": string, "url": string }],
    "details": [{ "label": string, "value": string }]
  },
  "summary": string,
  "experiences": [{
    "title": string, "company": string, "place": string, "dates": string,
    "bullets": [string], "stack": [string]
  }],
  "education": [{ "degree": string, "school": string, "place": string, "dates": string, "details": string }],
  "skills": [{ "category": string, "items": [string] }],
  "softSkills": [string],
  "languages": [{ "name": string, "level": string }],
  "interests": [string]
}`;
