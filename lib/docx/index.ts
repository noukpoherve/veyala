import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Header,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  VerticalPositionRelativeFrom,
  WidthType,
} from "docx";
import type { CVData } from "@/lib/cv-schema";
import { normalizeHttpUrl, parseInlineLinks } from "@/lib/inline-links";
import { withSoftSkillsGroup } from "@/lib/match-score";
import type { SectionId, TemplateDefinition } from "@/lib/templates/definition";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { sidebarFillPng } from "./sidebar-fill-png";

/**
 * Generic DOCX engine driven by a template definition. Mirrors the HTML
 * renderer sections; the sidebar gradient uses the definition's image asset
 * when available (Word has no native gradient fill), solid color otherwise.
 */

const hex = (color: string): string => color.replace("#", "").toUpperCase();

const A4 = { width: 11906, height: 16838 };
const SIDEBAR_DXA = 4530;
const MAIN_DXA = 7376;

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
  insideHorizontal: noBorder,
  insideVertical: noBorder,
} as const;

interface Ctx {
  cv: CVData;
  def: TemplateDefinition;
  font: string;
  copy: ReturnType<typeof getMessages>["cv"];
}

// ---------- shared paragraph helpers ----------

function bandTitle(text: string, ctx: Ctx): Paragraph {
  if (ctx.def.headerStyle === "underline") {
    return new Paragraph({
      spacing: { before: 110, after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: hex(ctx.def.colors.band), space: 2 },
      },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          color: hex(ctx.def.colors.heading),
          size: 20,
          font: ctx.font,
          characterSpacing: 20,
        }),
      ],
    });
  }
  return new Paragraph({
    spacing: { before: 110, after: 80 },
    shading: { type: ShadingType.CLEAR, fill: hex(ctx.def.colors.band), color: "auto" },
    children: [
      new TextRun({
        text: ` ${text.toUpperCase()}`,
        bold: true,
        color: hex(ctx.def.colors.bandText),
        size: 20,
        font: ctx.font,
        characterSpacing: 20,
      }),
    ],
  });
}

function itemTitle(text: string, ctx: Ctx): Paragraph {
  return new Paragraph({
    spacing: { before: 90, after: 10 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: hex(ctx.def.colors.heading),
        size: 18,
        font: ctx.font,
      }),
    ],
  });
}

function metaLine(dates: string, place: string, ctx: Ctx): Paragraph {
  const children = [
    new TextRun({ text: dates, bold: true, color: "222222", size: 15, font: ctx.font }),
  ];
  if (place) {
    children.push(
      new TextRun({
        text: `   ·   ${place}`,
        italics: true,
        color: hex(ctx.def.colors.body),
        size: 14,
        font: ctx.font,
      })
    );
  }
  return new Paragraph({ spacing: { after: 22 }, children });
}

function bulletLine(text: string, ctx: Ctx): Paragraph {
  const bodyColor = hex(ctx.def.colors.body);
  const linkColor = hex(ctx.def.colors.link);
  const children: (TextRun | ExternalHyperlink)[] = [
    new TextRun({ text: "•  ", color: hex(ctx.def.colors.band), size: 14, font: ctx.font }),
  ];
  for (const seg of parseInlineLinks(text)) {
    if (seg.type === "text") {
      children.push(new TextRun({ text: seg.value, color: bodyColor, size: 14, font: ctx.font }));
    } else {
      children.push(
        new ExternalHyperlink({
          link: normalizeHttpUrl(seg.url),
          children: [
            new TextRun({
              text: seg.label,
              color: linkColor,
              underline: {},
              size: 14,
              font: ctx.font,
            }),
          ],
        })
      );
    }
  }
  return new Paragraph({
    spacing: { after: 16, line: 222, lineRule: "auto" },
    indent: { left: 160, hanging: 130 },
    children,
  });
}

function bodyText(text: string, ctx: Ctx): Paragraph {
  return new Paragraph({
    spacing: { after: 20, line: 226, lineRule: "auto" },
    children: [new TextRun({ text, color: hex(ctx.def.colors.body), size: 14, font: ctx.font })],
  });
}

// ---------- sidebar helpers ----------

function sideTitle(text: string, ctx: Ctx): Paragraph {
  return new Paragraph({
    spacing: { before: 170, after: 70 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        color: hex(ctx.def.colors.sidebarText),
        size: 21,
        font: ctx.font,
        characterSpacing: 30,
      }),
    ],
  });
}

