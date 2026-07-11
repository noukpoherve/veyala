"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BuyPackButton({ packId, highlighted }: { packId: string; highlighted: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Paiement indisponible.");
      window.location.assign(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={highlighted ? "gradient" : "outline"}
        className="w-full"
        disabled={loading}
        onClick={() => void buy()}
      >
        {loading ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
        Acheter
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
