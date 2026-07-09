"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

const reviewSchema = z.object({
  templateId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

/** Approves (→ public) or rejects a pending community template. */
export async function reviewTemplate(formData: FormData) {
  await requireAdmin();
  const parsed = reviewSchema.safeParse({
    templateId: formData.get("templateId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return;

  const { templateId, decision } = parsed.data;
  await db.template.update({
    where: { id: templateId },
    data: { status: decision, isPublic: decision === "APPROVED" },
  });
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
}
