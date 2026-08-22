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
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { redirectLocalized } from "@/i18n/redirect";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.settings };
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { test?: string; ok?: string };
}) {
  const m = getMessages(getLocale());
  const t = m.adminUi.settings;
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
    redirectLocalized(
      `/admin/settings?ok=${result.ok ? "1" : "0"}&test=${encodeURIComponent(result.message)}`
    );
  }

  return (
    <article className="space-y-8">
      <PageHeader title={m.admin.settings} />

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
              {t.providersTitle}
            </CardTitle>
            <CardDescription>{t.providersHelp(envProvider)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {providers.length > 0 ? (
              <ul className="space-y-4">
                {providers.map((provider) => (
                  <li key={provider.id} className="space-y-3 rounded-md border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span>{provider.name}</span>
                        {provider.isDefault ? <Badge>{t.defaultBadge}</Badge> : null}
                        {!provider.active ? (
                          <Badge variant="secondary">{t.inactiveBadge}</Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!provider.isDefault ? (
                          <form action={setDefaultProvider}>
                            <input type="hidden" name="providerId" value={provider.id} />
                            <Button type="submit" size="sm" variant="outline">
                              <Star />
                              {t.setDefault}
                            </Button>
                          </form>
                        ) : null}
                        <form action={toggleProviderActive}>
                          <input type="hidden" name="providerId" value={provider.id} />
                          <Button type="submit" size="sm" variant="outline">
                            <Power />
                            {provider.active ? t.deactivate : t.activate}
                          </Button>
                        </form>
                        <form action={runTest}>
                          <input type="hidden" name="providerId" value={provider.id} />
                          <Button type="submit" size="sm" variant="outline">
                            <FlaskConical />
                            {t.test}
                          </Button>
                        </form>
                        <form action={deleteProvider}>
                          <input type="hidden" name="providerId" value={provider.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            aria-label={t.deleteProvider(provider.name)}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </form>
                      </div>
                    </div>

                    <form action={updateProvider} className="grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="providerId" value={provider.id} />
                      <div className="space-y-1.5">
                        <Label htmlFor={`name-${provider.id}`}>{t.providerName}</Label>
                        <Input
                          id={`name-${provider.id}`}
                          name="name"
                          required
                          defaultValue={provider.name}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`protocol-${provider.id}`}>{t.protocol}</Label>
                        <select
                          id={`protocol-${provider.id}`}
                          name="protocol"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          defaultValue={provider.protocol}
                        >
                          <option value="openai">{t.protocolOpenai}</option>
                          <option value="anthropic">{t.protocolAnthropic}</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`baseUrl-${provider.id}`}>{t.baseUrl}</Label>
                        <Input
                          id={`baseUrl-${provider.id}`}
                          name="baseUrl"
                          type="url"
                          required
                          defaultValue={provider.baseUrl}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`model-${provider.id}`}>{t.model}</Label>
                        <Input
                          id={`model-${provider.id}`}
                          name="model"
                          required
                          defaultValue={provider.model}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`apiKey-${provider.id}`}>{t.newApiKey}</Label>
                        <Input
                          id={`apiKey-${provider.id}`}
                          name="apiKey"
                          type="password"
                          autoComplete="off"
                          placeholder={t.apiKeyPlaceholder}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="active" defaultChecked={provider.active} />
                        {t.activeCheckbox}
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="isDefault"
                          defaultChecked={provider.isDefault}
                        />
                        {t.defaultCheckbox}
                      </label>
                      <div className="sm:col-span-2">
                        <Button type="submit" size="sm">
                          {t.saveChanges}
                        </Button>
                      </div>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noProviders}</p>
            )}

            <form
              action={addProvider}
              className="grid gap-3 rounded-md border border-dashed p-4 sm:grid-cols-2"
            >
              <h3 className="sm:col-span-2 text-sm font-medium">{t.addProviderTitle}</h3>
              <div className="space-y-1.5">
                <Label htmlFor="p-name">{t.providerName}</Label>
                <Input id="p-name" name="name" required placeholder="Groq" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-protocol">{t.protocol}</Label>
                <select
                  id="p-protocol"
                  name="protocol"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  defaultValue="openai"
                >
                  <option value="openai">{t.protocolOpenaiLong}</option>
                  <option value="anthropic">{t.protocolAnthropicLong}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-baseUrl">{t.baseUrl}</Label>
                <Input
                  id="p-baseUrl"
                  name="baseUrl"
                  type="url"
                  required
                  placeholder="https://api.groq.com/openai/v1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-model">{t.model}</Label>
                <Input id="p-model" name="model" required placeholder="llama-3.3-70b-versatile" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="p-apiKey">{t.apiKeyLabel}</Label>
                <Input id="p-apiKey" name="apiKey" type="password" required autoComplete="off" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isDefault" defaultChecked />
                {t.makeDefault}
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">
                  <Plus />
                  {t.addProvider}
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
              {t.packsTitle}
            </CardTitle>
            <CardDescription>{t.packsHelp}</CardDescription>
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
                  <Label htmlFor={`label-${pack.id}`}>{t.packLabel}</Label>
                  <Input
                    id={`label-${pack.id}`}
                    name="label"
                    defaultValue={pack.label}
                    className="w-32"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`price-${pack.id}`}>{t.packPrice}</Label>
                  <Input
                    id={`price-${pack.id}`}
                    name="priceCents"
                    type="number"
                    defaultValue={pack.priceCents}
                    className="w-28"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`credits-${pack.id}`}>{t.packCredits}</Label>
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
                  {t.activeCheckbox}
                </label>
                <Button type="submit" size="sm" variant="outline">
                  {m.common.save}
                </Button>
              </form>
            ))}

            <form
              action={addPack}
              className="flex flex-wrap items-end gap-3 rounded-md border border-dashed p-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="new-label">{t.packLabel}</Label>
                <Input
                  id="new-label"
                  name="label"
                  required
                  placeholder={t.packLabelPlaceholder}
                  className="w-32"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-price">{t.packPrice}</Label>
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
                <Label htmlFor="new-credits">{t.packCredits}</Label>
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
                {t.addPack}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
