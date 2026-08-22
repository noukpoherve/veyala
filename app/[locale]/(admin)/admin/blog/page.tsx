import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listAdminPosts } from "@/lib/blog/queries";
import { deleteBlogPost, unpublishBlogPost } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.blog };
}

export default async function AdminBlogPage({ searchParams }: { searchParams: { page?: string } }) {
  const m = getMessages(getLocale());
  const t = m.adminUi.blog;
  const page = parsePage(searchParams.page);
  const { posts, total } = await listAdminPosts({
    skip: paginationSkip(page),
    take: DEFAULT_PAGE_SIZE,
  });
  const published = posts.filter((post) => post.status === "PUBLISHED").length;

  return (
    <article className="space-y-6">
      <PageHeader
        title={m.admin.blog}
        description={t.countSummary(total, published)}
        actions={
          <Button asChild variant="gradient">
            <Link href="/admin/blog/new">
              <Plus />
              {t.newPost}
            </Link>
          </Button>
        }
      />

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.empty}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="hover:text-blue-700 hover:underline"
                      >
                        {post.title}
                      </Link>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      /blog/{post.slug} · {t.categories[post.category]}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                      {post.status === "PUBLISHED" ? t.published : t.draft}
                    </Badge>
                    {post.featured ? <Badge variant="secondary">{t.featured}</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/blog/${post.id}/edit`}>{m.common.edit}</Link>
                  </Button>
                  {post.status === "PUBLISHED" ? (
                    <>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          {t.view}
                        </Link>
                      </Button>
                      <form action={unpublishBlogPost}>
                        <input type="hidden" name="id" value={post.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          {t.unpublish}
                        </Button>
                      </form>
                    </>
                  ) : null}
                  <form action={deleteBlogPost}>
                    <input type="hidden" name="id" value={post.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      {m.common.delete}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        pathname="/admin/blog"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages(total)}
        totalItems={total}
      />
    </article>
  );
}
