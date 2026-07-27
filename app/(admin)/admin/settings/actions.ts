"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { chat, resolveLLMConfig, LLMError } from "@/lib/llm";
import { PACKS_TAG } from "@/lib/cached";

// ---------- LLM providers (unlimited CRUD) ----------

const providerSchema = z.object({
  name: z.string().min(2).max(60),
  protocol: z.enum(["openai", "anthropic"]),
  baseUrl: z.string().url(),
  model: z.string().min(1).max(120),
  apiKey: z.string().min(8),
  isDefault: z.boolean(),
});

/** Adds an LLM provider; the API key is AES-GCM encrypted at rest. No count limit. */
export async function addProvider(formData: FormData) {
  const session = await requireAdmin();
  const parsed = providerSchema.safeParse({
    name: formData.get("name"),
    protocol: formData.get("protocol"),
    baseUrl: formData.get("baseUrl"),
    model: formData.get("model"),
    apiKey: formData.get("apiKey"),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return;

  const { apiKey, isDefault, ...rest } = parsed.data;
  const created = await db.$transaction(async (tx) => {
    if (isDefault) {
      await tx.lLMProvider.updateMany({ data: { isDefault: false } });
    }
    return tx.lLMProvider.create({
      data: { ...rest, apiKeyEnc: encryptSecret(apiKey), active: true, isDefault },
    });
  });
  await logAdminAction({
    actorId: session.user.id,
    action: "llm.create",
    targetId: created.id,
    meta: { name: created.name, model: created.model },
  });
  revalidatePath("/admin/settings");
}

const updateProviderSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(2).max(60),
  protocol: z.enum(["openai", "anthropic"]),
  baseUrl: z.string().url(),
  model: z.string().min(1).max(120),
  /** Empty = keep existing key. */
  apiKey: z.string().optional(),
  active: z.boolean(),
  isDefault: z.boolean(),
});

