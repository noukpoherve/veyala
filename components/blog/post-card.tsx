import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { CATEGORY_LABELS, type BlogPost } from "@/lib/blog/types";
import { formatPostDate } from "@/lib/blog/mapper";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: BlogPost;
  featured?: boolean;
};

export function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_50px_-28px_rgba(37,99,235,0.45)]",
        featured && "md:flex-row"
      )}
    >
      <div
        className={cn("relative overflow-hidden", featured ? "min-h-[220px] md:w-[44%]" : "h-40")}
        style={{
          background: `linear-gradient(145deg, ${post.accent} 0%, #0B1527 78%)`,
        }}
        aria-hidden
      >
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_70%,#93c5fd,transparent_40%)]" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
            {CATEGORY_LABELS[post.category]}
          </p>
          {featured ? (
            <p className="mt-2 line-clamp-3 font-display text-2xl font-bold leading-tight text-white">
              {post.title}
            </p>
          ) : null}
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col p-6", featured && "md:p-8")}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {post.readingTimeMin} min
          </span>
        </div>

        <h2
          className={cn(
            "mt-3 font-display font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-700",
            featured ? "text-2xl md:text-[1.7rem]" : "text-xl",
            featured && "md:sr-only"
          )}
        >
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h2>

        <p className={cn("mt-3 text-sm leading-relaxed text-slate-600", featured && "text-[15px]")}>
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-6">
          <ul className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {tag}
              </li>
            ))}
          </ul>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
            Lire
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
