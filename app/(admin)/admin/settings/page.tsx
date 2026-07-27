import type { Metadata } from "next";
import { Plus, Star, Trash2, Power, FlaskConical } from "lucide-react";
import { db } from "@/lib/db";
import {
  addPack,
  addProvider,
  deleteProvider,
  setDefaultProvider,
  toggleProviderActive,
  updatePack,
  updateProvider,
  testProvider,
} from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Réglages · Admin" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { test?: string; ok?: string };
}) {
  const [providers, packs] = await Promise.all([
    db.lLMProvider.findMany({ orderBy: { createdAt: "asc" } }),
    db.pack.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const envProvider = process.env.LLM_API_KEY
    ? `${process.env.LLM_BASE_URL ?? "?"} · ${process.env.LLM_MODEL ?? "?"}`
    : null;

  async function runTest(formData: FormData) {
    "use server";
    const result = await testProvider(formData);
    const { redirect } = await import("next/navigation");
    redirect(
      `/admin/settings?ok=${result.ok ? "1" : "0"}&test=${encodeURIComponent(result.message)}`
    );
  }

  return (
    <article className="space-y-8">
      <h1 className="font-display text-2xl font-bold">Réglages</h1>

      {searchParams.test ? (
        <p
          role="status"
          className={
            searchParams.ok === "1"
              ? "rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"
              : "rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {searchParams.test}
        </p>
      ) : null}

      <section aria-labelledby="llm-title" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle id="llm-title" className="text-base">
              Fournisseurs IA
            </CardTitle>
            <CardDescription>
              Ajoutez, modifiez ou testez autant de fournisseurs que nécessaire. Le fournisseur par
              défaut sert à toutes les générations. Sans fournisseur en base, l&apos;application
              retombe sur les variables d&apos;environnement
              {envProvider ? ` (actuellement : ${envProvider})` : " (non configurées)"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {providers.length > 0 ? (
              <ul className="space-y-4">
                {providers.map((provider) => (
                  <li key={provider.id} className="space-y-3 rounded-md border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span>{provider.name}</span>
                        {provider.isDefault ? <Badge>Par défaut</Badge> : null}
                        {!provider.active ? <Badge variant="secondary">Inactif</Badge> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!provider.isDefault ? (
                          <form action={setDefaultProvider}>
                            <input type="hidden" name="providerId" value={provider.id} />
                            <Button type="submit" size="sm" variant="outline">
                              <Star />
                              Par défaut
                            </Button>
                          </form>
                        ) : null}
                        <form action={toggleProviderActive}>
                          <input type="hidden" name="providerId" value={provider.id} />
                          <Button type="submit" size="sm" variant="outline">
                            <Power />
                            {provider.active ? "Désactiver" : "Activer"}
                          </Button>
                        </form>
                        <form action={runTest}>
                          <input type="hidden" name="providerId" value={provider.id} />
                          <Button type="submit" size="sm" variant="outline">
                            <FlaskConical />
                            Tester
                          </Button>
                        </form>
                        <form action={deleteProvider}>
                          <input type="hidden" name="providerId" value={provider.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            aria-label={`Supprimer ${provider.name}`}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </form>
                      </div>
                    </div>

                    <form action={updateProvider} className="grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="providerId" value={provider.id} />
                      <div className="space-y-1.5">
                        <Label htmlFor={`name-${provider.id}`}>Nom</Label>
                        <Input
                          id={`name-${provider.id}`}
                          name="name"
                          required
                          defaultValue={provider.name}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`protocol-${provider.id}`}>Protocole</Label>
                        <select
                          id={`protocol-${provider.id}`}
                          name="protocol"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          defaultValue={provider.protocol}
                        >
                          <option value="openai">OpenAI-compatible</option>
                          <option value="anthropic">Anthropic</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`baseUrl-${provider.id}`}>Base URL</Label>
                        <Input
                          id={`baseUrl-${provider.id}`}
                          name="baseUrl"
                          type="url"
                          required
                          defaultValue={provider.baseUrl}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`model-${provider.id}`}>Modèle</Label>
                        <Input
                          id={`model-${provider.id}`}
                          name="model"
                          required
                          defaultValue={provider.model}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`apiKey-${provider.id}`}>
                          Nouvelle clé API (laisser vide pour conserver)
                        </Label>
                        <Input
                          id={`apiKey-${provider.id}`}
                          name="apiKey"
                          type="password"
                          autoComplete="off"
                          placeholder="••••••••"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="active" defaultChecked={provider.active} />
                        Actif
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="isDefault"
                          defaultChecked={provider.isDefault}
                        />
                        Par défaut
                      </label>
                      <div className="sm:col-span-2">
                        <Button type="submit" size="sm">
                          Enregistrer les modifications
                        </Button>
                      </div>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun fournisseur en base.</p>
            )}

            <form
              action={addProvider}
              className="grid gap-3 rounded-md border border-dashed p-4 sm:grid-cols-2"
            >
              <h3 className="sm:col-span-2 text-sm font-medium">Ajouter un fournisseur</h3>
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Nom</Label>
                <Input id="p-name" name="name" required placeholder="Groq" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-protocol">Protocole</Label>
                <select
                  id="p-protocol"
                  name="protocol"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  defaultValue="openai"
                >
                  <option value="openai">OpenAI-compatible (/chat/completions)</option>
                  <option value="anthropic">Anthropic (/v1/messages)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-baseUrl">Base URL</Label>
                <Input
                  id="p-baseUrl"
                  name="baseUrl"
                  type="url"
                  required
                  placeholder="https://api.groq.com/openai/v1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-model">Modèle</Label>
                <Input id="p-model" name="model" required placeholder="llama-3.3-70b-versatile" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="p-apiKey">Clé API (chiffrée en base)</Label>
                <Input id="p-apiKey" name="apiKey" type="password" required autoComplete="off" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isDefault" defaultChecked />
                Définir comme fournisseur par défaut
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">
                  <Plus />
                  Ajouter le fournisseur
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="packs-title" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle id="packs-title" className="text-base">
              Packs de crédits
            </CardTitle>
            <CardDescription>Prix en centimes d&apos;euro (199 = 1,99 €).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {packs.map((pack) => (
              <form
                key={pack.id}
                action={updatePack}
                className="flex flex-wrap items-end gap-3 rounded-md border p-3"
              >
                <input type="hidden" name="packId" value={pack.id} />
                <div className="space-y-1.5">
                  <Label htmlFor={`label-${pack.id}`}>Libellé</Label>
                  <Input
                    id={`label-${pack.id}`}
                    name="label"
                    defaultValue={pack.label}
                    className="w-32"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`price-${pack.id}`}>Prix (cts)</Label>
                  <Input
                    id={`price-${pack.id}`}
                    name="priceCents"
                    type="number"
                    defaultValue={pack.priceCents}
                    className="w-28"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`credits-${pack.id}`}>Crédits</Label>
                  <Input
                    id={`credits-${pack.id}`}
                    name="credits"
                    type="number"
                    defaultValue={pack.credits}
                    className="w-24"
                  />
                </div>
                <label className="flex h-9 items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={pack.active} />
                  Actif
                </label>
                <Button type="submit" size="sm" variant="outline">
                  Enregistrer
                </Button>
              </form>
            ))}

            <form
              action={addPack}
              className="flex flex-wrap items-end gap-3 rounded-md border border-dashed p-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="new-label">Libellé</Label>
                <Input id="new-label" name="label" required placeholder="100 CV" className="w-32" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-price">Prix (cts)</Label>
                <Input
                  id="new-price"
                  name="priceCents"
                  type="number"
                  required
                  placeholder="1999"
                  className="w-28"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-credits">Crédits</Label>
                <Input
                  id="new-credits"
                  name="credits"
                  type="number"
                  required
                  placeholder="100"
                  className="w-24"
                />
              </div>
              <Button type="submit" size="sm">
                <Plus />
                Ajouter un pack
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
