"use client";

import { useRef } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import type { CVData } from "@/lib/cv-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} aria-label={label}>
      <Trash2 className="text-destructive" />
    </Button>
  );
}

/** Textarea bound to a string array (one entry per line). */
function LinesField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string[];
  onChange: (lines: string[]) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea
        rows={rows}
        defaultValue={value.join("\n")}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
          )
        }
      />
    </div>
  );
}

/** Downscales the photo client-side and returns a compact JPEG data URL. */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function PhotoField({ form }: { form: UseFormReturn<CVData> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const photoUrl = form.watch("identity.photoUrl");

  return (
    <div className="flex items-center gap-4">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL preview
        <img
          src={photoUrl}
          alt="Photo du CV"
          className="h-20 w-16 rounded-md border object-cover"
        />
      ) : (
        <div className="flex h-20 w-16 items-center justify-center rounded-md border border-dashed text-muted-foreground">
          <ImagePlus className="size-5" aria-hidden />
        </div>
      )}
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              form.setValue("identity.photoUrl", await fileToDataUrl(file), { shouldDirty: true });
            }
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <ImagePlus />
            {photoUrl ? "Changer la photo" : "Ajouter une photo"}
          </Button>
          {photoUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => form.setValue("identity.photoUrl", "", { shouldDirty: true })}
            >
              Retirer
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP — affichée uniquement sur les templates avec photo.
        </p>
      </div>
    </div>
  );
}

/** All structured-CV form fields, shared by /profile and the CV editor. */
export function CvFields({ form }: { form: UseFormReturn<CVData> }) {
  const { control, register, getValues, setValue } = form;
  const links = useFieldArray({ control, name: "contact.links" });
  const experiences = useFieldArray({ control, name: "experiences" });
  const education = useFieldArray({ control, name: "education" });
  const skills = useFieldArray({ control, name: "skills" });
  const languages = useFieldArray({ control, name: "languages" });

  return (
    <>
      <SectionCard title="Identité & contact">
        <PhotoField form={form} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nom complet *</Label>
            <Input id="fullName" {...register("identity.fullName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="headline">Titre / accroche</Label>
            <Input id="headline" {...register("identity.headline")} placeholder="Développeur Full-Stack — React, Node" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("contact.email")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" {...register("contact.phone")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="location">Localisation</Label>
            <Input id="location" {...register("contact.location")} placeholder="Paris, France" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Liens (LinkedIn, GitHub, portfolio…)</Label>
          {links.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <Input className="w-40" placeholder="Label" {...register(`contact.links.${i}.label`)} />
              <Input placeholder="https://…" {...register(`contact.links.${i}.url`)} />
              <RemoveButton onClick={() => links.remove(i)} label={`Supprimer le lien ${i + 1}`} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => links.append({ label: "", url: "" })}>
            <Plus />
            Ajouter un lien
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summary">Profil / résumé</Label>
          <Textarea id="summary" rows={4} {...register("summary")} />
        </div>
      </SectionCard>

      <SectionCard title="Expériences">
        {experiences.fields.map((field, i) => (
          <div key={field.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Intitulé du poste *</Label>
                  <Input {...register(`experiences.${i}.title`)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Entreprise</Label>
                  <Input {...register(`experiences.${i}.company`)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lieu</Label>
                  <Input {...register(`experiences.${i}.place`)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dates</Label>
                  <Input {...register(`experiences.${i}.dates`)} placeholder="2023 — 2025" />
                </div>
              </div>
              <RemoveButton onClick={() => experiences.remove(i)} label={`Supprimer l'expérience ${i + 1}`} />
            </div>
            <LinesField
              label="Réalisations (une par ligne)"
              value={getValues(`experiences.${i}.bullets`)}
              onChange={(lines) => setValue(`experiences.${i}.bullets`, lines, { shouldDirty: true })}
            />
            <LinesField
              label="Stack technique (une techno par ligne)"
              rows={3}
              value={getValues(`experiences.${i}.stack`)}
              onChange={(lines) => setValue(`experiences.${i}.stack`, lines, { shouldDirty: true })}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            experiences.append({ title: "", company: "", place: "", dates: "", bullets: [], stack: [] })
          }
        >
          <Plus />
          Ajouter une expérience
        </Button>
      </SectionCard>

      <SectionCard title="Formations">
        {education.fields.map((field, i) => (
          <div key={field.id} className="flex items-start gap-2 rounded-lg border p-4">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Diplôme *</Label>
                <Input {...register(`education.${i}.degree`)} />
              </div>
              <div className="space-y-1.5">
                <Label>École</Label>
                <Input {...register(`education.${i}.school`)} />
              </div>
              <div className="space-y-1.5">
                <Label>Lieu</Label>
                <Input {...register(`education.${i}.place`)} />
              </div>
              <div className="space-y-1.5">
                <Label>Dates</Label>
                <Input {...register(`education.${i}.dates`)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Détails</Label>
                <Input {...register(`education.${i}.details`)} />
              </div>
            </div>
            <RemoveButton onClick={() => education.remove(i)} label={`Supprimer la formation ${i + 1}`} />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => education.append({ degree: "", school: "", place: "", dates: "", details: "" })}
        >
          <Plus />
          Ajouter une formation
        </Button>
      </SectionCard>

      <SectionCard title="Compétences">
        {skills.fields.map((field, i) => (
          <div key={field.id} className="flex items-start gap-2 rounded-lg border p-4">
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label>Catégorie *</Label>
                <Input {...register(`skills.${i}.category`)} placeholder="Back-end, DevOps…" />
              </div>
              <LinesField
                label="Compétences (une par ligne)"
                rows={3}
                value={getValues(`skills.${i}.items`)}
                onChange={(lines) => setValue(`skills.${i}.items`, lines, { shouldDirty: true })}
              />
            </div>
            <RemoveButton onClick={() => skills.remove(i)} label={`Supprimer la catégorie ${i + 1}`} />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => skills.append({ category: "", items: [] })}>
          <Plus />
          Ajouter une catégorie
        </Button>
      </SectionCard>

      <SectionCard title="Langues & centres d'intérêt">
        <div className="space-y-2">
          <Label>Langues</Label>
          {languages.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <Input className="w-48" placeholder="Français" {...register(`languages.${i}.name`)} />
              <Input placeholder="Courant, C1…" {...register(`languages.${i}.level`)} />
              <RemoveButton onClick={() => languages.remove(i)} label={`Supprimer la langue ${i + 1}`} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => languages.append({ name: "", level: "" })}>
            <Plus />
            Ajouter une langue
          </Button>
        </div>
        <LinesField
          label="Centres d'intérêt (un par ligne)"
          rows={3}
          value={getValues("interests")}
          onChange={(lines) => setValue("interests", lines, { shouldDirty: true })}
        />
      </SectionCard>
    </>
  );
}
