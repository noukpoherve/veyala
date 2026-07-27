import type { Metadata } from "next";
import { ErrorScreen, type ErrorScreenKind } from "@/components/errors/error-screen";

export const metadata: Metadata = {
  title: "Une erreur est survenue",
};

const REASONS: Record<
  string,
  { kind: ErrorScreenKind; title: string; description: string; backLabel?: string }
> = {
  regenerate: {
    kind: "generic",
    title: "La régénération n'a pas abouti",
    description:
      "Votre crédit a été remboursé si un débit avait eu lieu. Réessayez depuis votre CV, ou contactez le support si cela se reproduit.",
    backLabel: "Retour au CV",
  },
  analyze: {
    kind: "generic",
    title: "L'analyse n'a pas abouti",
    description:
      "Le service est peut-être momentanément indisponible. Réessayez dans un instant, ou contactez le support si le problème continue.",
    backLabel: "Retour à la génération",
  },
  generate: {
    kind: "generic",
    title: "La génération n'a pas abouti",
    description:
      "Votre crédit a été remboursé si un débit avait eu lieu. Vous pouvez relancer une génération, ou écrire au support.",
    backLabel: "Retour à la génération",
  },
  payment: {
    kind: "unavailable",
    title: "Paiement indisponible",
    description:
      "Nous n'avons pas pu ouvrir la session de paiement. Réessayez plus tard, ou contactez le support pour être accompagné.",
    backLabel: "Retour aux crédits",
  },
};

/**
 * Soft failure landing (no red dump): used when an action fails and we redirect
 * instead of rendering an inline destructive banner.
 */
export default function ErreurPage({
  searchParams,
}: {
  searchParams: { reason?: string; back?: string };
}) {
  const reason = searchParams.reason ?? "";
  const preset = REASONS[reason];
  const back = safeInternalPath(searchParams.back) ?? "/dashboard";

  return (
    <ErrorScreen
      kind={preset?.kind ?? "generic"}
      title={preset?.title}
      description={preset?.description}
      code={preset ? undefined : "Erreur"}
      primaryHref={back}
      primaryLabel={preset?.backLabel ?? "Continuer"}
      supportHref="/support"
    />
  );
}

function safeInternalPath(value: string | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
