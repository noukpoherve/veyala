import type { Metadata } from "next";
import { LegalArticle } from "@/components/marketing/legal-article";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalArticle title="Politique de confidentialité" updated="9 juillet 2026">
      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>Compte : email, nom, photo de profil (si connexion Google).</li>
          <li>CV : le fichier importé et sa version structurée, éditable par vous.</li>
          <li>Générations : offres d&apos;emploi soumises et CV produits.</li>
          <li>Paiements : traités par Stripe ; nous ne stockons aucune donnée bancaire.</li>
        </ul>
      </section>
      <section>
        <h2>Finalités et bases légales</h2>
        <p>
          Vos données servent exclusivement à fournir le service (exécution du contrat) : adapter
          votre CV aux offres, générer les exports et gérer vos crédits. Aucune revente de données,
          aucune publicité.
        </p>
      </section>
      <section>
        <h2>Sous-traitants</h2>
        <p>
          Le texte de votre CV et des offres est transmis au fournisseur d&apos;IA configuré
          uniquement pour la génération. Les paiements passent par Stripe ; l&apos;envoi
          d&apos;emails de connexion par notre prestataire SMTP.
        </p>
      </section>
      <section>
        <h2>Durées de conservation</h2>
        <p>
          Vos données sont conservées tant que votre compte est actif, puis supprimées dans les 30
          jours suivant la suppression du compte.
        </p>
      </section>
      <section>
        <h2>Vos droits (RGPD)</h2>
        <p>
          Vous disposez des droits d&apos;accès, de rectification, de portabilité, d&apos;opposition
          et d&apos;effacement. La suppression de compte et de toutes les données associées est
          disponible sur demande à contact@cvgen.example et depuis votre espace. Vous pouvez saisir
          la CNIL pour toute réclamation.
        </p>
      </section>
    </LegalArticle>
  );
}
