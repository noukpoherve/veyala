// Générateur du CV Word — reproduit exactement le design validé
// (dégradé bleu→violet→bordeaux, logo IMIE à côté du nom, briques, bandes bleues, liens cliquables).
import fs from "fs";
import path from "path";
import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, VerticalAlign,
  TableLayoutType, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
  Header, ExternalHyperlink,
} from "docx";

const FONT = "Century Gothic";
const WHITE = "FFFFFF";
const LIGHT = "EDE7F0";
const BAND = "56A8DC";
const DARKTITLE = "1F3550";
const DARKSUB = "222222";
const GREYTXT = "555555";
const LINKC = "CFE3F5";

const ASSETS = path.join(process.cwd(), "assets");
const img = (name) => fs.readFileSync(path.join(ASSETS, name));

// ---------- helpers sidebar ----------
const sideTitle = (text) => new Paragraph({ spacing: { before: 170, after: 70 },
  children: [new TextRun({ text, bold: true, color: WHITE, size: 21, font: FONT, characterSpacing: 30 })] });

const infoLine = (label, value) => new Paragraph({ spacing: { after: 26 }, children: [
  new TextRun({ text: label, bold: true, color: WHITE, size: 15, font: FONT }),
  new TextRun({ text: value, color: LIGHT, size: 15, font: FONT }),
]});

const infoLink = (label, display, url) => new Paragraph({ spacing: { after: 26 }, children: [
  new TextRun({ text: label, bold: true, color: WHITE, size: 15, font: FONT }),
  new ExternalHyperlink({ link: url, children: [
    new TextRun({ text: display, color: LINKC, underline: {}, size: 15, font: FONT }),
  ]}),
]});

const sideText = (text, opts = {}) => new Paragraph({ spacing: { after: opts.after ?? 40 },
  children: [new TextRun({ text, color: opts.color ?? WHITE, size: opts.size ?? 15, font: FONT })] });

const chipCat = (t) => new Paragraph({ spacing: { before: 70, after: 40 },
  children: [new TextRun({ text: t, bold: true, color: WHITE, size: 15, font: FONT })] });

const chips = (skills) => new Paragraph({ spacing: { after: 46, line: 236, lineRule: "auto" },
  children: [new TextRun({ text: skills.join(" · "), color: LIGHT, size: 14, font: FONT })] });

// ---------- helpers colonne droite ----------
const band = (text) => new Paragraph({ spacing: { before: 110, after: 80 },
  shading: { type: ShadingType.CLEAR, fill: BAND, color: "auto" },
  children: [new TextRun({ text, bold: true, color: WHITE, size: 20, font: FONT, characterSpacing: 20 })] });

const jobTitle = (text) => new Paragraph({ spacing: { before: 90, after: 10 },
  children: [new TextRun({ text, bold: true, color: DARKTITLE, size: 18, font: FONT })] });

const dateLine = (dates, place) => new Paragraph({ spacing: { after: 22 }, children: [
  new TextRun({ text: dates, bold: true, color: DARKSUB, size: 15, font: FONT }),
  new TextRun({ text: "   ·   " + place, italics: true, color: GREYTXT, size: 14, font: FONT }),
]});

const bullet = (text) => new Paragraph({ spacing: { after: 16, line: 222, lineRule: "auto" }, indent: { left: 160, hanging: 130 },
  children: [new TextRun({ text: "•  ", color: BAND, size: 14, font: FONT }),
             new TextRun({ text, color: GREYTXT, size: 14, font: FONT })] });

const stackLine = (t) => new Paragraph({ spacing: { after: 20, line: 222, lineRule: "auto" }, indent: { left: 160 }, children: [
  new TextRun({ text: "Stacks : ", bold: true, color: DARKTITLE, size: 13, font: FONT }),
  new TextRun({ text: t, italics: true, color: GREYTXT, size: 13, font: FONT }),
]});

/**
 * Construit le CV .docx et retourne un Buffer.
 * @param {object} cv
 *  cv.info            — coordonnées (BASE_INFO)
 *  cv.headline        — intitulé du poste visé (ligne italique sous la dispo)
 *  cv.profil          — texte du paragraphe PROFIL
 *  cv.competences     — [{ cat, items[] }]
 *  cv.experiences     — [{ title, dates, place, bullets[], stack }]
 *  cv.formations      — [{ title, dates, place, bullet }]
 */
