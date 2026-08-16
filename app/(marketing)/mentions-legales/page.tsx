import type { Metadata } from "next";
import { LegalArticle } from "@/components/marketing/legal-article";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalArticle title="Mentions légales" updated="9 juillet 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Veyala est édité par [Raison sociale à compléter], [forme juridique], immatriculée sous le
          numéro [SIREN], dont le siège social est situé [adresse]. Directeur de la publication :
          [nom]. Contact : contact@cvgen.example.
        </p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par [hébergeur, ex. Vercel Inc., 440 N Barranca Ave #4133, Covina, CA
          91723, USA]. La base de données est hébergée par [Neon / Supabase].
        </p>
      </section>
      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments du site (design, textes, logos, code) est protégé par le
          droit de la propriété intellectuelle. Les CV générés appartiennent à leurs utilisateurs.
        </p>
      </section>
    </LegalArticle>
  );
}
