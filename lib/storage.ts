import "server-only";
import { mkdir, writeFile, readFile as fsReadFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Configurable file storage (STORAGE_DRIVER):
 *  - local    : /uploads at project root (dev)
 *  - s3       : any S3-compatible storage — Cloudflare R2 recommended
 *  - supabase : Supabase Storage bucket (REST API)
 *
 * Reads go through readStoredFile() so private buckets can be proxied by
 * /api/files with the app's own access control.
 */

export interface StoredFile {
  /** Internal path/key (e.g. "exports/<userId>/abc.pdf"). */
  key: string;
  /** Client-servable URL (internal proxy route unless a public base URL is set). */
  url: string;
}

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const driver = () => process.env.STORAGE_DRIVER || "local";

function sanitizeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

// ---------- local ----------

function localPath(key: string): string {
  const safe = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(UPLOADS_DIR, safe);
  // path.sep suffix: "uploads-evil" must not pass as being inside "uploads".
  if (!target.startsWith(UPLOADS_DIR + path.sep)) throw new Error("Chemin de fichier invalide.");
  return target;
}

async function saveLocal(buffer: Buffer, key: string): Promise<StoredFile> {
  const target = localPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);
  return { key, url: `/api/files/${key}` };
}

// ---------- s3 (Cloudflare R2 or any S3-compatible) ----------

async function s3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3/R2 non configuré : S3_ENDPOINT, S3_ACCESS_KEY_ID et S3_SECRET_ACCESS_KEY requis."
    );
  }
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    endpoint,
    region: process.env.S3_REGION || "auto",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

function s3Bucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET manquant.");
  return bucket;
}

async function saveS3(buffer: Buffer, key: string, contentType: string): Promise<StoredFile> {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await s3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  // With a public base URL (R2 public bucket / custom domain) files are served
  // directly; otherwise they stay private and go through the /api/files proxy.
  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  return { key, url: publicBase ? `${publicBase}/${key}` : `/api/files/${key}` };
}

async function readS3(key: string): Promise<Buffer> {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await s3Client();
  const res = await client.send(new GetObjectCommand({ Bucket: s3Bucket(), Key: key }));
  if (!res.Body) throw new Error("Fichier introuvable.");
  return Buffer.from(await res.Body.transformToByteArray());
}

// ---------- supabase storage ----------

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.");
  return {
    url: url.replace(/\/$/, ""),
    serviceKey,
    bucket: process.env.SUPABASE_BUCKET || "cvgen",
  };
}

async function saveSupabase(buffer: Buffer, key: string, contentType: string): Promise<StoredFile> {
  const { url, serviceKey, bucket } = supabaseConfig();
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
  return { key, url: `/api/files/${key}` };
}

async function readSupabase(key: string): Promise<Buffer> {
  const { url, serviceKey, bucket } = supabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${key}`, {
    headers: { Authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) throw new Error("Fichier introuvable.");
  return Buffer.from(await res.arrayBuffer());
}

// ---------- public API ----------

/** Persists a file and returns its key + URL. */
export async function saveFile(
  buffer: Buffer,
  opts: { dir: string; filename: string; contentType: string }
): Promise<StoredFile> {
  const key = `${opts.dir}/${randomUUID()}${sanitizeExt(opts.filename)}`;
  switch (driver()) {
    case "s3":
      return saveS3(buffer, key, opts.contentType);
    case "supabase":
      return saveSupabase(buffer, key, opts.contentType);
    default:
      return saveLocal(buffer, key);
  }
}

/** Reads a stored file back, whatever the driver (used by the /api/files proxy). */
export async function readStoredFile(key: string): Promise<Buffer> {
  switch (driver()) {
    case "s3":
      return readS3(key);
    case "supabase":
      return readSupabase(key);
    default:
      return fsReadFile(localPath(key));
  }
}
