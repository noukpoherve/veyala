import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata: Metadata = { title: "Nouvel article · Admin" };

export default function AdminBlogNewPage() {
  return (
    <article className="space-y-6">
      <nav>
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au blog
        </Link>
      </nav>
      <h1 className="font-display text-2xl font-bold">Nouvel article</h1>
      <BlogPostForm mode="create" />
    </article>
  );
}
