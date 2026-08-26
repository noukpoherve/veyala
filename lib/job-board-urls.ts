/**
 * Turns a pasted job-board URL (search overlay, homepage card, tracking
 * junk) into a short list of public pages worth fetching. Host recipes cover
 * boards that hide the offer behind a login/search shell; unknown sites get
 * same-origin guesses from a job id in the query string.
 */

const LINKEDIN_JOB_ID_RE = /^\d{6,20}$/;
const INDEED_JOB_KEY_RE = /^[a-f0-9]{10,32}$/i;
const GENERIC_JOB_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{5,79}$/;

const OVERLAY_PATH_RE = /^\/$|search|jobs\/search|offres\/recherche|emploi\/?$/i;

const GENERIC_ID_PARAMS = [
  "currentJobId",
  "jobId",
  "job_id",
  "jk",
  "vjk",
  "offerId",
  "offreId",
  "offre_id",
  "gh_jid",
  "vacancyId",
  "postingId",
  "advertId",
  "idOffre",
  "offreIdOrigine",
] as const;

const TRACKING_PARAM_RE = /^(utm_|fbclid|gclid|msclkid|trk|tracking|refId|eBP|origin)/i;

export function hostIs(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}

function originOf(url: URL): string {
  return `https://${url.hostname}`;
}

export function stripTrackingParams(url: URL): URL {
  const next = new URL(url.href);
  for (const key of Array.from(next.searchParams.keys())) {
    if (TRACKING_PARAM_RE.test(key)) next.searchParams.delete(key);
  }
  return next;
}

export function extractLinkedInJobId(url: URL): string | null {
  if (!hostIs(url.hostname, "linkedin.com") && url.hostname.toLowerCase() !== "lnkd.in") {
    return null;
  }
  for (const key of ["currentJobId", "jobId"]) {
    const value = url.searchParams.get(key);
    if (value && LINKEDIN_JOB_ID_RE.test(value)) return value;
  }
  const match =
    url.pathname.match(/\/jobs\/view\/(?:[\w.%+-]+-)?(\d{6,20})\/?$/i) ??
    url.pathname.match(/\/jobs-guest\/jobs\/api\/jobPosting\/(\d{6,20})\/?$/i);
  return match?.[1] ?? null;
}

export function extractIndeedJobKey(url: URL): string | null {
  if (!hostIs(url.hostname, "indeed.com")) return null;
  for (const key of ["vjk", "jk"]) {
    const value = url.searchParams.get(key);
    if (value && INDEED_JOB_KEY_RE.test(value)) return value.toLowerCase();
  }
  return null;
}

function queryId(url: URL, keys: string[], test: (v: string) => boolean): string | null {
  for (const key of keys) {
    const value = url.searchParams.get(key);
    if (value && test(value)) return value;
  }
  return null;
}

function pathId(url: URL, pattern: RegExp): string | null {
  const match = url.pathname.match(pattern);
  return match?.[1] ?? null;
}

export function extractGenericJobId(url: URL): string | null {
  for (const key of GENERIC_ID_PARAMS) {
    const value = url.searchParams.get(key);
    if (value && GENERIC_JOB_ID_RE.test(value)) return value;
  }
  return (
    pathId(
      url,
      /\/(?:jobs?|offres?|vacanc(?:y|ies)|postings?|emploi)\/(?:[\w.%+-]+-)?([a-zA-Z0-9_-]{6,80})\/?$/i
    ) ?? null
  );
}

function isOverlayUrl(url: URL): boolean {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return OVERLAY_PATH_RE.test(path);
}

type Recipe = {
  match: (hostname: string) => boolean;
  id: (url: URL) => string | null;
  candidates: (url: URL, id: string) => URL[];
  /** Skip same-origin generic guesses (they 404 or trip anti-bot). */
  exclusive?: boolean;
};

