"use client";
import { useState } from "react";

export default function Home() {
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [variant, setVariant] = useState("tama");
  const [targetTitle, setTargetTitle] = useState("");
  const [criteria, setCriteria] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");
  const [poste, setPoste] = useState("");

  async function handleGenerate(e) {
    e.preventDefault();
    if (!jobUrl.trim() && !jobText.trim()) {
      setStatus("error");
      setMessage("Indiquez l'URL de l'offre ou collez son texte.");
      return;
    }
    setStatus("loading");
    setMessage("Analyse de l'offre et adaptation du CV…");
    setPoste("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl, jobText, variant, targetTitle, criteria }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      const detected = decodeURIComponent(res.headers.get("X-Poste-Detecte") || "");
      const disposition = res.headers.get("Content-Disposition") || "";
      const nameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = nameMatch ? nameMatch[1] : "CV_adapte.docx";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setPoste(detected);
      setStatus("done");
      setMessage(`CV téléchargé : ${filename}`);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <main className="shell">
      <aside className="rail" aria-hidden="true">
        <div className="rail-inner">
          <span className="rail-mark">CV</span>
          <span className="rail-word">GÉNÉRATEUR</span>
        </div>
      </aside>

      <section className="content">
        <header className="head">
          <h1>CV sur mesure, à partir d&apos;une offre</h1>
          <p>
            Collez l&apos;URL d&apos;une annonce (ou son texte), choisissez vos critères :
            le CV Word est reconstruit avec le design d&apos;origine, adapté aux mots-clés de l&apos;offre.
            Rien n&apos;est inventé — vos expériences sont reformulées et réordonnées, jamais modifiées sur le fond.
          </p>
        </header>

        <form onSubmit={handleGenerate}>
          <label className="field">
            <span>URL de l&apos;offre</span>
            <input
              type="url"
              placeholder="https://fr.indeed.com/viewjob?jk=…"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Ou collez le texte de l&apos;offre <em>(recommandé si le site bloque les robots : Indeed, LinkedIn…)</em></span>
            <textarea
              rows={7}
              placeholder="Description du poste, missions, profil recherché…"
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
            />
          </label>

          <div className="row">
            <label className="field">
              <span>Expérience principale mise en avant</span>
              <select value={variant} onChange={(e) => setVariant(e.target.value)}>
                <option value="tama">Tama — Développeur Full Stack</option>
                <option value="bridgeness">Bridgeness — Lead Développeur / DevOps</option>
              </select>
            </label>

            <label className="field">
              <span>Intitulé du poste visé <em>(optionnel)</em></span>
              <input
                type="text"
                placeholder="Ex. : Développeur Python en alternance"
                value={targetTitle}
                onChange={(e) => setTargetTitle(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Consignes supplémentaires <em>(optionnel)</em></span>
            <textarea
              rows={3}
              placeholder="Ex. : insister sur le DevOps et Docker ; profil orienté backend…"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
          </label>

          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Génération en cours…" : "Générer le CV adapté"}
          </button>
        </form>

        {status !== "idle" && (
          <div className={`status ${status}`} role="status">
            {status === "loading" && <span className="spinner" aria-hidden="true" />}
            <p>
              {message}
              {status === "done" && poste ? <> — poste détecté : <strong>{poste}</strong></> : null}
            </p>
          </div>
        )}

        <footer className="foot">
          Fichier généré : Word (.docx), une page, liens cliquables, lisible par les ATS.
        </footer>
      </section>
    </main>
  );
}
