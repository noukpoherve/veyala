"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * After Checkout redirects to /billing?status=success, asks Stripe (via our
 * API) to confirm any PENDING sessions and credit them. Covers missing webhooks.
 * Safe to click repeatedly: the API is idempotent and will not double-credit.
 */
export function BillingPaymentSync({ auto }: { auto: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [credited, setCredited] = useState(0);
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
      const n = body?.credited ?? 0;
      setCredited(n);
      setState("done");
      setMessage(
        n > 0
          ? "De nouveaux crédits ont été ajoutés à votre solde."
          : "Aucun nouveau crédit à ajouter. Votre solde est déjà à jour (un paiement « Payé » ne sera jamais re-crédité)."
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
      <Alert variant="info" title="Vérification en cours…">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Synchronisation avec Stripe…
        </span>
      </Alert>
    );
  }

  if (state === "error") {
    return (
      <Alert variant="error" title="Synchronisation impossible">
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
      <Alert
        variant={credited > 0 ? "success" : "info"}
        title={credited > 0 ? "Crédits ajoutés" : "Solde déjà à jour"}
      >
        {message}
      </Alert>
    );
  }

  return null;
}