function sideText(
  text: string,
  ctx: Ctx,
  opts: { bold?: boolean; after?: number } = {}
): Paragraph {
  return new Paragraph({
    spacing: { after: opts.after ?? 26 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        color: hex(ctx.def.colors.sidebarText),
        size: 15,
        font: ctx.font,
      }),
    ],
  });
}

function sideLink(label: string, url: string, ctx: Ctx): Paragraph {
  return new Paragraph({
    spacing: { after: 26 },
    children: [
      new ExternalHyperlink({
        link: url,
        children: [
          new TextRun({
            text: label,
            color: hex(ctx.def.colors.sidebarText),
            underline: {},
            size: 15,
            font: ctx.font,
          }),
        ],
      }),
    ],
  });
}

// ---------- sections ----------

function contactParagraphs(ctx: Ctx, inSidebar: boolean): Paragraph[] {
  const { contact } = ctx.cv;
  const out: Paragraph[] = [];
  if (inSidebar) out.push(sideTitle(ctx.copy.information, ctx));

  const line = (text: string) => (inSidebar ? sideText(text, ctx) : bodyText(text, ctx));
  if (contact.phone) out.push(line(contact.phone));
  if (contact.email) {
    out.push(
      inSidebar
        ? sideLink(contact.email, `mailto:${contact.email}`, ctx)
        : bodyText(contact.email, ctx)
    );
  }
  if (contact.location) out.push(line(contact.location));
  for (const l of contact.links) {
    const url = /^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}`;
    out.push(
      inSidebar ? sideLink(l.label || l.url, url, ctx) : bodyText(`${l.label} : ${url}`, ctx)
    );
  }
  return out;
}

function skillsParagraphs(ctx: Ctx, inSidebar: boolean): Paragraph[] {
  if (ctx.cv.skills.length === 0) return [];
  const out: Paragraph[] = [
    inSidebar ? sideTitle(ctx.copy.skills, ctx) : bandTitle(ctx.copy.skills, ctx),
  ];
  const itemColor = ctx.def.chipText
    ? hex(ctx.def.chipText)
    : inSidebar
      ? hex(ctx.def.colors.sidebarText)
      : hex(ctx.def.colors.body);
  const sep = ctx.def.skillsStyle === "list" ? "\n• " : " · ";

  for (const group of ctx.cv.skills) {
    const itemsText =
      ctx.def.skillsStyle === "list" ? `• ${group.items.join("\n• ")}` : group.items.join(sep);
    if (inSidebar) {
      out.push(sideText(group.category, ctx, { bold: true, after: 40 }));
      out.push(
        new Paragraph({
          spacing: { after: 46, line: 236, lineRule: "auto" },
          children: [
            new TextRun({
              text: itemsText,
              color: itemColor,
              size: 14,
              font: ctx.font,
            }),
          ],
        })
      );
    } else {
      out.push(itemTitle(group.category, ctx));
      out.push(
        new Paragraph({
          spacing: { after: 60, line: 240, lineRule: "auto" },
          children: [
            new TextRun({
              text: itemsText,
              color: itemColor,
              size: 16,
              font: ctx.font,
            }),
          ],
        })
      );
    }
  }
  return out;
}

/** Paragraphs for one job/project entry. Experience and project entries share this shape. */
function experienceItemParagraphs(exp: CVData["experiences"][number], ctx: Ctx): Paragraph[] {
  const out: Paragraph[] = [];
  if (exp.company && exp.companyUrl) {
    out.push(
      new Paragraph({
        spacing: { before: 90, after: 10 },
        children: [
          new TextRun({
            text: exp.title,
            bold: true,
            color: hex(ctx.def.colors.heading),
            size: 18,
            font: ctx.font,
          }),
          new TextRun({
            text: " — ",
            bold: true,
            color: hex(ctx.def.colors.heading),
            size: 18,
            font: ctx.font,
          }),
          new ExternalHyperlink({
            link: normalizeHttpUrl(exp.companyUrl),
            children: [
              new TextRun({
                text: exp.company,
                bold: true,
                color: hex(ctx.def.colors.link),
                underline: {},
                size: 18,
                font: ctx.font,
              }),
            ],
          }),
        ],
      })
    );
  } else if (exp.companyUrl) {
    out.push(
      new Paragraph({
        spacing: { before: 90, after: 10 },
        children: [
          new ExternalHyperlink({
            link: normalizeHttpUrl(exp.companyUrl),
            children: [
              new TextRun({
                text: exp.title,
                bold: true,
                color: hex(ctx.def.colors.link),
                underline: {},
                size: 18,
                font: ctx.font,
              }),
            ],
          }),
        ],
      })
    );
  } else {
    out.push(itemTitle(exp.company ? `${exp.title} — ${exp.company}` : exp.title, ctx));
  }
  out.push(metaLine(exp.dates, exp.place, ctx));
  for (const b of exp.bullets) out.push(bulletLine(b, ctx));
  if (exp.links.length) {
    const linkChildren: (TextRun | ExternalHyperlink)[] = [];
    exp.links
      .filter((l) => l.url)
      .forEach((l, i) => {
        if (i > 0) {
          linkChildren.push(
            new TextRun({
              text: "  ·  ",
              color: hex(ctx.def.colors.body),
              size: 13,
              font: ctx.font,
            })
          );
        }
        linkChildren.push(
          new ExternalHyperlink({
            link: normalizeHttpUrl(l.url),
            children: [
              new TextRun({
                text: l.label || l.url,
                color: hex(ctx.def.colors.link),
                underline: {},
                size: 13,
                font: ctx.font,
              }),
            ],
          })
        );
      });
    if (linkChildren.length) {
      out.push(
        new Paragraph({
          spacing: { after: 16, line: 222, lineRule: "auto" },
          indent: { left: 160 },
          children: linkChildren,
        })
      );
    }
  }
  if (exp.stack.length) {
    out.push(
      new Paragraph({
        spacing: { after: 20, line: 222, lineRule: "auto" },
        indent: { left: 160 },
        children: [
          new TextRun({
            text: `${ctx.copy.stack} : `,
            bold: true,
            color: hex(ctx.def.colors.heading),
            size: 13,
            font: ctx.font,
          }),
          new TextRun({
            text: exp.stack.join(", "),
            italics: true,
            color: hex(ctx.def.colors.body),
            size: 13,
            font: ctx.font,
          }),
        ],
      })
    );
  }
  return out;
}

function experienceParagraphs(ctx: Ctx): Paragraph[] {
  const experiences = ctx.cv.experiences.filter((e) => e.included !== false);
  const projects = (ctx.cv.projects ?? []).filter((p) => p.included !== false);
  const out: Paragraph[] = [];
  if (experiences.length) {
    out.push(bandTitle(ctx.copy.experience, ctx));
    for (const exp of experiences) out.push(...experienceItemParagraphs(exp, ctx));
  }
  // Personal projects always render after work experience, and never before it.
  if (projects.length) {
    out.push(bandTitle(ctx.copy.projects, ctx));
    for (const proj of projects) out.push(...experienceItemParagraphs(proj, ctx));
  }
  return out;
}

function educationParagraphs(ctx: Ctx): Paragraph[] {
  const list = ctx.cv.education.filter((e) => e.included !== false);
  if (list.length === 0) return [];
  const out: Paragraph[] = [bandTitle(ctx.copy.education, ctx)];
  for (const ed of list) {
    out.push(itemTitle(ed.school ? `${ed.degree} — ${ed.school}` : ed.degree, ctx));
    out.push(metaLine(ed.dates, ed.place, ctx));
    if (ed.details) out.push(bulletLine(ed.details, ctx));
  }
  return out;
}

function certificationsParagraphs(ctx: Ctx): Paragraph[] {
  const list = (ctx.cv.certifications ?? []).filter((c) => c.included !== false);
  if (list.length === 0) return [];
  const out: Paragraph[] = [bandTitle(ctx.copy.certifications, ctx)];
  for (const cert of list) {
    if (cert.url) {
      out.push(
        new Paragraph({
          spacing: { before: 90, after: 10 },
          children: [
            new ExternalHyperlink({
              link: normalizeHttpUrl(cert.url),
              children: [
                new TextRun({
                  text: cert.name,
                  bold: true,
                  color: hex(ctx.def.colors.link),
                  underline: {},
                  size: 18,
                  font: ctx.font,
                }),
              ],
            }),
          ],
        })
      );
    } else {
      out.push(itemTitle(cert.name, ctx));
    }
    const meta = [cert.issuer, cert.credentialId ? `ID ${cert.credentialId}` : ""]
      .filter(Boolean)
      .join(" — ");
    out.push(metaLine(cert.dates, meta, ctx));
  }
  return out;
}

function languagesParagraphs(ctx: Ctx, inSidebar: boolean): Paragraph[] {
  if (ctx.cv.languages.length === 0) return [];
  const out: Paragraph[] = [
    inSidebar ? sideTitle(ctx.copy.languages, ctx) : bandTitle(ctx.copy.languages, ctx),
  ];
  for (const lang of ctx.cv.languages) {
    const text = lang.level ? `${lang.name} — ${lang.level}` : lang.name;
    out.push(inSidebar ? sideText(text, ctx, { after: 20 }) : bodyText(text, ctx));
  }
  return out;
}

function interestsParagraphs(ctx: Ctx, inSidebar: boolean): Paragraph[] {
  if (ctx.cv.interests.length === 0) return [];
  const text = ctx.cv.interests.join(" · ");
  return [
    inSidebar ? sideTitle(ctx.copy.interests, ctx) : bandTitle(ctx.copy.interests, ctx),
    inSidebar ? sideText(text, ctx) : bodyText(text, ctx),
  ];
}

function summaryParagraphs(ctx: Ctx): Paragraph[] {
  if (!ctx.cv.summary) return [];
  return [bandTitle(ctx.copy.summary, ctx), bodyText(ctx.cv.summary, ctx)];
}

function sectionParagraphs(id: SectionId, ctx: Ctx, inSidebar: boolean): Paragraph[] {
  switch (id) {
    case "contact":
      return contactParagraphs(ctx, inSidebar);
    case "summary":
      return summaryParagraphs(ctx);
    case "experience":
      return experienceParagraphs(ctx);
    case "education":
      return educationParagraphs(ctx);
    case "certifications":
      return certificationsParagraphs(ctx);
    case "skills":
      return skillsParagraphs(ctx, inSidebar);
    case "languages":
      return languagesParagraphs(ctx, inSidebar);
    case "interests":
      return interestsParagraphs(ctx, inSidebar);
  }
}

// ---------- assets ----------

async function loadSidebarImage(def: TemplateDefinition): Promise<Buffer | null> {
  if (def.sidebarDecor === false || !def.sidebarImageAsset) return null;
  try {
    return await readFile(path.join(process.cwd(), def.sidebarImageAsset));
  } catch {
    return null;
  }
}

/** Decorative asset when present, otherwise a generated full-page color strip. */
async function loadSidebarFill(def: TemplateDefinition): Promise<Buffer> {
  return (await loadSidebarImage(def)) ?? sidebarFillPng(def.colors.sidebar);
}

type DocxImageType = "jpg" | "png" | "gif" | "bmp";

/** Detects a DOCX-supported image type from a data-URL MIME or magic bytes. */
function detectDocxImageType(buf: Buffer, dataUrl?: string): DocxImageType | null {
  const mime = dataUrl?.match(/^data:(image\/[a-z0-9.+-]+);/i)?.[1]?.toLowerCase();
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/gif") return "gif";
  if (mime === "image/bmp" || mime === "image/x-ms-bmp") return "bmp";
  // WebP and others are not accepted by docx ImageRun.
  if (mime) return null;

  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "png";
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) return "bmp";
  return null;
}

async function loadPhoto(url: string): Promise<{ data: Buffer; type: DocxImageType } | null> {
  try {
    let data: Buffer | null = null;
    let dataUrl: string | undefined;
    if (url.startsWith("data:image/")) {
      dataUrl = url;
      data = Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    } else if (url.startsWith("/api/files/")) {
      // Only the authenticated app proxy — never fetch arbitrary http(s) (SSRF).
      const { readStoredFile } = await import("@/lib/storage");
      const key = decodeURIComponent(url.slice("/api/files/".length));
      if (!key || key.includes("..")) return null;
      data = await readStoredFile(key);
    }
    if (!data?.length) return null;
    const type = detectDocxImageType(data, dataUrl);
    if (!type) return null;
    return { data, type };
  } catch {
    return null;
  }
}

// ---------- layouts ----------

function nameHeader(ctx: Ctx): Paragraph[] {
  const out = [
    new Paragraph({
      spacing: { before: 40, after: 0 },
      children: [
        new TextRun({
          text: ctx.cv.identity.fullName,
          bold: true,
          color: "111111",
          size: 40,
          font: ctx.font,
        }),
      ],
    }),
  ];
  if (ctx.cv.identity.headline) {
    out.push(
      new Paragraph({
        spacing: { before: 60, after: 40 },
        children: [
          new TextRun({
            text: ctx.cv.identity.headline,
            italics: true,
            color: "1A1A1A",
            size: 17,
            font: ctx.font,
          }),
        ],
      })
    );
  }
  return out;
}

/** Name block for a sidebar placement, sized for the narrow column. */
function sidebarNameHeader(ctx: Ctx): Paragraph[] {
  const out = [
    new Paragraph({
      spacing: { before: 40, after: 20 },
      children: [
        new TextRun({
          text: ctx.cv.identity.fullName,
          bold: true,
          color: hex(ctx.def.colors.heading),
          size: 30,
          font: ctx.font,
        }),
      ],
    }),
  ];
  if (ctx.cv.identity.headline) {
    out.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: ctx.cv.identity.headline,
            color: hex(ctx.def.colors.body),
            size: 16,
            font: ctx.font,
          }),
        ],
      })
    );
  }
  return out;
}

async function sidebarDocument(ctx: Ctx): Promise<Document> {
  const { cv, def } = ctx;
  const left: Paragraph[] = [];

  if (def.namePlacement === "sidebar") left.push(...sidebarNameHeader(ctx));

  if (def.photo && cv.identity.photoUrl) {
    const photo = await loadPhoto(cv.identity.photoUrl);
    if (photo) {
      left.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 70, after: 60 },
          children: [
            new ImageRun({
              type: photo.type,
              data: photo.data,
              transformation: { width: 118, height: 134 },
            }),
          ],
        })
      );
    }
  }
  for (const id of def.sidebarSections) left.push(...sectionParagraphs(id, ctx, true));

  const right: Paragraph[] = def.namePlacement === "sidebar" ? [] : [...nameHeader(ctx)];
  for (const id of def.mainSections) right.push(...sectionParagraphs(id, ctx, false));

  // Full-height rail behind the sidebar column, drawn from the header so it
  // spans every page (Word cannot stretch a table-cell fill to the page foot).
  const sidebarImage = await loadSidebarFill(def);
  const headers = {
    default: new Header({
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              type: "png",
              data: sidebarImage,
              transformation: { width: 302, height: 1123 },
              floating: {
                horizontalPosition: {
                  relative: HorizontalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                behindDocument: true,
                allowOverlap: true,
              },
            }),
          ],
        }),
      ],
    }),
  };

  const table = new Table({
    width: { size: SIDEBAR_DXA + MAIN_DXA, type: WidthType.DXA },
    columnWidths: [SIDEBAR_DXA, MAIN_DXA],
    layout: TableLayoutType.FIXED,
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: SIDEBAR_DXA, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 260, right: 210 },
            verticalAlign: VerticalAlign.TOP,
            children: left,
          }),
          new TableCell({
            width: { size: MAIN_DXA, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
            margins: { top: 0, bottom: 0, left: 300, right: 280 },
            verticalAlign: VerticalAlign.TOP,
            children: right,
          }),
        ],
      }),
    ],
  });

  return new Document({
    styles: {
      default: { hyperlink: { run: { color: hex(ctx.def.colors.sidebarText), underline: {} } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: A4,
            // 8mm top/bottom insets text on every page, including splits.
            // The sidebar PNG is pinned to the PAGE, so the rail stays full-bleed.
            margin: { top: 454, bottom: 454, left: 0, right: 0, header: 0, footer: 0 },
          },
        },
        headers: { default: headers.default, first: headers.default },
        children: [table],
      },
    ],
  });
}

async function singleColumnDocument(ctx: Ctx): Promise<Document> {
  const children: Paragraph[] = [];

  if (ctx.def.photo && ctx.cv.identity.photoUrl) {
    const photo = await loadPhoto(ctx.cv.identity.photoUrl);
    if (photo) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 80 },
          children: [
            new ImageRun({
              type: photo.type,
              data: photo.data,
              transformation: { width: 110, height: 124 },
            }),
          ],
        })
      );
    }
  }

  children.push(...nameHeader(ctx));
  for (const id of ctx.def.mainSections) children.push(...sectionParagraphs(id, ctx, false));

  return new Document({
    styles: { default: { hyperlink: { run: { color: hex(ctx.def.colors.link), underline: {} } } } },
    sections: [
      {
        properties: {
          page: { size: A4, margin: { top: 680, bottom: 680, left: 900, right: 900 } },
        },
        children,
      },
    ],
  });
}

/** Builds the .docx export of a CV for the given template definition. */
export async function renderCVDocx(
  cv: CVData,
  def: TemplateDefinition,
  locale: Locale = "fr"
): Promise<Buffer> {
  const data = withSoftSkillsGroup(cv);
  const ctx: Ctx = { cv: data, def, font: def.fonts.body, copy: getMessages(locale).cv };
  const doc =
    def.layout === "sidebar-left" ? await sidebarDocument(ctx) : await singleColumnDocument(ctx);
  return Packer.toBuffer(doc);
}
