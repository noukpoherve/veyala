import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="bg-signature h-1.5 w-40 rounded-full" aria-hidden />
      <h1 className="font-display text-4xl font-bold tracking-tight">CVGen</h1>
      <p className="max-w-md text-center text-muted-foreground">
        CV optimisés par IA, adaptés à chaque offre d&apos;emploi. Export Word et PDF au
        design soigné.
      </p>
      <Link
        href="/dashboard"
        className="bg-signature-x rounded-md px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:brightness-110"
      >
        Générer mon CV
      </Link>
    </main>
  );
}
