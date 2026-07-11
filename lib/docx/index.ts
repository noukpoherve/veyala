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
import type { SectionId, TemplateDefinition } from "@/lib/templates/definition";

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
  return new Paragraph({
    spacing: { after: 16, line: 222, lineRule: "auto" },
    indent: { left: 160, hanging: 130 },
    children: [
      new TextRun({ text: "•  ", color: hex(ctx.def.colors.band), size: 14, font: ctx.font }),
      new TextRun({ text, color: hex(ctx.def.colors.body), size: 14, font: ctx.font }),
    ],
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
  if (inSidebar) out.push(sideTitle("Informations", ctx));

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
    inSidebar ? sideTitle("Compétences", ctx) : bandTitle("Compétences", ctx),
  ];
  for (const group of ctx.cv.skills) {
    if (inSidebar) {
      out.push(sideText(group.category, ctx, { bold: true, after: 40 }));
      out.push(
        new Paragraph({
          spacing: { after: 46, line: 236, lineRule: "auto" },
          children: [
            new TextRun({
              text: group.items.join(" · "),
              color: hex(ctx.def.colors.sidebarText),
              size: 14,
              font: ctx.font,
            }),
          ],
        })
      );
    } else {
      out.push(itemTitle(group.category, ctx));
      out.push(bodyText(group.items.join(" · "), ctx));
    }
  }
  return out;
}

function experienceParagraphs(ctx: Ctx): Paragraph[] {
  if (ctx.cv.experiences.length === 0) return [];
  const out: Paragraph[] = [bandTitle("Expériences professionnelles", ctx)];
  for (const exp of ctx.cv.experiences) {
    out.push(itemTitle(exp.company ? `${exp.title} — ${exp.company}` : exp.title, ctx));
    out.push(metaLine(exp.dates, exp.place, ctx));
    for (const b of exp.bullets) out.push(bulletLine(b, ctx));
    if (exp.stack.length) {
      out.push(
        new Paragraph({
          spacing: { after: 20, line: 222, lineRule: "auto" },
          indent: { left: 160 },
          children: [
            new TextRun({
              text: "Stack : ",
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
  }
  return out;
}

function educationParagraphs(ctx: Ctx): Paragraph[] {
  if (ctx.cv.education.length === 0) return [];
  const out: Paragraph[] = [bandTitle("Formation", ctx)];
  for (const ed of ctx.cv.education) {
    out.push(itemTitle(ed.school ? `${ed.degree} — ${ed.school}` : ed.degree, ctx));
    out.push(metaLine(ed.dates, ed.place, ctx));
    if (ed.details) out.push(bulletLine(ed.details, ctx));
  }
  return out;
}

function languagesParagraphs(ctx: Ctx, inSidebar: boolean): Paragraph[] {
  if (ctx.cv.languages.length === 0) return [];
  const out: Paragraph[] = [inSidebar ? sideTitle("Langues", ctx) : bandTitle("Langues", ctx)];
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
    inSidebar ? sideTitle("Centres d'intérêt", ctx) : bandTitle("Centres d'intérêt", ctx),
    inSidebar ? sideText(text, ctx) : bodyText(text, ctx),
  ];
}

function summaryParagraphs(ctx: Ctx): Paragraph[] {
  if (!ctx.cv.summary) return [];
  return [bandTitle("Profil", ctx), bodyText(ctx.cv.summary, ctx)];
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
  if (!def.sidebarImageAsset) return null;
  try {
    return await readFile(path.join(process.cwd(), def.sidebarImageAsset));
  } catch {
    return null;
  }
}

async function loadPhoto(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("data:image/")) {
      return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    }
    if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    return null;
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
            new ImageRun({ type: "png", data: photo, transformation: { width: 118, height: 134 } }),
          ],
        })
      );
    }
  }
  for (const id of def.sidebarSections) left.push(...sectionParagraphs(id, ctx, true));

  const right: Paragraph[] = def.namePlacement === "sidebar" ? [] : [...nameHeader(ctx)];
  for (const id of def.mainSections) right.push(...sectionParagraphs(id, ctx, false));

  // Full-height gradient behind the sidebar column, drawn from the header
  // so it spans the entire page (Word cannot fill a table cell with a gradient).
  const sidebarImage = await loadSidebarImage(def);
  const headers = sidebarImage
    ? {
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
      }
    : undefined;

  const sidebarFill = sidebarImage ? undefined : hex(def.colors.sidebar[0]!);

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
            shading: sidebarFill
              ? { type: ShadingType.CLEAR, fill: sidebarFill, color: "auto" }
              : undefined,
            margins: { top: 80, bottom: 80, left: 260, right: 210 },
            verticalAlign: VerticalAlign.TOP,
            children: left,
          }),
          new TableCell({
            width: { size: MAIN_DXA, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
            margins: { top: 80, bottom: 80, left: 300, right: 280 },
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
            margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 },
          },
        },
        ...(headers ? { headers: { default: headers.default, first: headers.default } } : {}),
        children: [table],
      },
    ],
  });
}

function singleColumnDocument(ctx: Ctx): Document {
  const children: Paragraph[] = [...nameHeader(ctx)];
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
export async function renderCVDocx(cv: CVData, def: TemplateDefinition): Promise<Buffer> {
  const ctx: Ctx = { cv, def, font: def.fonts.body };
  const doc =
    def.layout === "sidebar-left" ? await sidebarDocument(ctx) : singleColumnDocument(ctx);
  return Packer.toBuffer(doc);
}
