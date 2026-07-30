export type BlogCategory = "cv" | "ats" | "lettre" | "emploi" | "etudes" | "ia";

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; title?: string; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "cta"; text: string; href: string; label: string };

export type BlogAuthor = {
  name: string;
  role: string;
};

export type BlogFaq = {
  question: string;
  answer: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: BlogCategory;
  tags: string[];
  keywords: string[];
  publishedAt: string;
  updatedAt: string;
  readingTimeMin: number;
  featured?: boolean;
  author: BlogAuthor;
  /** Accent color used on OG images and category chips */
  accent: string;
  body: ContentBlock[];
  faq?: BlogFaq[];
};

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  cv: "CV",
  ats: "ATS",
  lettre: "Lettre de motivation",
  emploi: "Emploi & recrutement",
  etudes: "Études & formations",
  ia: "IA & candidature",
};
