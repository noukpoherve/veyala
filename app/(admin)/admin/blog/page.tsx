import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listAdminPosts } from "@/lib/blog/queries";
import { CATEGORY_LABELS } from "@/lib/blog/types";
import { deleteBlogPost, unpublishBlogPost } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Blog · Admin" };

export default async function AdminBlogPage() {
  const posts = await listAdminPosts();
  const published = posts.filter((post) => post.status === "PUBLISHED").length;

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length} article{posts.length > 1 ? "s" : ""} · {published} publié
            {published > 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/admin/blog/new">
            <Plus />
            Nouvel article
          </Link>
        </Button>
      </header>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucun article. Lancez le seed ou créez le premier article.
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
                      /blog/{post.slug} · {CATEGORY_LABELS[post.category]}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                      {post.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                    </Badge>
                    {post.featured ? <Badge variant="secondary">À la une</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/blog/${post.id}/edit`}>Éditer</Link>
                  </Button>
                  {post.status === "PUBLISHED" ? (
                    <>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          Voir
                        </Link>
                      </Button>
                      <form action={unpublishBlogPost}>
                        <input type="hidden" name="id" value={post.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Dépublier
                        </Button>
                      </form>
                    </>
                  ) : null}
                  <form action={deleteBlogPost}>
                    <input type="hidden" name="id" value={post.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      Supprimer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
