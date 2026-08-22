import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getAdminPostById } from "@/lib/blog/queries";
import { deleteBlogPost, unpublishBlogPost } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.blogEdit };
}

export default async function AdminBlogEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { saved?: string };
}) {
  const m = getMessages(getLocale());
  const t = m.adminUi.blog;
  const post = await getAdminPostById(params.id);
  if (!post) notFound();

  return (
    <article className="space-y-6">
      <nav className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href="/admin/blog">{t.backToBlog}</BackLink>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
            {post.status === "PUBLISHED" ? t.published : t.draft}
          </Badge>
          {post.status === "PUBLISHED" ? (
            <form action={unpublishBlogPost}>
              <input type="hidden" name="id" value={post.id} />
              <Button type="submit" size="sm" variant="outline">
                {t.unpublish}
              </Button>
            </form>
          ) : null}
          <form action={deleteBlogPost}>
            <input type="hidden" name="id" value={post.id} />
            <Button type="submit" size="sm" variant="destructive">
              {m.common.delete}
            </Button>
          </form>
        </div>
      </nav>

      <PageHeader title={t.editTitle} />
      {searchParams.saved ? <Alert variant="success">{t.savedAlert}</Alert> : null}
      <BlogPostForm mode="edit" post={post} />
    </article>
  );
}
