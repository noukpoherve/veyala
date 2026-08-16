import type { Metadata } from "next";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Nouvel article · Admin" };

export default function AdminBlogNewPage() {
  return (
    <article className="space-y-6">
      <nav>
        <BackLink href="/admin/blog">Retour au blog</BackLink>
      </nav>
      <PageHeader title="Nouvel article" />
      <BlogPostForm mode="create" />
    </article>
  );
}
