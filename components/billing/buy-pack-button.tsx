"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BuyPackButton({ packId, highlighted }: { packId: string; highlighted: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function buy() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !body?.url) {
        router.push("/erreur?reason=payment&back=/billing");
        return;
      }
      window.location.assign(body.url);
    } catch {
      router.push("/erreur?reason=payment&back=/billing");
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
