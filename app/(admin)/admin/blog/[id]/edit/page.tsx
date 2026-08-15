import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getAdminPostById } from "@/lib/blog/queries";
import { deleteBlogPost, unpublishBlogPost } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = { title: "Éditer l'article · Admin" };

export default async function AdminBlogEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { saved?: string };
}) {
  const post = await getAdminPostById(params.id);
  if (!post) notFound();

  return (
    <article className="space-y-6">
      <nav className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href="/admin/blog">Retour au blog</BackLink>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
            {post.status === "PUBLISHED" ? "Publié" : "Brouillon"}
          </Badge>
          {post.status === "PUBLISHED" ? (
            <form action={unpublishBlogPost}>
              <input type="hidden" name="id" value={post.id} />
              <Button type="submit" size="sm" variant="outline">
                Dépublier
              </Button>
            </form>
          ) : null}
          <form action={deleteBlogPost}>
            <input type="hidden" name="id" value={post.id} />
            <Button type="submit" size="sm" variant="destructive">
              Supprimer
            </Button>
          </form>
        </div>
      </nav>

      <h1 className="font-display text-2xl font-bold">Éditer l&apos;article</h1>
      {searchParams.saved ? <Alert variant="success">Article enregistré.</Alert> : null}
      <BlogPostForm mode="edit" post={post} />
    </article>
  );
}
