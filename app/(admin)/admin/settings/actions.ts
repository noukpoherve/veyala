"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";

// ---------- LLM providers ----------

const providerSchema = z.object({
  name: z.string().min(2).max(60),
  protocol: z.enum(["openai", "anthropic"]),
  baseUrl: z.string().url(),
  model: z.string().min(1).max(120),
  apiKey: z.string().min(8),
  isDefault: z.boolean(),
});

/** Adds an LLM provider; the API key is AES-GCM encrypted at rest. */
export async function addProvider(formData: FormData) {
  await requireAdmin();
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
  await db.$transaction(async (tx) => {
    if (isDefault) {
      await tx.lLMProvider.updateMany({ data: { isDefault: false } });
    }
    await tx.lLMProvider.create({
      data: { ...rest, apiKeyEnc: encryptSecret(apiKey), active: true, isDefault },
    });
  });
  revalidatePath("/admin/settings");
}

const providerIdSchema = z.object({ providerId: z.string().min(1) });

/** Makes a provider the default one (used by all generations). */
export async function setDefaultProvider(formData: FormData) {
  await requireAdmin();
  const parsed = providerIdSchema.safeParse({ providerId: formData.get("providerId") });
  if (!parsed.success) return;

  await db.$transaction([
    db.lLMProvider.updateMany({ data: { isDefault: false } }),
    db.lLMProvider.update({
      where: { id: parsed.data.providerId },
      data: { isDefault: true, active: true },
    }),
  ]);
  revalidatePath("/admin/settings");
}

/** Deletes a provider (falls back to env config if none remains). */
export async function deleteProvider(formData: FormData) {
  await requireAdmin();
  const parsed = providerIdSchema.safeParse({ providerId: formData.get("providerId") });
  if (!parsed.success) return;

  await db.lLMProvider.delete({ where: { id: parsed.data.providerId } }).catch(() => {});
  revalidatePath("/admin/settings");
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
  revalidatePath("/admin/settings");
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
  revalidatePath("/admin/settings");
  revalidatePath("/billing");
}
