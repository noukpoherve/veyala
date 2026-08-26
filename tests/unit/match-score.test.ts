import { describe, expect, it } from "vitest";
import {
  scoreCvAgainstJob,
  cvCorpus,
  normalizeTerm,
  compareMatchBreakdown,
  promoteRequirementsInCv,
  applyClaimsToCv,
  projectScoreWithClaims,
  sanitizeSkillsAgainstBase,
  withSoftSkillsGroup,
  parseMatchBreakdown,
  unionSoftSkills,
  finalizeTailoredCv,
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
      companyUrl: "",
      place: "Paris",
      dates: "2020-2024",
      bullets: ["Mise en place de CI/CD", "Apps React performantes"],
      stack: ["React", "TypeScript", "Node.js"],
      links: [],
      included: true,
    },
  ],
  projects: [],
  education: [],
  certifications: [],
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

  it("captures soft-skill sections and catalog mentions", () => {
    const text = `
Soft skills:
- Autonomie
- Esprit d'équipe
À propos
Quelqu'un de très autonome pour le poste.
`;
    const req = extractRequirementsHeuristic(text);
    expect(req.softSkills.join(" ").toLowerCase()).toMatch(/autonomie|esprit/);
  });

  it("skips oversized lines and falls back to first title-like line", () => {
    const long = "x".repeat(100);
    const text = `Ingénieur backend Node\n${long}\n- ok\n`;
    const req = extractRequirementsHeuristic(text);
    expect(req.title.toLowerCase()).toContain("ingénieur");
  });
});

describe("sanitizeSkillsAgainstBase / withSoftSkillsGroup", () => {
  it("drops invented hard skills but keeps claimed soft skills", () => {
    const crafted: CVData = {
      ...baseCv,
      softSkills: ["Autonomie"],
      skills: [
        { category: "Frontend", items: ["React", "ZigLang"] },
        { category: "Soft skills", items: ["old"] },
      ],
    };
    const sanitized = sanitizeSkillsAgainstBase(crafted, baseCv);
    expect(sanitized.skills.flatMap((g) => g.items)).toContain("React");
    expect(sanitized.skills.flatMap((g) => g.items)).not.toContain("ZigLang");
    expect(sanitized.softSkills).toContain("Autonomie");

    const emptyHard: CVData = {
      ...baseCv,
      skills: [{ category: "X", items: ["UnknownTool"] }],
      softSkills: [],
    };
    expect(sanitizeSkillsAgainstBase(emptyHard, baseCv).skills).toEqual(baseCv.skills);

    const grouped = withSoftSkillsGroup({ ...baseCv, softSkills: ["Autonomie"] });
    expect(grouped.skills.some((g) => g.category === "Soft skills")).toBe(true);
    expect(
      withSoftSkillsGroup({ ...baseCv, softSkills: [] }).skills.some(
        (g) => g.category === "Soft skills"
      )
    ).toBe(false);
  });

  it("keeps profile soft skills even if the LLM returns a different non-empty list", () => {
    const profile: CVData = { ...baseCv, softSkills: ["Autonomie", "Rigueur"] };
    const llm: CVData = {
      ...baseCv,
      softSkills: ["Communication"],
      skills: [{ category: "Frontend", items: ["React"] }],
    };
    const finalized = finalizeTailoredCv(llm, profile, {
      title: "Dev",
      mustHave: [],
      niceHave: [],
      tools: [],
      softSkills: [],
    });
    expect(finalized.softSkills).toEqual(
      expect.arrayContaining(["Autonomie", "Rigueur", "Communication"])
    );
    const group = finalized.skills.find((g) => g.category === "Soft skills");
    expect(group?.items).toEqual(expect.arrayContaining(["Autonomie", "Rigueur", "Communication"]));
  });

  it("unions claimed matching gaps with the profile catalog", () => {
    expect(unionSoftSkills(["Autonomie"], ["autonomie"], ["Rigueur"])).toEqual([
      "Autonomie",
      "Rigueur",
    ]);
  });
});

describe("parseMatchBreakdown", () => {
  it("returns null for invalid payloads", () => {
    expect(parseMatchBreakdown(null)).toBeNull();
    expect(parseMatchBreakdown({ before: {}, after: {} })).toBeNull();
  });
});

describe("promoteRequirementsInCv summary", () => {
  it("appends and truncates a long summary when promoting covered terms", () => {
    const cv: CVData = {
      ...baseCv,
      summary: "A".repeat(470),
      skills: [{ category: "Autres", items: ["CSS"] }],
      experiences: [
        {
          ...baseCv.experiences[0]!,
          stack: ["GraphQL", "AWS"],
          bullets: ["GraphQL AWS"],
        },
      ],
    };
    const promoted = promoteRequirementsInCv(cv, {
      title: "Backend",
      mustHave: ["GraphQL"],
      niceHave: [],
      tools: ["AWS"],
      softSkills: [],
    });
    expect(promoted.summary.length).toBeLessThanOrEqual(480);
    expect(promoted.summary).toMatch(/…$/);
  });
});
