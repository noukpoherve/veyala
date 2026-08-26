import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSafePublicUrl } from "@/lib/job-url";
import {
  extractIndeedJobKey,
  extractJobTextFromHtml,
  extractLinkedInJobId,
  fetchJobText,
  jobFetchCandidates,
  looksLikeBotWall,
  looksLikeLoginWall,
} from "@/lib/fetch-job-text";

const AWS_WAF_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <script type="text/javascript">
    window.awsWafCookieDomainList = [];
  </script>
  <script src="https://b9847fd4f6bc.4e4c5266.eu-west-1.token.awswaf.com/challenge.js"></script>
</head>
<body>
  <div id="challenge-container"></div>
  <noscript>
    <h1>JavaScript is disabled</h1>
    In order to continue, we need to verify that you're not a robot.
    This requires JavaScript. Enable JavaScript and then reload the page.
  </noscript>
</body>
</html>`;

const JOB_POSTING_HTML = `<!DOCTYPE html>
<html>
<head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Assistant Projets IA & Machine Learning H/F",
  "hiringOrganization": { "@type": "Organization", "name": "Crédit Agricole CIB" },
  "employmentType": "INTERN",
  "jobLocation": { "@type": "Place", "address": { "addressLocality": "Montrouge" } },
  "description": "<p>Vous recherchons un stage en IA. Missions : construire un agent LLM, revue de littérature, Python.</p>"
}
</script>
</head>
<body>
  <header>Welcome to the Jungle</header>
  <main>
    <h1>Assistant Projets IA</h1>
    <p>Stage à Montrouge. Compétences : Large Language Models, Python, validation de modèles.</p>
  </main>
  <footer>Mentions légales</footer>
</body>
</html>`;

const OFFER_URL = "https://1.1.1.1/jobs/assistant-ia";

const LINKEDIN_LOGIN_HTML = `<!DOCTYPE html>
<html lang="fr-FR">
<head><title>S’identifier sur LinkedIn | LinkedIn</title></head>
<body>
  <h1>S’identifier</h1>
  <p>LinkedIn et des tiers utilisent des cookies essentiels et non essentiels pour fournir,
  sécuriser, analyser et améliorer nos Services, et pour vous montrer des publicités pertinentes
  (notamment des professionnels et des offres d’emploi) sur et en dehors de LinkedIn.</p>
  <p>Sélectionnez Accepter pour approuver ou Refuser pour décliner les cookies non essentiels.</p>
</body>
</html>`;

const LINKEDIN_GUEST_HTML = `<section class="top-card-layout">
  <h1 class="top-card-layout__title">ALTERNANCE Intégrateur frontend H/F</h1>
  <div class="show-more-less-html__markup">
    <p>Description Leadformance propose aux professionnels des solutions de localisation
    de leurs points de vente et une plateforme BRIDGE de mini-sites magasin.</p>
    <p>Missions : intégration frontend, Node.js, Angular, Nest.js, PHP, Symfony 6+,
    JavaScript ES6+ et TypeScript. Collaboration avec les développeurs et le support client.</p>
    <p>Profil : envie de maîtriser les langages du web et de livrer des store locators fluides.</p>
  </div>
</section>`;

const LINKEDIN_SEARCH =
  "https://www.linkedin.com/jobs/search-results/?currentJobId=4436374876&keywords=alternance%20developpeur%20web";

const INDEED_HOME = "https://fr.indeed.com/?vjk=c146417851f6aeb6";

const INDEED_SECURITY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Security Check - Indeed.com</title>
  <script>window.INDEED_CLOUDFLARE_STATIC_PAGE={PAGE_TYPE:"captcha"};</script>
</head>
<body>
  <nav><a href="/">Find jobs</a></nav>
  <main><h1>Additional Verification Required</h1><p>Please enable JavaScript to complete the security check.</p></main>
</body>
</html>`;

const INDEED_EMBEDDED_HTML = `<!DOCTYPE html>
<html>
<head><title>Architecte Web - Indeed.com</title></head>
<body>
<script>
window._initialData = {"jobTitle":"[Alternance] Architecte Web & Sécurité (Next.js / Node.js / DevOps)","jobInfoWrapperModel":{"jobInfoModel":{"jobInfoHeaderModel":{"jobTitle":"[Alternance] Architecte Web & Sécurité (Next.js / Node.js / DevOps)","companyName":"CLOUD CAMPUS","subtitle":"CLOUD CAMPUS - Paris (75)"},"sanitizedJobDescription":"<p>Tu es un développeur expérimenté et tu souhaites prendre de la hauteur sur l'architecture, l'infrastructure Cloud et la cybersécurité. Tu architectures des applications avec Next.js, Node.js et DevOps pour des plateformes SaaS critiques.</p>"}}};
</script>
</body>
</html>`;

