"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * After Checkout redirects to /billing?status=success, asks Stripe (via our
 * API) to confirm any PENDING sessions and credit them. Covers missing webhooks.
 */
export function BillingPaymentSync({ auto }: { auto: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  async function sync() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const body = (await res.json().catch(() => null)) as {
        credited?: number;
        error?: string;
      } | null;
      if (!res.ok) {
        setState("error");
        setMessage(body?.error || "Synchronisation impossible. Réessayez.");
        return;
      }
      const credited = body?.credited ?? 0;
      setState("done");
      setMessage(
        credited > 0
          ? "Crédits ajoutés. Votre solde a été mis à jour."
          : "Aucun paiement en attente à créditer. Si le statut reste « En attente », vérifiez le webhook Stripe ou contactez le support."
      );
      router.refresh();
    } catch {
      setState("error");
      setMessage("Connexion impossible. Réessayez.");
    }
  }

  // One-shot sync on Checkout success redirect.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once when auto
  useEffect(() => {
    if (!auto || ran.current) return;
    ran.current = true;
    void sync();
  }, [auto]);

  if (state === "idle" && !auto) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => void sync()}>
        Actualiser mon solde
      </Button>
    );
  }

  if (state === "loading") {
    return (
      <Alert variant="info" title="Finalisation du paiement…">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Vérification auprès de Stripe…
        </span>
      </Alert>
    );
  }

  if (state === "error") {
    return (
      <Alert variant="error" title="Crédit non synchronisé">
        <p>{message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void sync()}
        >
          Réessayer
        </Button>
      </Alert>
    );
  }

  if (state === "done") {
    return (
      <Alert variant="success" title="Paiement traité">
        {message}
      </Alert>
    );
  }

  return null;
}
