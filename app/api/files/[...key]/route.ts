import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readStoredFile } from "@/lib/storage";
import { sanitizeDownloadFilename } from "@/lib/export-filename";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

/** Serves stored files (local, S3/R2 or Supabase). Requires an authenticated session. */
export async function GET(req: Request, { params }: { params: { key: string[] } }) {
  const m = getMessages(getLocaleFromRequest(req));
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: m.errors.authRequired }, { status: 401 });
  }

  const key = params.key.join("/");
  // Files are namespaced per user: cv-source/<userId>/…, exports/<userId>/…
  const isOwner = key.split("/")[1] === session.user.id;
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: m.api.files.forbidden }, { status: 403 });
  }

  try {
    const buffer = await readStoredFile(key);
    const ext = key.slice(key.lastIndexOf("."));
    const filename = sanitizeDownloadFilename(new URL(req.url).searchParams.get("filename"));
    const headers: Record<string, string> = {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    };
    if (filename) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }
    return new NextResponse(new Uint8Array(buffer), { headers });
  } catch {
    return NextResponse.json({ error: m.api.files.notFound }, { status: 404 });
  }
}
