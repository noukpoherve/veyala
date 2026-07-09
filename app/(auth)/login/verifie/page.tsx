import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Vérifiez votre boîte mail" };

export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <MailCheck className="size-10 text-primary" aria-hidden />
          <CardTitle className="text-2xl">Vérifiez votre boîte mail</CardTitle>
          <CardDescription>
            Un lien de connexion vient de vous être envoyé. Cliquez dessus pour accéder à
            votre espace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm text-primary underline">
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
