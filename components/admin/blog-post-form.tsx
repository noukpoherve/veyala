"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { BlogActionState } from "@/app/(admin)/admin/blog/actions";
import { createBlogPost, updateBlogPost } from "@/app/(admin)/admin/blog/actions";
import type { AdminBlogPost } from "@/lib/blog/mapper";
import { slugifyTitle } from "@/lib/blog/mapper";
import { PUBLISH_MIN_SCORE, scoreSeoFromForm } from "@/lib/blog/seo-score";
import { CATEGORY_LABELS, type BlogCategory, type BlogFaq } from "@/lib/blog/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BlogPostFormProps = {
  mode: "create" | "edit";
  post?: AdminBlogPost;
};

const initialState: BlogActionState = { ok: false, message: "" };

export function BlogPostForm({ mode, post }: BlogPostFormProps) {
  const action = mode === "create" ? createBlogPost : updateBlogPost;
  const [state, formAction] = useFormState(action, initialState);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [description, setDescription] = useState(post?.description ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [focusKeyword, setFocusKeyword] = useState(post?.focusKeyword ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [keywords, setKeywords] = useState(post?.keywords.join(", ") ?? "");
  const [bodyMarkdown, setBodyMarkdown] = useState(post?.bodyMarkdown ?? "");
  const [faq, setFaq] = useState<BlogFaq[]>(post?.faq ?? []);
  const [category, setCategory] = useState<BlogCategory>(post?.category ?? "cv");

  const seo = useMemo(
    () =>
      scoreSeoFromForm({
        title,
        description,
        slug,
        excerpt,
        focusKeyword,
        tagsCsv: tags,
        keywordsCsv: keywords,
        bodyMarkdown,
        faqCount: faq.length,
      }),
    [title, description, slug, excerpt, focusKeyword, tags, keywords, bodyMarkdown, faq.length]
  );

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="faqJson" value={JSON.stringify(faq)} />

      <div className="space-y-6">
        {state.message ? (
          <p
            role="status"
            className={cn(
              "rounded-md border p-3 text-sm",
              state.ok
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {state.message}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contenu</CardTitle>
            <CardDescription>
              Markdown simplifié : ## H2, ### H3, listes, citations (&gt;), callouts (!!!), CTA
              (@@cta|/register|Label).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Titre" error={state.fieldErrors?.title?.[0]}>
              <Input
                name="title"
                value={title}
                onChange={(event) => {
                  const next = event.target.value;
                  setTitle(next);
                  if (!slugTouched) setSlug(slugifyTitle(next));
                }}
                required
              />
            </Field>
            <Field label="Slug URL" error={state.fieldErrors?.slug?.[0]}>
              <Input
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                required
              />
            </Field>
            <Field label="Extrait (cartes / partage)" error={state.fieldErrors?.excerpt?.[0]}>
              <Textarea
                name="excerpt"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                rows={3}
                required
              />
            </Field>
            <Field label="Corps de l'article" error={state.fieldErrors?.bodyMarkdown?.[0]}>
              <Textarea
                name="bodyMarkdown"
                value={bodyMarkdown}
                onChange={(event) => setBodyMarkdown(event.target.value)}
                rows={22}
                className="font-mono text-[13px] leading-relaxed"
                required
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">FAQ (optionnel)</CardTitle>
            <CardDescription>2+ questions activent le schema FAQPage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {faq.map((item, index) => (
              <div key={`faq-${index}`} className="space-y-2 rounded-lg border p-3">
                <Input
                  value={item.question}
                  placeholder="Question"
                  onChange={(event) => {
                    const next = [...faq];
                    next[index] = { ...item, question: event.target.value };
                    setFaq(next);
                  }}
                />
                <Textarea
                  value={item.answer}
                  placeholder="Réponse"
                  rows={3}
                  onChange={(event) => {
                    const next = [...faq];
                    next[index] = { ...item, answer: event.target.value };
                    setFaq(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFaq(faq.filter((_, i) => i !== index))}
                >
                  Supprimer
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFaq([...faq, { question: "", answer: "" }])}
            >
              Ajouter une question
            </Button>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO</CardTitle>
            <CardDescription>
              Score {seo.score}/100 · seuil publication {PUBLISH_MIN_SCORE}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width]",
                  seo.canPublish
                    ? "bg-emerald-500"
                    : seo.score >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                )}
                style={{ width: `${seo.score}%` }}
              />
            </div>
            <ul className="max-h-56 space-y-1.5 overflow-y-auto text-xs">
              {seo.checks.map((check) => (
                <li
                  key={check.id}
                  className={cn(
                    "rounded-md px-2 py-1.5",
                    check.ok ? "bg-emerald-50 text-emerald-900" : "bg-slate-50 text-slate-600"
                  )}
                >
                  <span className="font-medium">
                    {check.ok ? "✓" : "○"} {check.label}
                  </span>
                  {!check.ok ? <span className="mt-0.5 block opacity-80">{check.hint}</span> : null}
                </li>
              ))}
            </ul>

            <Field label="Meta description" error={state.fieldErrors?.description?.[0]}>
              <Textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                required
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{description.length} car.</p>
            </Field>
            <Field label="Mot-clé principal">
              <Input
                name="focusKeyword"
                value={focusKeyword}
                onChange={(event) => setFocusKeyword(event.target.value)}
              />
            </Field>
            <Field label="Tags (virgules)">
              <Input name="tags" value={tags} onChange={(event) => setTags(event.target.value)} />
            </Field>
            <Field label="Mots-clés SEO (virgules)">
              <Input
                name="keywords"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Catégorie">
              <select
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value as BlogCategory)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                {(Object.keys(CATEGORY_LABELS) as BlogCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Accent (#hex)">
              <Input name="accent" defaultValue={post?.accent ?? "#2563EB"} />
            </Field>
            <Field label="Auteur">
              <Input name="authorName" defaultValue={post?.author.name ?? "Équipe Veyala"} />
            </Field>
            <Field label="Rôle auteur">
              <Input
                name="authorRole"
                defaultValue={post?.author.role ?? "Experts CV, ATS & candidature"}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={post?.featured}
                className="size-4 rounded border"
              />
              Article à la une
            </label>

            <div className="flex flex-col gap-2 pt-2">
              <SubmitButtons
                canPublish={seo.canPublish}
                isPublished={post?.status === "PUBLISHED"}
              />
              {!seo.canPublish ? (
                <p className="text-xs text-amber-700">
                  Publication bloquée tant que le score SEO est sous {PUBLISH_MIN_SCORE}.
                </p>
              ) : null}
              {post?.status === "PUBLISHED" ? (
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
                >
                  Voir l&apos;article
                  <ExternalLink className="size-3.5" aria-hidden />
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function SubmitButtons({
  canPublish,
  isPublished,
}: {
  canPublish: boolean;
  isPublished?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
        Enregistrer brouillon
      </Button>
      <Button
        type="submit"
        name="intent"
        value="publish"
        variant="gradient"
        disabled={pending || !canPublish}
        title={canPublish ? "Publier" : `Score SEO insuffisant (min ${PUBLISH_MIN_SCORE})`}
      >
        {isPublished ? "Mettre à jour & garder publié" : "Publier"}
      </Button>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
