import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readStoredFile } from "@/lib/storage";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

/** Serves stored files (local, S3/R2 or Supabase). Requires an authenticated session. */
export async function GET(_req: Request, { params }: { params: { key: string[] } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const key = params.key.join("/");
  // Files are namespaced per user: cv-source/<userId>/…, exports/<userId>/…
  const isOwner = key.split("/")[1] === session.user.id;
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const buffer = await readStoredFile(key);
    const ext = key.slice(key.lastIndexOf("."));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }
}
