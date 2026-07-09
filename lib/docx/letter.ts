import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import type { CVData } from "@/lib/cv-schema";
import type { TemplateDefinition } from "@/lib/templates/definition";

const hex = (color: string): string => color.replace("#", "").toUpperCase();

/** Builds the .docx export of a cover letter. */
export async function renderCoverLetterDocx(
  cv: CVData,
  letter: { body: string; jobTitle: string },
  def: TemplateDefinition
): Promise<Buffer> {
  const font = def.fonts.body;
  const heading = hex(def.colors.heading);
  const contactParts = [
    cv.contact.email,
    cv.contact.phone,
    cv.contact.location,
    ...cv.contact.links.map((l) => l.url),
  ].filter(Boolean);
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());

  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: cv.identity.fullName, bold: true, size: 30, color: heading, font })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: contactParts.join(" · "), size: 17, color: "666666", font })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 240 },
      children: [new TextRun({ text: `Le ${today}`, size: 19, color: "555555", font })],
    }),
    new Paragraph({
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: `Objet : candidature au poste de ${letter.jobTitle}`,
          bold: true,
          size: 21,
          color: heading,
          font,
        }),
      ],
    }),
    ...letter.body
      .split(/\n{2,}|\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map(
        (text) =>
          new Paragraph({
            spacing: { after: 160, line: 300, lineRule: "auto" },
            alignment: AlignmentType.JUSTIFIED,
            children: [new TextRun({ text, size: 21, color: "333333", font })],
          })
      ),
    new Paragraph({
      spacing: { before: 320 },
      children: [new TextRun({ text: cv.identity.fullName, bold: true, size: 21, color: heading, font })],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 900, bottom: 900, left: 1020, right: 1020 },
          },
        },
        children,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
