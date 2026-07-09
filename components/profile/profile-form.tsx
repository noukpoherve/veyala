"use client";

import { useState } from "react";
import { useFieldArray, useForm, type Control, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { cvSchema, type CVData } from "@/lib/cv-schema";
import { saveProfile } from "@/app/(app)/profile/actions";
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

function ExperiencesSection({ control, form }: { control: Control<CVData>; form: ReturnType<typeof useForm<CVData>> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "experiences" });
  return (
    <SectionCard title="Expériences">
      {fields.map((field, i) => (
        <div key={field.id} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Intitulé du poste *</Label>
                <Input {...form.register(`experiences.${i}.title`)} />
              </div>
              <div className="space-y-1.5">
                <Label>Entreprise</Label>
                <Input {...form.register(`experiences.${i}.company`)} />
              </div>
              <div className="space-y-1.5">
                <Label>Lieu</Label>
                <Input {...form.register(`experiences.${i}.place`)} />
              </div>
              <div className="space-y-1.5">
                <Label>Dates</Label>
                <Input {...form.register(`experiences.${i}.dates`)} placeholder="2023 — 2025" />
              </div>
            </div>
            <RemoveButton onClick={() => remove(i)} label={`Supprimer l'expérience ${i + 1}`} />
          </div>
          <LinesField
            label="Réalisations (une par ligne)"
            value={form.getValues(`experiences.${i}.bullets`)}
            onChange={(lines) => form.setValue(`experiences.${i}.bullets`, lines, { shouldDirty: true })}
          />
          <LinesField
            label="Stack technique (une techno par ligne)"
            rows={3}
            value={form.getValues(`experiences.${i}.stack`)}
            onChange={(lines) => form.setValue(`experiences.${i}.stack`, lines, { shouldDirty: true })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ title: "", company: "", place: "", dates: "", bullets: [], stack: [] })}
      >
        <Plus />
        Ajouter une expérience
      </Button>
    </SectionCard>
  );
}

export function ProfileForm({ initialData }: { initialData: CVData }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<CVData>({
    resolver: zodResolver(cvSchema) as Resolver<CVData>,
    defaultValues: initialData,
  });
  const { control, register, handleSubmit, getValues, setValue } = form;

  const links = useFieldArray({ control, name: "contact.links" });
  const education = useFieldArray({ control, name: "education" });
  const skills = useFieldArray({ control, name: "skills" });
  const languages = useFieldArray({ control, name: "languages" });

  const onSubmit = handleSubmit(
    async (data) => {
      setStatus("saving");
      const result = await saveProfile(data);
      if (result.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        setErrorMessage(result.error);
        setStatus("error");
      }
    },
    () => {
      setErrorMessage("Certains champs sont invalides (le nom complet est obligatoire).");
      setStatus("error");
    }
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionCard title="Identité & contact">
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

      <ExperiencesSection control={control} form={form} />

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

      <div className="sticky bottom-4 flex items-center gap-3">
        <Button type="submit" variant="gradient" disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="animate-spin" /> : null}
          Enregistrer mon CV de base
        </Button>
        {status === "saved" ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="size-4" />
            Enregistré
          </span>
        ) : null}
        {status === "error" ? (
          <span role="alert" className="text-sm text-destructive">
            {errorMessage}
          </span>
        ) : null}
      </div>
    </form>
  );
}