function mockResponse(body: string, init?: { status?: number; url?: string }): Response {
  const status = init?.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    url: init?.url ?? OFFER_URL,
    text: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("looksLikeBotWall", () => {
  it("detects AWS WAF challenge pages", () => {
    expect(looksLikeBotWall(AWS_WAF_HTML)).toBe(true);
  });

  it("does not flag a normal job posting", () => {
    expect(looksLikeBotWall(JOB_POSTING_HTML)).toBe(false);
  });

  it("detects Indeed Cloudflare security checks", () => {
    expect(looksLikeBotWall(INDEED_SECURITY_HTML)).toBe(true);
  });
});

describe("extractJobTextFromHtml", () => {
  it("reads JSON-LD JobPosting even when scripts are present", () => {
    const text = extractJobTextFromHtml(JOB_POSTING_HTML);
    expect(text).toMatch(/Assistant Projets IA/);
    expect(text).toMatch(/Crédit Agricole CIB/);
    expect(text).toMatch(/agent LLM/);
    expect(text).not.toMatch(/Mentions légales/);
    expect(text).not.toMatch(/Welcome to the Jungle/);
  });

  it("returns empty text for a bot-challenge shell", () => {
    expect(extractJobTextFromHtml(AWS_WAF_HTML)).toBe("");
  });

  it("returns empty text for a LinkedIn login wall", () => {
    expect(extractJobTextFromHtml(LINKEDIN_LOGIN_HTML)).toBe("");
    expect(looksLikeLoginWall(LINKEDIN_LOGIN_HTML)).toBe(true);
  });

  it("reads the public LinkedIn job markup, not the sign-in chrome", () => {
    const text = extractJobTextFromHtml(LINKEDIN_GUEST_HTML);
    expect(text).toMatch(/ALTERNANCE Intégrateur frontend/);
    expect(text).toMatch(/Node\.js/);
    expect(text).toMatch(/Missions/);
    expect(looksLikeLoginWall(LINKEDIN_GUEST_HTML, text)).toBe(false);
  });

  it("returns empty text for an Indeed security check", () => {
    expect(extractJobTextFromHtml(INDEED_SECURITY_HTML)).toBe("");
  });

  it("reads Indeed window._initialData instead of the empty SPA shell", () => {
    const text = extractJobTextFromHtml(INDEED_EMBEDDED_HTML);
    expect(text).toMatch(/Architecte Web/);
    expect(text).toMatch(/CLOUD CAMPUS/);
    expect(text).toMatch(/Next\.js/);
    expect(text).toMatch(/cybersécurité|DevOps/);
  });

  it("reads a JobPosting hydrated in __NEXT_DATA__", () => {
    const html = `<!DOCTYPE html><html><head></head><body>
      <div id="__next"></div>
      <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
        props: {
          pageProps: {
            job: {
              jobTitle: "Développeur React",
              companyName: "ACME Studio",
              jobDescription:
                "<p>Nous recrutons un développeur React et TypeScript pour l'équipe produit. Missions : features, tests, CI, Next.js et accessibilité.</p>",
            },
          },
        },
      })}</script>
    </body></html>`;
    const text = extractJobTextFromHtml(html);
    expect(text).toMatch(/Développeur React/);
    expect(text).toMatch(/ACME Studio/);
    expect(text).toMatch(/TypeScript/);
  });
});

describe("extractLinkedInJobId", () => {
  it("reads currentJobId from a search-results URL", () => {
    expect(extractLinkedInJobId(new URL(LINKEDIN_SEARCH))).toBe("4436374876");
  });

  it("reads the id from /jobs/view and slug URLs", () => {
    expect(extractLinkedInJobId(new URL("https://www.linkedin.com/jobs/view/4436374876"))).toBe(
      "4436374876"
    );
    expect(
      extractLinkedInJobId(
        new URL(
          "https://www.linkedin.com/jobs/view/alternance-integrateur-frontend-at-solocal-4436374876"
        )
      )
    ).toBe("4436374876");
  });

  it("puts the public guest posting ahead of a search URL", () => {
    const candidates = jobFetchCandidates(new URL(LINKEDIN_SEARCH)).map((u) => u.href);
    expect(candidates[0]).toBe(
      "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/4436374876"
    );
    expect(candidates[1]).toBe("https://www.linkedin.com/jobs/view/4436374876");
  });
});

describe("extractIndeedJobKey", () => {
  it("reads vjk from the Indeed homepage overlay URL", () => {
    expect(extractIndeedJobKey(new URL(INDEED_HOME))).toBe("c146417851f6aeb6");
  });

  it("reads jk from /viewjob", () => {
    expect(extractIndeedJobKey(new URL("https://fr.indeed.com/viewjob?jk=c146417851f6aeb6"))).toBe(
      "c146417851f6aeb6"
    );
  });

  it("puts the mobile viewjob page ahead of the homepage overlay", () => {
    const candidates = jobFetchCandidates(new URL(INDEED_HOME)).map((u) => u.href);
    expect(candidates[0]).toBe(
      "https://fr.indeed.com/m/basecamp/viewjob?viewtype=embedded&jk=c146417851f6aeb6"
    );
    expect(candidates[1]).toBe(
      "https://www.indeed.com/m/basecamp/viewjob?viewtype=embedded&jk=c146417851f6aeb6"
    );
  });
});

describe("jobFetchCandidates (generic boards)", () => {
  it("turns a search overlay with currentJobId into same-origin job URLs", () => {
    const url = new URL("https://careers.example.com/jobs/search?currentJobId=abc123xyz");
    const hrefs = jobFetchCandidates(url).map((u) => u.href);
    expect(hrefs[0]).toBe("https://careers.example.com/jobs/view/abc123xyz");
    expect(hrefs).toContain("https://careers.example.com/jobs/abc123xyz");
  });

  it("rewrites a France Travail listing id to the public detail page", () => {
    const url = new URL("https://www.francetravail.fr/offres/recherche.html?idOffre=123ABC456");
    const hrefs = jobFetchCandidates(url).map((u) => u.href);
    expect(hrefs[0]).toBe("https://candidat.francetravail.fr/offres/recherche/detail/123ABC456");
  });
});

describe("fetchJobText", () => {
  it("returns extracted HTML when the site serves the offer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(JOB_POSTING_HTML))
    );

    const text = await fetchJobText(OFFER_URL);
    expect(text).toMatch(/Machine Learning/);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("falls back to the reader when AWS WAF blocks the page", async () => {
    const readerMarkdown = `Title: Assistant Projets IA & Machine Learning H/F
Markdown Content:
Vous recherchez un stage en IA dans l'environnement bancaire.
Missions : construire un agent autonome, Large Language Models, revue de littérature.
Le département VRM valide les modèles de risques de marché.`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const href = String(input);
        if (href.startsWith("https://r.jina.ai/")) {
          return mockResponse(readerMarkdown, { url: href });
        }
        return mockResponse(AWS_WAF_HTML, { status: 202 });
      })
    );

    const text = await fetchJobText(OFFER_URL);
    expect(text).toMatch(/Large Language Models/);
    expect(text).toMatch(/agent autonome/);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws when both the site and the reader fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(AWS_WAF_HTML, { status: 202 }))
    );

    await expect(fetchJobText(OFFER_URL)).rejects.toThrow(/trop court ou bloqué/i);
  });

  it("fetches the public LinkedIn posting instead of the search login wall", async () => {
    try {
      await assertSafePublicUrl("https://www.linkedin.com/jobs/view/4436374876");
    } catch (e) {
      if (e instanceof Error && /résoudre/.test(e.message)) return;
      throw e;
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const href = String(input);
        if (href.includes("jobs-guest")) {
          return mockResponse(LINKEDIN_GUEST_HTML, { url: href });
        }
        if (href.includes("r.jina.ai") || href.includes("jobs/view")) {
          throw new Error("should not need view/reader when guest HTML is enough");
        }
        return mockResponse(LINKEDIN_LOGIN_HTML, {
          status: 200,
          url: "https://www.linkedin.com/uas/login?session_redirect=%2Fjobs%2Fsearch-results%2F",
        });
      })
    );

    const text = await fetchJobText(LINKEDIN_SEARCH);
    expect(text).toMatch(/Leadformance|BRIDGE|Node\.js/);
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain("jobs-guest");
  });

  it("fetches the Indeed mobile posting instead of the homepage captcha", async () => {
    try {
      await assertSafePublicUrl("https://fr.indeed.com/viewjob?jk=c146417851f6aeb6");
    } catch (e) {
      if (e instanceof Error && /résoudre/.test(e.message)) return;
      throw e;
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const href = String(input);
        if (href.includes("basecamp")) {
          return mockResponse(INDEED_EMBEDDED_HTML, { url: href });
        }
        if (href.includes("r.jina.ai")) {
          throw new Error("should not need the reader when basecamp HTML is enough");
        }
        return mockResponse(INDEED_SECURITY_HTML, { status: 403, url: href });
      })
    );

    const text = await fetchJobText(INDEED_HOME);
    expect(text).toMatch(/CLOUD CAMPUS/);
    expect(text).toMatch(/Next\.js/);
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain("basecamp");
    const firstInit = vi.mocked(fetch).mock.calls[0]?.[1] as { headers?: Record<string, string> };
    expect(firstInit?.headers?.["User-Agent"]).toMatch(/iPhone/);
  });

  it("stops retrying Indeed once Cloudflare blocks a candidate", async () => {
    try {
      await assertSafePublicUrl("https://fr.indeed.com/viewjob?jk=c146417851f6aeb6");
    } catch (e) {
      if (e instanceof Error && /résoudre/.test(e.message)) return;
      throw e;
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const href = String(input);
        if (href.startsWith("https://r.jina.ai/")) {
          return mockResponse("Just a moment... challenges.cloudflare.com", { url: href });
        }
        return mockResponse(INDEED_SECURITY_HTML, { status: 403, url: href });
      })
    );

    await expect(fetchJobText(INDEED_HOME)).rejects.toThrow(/trop court ou bloqué/i);
    const indeedHits = vi.mocked(fetch).mock.calls.filter(([input]) => {
      const href = String(input);
      return href.includes("indeed.com") && !href.includes("r.jina.ai");
    });
    expect(indeedHits).toHaveLength(1);
  });
});
