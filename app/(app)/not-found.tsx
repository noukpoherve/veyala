import { ErrorScreen } from "@/components/errors/error-screen";

/** 404 inside the authenticated app shell. */
export default function AppNotFound() {
  return (
    <ErrorScreen
      kind="not-found"
      title="Ressource introuvable"
      description="Ce CV ou cette page n'existe pas, ou vous n'y avez pas accès. Revenez au tableau de bord, ou contactez le support si besoin."
      primaryHref="/dashboard"
      primaryLabel="Tableau de bord"
      supportHref="/support"
    />
  );
}
