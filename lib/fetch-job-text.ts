import "server-only";
import { isIP } from "node:net";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { assertSafePublicUrl } from "@/lib/job-url";
import { jobFetchCandidates, prefersMobileUserAgent, readerTargets } from "@/lib/job-board-urls";

export {
  extractIndeedJobKey,
  extractLinkedInJobId,
  jobFetchCandidates,
  readerTargets,
} from "@/lib/job-board-urls";

const MIN_JOB_CHARS = 200;
const MAX_JOB_CHARS = 12_000;
const MAX_HTML_BYTES = 2_000_000;
const DIRECT_TIMEOUT_MS = 12_000;
const READER_TIMEOUT_MS = 20_000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const READER_ORIGIN = "https://r.jina.ai";

const BOT_WALL_RE =
  /token\.awswaf\.com|awsWafCookieDomainList|AwsWafIntegration|challenges\.cloudflare\.com|cdn-cgi\/challenge|cf-challenge|__cf_chl|geo\.captcha-delivery\.com|datadome|perimeterx|px-captcha|Enable JavaScript and then reload|checking your browser before|INDEED_CLOUDFLARE_STATIC_PAGE|Security Check - Indeed|bot-detection-anonymous|Additional Verification Required/i;

const LOGIN_WALL_RE =
  /\/uas\/login|authwall|S['’]identifier sur LinkedIn|Sign in to LinkedIn|Join LinkedIn|Connectez-vous pour (voir|continuer)|Please sign in to (view|continue)|Create an account to see|Créer un compte pour/i;

const TOO_SHORT_ERROR =
  "Contenu trop court ou bloqué par le site. Collez plutôt le texte de l'offre.";

const JOB_DOM_SELECTORS = [
  "#jobDescriptionText",
  ".show-more-less-html__markup",
  "[itemprop='description']",
  "[data-testid='jobDescriptionText']",
  "[data-testid='job-description']",
  ".jobsearch-jobDescriptionText",
  ".job-description",
  ".jobDescription",
  ".offer-description",
  ".description__text",
].join(", ");

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function collapseWs(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function htmlToText(html: string): string {
  return collapseWs(cheerio.load(`<div>${html}</div>`)("div").text());
}

function maybeHtmlToText(value: string): string {
  return /<[a-z][\s\S]*>/i.test(value) ? htmlToText(value) : collapseWs(value);
}

function stringField(value: unknown): string {
  if (typeof value === "string") return collapseWs(value);
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return collapseWs(value.map(stringField).filter(Boolean).join(" "));
  const obj = asRecord(value);
  if (!obj) return "";
  return stringField(obj.name ?? obj.text ?? obj.value ?? obj.description ?? obj.address);
}

function typeList(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

function isJobPosting(value: unknown): value is Record<string, unknown> {
  const obj = asRecord(value);
  if (!obj) return false;
  return typeList(obj["@type"]).some((t) => /jobposting/i.test(t));
}

function flattenJobPosting(job: Record<string, unknown>): string {
  const descriptionRaw = job.description;
  const description =
    typeof descriptionRaw === "string" && /<[a-z][\s\S]*>/i.test(descriptionRaw)
      ? htmlToText(descriptionRaw)
      : stringField(descriptionRaw);

  const parts = [
    stringField(job.title),
    stringField(job.hiringOrganization),
    stringField(job.employmentType),
    stringField(job.jobLocation),
    stringField(job.industry),
    stringField(job.skills),
    stringField(job.qualifications),
    stringField(job.responsibilities),
    stringField(job.experienceRequirements),
    stringField(job.educationRequirements),
    description,
  ].filter((p) => p.length > 0);

  return collapseWs(parts.join(" "));
}

function walkJsonLd(value: unknown, acc: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) walkJsonLd(item, acc);
    return;
  }
  const obj = asRecord(value);
  if (!obj) return;
  if (isJobPosting(obj)) acc.push(flattenJobPosting(obj));
  if (obj["@graph"]) walkJsonLd(obj["@graph"], acc);
}

function hasPublicJobBody(html: string, text: string): boolean {
  if (/\bshow-more-less-html__markup\b/.test(html)) return true;
  if (/"@type"\s*:\s*"JobPosting"/i.test(html)) return true;
  if (/\bsanitizedJobDescription\b|#jobDescriptionText/.test(html)) return true;
  return (
    /\b(Missions|Description du poste|About the job|Your role)\b/i.test(text) && text.length >= 400
  );
}

export function looksLikeBotWall(html: string): boolean {
  return BOT_WALL_RE.test(html);
}

export function looksLikeLoginWall(html: string, text = ""): boolean {
  if (hasPublicJobBody(html, text)) return false;
  return LOGIN_WALL_RE.test(html) || LOGIN_WALL_RE.test(text);
}

function extractJsonLdJobPosting($: CheerioAPI): string {
  const chunks: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      walkJsonLd(JSON.parse(raw) as unknown, chunks);
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  });
  return collapseWs(chunks.join(" "));
}

