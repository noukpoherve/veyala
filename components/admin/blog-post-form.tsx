"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ExternalLink } from "lucide-react";
import type { BlogActionState } from "@/app/[locale]/(admin)/admin/blog/actions";
import { createBlogPost, updateBlogPost } from "@/app/[locale]/(admin)/admin/blog/actions";
import type { AdminBlogPost } from "@/lib/blog/mapper";
import { slugifyTitle } from "@/lib/blog/mapper";
import { PUBLISH_MIN_SCORE, scoreSeoFromForm } from "@/lib/blog/seo-score";
import { CATEGORY_LABELS, type BlogCategory, type BlogFaq } from "@/lib/blog/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMessages } from "@/components/i18n/locale-provider";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type BlogPostFormProps = {
  mode: "create" | "edit";
  post?: AdminBlogPost;
};

const initialState: BlogActionState = { ok: false, message: "" };

export function BlogPostForm({ mode, post }: BlogPostFormProps) {
  const m = useMessages();
  const t = m.adminUi.blogForm;
  const categories = m.adminUi.blog.categories;
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
            <CardTitle className="text-base">{t.contentTitle}</CardTitle>
            <CardDescription>{t.contentHelp}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label={t.title} error={state.fieldErrors?.title?.[0]}>
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
            <Field label={t.slug} error={state.fieldErrors?.slug?.[0]}>
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
            <Field label={t.excerpt} error={state.fieldErrors?.excerpt?.[0]}>
              <Textarea
                name="excerpt"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                rows={3}
                required
              />
            </Field>
            <Field label={t.body} error={state.fieldErrors?.bodyMarkdown?.[0]}>
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
            <CardTitle className="text-base">{t.faqTitle}</CardTitle>
            <CardDescription>{t.faqHelp}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {faq.map((item, index) => (
              <div key={`faq-${index}`} className="space-y-2 rounded-lg border p-3">
                <Input
                  value={item.question}
                  placeholder={t.questionPlaceholder}
                  onChange={(event) => {
                    const next = [...faq];
                    next[index] = { ...item, question: event.target.value };
                    setFaq(next);
                  }}
                />
                <Textarea
                  value={item.answer}
                  placeholder={t.answerPlaceholder}
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
                  {m.common.delete}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFaq([...faq, { question: "", answer: "" }])}
            >
              {t.addQuestion}
            </Button>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.seoTitle}</CardTitle>
            <CardDescription>{t.seoScore(seo.score, PUBLISH_MIN_SCORE)}</CardDescription>
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

            <Field label={t.metaDescription} error={state.fieldErrors?.description?.[0]}>
              <Textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                required
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t.charCount(description.length)}
              </p>
            </Field>
            <Field label={t.focusKeyword}>
              <Input
                name="focusKeyword"
                value={focusKeyword}
                onChange={(event) => setFocusKeyword(event.target.value)}
              />
            </Field>
            <Field label={t.tags}>
              <Input name="tags" value={tags} onChange={(event) => setTags(event.target.value)} />
            </Field>
            <Field label={t.keywords}>
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
            <CardTitle className="text-base">{t.publishTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label={t.category}>
              <select
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value as BlogCategory)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                {(Object.keys(CATEGORY_LABELS) as BlogCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {categories[key]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.accent}>
              <Input name="accent" defaultValue={post?.accent ?? "#2563EB"} />
            </Field>
            <Field label={t.author}>
              <Input
                name="authorName"
                defaultValue={post?.author.name ?? m.pages.support.fromTeam}
              />
            </Field>
            <Field label={t.authorRole}>
              <Input name="authorRole" defaultValue={post?.author.role ?? t.defaultAuthorRole} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={post?.featured}
                className="size-4 rounded border"
              />
              {t.featured}
            </label>

            <div className="flex flex-col gap-2 pt-2">
              <SubmitButtons
                canPublish={seo.canPublish}
                isPublished={post?.status === "PUBLISHED"}
              />
              {!seo.canPublish ? (
                <p className="text-xs text-amber-700">{t.publishBlocked(PUBLISH_MIN_SCORE)}</p>
              ) : null}
              {post?.status === "PUBLISHED" ? (
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
                >
                  {t.viewPost}
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
  const t = useMessages().adminUi.blogForm;
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
        {t.saveDraft}
      </Button>
      <Button
        type="submit"
        name="intent"
        value="publish"
        variant="gradient"
        disabled={pending || !canPublish}
        title={canPublish ? t.publish : t.publishBlockedTitle(PUBLISH_MIN_SCORE)}
      >
        {isPublished ? t.updateKeepPublished : t.publish}
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
