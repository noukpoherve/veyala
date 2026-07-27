import { describe, expect, it } from "vitest";
import {
  scoreCvAgainstJob,
  cvCorpus,
  normalizeTerm,
  compareMatchBreakdown,
  promoteRequirementsInCv,
  applyClaimsToCv,
  projectScoreWithClaims,
} from "@/lib/match-score";
import { extractRequirementsHeuristic } from "@/lib/job-requirements";
import type { CVData } from "@/lib/cv-schema";

const baseCv: CVData = {
  identity: { fullName: "Ada Lovelace", headline: "Développeuse Full Stack React", photoUrl: "" },
  contact: { email: "", phone: "", location: "", links: [], details: [] },
  summary: "Experte React et TypeScript avec 5 ans d'expérience.",
  experiences: [
    {
      title: "Développeuse frontend",
      company: "Acme",
      place: "Paris",
      dates: "2020-2024",
      bullets: ["Mise en place de CI/CD", "Apps React performantes"],
      stack: ["React", "TypeScript", "Node.js"],
    },
  ],
  education: [],
  skills: [
    { category: "Frontend", items: ["React", "TypeScript", "CSS"] },
    { category: "Backend", items: ["Node.js", "PostgreSQL"] },
  ],
  languages: [{ name: "Anglais", level: "courant" }],
  softSkills: [],
  interests: [],
};

describe("normalizeTerm", () => {
  it("strips accents and lowercases", () => {
    expect(normalizeTerm("Développeur")).toBe("developpeur");
  });
});

describe("scoreCvAgainstJob", () => {
  it("scores high when must-haves are present", () => {
    const result = scoreCvAgainstJob(baseCv, {
      title: "Frontend",
      mustHave: ["React", "TypeScript"],
      niceHave: ["GraphQL"],
      tools: ["Node.js"],
      softSkills: ["Communication"],
    });
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.items.find((i) => i.term === "React")?.status).toBe("covered");
    expect(result.items.find((i) => i.term === "GraphQL")?.status).toBe("missing");
  });

  it("is deterministic", () => {
    const req = {
      title: "Dev",
      mustHave: ["React", "Kubernetes"],
      niceHave: ["Docker"],
      tools: ["AWS"],
      softSkills: [],
    };
    expect(scoreCvAgainstJob(baseCv, req)).toEqual(scoreCvAgainstJob(baseCv, req));
  });

  it("returns 0 when the checklist is empty", () => {
    expect(
      scoreCvAgainstJob(baseCv, {
        title: "",
        mustHave: [],
        niceHave: [],
        tools: [],
        softSkills: [],
      }).score
    ).toBe(0);
  });
});

describe("cvCorpus", () => {
  it("includes skills and stack", () => {
    const corpus = cvCorpus(baseCv);
    expect(corpus).toContain("react");
    expect(corpus).toContain("typescript");
  });
});

describe("compareMatchBreakdown", () => {
  it("flags improvements and remaining gaps", () => {
    const rows = compareMatchBreakdown({
      before: {
        score: 40,
        covered: 1,
        total: 3,
        items: [
          { term: "React", kind: "must", status: "covered" },
          { term: "Kubernetes", kind: "must", status: "missing" },
          { term: "GraphQL", kind: "nice", status: "missing" },
        ],
      },
      after: {
        score: 70,
        covered: 2,
        total: 3,
        items: [
          { term: "React", kind: "must", status: "covered" },
          { term: "Kubernetes", kind: "must", status: "partial" },
          { term: "GraphQL", kind: "nice", status: "missing" },
        ],
      },
    });
    const k8s = rows.find((r) => r.term === "Kubernetes");
    const gql = rows.find((r) => r.term === "GraphQL");
    expect(k8s?.improved).toBe(true);
    expect(k8s?.stillMissing).toBe(false);
    expect(gql?.stillMissing).toBe(true);
    expect(gql?.improved).toBe(false);
  });
});

describe("promoteRequirementsInCv", () => {
  it("surfaces offer wording for skills evidenced via aliases without inventing", () => {
    const cv: CVData = {
      ...baseCv,
      skills: [{ category: "Frontend", items: ["JS", "CSS"] }],
    };
    const boosted = promoteRequirementsInCv(cv, {
      title: "Frontend",
      mustHave: ["JavaScript", "Kubernetes"],
      niceHave: [],
      tools: [],
      softSkills: [],
    });
    const items = boosted.skills.flatMap((g) => g.items);
    expect(items.some((i) => /javascript/i.test(i))).toBe(true);
    expect(items.some((i) => /kubernetes/i.test(i))).toBe(false);
  });
});

describe("applyClaimsToCv", () => {
  it("raises projected score when claiming missing skills", () => {
    const req = {
      title: "Dev",
      mustHave: ["React", "Kubernetes"],
      niceHave: [],
      tools: ["Docker"],
      softSkills: ["Autonomie"],
    };
    const before = scoreCvAgainstJob(baseCv, req);
    const claims = [
      { term: "Kubernetes", kind: "must" as const },
      { term: "Docker", kind: "tool" as const },
      { term: "Autonomie", kind: "soft" as const },
    ];
    const projected = projectScoreWithClaims(baseCv, req, claims);
    expect(projected.score).toBeGreaterThan(before.score);
    expect(projected.score).toBeGreaterThanOrEqual(80);
    const enriched = applyClaimsToCv(baseCv, claims);
    expect(enriched.softSkills).toContain("Autonomie");
  });
});

describe("extractRequirementsHeuristic", () => {
  it("pulls tech tokens and section bullets", () => {
    const text = `
Poste: Développeur React
Compétences:
- React
- TypeScript
- Docker
Missions:
- Développer des features
`;
    const req = extractRequirementsHeuristic(text);
    expect(req.mustHave.join(" ").toLowerCase()).toMatch(/react|typescript/);
    expect(req.tools.map((t) => t.toLowerCase())).toEqual(
      expect.arrayContaining(["react", "typescript", "docker"])
    );
  });
});
