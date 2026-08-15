import type { Metadata } from "next";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = { title: "Nouvel article · Admin" };

export default function AdminBlogNewPage() {
  return (
    <article className="space-y-6">
      <nav>
        <BackLink href="/admin/blog">Retour au blog</BackLink>
      </nav>
      <h1 className="font-display text-2xl font-bold">Nouvel article</h1>
      <BlogPostForm mode="create" />
    </article>
  );
}
