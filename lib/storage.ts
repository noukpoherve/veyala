import "server-only";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Configurable file storage (STORAGE_DRIVER):
 *  - local    : /uploads at project root (dev)
 *  - supabase : Supabase Storage bucket
 *  - s3       : any S3-compatible storage
 */

export interface StoredFile {
  /** Internal path/key (e.g. "cv/abc.pdf"), reusable to read the file back. */
  key: string;
  /** Client-servable URL (internal download route for the local driver). */
  url: string;
}

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function sanitizeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

async function saveLocal(buffer: Buffer, key: string): Promise<StoredFile> {
  const target = path.join(UPLOADS_DIR, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);
  return { key, url: `/api/files/${key}` };
}

async function saveSupabase(buffer: Buffer, key: string, contentType: string): Promise<StoredFile> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.");
  const bucket = process.env.SUPABASE_BUCKET || "cvgen";
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) throw new Error(`Upload Supabase échoué (${res.status}) : ${await res.text()}`);
  return { key, url: `${url}/storage/v1/object/public/${bucket}/${key}` };
}

/** Persists a file and returns its key + URL. */
export async function saveFile(
  buffer: Buffer,
  opts: { dir: string; filename: string; contentType: string }
): Promise<StoredFile> {
  const driver = process.env.STORAGE_DRIVER || "local";
  const key = `${opts.dir}/${randomUUID()}${sanitizeExt(opts.filename)}`;

  switch (driver) {
    case "supabase":
      return saveSupabase(buffer, key, opts.contentType);
    case "s3":
      throw new Error("Driver s3 : à configurer (S3_ENDPOINT…) — utilisez local ou supabase.");
    default:
      return saveLocal(buffer, key);
  }
}

/** Reads a locally stored file back (used by the /api/files route). */
export async function readLocalFile(key: string): Promise<Buffer> {
  const safe = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(UPLOADS_DIR, safe);
  if (!target.startsWith(UPLOADS_DIR)) throw new Error("Chemin de fichier invalide.");
  return readFile(target);
}
