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
  /** Makes the company name clickable in preview / PDF / DOCX. */
  companyUrl: z.string().default(""),
  place: z.string().default(""),
  dates: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  stack: z.array(z.string()).default([]),
  /** Reference links (package, demo, extension…) shown under the experience. */
  links: z.array(linkSchema).default([]),
  /** Shown on the rendered CV when true (the default); hidden but kept when false. */
  included: z.boolean().default(true),
});

/** Personal project — same shape as a professional experience, rendered in its own
 *  section that always comes after "Work experience" and is never reorderable above it. */
export const projectSchema = experienceSchema;

export const educationSchema = z.object({
  degree: z.string().min(1),
  school: z.string().default(""),
  place: z.string().default(""),
  dates: z.string().default(""),
  details: z.string().default(""),
  included: z.boolean().default(true),
});

export const skillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string()).default([]),
});

export const languageSchema = z.object({
  name: z.string().min(1),
  level: z.string().default(""),
});

export const certificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().default(""),
  dates: z.string().default(""),
  /** Credential URL (http/https only when set). */
  url: z.string().default(""),
  credentialId: z.string().default(""),
  included: z.boolean().default(true),
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
  /** Personal projects, always rendered after "experiences" on the CV. */
  projects: z.array(projectSchema).default([]),
  education: z.array(educationSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  /** Soft skills chosen from the predefined catalog (profile). */
  softSkills: z.array(z.string()).default([]),
  languages: z.array(languageSchema).default([]),
  interests: z.array(z.string()).default([]),
});

export type CVData = z.infer<typeof cvSchema>;
export type CVExperience = z.infer<typeof experienceSchema>;
export type CVProject = z.infer<typeof projectSchema>;
export type CVEducation = z.infer<typeof educationSchema>;
export type CVCertification = z.infer<typeof certificationSchema>;
export type CVSkillGroup = z.infer<typeof skillGroupSchema>;

/** Validates LLM/form data; throws a descriptive ZodError otherwise. */
export function parseCV(data: unknown): CVData {
  return cvSchema.parse(data);
}

/**
 * Copy of the CV safe to embed in LLM prompts: the photo (base64 data URL,
 * enormous in tokens) is stripped — it is re-attached after tailoring.
 * "projects" is stripped too: tailoring never rewrites personal projects, it is
 * always copied back from the base CV verbatim (see lib/tailor.ts), so there is
 * no reason to spend prompt tokens describing it.
 */
export function cvForLLM(cv: CVData): CVData {
  return { ...cv, identity: { ...cv.identity, photoUrl: "" }, projects: [] };
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
    "title": string, "company": string, "companyUrl": string, "place": string, "dates": string,
    "bullets": [string], "stack": [string],
    "links": [{ "label": string, "url": string }]
  }],
  "education": [{ "degree": string, "school": string, "place": string, "dates": string, "details": string }],
  "certifications": [{ "name": string, "issuer": string, "dates": string, "url": string, "credentialId": string }],
  "skills": [{ "category": string, "items": [string] }],
  "softSkills": [string],
  "languages": [{ "name": string, "level": string }],
  "interests": [string]
}`;
