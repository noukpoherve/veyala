import type { Metadata } from "next";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.blogNew };
}

export default function AdminBlogNewPage() {
  const t = getMessages(getLocale()).adminUi.blog;
  return (
    <article className="space-y-6">
      <nav>
        <BackLink href="/admin/blog">{t.backToBlog}</BackLink>
      </nav>
      <PageHeader title={t.newTitle} />
      <BlogPostForm mode="create" />
    </article>
  );
}
