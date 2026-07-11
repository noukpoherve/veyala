import type { Metadata } from "next";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { db } from "@/lib/db";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import { reviewTemplate } from "./actions";
import { TemplateSwatch } from "@/components/templates/template-swatch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Templates · Admin" };

export default async function AdminTemplatesPage() {
  const [pending, others] = await Promise.all([
    db.template.findMany({
      where: { status: "PENDING" },
      include: { owner: { select: { email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.template.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: { owner: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <article className="space-y-8">
      <section aria-labelledby="pending-title" className="space-y-4">
        <h1 id="pending-title" className="font-display text-2xl font-bold">
          File de validation{" "}
          <Badge variant={pending.length ? "default" : "secondary"}>{pending.length}</Badge>
        </h1>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun template en attente. 🎉</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((template) => {
              const def = parseTemplateDefinition(template.definition);
              return (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Proposé par {template.owner?.email ?? "?"} ·{" "}
                      {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                        template.createdAt
                      )}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.previewImageUrl ? (
                      <Image
                        src={template.previewImageUrl}
                        alt={`Image de référence du template ${template.name}`}
                        width={400}
                        height={280}
                        className="h-40 w-full rounded-md border object-cover object-top"
                        unoptimized
                      />
                    ) : null}
                    <TemplateSwatch
                      layout={def.layout}
                      colors={def.colors.sidebar}
                      band={def.colors.band}
                    />
                    <div className="flex gap-2">
                      <form action={reviewTemplate} className="flex-1">
                        <input type="hidden" name="templateId" value={template.id} />
                        <input type="hidden" name="decision" value="APPROVED" />
                        <Button type="submit" size="sm" className="w-full">
                          <Check />
                          Approuver
                        </Button>
                      </form>
                      <form action={reviewTemplate} className="flex-1">
                        <input type="hidden" name="templateId" value={template.id} />
                        <input type="hidden" name="decision" value="REJECTED" />
                        <Button type="submit" size="sm" variant="destructive" className="w-full">
                          <X />
                          Rejeter
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="history-title" className="space-y-3">
        <h2 id="history-title" className="font-display text-lg font-semibold">
          Historique
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th scope="col" className="p-3 font-medium">
                  Template
                </th>
                <th scope="col" className="p-3 font-medium">
                  Auteur
                </th>
                <th scope="col" className="p-3 font-medium">
                  Statut
                </th>
                <th scope="col" className="p-3 font-medium">
                  Public
                </th>
              </tr>
            </thead>
            <tbody>
              {others.map((template) => (
                <tr key={template.id} className="border-t">
                  <td className="p-3 font-medium">{template.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {template.owner?.email ?? "Officiel"}
                  </td>
                  <td className="p-3">
                    <Badge variant={template.status === "APPROVED" ? "success" : "destructive"}>
                      {template.status === "APPROVED" ? "Approuvé" : "Rejeté"}
                    </Badge>
                  </td>
                  <td className="p-3">{template.isPublic ? "Oui" : "Non"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