const RECIPES: Recipe[] = [
  {
    match: (h) => hostIs(h, "linkedin.com") || h.toLowerCase() === "lnkd.in",
    id: extractLinkedInJobId,
    exclusive: true,
    candidates: (_url, id) => [
      new URL(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`),
      new URL(`https://www.linkedin.com/jobs/view/${id}`),
    ],
  },
  {
    match: (h) => hostIs(h, "indeed.com"),
    id: extractIndeedJobKey,
    exclusive: true,
    candidates: (url, id) => {
      const host = url.hostname.toLowerCase();
      const origin = host === "indeed.com" ? "https://www.indeed.com" : originOf(url);
      const out = [new URL(`${origin}/m/basecamp/viewjob?viewtype=embedded&jk=${id}`)];
      if (origin !== "https://www.indeed.com") {
        out.push(new URL(`https://www.indeed.com/m/basecamp/viewjob?viewtype=embedded&jk=${id}`));
      }
      return out;
    },
  },
  {
    match: (h) => hostIs(h, "glassdoor.com") || hostIs(h, "glassdoor.fr"),
    id: (url) => queryId(url, ["jl", "jobListingId"], (v) => /^\d{6,20}$/.test(v)),
    candidates: (url, id) => [new URL(`${originOf(url)}/job-listing/job?jl=${id}`)],
  },
  {
    match: (h) => hostIs(h, "francetravail.fr") || hostIs(h, "pole-emploi.fr"),
    id: (url) =>
      pathId(url, /\/detail\/([^/]+)\/?$/i) ??
      queryId(url, ["idOffre", "offreIdOrigine", "offreId"], (v) => GENERIC_JOB_ID_RE.test(v)),
    candidates: (_url, id) => [
      new URL(`https://candidat.francetravail.fr/offres/recherche/detail/${id}`),
    ],
  },
  {
    match: (h) => hostIs(h, "apec.fr"),
    id: (url) =>
      pathId(url, /\/detail-offre\/(\d+)\/?$/i) ??
      queryId(url, ["numIdOffre"], (v) => /^\d+$/.test(v)),
    candidates: (_url, id) => [
      new URL(`https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/${id}`),
    ],
  },
  {
    match: (h) => hostIs(h, "hellowork.com") || hostIs(h, "regionsjob.com"),
    id: (url) => pathId(url, /-(\d+)\.html?$/i) ?? queryId(url, ["id"], (v) => /^\d{5,}$/.test(v)),
    candidates: (url, id) => [new URL(`${originOf(url)}/emploi/${id}.html`)],
  },
  {
    match: (h) => hostIs(h, "monster.fr") || hostIs(h, "monster.com"),
    id: (url) => queryId(url, ["jobid", "id"], (v) => GENERIC_JOB_ID_RE.test(v)),
    candidates: (url, id) => [new URL(`${originOf(url)}/poste/emploi-${id}`)],
  },
  {
    match: (h) => hostIs(h, "welcometothejungle.com"),
    id: (url) => pathId(url, /\/jobs\/([^/]+)\/?$/i),
    candidates: (url, id) => {
      const parts = url.pathname.split("/").filter(Boolean);
      const company = parts.includes("companies") ? parts[parts.indexOf("companies") + 1] : null;
      if (!company) return [];
      const locale = parts[0] === "en" ? "en" : "fr";
      return [
        new URL(`https://www.welcometothejungle.com/${locale}/companies/${company}/jobs/${id}`),
      ];
    },
  },
  {
    match: (h) => hostIs(h, "greenhouse.io"),
    id: (url) =>
      queryId(url, ["gh_jid", "token"], (v) => /^\d{5,}$/.test(v)) ??
      pathId(url, /\/jobs\/(\d+)\/?$/i),
    candidates: (url, id) => {
      if (/\/jobs\/\d+/.test(url.pathname)) return [];
      return [new URL(`${originOf(url)}/embed/job_app?token=${id}`)];
    },
  },
  {
    match: (h) => hostIs(h, "lever.co"),
    id: (url) => pathId(url, /\/([0-9a-f-]{8,})\/?$/i),
    candidates: () => [],
  },
  {
    match: (h) => hostIs(h, "smartrecruiters.com"),
    id: (url) => pathId(url, /\/([\w-]+)\/?$/i),
    candidates: () => [],
  },
  {
    match: (h) => hostIs(h, "workable.com"),
    id: (url) =>
      pathId(url, /\/(?:jobs|j)\/([^/]+)\/?$/i) ??
      queryId(url, ["jid"], (v) => GENERIC_JOB_ID_RE.test(v)),
    candidates: () => [],
  },
  {
    match: (h) => hostIs(h, "ashbyhq.com"),
    id: (url) => pathId(url, /\/([^/]+)\/?$/i),
    candidates: () => [],
  },
  {
    match: (h) => hostIs(h, "teamtailor.com"),
    id: (url) => pathId(url, /\/jobs\/([^/]+)\/?$/i),
    candidates: () => [],
  },
  {
    match: (h) => hostIs(h, "recruitee.com"),
    id: (url) => pathId(url, /\/o\/([^/]+)\/?$/i),
    candidates: () => [],
  },
  {
    match: (h) => hostIs(h, "jobteaser.com"),
    id: (url) => pathId(url, /\/(?:job-offers|offres-emploi)\/([^/]+)\/?$/i),
    candidates: () => [],
  },
  {
    match: (h) => hostIs(h, "cadremploi.fr"),
    id: (url) =>
      pathId(url, /\/detail[_-]offre[_-](\d+)/i) ??
      queryId(url, ["idOffre"], (v) => /^\d+$/.test(v)),
    candidates: (url, id) => [new URL(`${originOf(url)}/emploi/${id}.html`)],
  },
  {
    match: (h) => hostIs(h, "ziprecruiter.com"),
    id: (url) =>
      pathId(url, /\/jobs?\/(?:[\w-]+-)?([a-z0-9]{8,})\/?$/i) ??
      queryId(url, ["lvk"], (v) => GENERIC_JOB_ID_RE.test(v)),
    candidates: () => [],
  },
];

function genericSameOriginGuesses(url: URL, id: string): URL[] {
  const origin = originOf(url);
  const encoded = encodeURIComponent(id);
  return [
    new URL(`${origin}/jobs/view/${encoded}`),
    new URL(`${origin}/jobs/${encoded}`),
    new URL(`${origin}/viewjob?jk=${encoded}`),
  ];
}

const MAX_CANDIDATES = 6;

/** Public pages to try, recipes first, original URL last. */
export function jobFetchCandidates(url: URL): URL[] {
  const seen = new Set<string>();
  const out: URL[] = [];
  const push = (candidate: URL) => {
    if (seen.has(candidate.href) || out.length >= MAX_CANDIDATES) return;
    seen.add(candidate.href);
    out.push(candidate);
  };

  let exclusive = false;
  for (const recipe of RECIPES) {
    if (!recipe.match(url.hostname)) continue;
    const id = recipe.id(url);
    if (id) {
      for (const candidate of recipe.candidates(url, id)) push(candidate);
    }
    if (recipe.exclusive) exclusive = true;
  }

  if (!exclusive) {
    const genericId = extractGenericJobId(url);
    if (genericId && isOverlayUrl(url)) {
      for (const candidate of genericSameOriginGuesses(url, genericId)) push(candidate);
    }
  }

  const stripped = stripTrackingParams(url);
  push(stripped);
  push(url);
  return out;
}

/** URLs the JS-rendering reader should try (job page, not the search shell). */
export function readerTargets(url: URL): URL[] {
  const seen = new Set<string>();
  const out: URL[] = [];
  const push = (candidate: URL) => {
    if (seen.has(candidate.href) || out.length >= 2) return;
    seen.add(candidate.href);
    out.push(candidate);
  };
  const linkedInId = extractLinkedInJobId(url);
  if (linkedInId) push(new URL(`https://www.linkedin.com/jobs/view/${linkedInId}`));
  const indeedKey = extractIndeedJobKey(url);
  if (indeedKey) {
    const host = url.hostname.toLowerCase();
    const origin =
      host === "indeed.com" || host.endsWith(".indeed.com")
        ? originOf(url)
        : "https://www.indeed.com";
    const viewOrigin = host === "indeed.com" ? "https://www.indeed.com" : origin;
    push(new URL(`${viewOrigin}/viewjob?jk=${indeedKey}`));
  }
  for (const candidate of jobFetchCandidates(url)) {
    if (
      /\/jobs\/view|\/viewjob|\/detail\/|\/jobs\/[^/]+$/.test(
        `${candidate.pathname}${candidate.search}`
      )
    ) {
      push(candidate);
    }
  }
  push(stripTrackingParams(url));
  push(url);
  return out;
}

const MOBILE_FIRST_DOMAINS = [
  "indeed.com",
  "glassdoor.com",
  "glassdoor.fr",
  "monster.com",
  "monster.fr",
  "ziprecruiter.com",
  "stepstone.fr",
  "stepstone.com",
];

export function prefersMobileUserAgent(hostname: string): boolean {
  return MOBILE_FIRST_DOMAINS.some((domain) => hostIs(hostname, domain));
}
