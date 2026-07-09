// POST /api/generate — reçoit l'offre + critères, renvoie le CV .docx adapté.
import { NextResponse } from "next/server";
import { fetchJobText, tailorCv } from "../../../lib/tailor.js";
import { buildCvDocx } from "../../../lib/docx-template.js";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { jobUrl, jobText, variant, targetTitle, criteria } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante. Ajoutez-la dans .env.local." }, { status: 500 });
    }

    // 1. Texte de l'offre : soit collé, soit récupéré depuis l'URL.
    let offer = (jobText || "").trim();
    if (!offer) {
      if (!jobUrl) {
        return NextResponse.json({ error: "Fournissez l'URL de l'offre ou collez son texte." }, { status: 400 });
      }
      offer = await fetchJobText(jobUrl);
    }

    // 2. Adaptation par Claude.
    const cv = await tailorCv({ jobText: offer, variant, targetTitle, criteria });

    // 3. Génération du .docx.
    const buffer = await buildCvDocx(cv);

    const safe = String(cv.posteDetecte).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "offre";
    const filename = `CV_Houndjetode_${safe}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Poste-Detecte": encodeURIComponent(cv.posteDetecte),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Erreur inconnue." }, { status: 500 });
  }
}
