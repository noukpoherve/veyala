"use client";

import { useRef, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { ArrowDownWideNarrow, ChevronDown, ImagePlus, Plus, Trash2 } from "lucide-react";
import type { CVData } from "@/lib/cv-schema";
import { sortByDatesDesc } from "@/lib/cv-sort";
import { fileToDataUrl } from "@/lib/image-file";
import { SOFT_SKILLS_CATALOG } from "@/lib/soft-skills";
import { SortableList } from "@/components/cv/sortable-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function SectionCard({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-6 text-left"
      >
        <CardTitle className="text-base">{title}</CardTitle>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open ? <CardContent className="space-y-4">{children}</CardContent> : null}
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
  hint,
  rows = 4,
}: {
  label: string;
  value: string[];
  onChange: (lines: string[]) => void;
  placeholder?: string;
  hint?: string;
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
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ExperienceLinks({ form, index }: { form: UseFormReturn<CVData>; index: number }) {
  const links = useFieldArray({
    control: form.control,
    name: `experiences.${index}.links`,
  });

  return (
    <div className="space-y-2">
      <Label>Liens de référence (package, démo, extension…)</Label>
      {links.fields.map((field, i) => (
        <div key={field.id} className="flex flex-wrap gap-2">
          <Input
            className="w-full sm:w-40"
            placeholder="Label"
            {...form.register(`experiences.${index}.links.${i}.label`)}
          />
          <Input
            className="min-w-0 flex-1"
            placeholder="https://…"
            {...form.register(`experiences.${index}.links.${i}.url`)}
          />
          <RemoveButton
            onClick={() => links.remove(i)}
            label={`Supprimer le lien de référence ${i + 1}`}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => links.append({ label: "", url: "" })}
      >
        <Plus />
        Ajouter un lien
      </Button>
    </div>
  );
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
          alt="Portrait du candidat"
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
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
          JPG, PNG ou WebP — affichée sur tous les templates (désactivable dans Personnaliser).
        </p>
      </div>
    </div>
  );
}

/** All structured-CV form fields, shared by /profile and the CV editor. */
export function CvFields({ form }: { form: UseFormReturn<CVData> }) {
  const { control, register, getValues, setValue, watch } = form;
  const softSkills = watch("softSkills") ?? [];
  const links = useFieldArray({ control, name: "contact.links" });
  const details = useFieldArray({ control, name: "contact.details" });
  const experiences = useFieldArray({ control, name: "experiences" });
  const education = useFieldArray({ control, name: "education" });
  const certifications = useFieldArray({ control, name: "certifications" });
  const skills = useFieldArray({ control, name: "skills" });
  const languages = useFieldArray({ control, name: "languages" });

  return (
    <>
      <SectionCard title="Identité & contact" defaultOpen>
        <PhotoField form={form} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nom complet *</Label>
            <Input id="fullName" {...register("identity.fullName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="headline">Titre / accroche</Label>
            <Input
              id="headline"
              {...register("identity.headline")}
              placeholder="Développeur Full-Stack — React, Node"
            />
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
            <div key={field.id} className="flex flex-wrap gap-2">
              <Input
                className="w-full sm:w-40"
                placeholder="Label"
                {...register(`contact.links.${i}.label`)}
              />
              <Input
                className="min-w-0 flex-1"
                placeholder="https://…"
                {...register(`contact.links.${i}.url`)}
              />
              <RemoveButton onClick={() => links.remove(i)} label={`Supprimer le lien ${i + 1}`} />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => links.append({ label: "", url: "" })}
          >
            <Plus />
            Ajouter un lien
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Informations complémentaires (ex. Permis → B, Nationalité…)</Label>
          {details.fields.map((field, i) => (
            <div key={field.id} className="flex flex-wrap gap-2">
              <Input
                className="w-full sm:w-40"
                placeholder="Permis"
                {...register(`contact.details.${i}.label`)}
              />
              <Input
                className="min-w-0 flex-1"
                placeholder="B"
                {...register(`contact.details.${i}.value`)}
              />
              <RemoveButton
                onClick={() => details.remove(i)}
                label={`Supprimer l'information ${i + 1}`}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => details.append({ label: "", value: "" })}
          >
            <Plus />
            Ajouter une information
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summary">Profil / résumé</Label>
          <Textarea id="summary" rows={4} {...register("summary")} />
        </div>
      </SectionCard>

      <SectionCard title="Expériences">
        <SortableList ids={experiences.fields.map((f) => f.id)} onMove={experiences.move}>
          {(handle, i) => (
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-start gap-2">
                <div className="pt-6">{handle}</div>
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Intitulé du poste *</Label>
                    <Input {...register(`experiences.${i}.title`)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Entreprise</Label>
                    <Input {...register(`experiences.${i}.company`)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>URL de l&apos;entreprise</Label>
                    <Input
                      {...register(`experiences.${i}.companyUrl`)}
                      placeholder="https://entreprise.com"
                    />
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
                <RemoveButton
                  onClick={() => experiences.remove(i)}
                  label={`Supprimer l'expérience ${i + 1}`}
                />
              </div>
              <LinesField
                label="Réalisations (une par ligne)"
                value={getValues(`experiences.${i}.bullets`)}
                onChange={(lines) =>
                  setValue(`experiences.${i}.bullets`, lines, { shouldDirty: true })
                }
                placeholder={`Développé l'extension [MyExt](https://marketplace.visualstudio.com/…)`}
                hint="Pour un mot cliquable dans une puce : [texte](https://url)"
              />
              <ExperienceLinks form={form} index={i} />
              <LinesField
                label="Stack technique (une techno par ligne)"
                rows={3}
                value={getValues(`experiences.${i}.stack`)}
                onChange={(lines) =>
                  setValue(`experiences.${i}.stack`, lines, { shouldDirty: true })
                }
              />
            </div>
          )}
        </SortableList>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              experiences.append({
                title: "",
                company: "",
                companyUrl: "",
                place: "",
                dates: "",
                bullets: [],
                stack: [],
                links: [],
              })
            }
          >
            <Plus />
            Ajouter une expérience
          </Button>
          {experiences.fields.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => experiences.replace(sortByDatesDesc(getValues("experiences")))}
            >
              <ArrowDownWideNarrow />
              Trier par date
            </Button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Formations">
        <SortableList ids={education.fields.map((f) => f.id)} onMove={education.move}>
          {(handle, i) => (
            <div className="flex items-start gap-2 rounded-lg border bg-card p-4">
              <div className="pt-6">{handle}</div>
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
              <RemoveButton
                onClick={() => education.remove(i)}
                label={`Supprimer la formation ${i + 1}`}
              />
            </div>
          )}
        </SortableList>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              education.append({ degree: "", school: "", place: "", dates: "", details: "" })
            }
          >
            <Plus />
            Ajouter une formation
          </Button>
          {education.fields.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => education.replace(sortByDatesDesc(getValues("education")))}
            >
              <ArrowDownWideNarrow />
              Trier par date
            </Button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Certifications">
        {certifications.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune certification — ajoutez AWS, Scrum, Google Cloud, etc.
          </p>
        ) : null}
        <SortableList ids={certifications.fields.map((f) => f.id)} onMove={certifications.move}>
          {(handle, i) => (
            <div className="flex items-start gap-2 rounded-lg border bg-card p-4">
              <div className="pt-6">{handle}</div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Nom *</Label>
                  <Input
                    {...register(`certifications.${i}.name`)}
                    placeholder="AWS Solutions Architect Associate"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Organisme</Label>
                  <Input
                    {...register(`certifications.${i}.issuer`)}
                    placeholder="Amazon Web Services"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input {...register(`certifications.${i}.dates`)} placeholder="2024" />
                </div>
                <div className="space-y-1.5">
                  <Label>URL du credential</Label>
                  <Input
                    {...register(`certifications.${i}.url`)}
                    placeholder="https://…"
                    inputMode="url"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>N° / ID</Label>
                  <Input {...register(`certifications.${i}.credentialId`)} />
                </div>
              </div>
              <RemoveButton
                onClick={() => certifications.remove(i)}
                label={`Supprimer la certification ${i + 1}`}
              />
            </div>
          )}
        </SortableList>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            certifications.append({
              name: "",
              issuer: "",
              dates: "",
              url: "",
              credentialId: "",
            })
          }
        >
          <Plus />
          Ajouter une certification
        </Button>
      </SectionCard>

      <SectionCard title="Compétences">
        <SortableList ids={skills.fields.map((f) => f.id)} onMove={skills.move}>
          {(handle, i) => (
            <div className="flex items-start gap-2 rounded-lg border bg-card p-4">
              <div className="pt-6">{handle}</div>
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
              <RemoveButton
                onClick={() => skills.remove(i)}
                label={`Supprimer la catégorie ${i + 1}`}
              />
            </div>
          )}
        </SortableList>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => skills.append({ category: "", items: [] })}
        >
          <Plus />
          Ajouter une catégorie
        </Button>
      </SectionCard>

      <SectionCard title="Soft skills">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Qualités qui vous définissent (sélection)
          </legend>
          <p className="mb-3 text-xs text-muted-foreground">
            Ces savoir-être enrichissent le matching ATS sans être confondus avec les outils
            techniques.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {SOFT_SKILLS_CATALOG.map((skill) => {
              const selected = softSkills.includes(skill.label);
              return (
                <li key={skill.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                    <input
                      type="checkbox"
                      className="size-4 rounded border"
                      checked={selected}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...softSkills, skill.label]
                          : softSkills.filter((s) => s !== skill.label);
                        setValue("softSkills", next, {
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                    {skill.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </SectionCard>

      <SectionCard title="Langues & centres d'intérêt">
        <div className="space-y-2">
          <Label>Langues</Label>
          <SortableList ids={languages.fields.map((f) => f.id)} onMove={languages.move}>
            {(handle, i) => (
              <div className="flex items-center gap-2">
                {handle}
                <Input
                  className="w-48"
                  placeholder="Français"
                  {...register(`languages.${i}.name`)}
                />
                <Input placeholder="Courant, C1…" {...register(`languages.${i}.level`)} />
                <RemoveButton
                  onClick={() => languages.remove(i)}
                  label={`Supprimer la langue ${i + 1}`}
                />
              </div>
            )}
          </SortableList>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => languages.append({ name: "", level: "" })}
          >
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
