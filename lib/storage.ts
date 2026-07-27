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

function assertDurableStorage(): void {
  if (driver() !== "local") return;
  const onServerless = Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT
  );
  if (onServerless || process.env.NODE_ENV === "production") {
    throw new Error(
      "STORAGE_DRIVER=local est interdit en production / serverless : utilisez s3 ou supabase."
    );
  }
}

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

async function deleteLocal(key: string): Promise<void> {
  const { unlink } = await import("node:fs/promises");
  await unlink(localPath(key)).catch((e: NodeJS.ErrnoException) => {
    if (e.code !== "ENOENT") throw e;
  });
}

async function deleteS3(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await s3Client();
  await client.send(new DeleteObjectCommand({ Bucket: s3Bucket(), Key: key }));
}

async function deleteSupabase(key: string): Promise<void> {
  const { url, serviceKey, bucket } = supabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${key}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Suppression Supabase échouée (${res.status}) : ${await res.text()}`);
  }
}

/** Extracts the storage key from a stored URL (`/api/files/...` or S3_PUBLIC_URL). */
export function keyFromStoredUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/api/files/")) {
    const key = decodeURIComponent(url.slice("/api/files/".length));
    return key || null;
  }
  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (publicBase && url.startsWith(`${publicBase}/`)) {
    return url.slice(publicBase.length + 1) || null;
  }
  return null;
}

/** Best-effort delete by key. Missing files are ignored. */
export async function deleteFile(key: string): Promise<void> {
  switch (driver()) {
    case "s3":
      return deleteS3(key);
    case "supabase":
      return deleteSupabase(key);
    default:
      return deleteLocal(key);
  }
}

/** Best-effort delete from a stored URL. Unknown URL shapes are skipped. */
export async function deleteStoredUrl(url: string | null | undefined): Promise<void> {
  const key = keyFromStoredUrl(url);
  if (!key) return;
  try {
    await deleteFile(key);
  } catch (error) {
    console.error("[storage] delete failed:", { key, error });
  }
}

// ---------- public API ----------

/** Persists a file and returns its key + URL. */
export async function saveFile(
  buffer: Buffer,
  opts: { dir: string; filename: string; contentType: string }
): Promise<StoredFile> {
  assertDurableStorage();
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
/** Whether the configured driver can persist files beyond a single instance. */
export function storageDriverStatus(): "ok" | "error" | "unconfigured" | "ephemeral" {
  const d = driver();
  if (d === "local") {
    const onServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    return onServerless || process.env.NODE_ENV === "production" ? "error" : "ephemeral";
  }
  if (d === "s3") {
    return process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET
      ? "ok"
      : "unconfigured";
  }
  if (d === "supabase") {
    return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "ok"
      : "unconfigured";
  }
  return "unconfigured";
}

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