function parseJsonObjectAt(html: string, braceIndex: number): unknown | null {
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = braceIndex; i < html.length && i - braceIndex < MAX_HTML_BYTES; i++) {
    const c = html[i];
    if (inStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === "\\") {
        escaped = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(braceIndex, i + 1)) as unknown;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function assignmentObject(html: string, marker: string): unknown | null {
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const eq = html.indexOf("=", idx + marker.length);
  const brace = html.indexOf("{", eq);
  if (eq < 0 || brace < 0 || brace - eq > 80) return null;
  return parseJsonObjectAt(html, brace);
}

function normalizedKey(key: string): string {
  return key.replace(/[_-]/g, "").toLowerCase();
}

function extractJobishFromJson(data: unknown): string {
  const jobTitles: string[] = [];
  const looseTitles: string[] = [];
  const companies: string[] = [];
  const descriptions: string[] = [];

  const visit = (value: unknown, key: string) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item, key);
      return;
    }
    const obj = asRecord(value);
    if (obj) {
      for (const [childKey, child] of Object.entries(obj)) visit(child, childKey);
      return;
    }
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed.length < 8) return;
    const k = normalizedKey(key);
    if (/^(jobtitle|offertitle|vacancytitle|postingtitle)$/.test(k)) {
      jobTitles.push(trimmed);
      return;
    }
    if (k === "title" && trimmed.length >= 12 && trimmed.length <= 180) {
      looseTitles.push(trimmed);
      return;
    }
    if (/^(companyname|employername|hiringorganization)$/.test(k)) {
      companies.push(collapseWs(trimmed));
      return;
    }
    if (
      /(sanitizedjobdescription|jobdescription|fulldescription|descriptionhtml|descriptiontext|jobadtext|offerdescription|postingdescription|vacancydescription)$/.test(
        k
      )
    ) {
      descriptions.push(trimmed);
      return;
    }
    if (k === "description" && (trimmed.length >= 400 || /<[pl]/i.test(trimmed))) {
      descriptions.push(trimmed);
    }
  };

  visit(data, "");
  const descRaw = descriptions.sort((a, b) => b.length - a.length)[0] ?? "";
  const description = descRaw ? maybeHtmlToText(descRaw) : "";
  const title = jobTitles[0] ?? looseTitles[0];
  return collapseWs([title, companies[0], description].filter((t) => t && t.length > 0).join(" "));
}

function extractEmbeddedJobJson(html: string, $: CheerioAPI): string {
  const blobs: unknown[] = [];
  const nextData = $("#__NEXT_DATA__").text();
  if (nextData.trim()) {
    try {
      blobs.push(JSON.parse(nextData) as unknown);
    } catch {
      // ignore
    }
  }
  $('script[type="application/json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw.startsWith("{")) return;
    try {
      blobs.push(JSON.parse(raw) as unknown);
    } catch {
      // ignore
    }
  });
  for (const marker of ["window._initialData", "window.__NUXT__", "__NUXT_DATA__"]) {
    const parsed = assignmentObject(html, marker);
    if (parsed) blobs.push(parsed);
  }
  const chunks = blobs.map(extractJobishFromJson).filter((t) => t.length >= 80);
  return chunks.sort((a, b) => b.length - a.length)[0] ?? "";
}

/**
 * Pulls readable job text from HTML: JSON-LD, hydrated JSON, common
 * description nodes, then article/main. Challenge pages yield "".
 */
export function extractJobTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLdJobPosting($);
  const embedded = extractEmbeddedJobJson(html, $);
  const heading = collapseWs(
    $("h1, .top-card-layout__title, .topcard__title, [itemprop='title']").first().text()
  );
  const markup = collapseWs($(JOB_DOM_SELECTORS).text());
  $("script, style, nav, footer, header, noscript, svg, iframe").remove();
  const main = $("article, main, [role='main']").first();
  const bodyText = collapseWs((main.length ? main : $("body")).text());
  const preferred = collapseWs(
    [heading, markup, jsonLd, embedded].filter((t) => t.length > 0).join(" ")
  );
  const text =
    preferred.length >= MIN_JOB_CHARS
      ? preferred
      : collapseWs([preferred, bodyText].filter((t) => t.length > 0).join(" "));
  if (looksLikeLoginWall(html, text)) return "";
  if (looksLikeBotWall(html) && !hasPublicJobBody(html, text)) return "";
  return text;
}

function cleanReaderText(text: string): string {
  return collapseWs(text.replace(/!\[[^\]]*]\([^)]*\)/g, " "));
}

function readerUrlFor(target: URL): string {
  return `${READER_ORIGIN}/${target.href}`;
}

function readerHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "text/markdown, text/plain;q=0.9, */*;q=0.8",
    "X-Return-Format": "markdown",
    "X-Timeout": String(Math.ceil(READER_TIMEOUT_MS / 1000)),
  };
  const apiKey = process.env.JINA_API_KEY?.trim();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

function htmlRequestHeaders(userAgent: string): HeadersInit {
  return {
    "User-Agent": userAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
  };
}

async function fetchHtmlOnce(
  url: URL,
  userAgent: string
): Promise<{ html: string; finalUrl: URL } | null> {
  try {
    const res = await fetch(url, {
      headers: htmlRequestHeaders(userAgent),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(DIRECT_TIMEOUT_MS),
    });
    const finalUrl = res.url && res.url !== url.href ? new URL(res.url) : url;
    if (finalUrl.href !== url.href) {
      await assertSafePublicUrl(finalUrl.href);
    }
    const html = await res.text();
    if (html.length > MAX_HTML_BYTES) return null;
    return { html, finalUrl };
  } catch {
    return null;
  }
}

function isChallengeHtml(html: string): boolean {
  return looksLikeBotWall(html) && !hasPublicJobBody(html, "");
}

async function fetchDirectHtml(url: URL): Promise<{ html: string; finalUrl: URL } | null> {
  const mobileFirst = prefersMobileUserAgent(url.hostname);
  const primary = mobileFirst ? MOBILE_UA : BROWSER_UA;
  const first = await fetchHtmlOnce(url, primary);
  if (first && !isChallengeHtml(first.html)) return first;
  if (mobileFirst) return first;
  const second = await fetchHtmlOnce(url, MOBILE_UA);
  if (second && !isChallengeHtml(second.html)) return second;
  return first ?? second;
}

function challengeScope(hostname: string): string {
  if (isIP(hostname)) return hostname;
  const host = hostname.toLowerCase();
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

function allowBrowserFallback(url: URL): boolean {
  if (process.env.VITEST) return false;
  if (isIP(url.hostname)) return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  return true;
}

async function fetchViaReader(url: URL): Promise<string | null> {
  try {
    const res = await fetch(readerUrlFor(url), {
      headers: readerHeaders(),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(READER_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const text = cleanReaderText(await res.text());
    if (text.length > MAX_HTML_BYTES) return null;
    if (text.length < MIN_JOB_CHARS) return null;
    if (looksLikeBotWall(text) || looksLikeLoginWall(text, text)) return null;
    return text.slice(0, MAX_JOB_CHARS);
  } catch {
    return null;
  }
}

async function fetchViaBrowser(url: URL): Promise<string | null> {
  if (!allowBrowserFallback(url)) return null;
  const { fetchHtmlWithBrowser } = await import("@/lib/job-page-browser");
  const html = await fetchHtmlWithBrowser(url);
  if (!html) return null;
  const text = extractJobTextFromHtml(html);
  if (text.length < MIN_JOB_CHARS) return null;
  return text.slice(0, MAX_JOB_CHARS);
}

/** Fetches and cleans a job posting's text from its URL (SSRF-safe). */
export async function fetchJobText(rawUrl: string): Promise<string> {
  const url = await assertSafePublicUrl(rawUrl);
  const pending = jobFetchCandidates(url);
  const tried = new Set<string>();
  const blockedScopes = new Set<string>();

  while (pending.length > 0) {
    const candidate = pending.shift();
    if (!candidate || tried.has(candidate.href)) continue;
    tried.add(candidate.href);
    if (blockedScopes.has(challengeScope(candidate.hostname))) continue;
    if (candidate.href !== url.href) {
      await assertSafePublicUrl(candidate.href);
    }
    const got = await fetchDirectHtml(candidate);
    if (!got) continue;
    if (isChallengeHtml(got.html)) {
      blockedScopes.add(challengeScope(got.finalUrl.hostname));
      blockedScopes.add(challengeScope(candidate.hostname));
      continue;
    }
    const text = extractJobTextFromHtml(got.html);
    if (text.length >= MIN_JOB_CHARS) return text.slice(0, MAX_JOB_CHARS);
    for (const extra of jobFetchCandidates(got.finalUrl)) {
      if (!tried.has(extra.href)) pending.push(extra);
    }
  }

  for (const target of readerTargets(url)) {
    if (target.href !== url.href) {
      await assertSafePublicUrl(target.href);
    }
    const fromReader = await fetchViaReader(target);
    if (fromReader) return fromReader;
  }

  const browserTarget = jobFetchCandidates(url)[0] ?? url;
  if (browserTarget.href !== url.href) {
    await assertSafePublicUrl(browserTarget.href);
  }
  const fromBrowser = await fetchViaBrowser(browserTarget);
  if (fromBrowser) return fromBrowser;

  throw new Error(TOO_SHORT_ERROR);
}
