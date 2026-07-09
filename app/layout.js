import "./globals.css";

export const metadata = {
  title: "Générateur de CV adapté — Noukpo Hervé Houndjetodé",
  description: "Génère un CV Word adapté à une offre d'emploi à partir de son URL.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
