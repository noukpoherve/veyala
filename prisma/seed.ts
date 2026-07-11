import { PrismaClient } from "@prisma/client";
import { OFFICIAL_TEMPLATES } from "../lib/templates/official";
import { templateFingerprint } from "../lib/templates/fingerprint";

const db = new PrismaClient();

const PACKS = [
  { label: "5 CV", priceCents: 199, credits: 5, sortOrder: 1 },
  { label: "20 CV", priceCents: 599, credits: 20, sortOrder: 2 },
  { label: "50 CV", priceCents: 1299, credits: 50, sortOrder: 3 },
];

async function seedPacks() {
  for (const pack of PACKS) {
    const existing = await db.pack.findFirst({ where: { label: pack.label } });
    if (existing) {
      await db.pack.update({ where: { id: existing.id }, data: pack });
    } else {
      await db.pack.create({ data: pack });
    }
  }
  console.log(`✓ ${PACKS.length} packs`);
}

async function seedTemplates() {
  for (const template of OFFICIAL_TEMPLATES) {
    const fingerprint = templateFingerprint(template.definition);
    await db.template.upsert({
      where: { slug: template.slug },
      create: {
        name: template.name,
        slug: template.slug,
        engine: template.engine,
        fingerprint,
        definition: template.definition,
        status: "APPROVED",
        isPublic: true,
      },
      update: {
        name: template.name,
        engine: template.engine,
        fingerprint,
        definition: template.definition,
        status: "APPROVED",
        isPublic: true,
      },
    });
  }
  console.log(`✓ ${OFFICIAL_TEMPLATES.length} templates officiels`);
}

async function seedAdmin() {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  for (const email of emails) {
    await db.user.upsert({
      where: { email },
      create: { email, role: "ADMIN" },
      update: { role: "ADMIN" },
    });
  }
  if (emails.length) console.log(`✓ ${emails.length} admin(s)`);
}

async function main() {
  await seedPacks();
  await seedTemplates();
  await seedAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
