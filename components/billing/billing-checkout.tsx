"use client";

import { useRef, useState } from "react";
import { Loader2, ShoppingCart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { useLocalizedRouter } from "@/i18n/navigation";
import { formatCurrency } from "@/i18n/format";

type Pack = {
  id: string;
  label: string;
  priceCents: number;
  credits: number;
};

type Preview = {
  code: string;
  label: string;
  amountCents: number;
  discountCents: number;
  credits: number;
  originalAmountCents: number;
  originalCredits: number;
};

/** Packs grid + shared promo field; promo is applied at Checkout creation. */
export function BillingCheckout({
  packs,
  highlightedIndex,
}: {
  packs: Pack[];
  highlightedIndex: number;
}) {
  const locale = useLocale();
  const messages = useMessages();
  const m = messages.pages.checkout;
  const euros = (cents: number) => formatCurrency(cents, locale);
  const router = useLocalizedRouter();
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function applyPromo(packId: string) {
    const code = promoInput.trim();
    if (!code) {
      setAppliedCode("");
      setPreview(null);
      setPromoError("");
      return;
    }
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, code }),
      });
      const body = (await res.json().catch(() => null)) as
        | (Preview & { ok?: boolean; error?: string })
        | null;
      if (!res.ok || !body?.ok) {
        setPreview(null);
        setAppliedCode("");
        setPromoError(body?.error || m.invalidCode);
        return;
      }
      setPreview(body);
      setAppliedCode(body.code);
    } catch {
      setPromoError(m.checkFailed);
    } finally {
      setPromoLoading(false);
    }
  }

  async function buy(packId: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBuyingPackId(packId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId,
          ...(appliedCode ? { promoCode: appliedCode } : {}),
        }),
      });
      const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !body?.url) {
        inFlight.current = false;
        setBuyingPackId(null);
        if (body?.error && res.status === 400) {
          setPromoError(body.error);
          return;
        }
        router.push("/erreur?reason=payment&back=/billing");
        return;
      }
      window.location.assign(body.url);
    } catch {
      inFlight.current = false;
      setBuyingPackId(null);
      router.push("/erreur?reason=payment&back=/billing");
    }
  }

  const previewPackId = packs[highlightedIndex]?.id ?? packs[0]?.id;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <label htmlFor="promo-code" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Tag className="size-4" aria-hidden />
          {m.promoLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="promo-code"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            placeholder={m.promoPlaceholder}
            className="max-w-xs uppercase"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="outline"
            disabled={promoLoading || !previewPackId}
            onClick={() => previewPackId && void applyPromo(previewPackId)}
          >
            {promoLoading ? <Loader2 className="animate-spin" /> : null}
            {m.apply}
          </Button>
          {appliedCode ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPromoInput("");
                setAppliedCode("");
                setPreview(null);
                setPromoError("");
              }}
            >
              {messages.common.remove}
            </Button>
          ) : null}
        </div>
        {promoError ? <p className="mt-2 text-sm text-destructive">{promoError}</p> : null}
        {preview ? (
          <p className="mt-2 text-sm text-emerald-700">
            {m.promoAppliedPrefix} <strong>{preview.code}</strong>{" "}
            {m.promoAppliedSuffix(preview.label)}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">{m.tip}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack, i) => {
          const highlighted = i === highlightedIndex;
          const loading = buyingPackId === pack.id;
          const showPreview = preview && appliedCode;
          const price = showPreview
            ? // Recompute roughly for display: only exact after preview on that pack
              pack.id === previewPackId
              ? preview.amountCents
              : pack.priceCents
            : pack.priceCents;
          const credits = showPreview && pack.id === previewPackId ? preview.credits : pack.credits;

          return (
            <Card key={pack.id} className={highlighted ? "border-primary shadow-md" : ""}>
              <CardHeader className="items-center text-center">
                {highlighted ? <Badge className="mb-1">{m.popular}</Badge> : null}
                <CardTitle className="text-xl">{pack.label}</CardTitle>
                <CardDescription>
                  {m.packDescription(credits, euros(Math.round(price / Math.max(1, credits))))}
                </CardDescription>
                <p className="font-display text-3xl font-bold">
                  {euros(price)}
                  {showPreview && pack.id === previewPackId && preview.discountCents > 0 ? (
                    <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                      {euros(pack.priceCents)}
                    </span>
                  ) : null}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {appliedCode && pack.id !== previewPackId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => void applyPromo(pack.id)}
                  >
                    {m.recalculate}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant={highlighted ? "gradient" : "outline"}
                  className="w-full"
                  disabled={loading || buyingPackId != null}
                  onClick={() => void buy(pack.id)}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
                  {m.buy}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
