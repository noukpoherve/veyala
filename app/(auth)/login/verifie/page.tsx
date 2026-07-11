import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Vérifiez votre boîte mail" };

export default function VerifyRequestPage() {
  return (
    <main className="bg-aurora relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="orb -top-32 left-[-6%] size-[480px] [animation-duration:9s]"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)" }}
      />
      <Card className="relative w-full max-w-md rounded-3xl border-slate-100 text-center shadow-xl shadow-blue-900/5">
        <CardHeader className="items-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
            <MailCheck className="size-7 text-blue-600" aria-hidden />
          </span>
          <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
            Vérifiez votre boîte mail
          </CardTitle>
          <CardDescription>
            Un lien de connexion vient de vous être envoyé. Cliquez dessus pour accéder à votre
            espace.
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
