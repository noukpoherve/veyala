import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY manquante (32 octets en base64).");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY invalide : 32 octets base64 attendus.");
  return key;
}

/** Encrypts a secret (LLM API key) for DB storage. Format: iv.tag.data, base64-encoded. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    data.toString("base64"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [iv, tag, data] = payload.split(".");
  if (!iv || !tag || !data) throw new Error("Secret chiffré illisible.");
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString(
    "utf8"
  );
}
