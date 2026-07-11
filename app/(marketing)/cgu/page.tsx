import type { Metadata } from "next";
import { LegalArticle } from "@/components/marketing/legal-article";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <LegalArticle title="Conditions générales d'utilisation" updated="9 juillet 2026">
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes CGU encadrent l&apos;utilisation de Veyala, service de génération de
          CV assistée par intelligence artificielle. La création d&apos;un compte vaut
          acceptation des présentes conditions.
        </p>
      </section>
      <section>
        <h2>2. Compte et crédits</h2>
        <ul>
          <li>Le compte est personnel ; vous êtes responsable de sa confidentialité.</li>
          <li>1 crédit permet 1 génération de CV (fichiers Word et PDF inclus).</li>
          <li>2 crédits sont offerts à l&apos;inscription ; les crédits achetés n&apos;expirent pas.</li>
          <li>Une génération échouée est automatiquement remboursée en crédits.</li>
          <li>Les crédits ne sont ni remboursables en euros, ni transférables.</li>
        </ul>
      </section>
      <section>
        <h2>3. Contenu généré</h2>
        <p>
          L&apos;IA reformule exclusivement les informations que vous fournissez : vous
          demeurez seul responsable de l&apos;exactitude de votre CV de base et des CV
          générés que vous transmettez à des tiers.
        </p>
      </section>
      <section>
        <h2>4. Usage acceptable</h2>
        <p>
          Sont notamment interdits : l&apos;usurpation d&apos;identité, la soumission de
          contenus illicites, la revente du service et toute tentative de contournement des
          mécanismes de crédits ou de sécurité.
        </p>
      </section>
      <section>
        <h2>5. Paiements</h2>
        <p>
          Les paiements sont traités par Stripe. Les prix affichés sont en euros TTC. Le
          crédit du compte intervient à la confirmation du paiement par Stripe.
        </p>
      </section>
      <section>
        <h2>6. Résiliation</h2>
        <p>
          Vous pouvez supprimer votre compte et vos données à tout moment depuis la page
          Confidentialité ou en nous contactant. Veyala peut suspendre un compte en cas de
          violation des présentes CGU.
        </p>
      </section>
    </LegalArticle>
  );
}