export async function buildCvDocx(cv) {
  const { info } = cv;

  // ===== colonne gauche =====
  const left = [];
  left.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 70, after: 60 },
    children: [new ImageRun({ type: "png", data: img("photo.png"), transformation: { width: 118, height: 134 } })] }));

  left.push(sideTitle("INFORMATIONS"));
  left.push(infoLine("Téléphone : ", info.telephone));
  left.push(infoLink("Email : ", info.email, "mailto:" + info.email));
  left.push(infoLine("Adresse : ", info.adresse));
  left.push(infoLink("LinkedIn : ", info.linkedinDisplay, info.linkedinUrl));
  left.push(infoLink("GitHub : ", info.githubDisplay, info.githubUrl));
  left.push(infoLink("Portfolio : ", info.portfolioDisplay, info.portfolioUrl));
  left.push(infoLine("Permis : ", info.permis));
  left.push(infoLine("", info.prime));

  left.push(sideTitle("COMPÉTENCES"));
  for (const c of cv.competences) {
    left.push(chipCat(c.cat));
    left.push(chips(c.items));
  }

  left.push(sideTitle("LANGUES"));
  left.push(sideText("Français — Langue maternelle", { after: 20 }));
  left.push(sideText("Anglais — Professionnel (doc. technique)", { color: LIGHT }));

  // ===== colonne droite =====
  const right = [];
  const nbr = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noB = { top: nbr, bottom: nbr, left: nbr, right: nbr, insideHorizontal: nbr, insideVertical: nbr };

  right.push(new Table({
    width: { size: 7200, type: WidthType.DXA },
    columnWidths: [5700, 1500],
    layout: TableLayoutType.FIXED,
    borders: noB,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 5700, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [
          new Paragraph({ spacing: { before: 40, after: 0 },
            children: [new TextRun({ text: info.nom, bold: true, color: "111111", size: 40, font: FONT })] }),
          new Paragraph({ spacing: { after: 0 },
            children: [new TextRun({ text: info.nomFamille, bold: true, color: "111111", size: 40, font: FONT })] }),
        ]}),
      new TableCell({ width: { size: 1500, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [ new Paragraph({ alignment: AlignmentType.RIGHT,
          children: [new ImageRun({ type: "png", data: img("imie_logo.png"), transformation: { width: 76, height: 80 } })] }) ]}),
    ]}) ],
  }));

  right.push(new Paragraph({ spacing: { before: 70, after: 12 },
    children: [new TextRun({ text: "DISPONIBLE DÈS MAINTENANT POUR UNE ALTERNANCE EN CONTRAT D'APPRENTISSAGE", bold: true, color: "1A1A1A", size: 17, font: FONT })] }));
  right.push(new Paragraph({ spacing: { after: 8 },
    children: [new TextRun({ text: cv.headline, italics: true, color: "1A1A1A", size: 17, font: FONT })] }));
  right.push(new Paragraph({ spacing: { after: 40 },
    children: [new TextRun({ text: info.rythme, italics: true, color: GREYTXT, size: 15, font: FONT })] }));

  right.push(band("PROFIL"));
  right.push(new Paragraph({ spacing: { after: 20, line: 226, lineRule: "auto" },
    children: [new TextRun({ text: cv.profil, color: GREYTXT, size: 14, font: FONT })] }));

  right.push(band("EXPÉRIENCES PROFESSIONNELLES"));
  for (const exp of cv.experiences) {
    right.push(jobTitle(exp.title));
    right.push(dateLine(exp.dates, exp.place));
    for (const b of exp.bullets) right.push(bullet(b));
    if (exp.stack) right.push(stackLine(exp.stack));
  }

  right.push(band("FORMATION PROFESSIONNELLE"));
  for (const f of cv.formations) {
    right.push(jobTitle(f.title));
    right.push(dateLine(f.dates, f.place));
    if (f.bullet) right.push(bullet(f.bullet));
  }

  // ===== header : dégradé pleine page =====
  const header = new Header({ children: [ new Paragraph({ children: [ new ImageRun({
    type: "png", data: img("sidebar.png"),
    transformation: { width: 302, height: 1123 },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
      behindDocument: true, allowOverlap: true,
    },
  }) ] }) ] });

  // ===== table principale =====
  const LEFTW = 4530, RIGHTW = 7376;
  const table = new Table({
    width: { size: LEFTW + RIGHTW, type: WidthType.DXA },
    columnWidths: [LEFTW, RIGHTW],
    layout: TableLayoutType.FIXED,
    borders: noB,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: LEFTW, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 260, right: 210 },
        verticalAlign: VerticalAlign.TOP, children: left }),
      new TableCell({ width: { size: RIGHTW, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: WHITE, color: "auto" },
        margins: { top: 80, bottom: 80, left: 300, right: 280 },
        verticalAlign: VerticalAlign.TOP, children: right }),
    ]}) ],
  });

  const doc = new Document({
    styles: { default: { hyperlink: { run: { color: LINKC, underline: {} } } } },
    sections: [{
      properties: { page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 },
      } },
      headers: { default: header, first: header },
      children: [table],
    }],
  });

  return Packer.toBuffer(doc);
}