/** Updates any field of a provider (key optional). */
export async function updateProvider(formData: FormData) {
  const session = await requireAdmin();
  const rawKey = String(formData.get("apiKey") ?? "").trim();
  const parsed = updateProviderSchema.safeParse({
    providerId: formData.get("providerId"),
    name: formData.get("name"),
    protocol: formData.get("protocol"),
    baseUrl: formData.get("baseUrl"),
    model: formData.get("model"),
    apiKey: rawKey.length ? rawKey : undefined,
    active: formData.get("active") === "on",
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return;
  if (parsed.data.apiKey !== undefined && parsed.data.apiKey.length < 8) return;

  const { providerId, apiKey, isDefault, ...rest } = parsed.data;
  await db.$transaction(async (tx) => {
    if (isDefault) {
      await tx.lLMProvider.updateMany({ data: { isDefault: false } });
    }
    await tx.lLMProvider.update({
      where: { id: providerId },
      data: {
        ...rest,
        isDefault,
        ...(apiKey ? { apiKeyEnc: encryptSecret(apiKey) } : {}),
      },
    });
  });
  await logAdminAction({
    actorId: session.user.id,
    action: "llm.update",
    targetId: providerId,
    meta: { keyRotated: Boolean(apiKey) },
  });
  revalidatePath("/admin/settings");
}

const providerIdSchema = z.object({ providerId: z.string().min(1) });

/** Makes a provider the default one (used by all generations). */
export async function setDefaultProvider(formData: FormData) {
  const session = await requireAdmin();
  const parsed = providerIdSchema.safeParse({ providerId: formData.get("providerId") });
  if (!parsed.success) return;

  await db.$transaction([
    db.lLMProvider.updateMany({ data: { isDefault: false } }),
    db.lLMProvider.update({
      where: { id: parsed.data.providerId },
      data: { isDefault: true, active: true },
    }),
  ]);
  await logAdminAction({
    actorId: session.user.id,
    action: "llm.set_default",
    targetId: parsed.data.providerId,
  });
  revalidatePath("/admin/settings");
}

/** Toggles active flag without deleting. */
export async function toggleProviderActive(formData: FormData) {
  const session = await requireAdmin();
  const parsed = providerIdSchema.safeParse({ providerId: formData.get("providerId") });
  if (!parsed.success) return;
  const current = await db.lLMProvider.findUnique({ where: { id: parsed.data.providerId } });
  if (!current) return;
  await db.lLMProvider.update({
    where: { id: current.id },
    data: { active: !current.active },
  });
  await logAdminAction({
    actorId: session.user.id,
    action: "llm.toggle_active",
    targetId: current.id,
    meta: { active: !current.active },
  });
  revalidatePath("/admin/settings");
}

/** Deletes a provider (falls back to env config if none remains). */
export async function deleteProvider(formData: FormData) {
  const session = await requireAdmin();
  const parsed = providerIdSchema.safeParse({ providerId: formData.get("providerId") });
  if (!parsed.success) return;

  await db.lLMProvider.delete({ where: { id: parsed.data.providerId } }).catch(() => {});
  await logAdminAction({
    actorId: session.user.id,
    action: "llm.delete",
    targetId: parsed.data.providerId,
  });
  revalidatePath("/admin/settings");
}

/** Smoke-tests a specific provider (or the resolved default). */
export async function testProvider(formData: FormData): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const providerId = String(formData.get("providerId") ?? "");
  try {
    let config = await resolveLLMConfig();
    if (providerId) {
      const row = await db.lLMProvider.findUnique({ where: { id: providerId } });
      if (!row?.apiKeyEnc) return { ok: false, message: "Fournisseur introuvable." };
      config = {
        protocol: row.protocol,
        baseUrl: row.baseUrl,
        apiKey: decryptSecret(row.apiKeyEnc),
        model: row.model,
        providerName: row.name,
      };
    }
    const started = Date.now();
    const reply = await chat(
      { system: "Tu es un assistant de test. Réponds uniquement : OK", user: "ping" },
      config
    );
    return {
      ok: true,
      message: `${config.providerName} · ${config.model} · ${Date.now() - started} ms · ${reply.slice(0, 80)}`,
    };
  } catch (e) {
    const msg =
      e instanceof LLMError || e instanceof Error ? e.message : "Échec du test fournisseur.";
    return { ok: false, message: msg };
  }
}

// ---------- Packs ----------

const packSchema = z.object({
  label: z.string().min(2).max(60),
  priceCents: z.coerce.number().int().min(50).max(100000),
  credits: z.coerce.number().int().min(1).max(1000),
});

/** Creates a credit pack. */
export async function addPack(formData: FormData) {
  await requireAdmin();
  const parsed = packSchema.safeParse({
    label: formData.get("label"),
    priceCents: formData.get("priceCents"),
    credits: formData.get("credits"),
  });
  if (!parsed.success) return;

  const maxOrder = await db.pack.aggregate({ _max: { sortOrder: true } });
  await db.pack.create({
    data: { ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  });
  revalidateTag(PACKS_TAG);
  revalidatePath("/admin/settings");
  revalidatePath("/billing");
  revalidatePath("/");
}

const updatePackSchema = packSchema.extend({
  packId: z.string().min(1),
  active: z.boolean(),
});

/** Updates a pack's label, price, credits and availability. */
export async function updatePack(formData: FormData) {
  await requireAdmin();
  const parsed = updatePackSchema.safeParse({
    packId: formData.get("packId"),
    label: formData.get("label"),
    priceCents: formData.get("priceCents"),
    credits: formData.get("credits"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return;

  const { packId, ...data } = parsed.data;
  await db.pack.update({ where: { id: packId }, data });
  revalidateTag(PACKS_TAG);
  revalidatePath("/admin/settings");
  revalidatePath("/billing");
  revalidatePath("/");
}
