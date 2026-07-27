import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Blocks SSRF when fetching job postings: only http(s), no credentials, no
 * localhost / private / link-local / metadata IPs (including after DNS resolve).
 */

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata"]);

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  // IPv4-mapped IPv6
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const parts = v4.split(".").map(Number);
    const a = parts[0] ?? -1;
    const b = parts[1] ?? -1;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
    if (lower.startsWith("fe80")) return true; // link-local
    return false;
  }
  return true;
}

/** Validates and returns a safe absolute http(s) URL, or throws. */
export async function assertSafePublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL d'offre invalide.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Seules les URLs http(s) sont autorisées.");
  }
  if (url.username || url.password) {
    throw new Error("URL d'offre invalide (identifiants interdits).");
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("Cette URL n'est pas autorisée.");
  }

  if (isIP(host) && isPrivateIp(host)) {
    throw new Error("Cette URL n'est pas autorisée.");
  }

  // Resolve DNS and reject private answers (DNS rebinding mitigation).
  if (!isIP(host)) {
    let addresses: string[];
    try {
      const records = await lookup(host, { all: true, verbatim: true });
      addresses = records.map((r) => r.address);
    } catch {
      throw new Error("Impossible de résoudre l'hôte de l'offre.");
    }
    if (addresses.length === 0 || addresses.some(isPrivateIp)) {
      throw new Error("Cette URL n'est pas autorisée.");
    }
  }

  return url;
}
