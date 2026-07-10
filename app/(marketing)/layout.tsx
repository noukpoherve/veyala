import { auth } from "@/lib/auth";
import { LandingHeader } from "@/components/landing/header";
import { LandingFooter } from "@/components/landing/footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingHeader isAuthenticated={Boolean(session?.user)} />
      <div className="flex-1">{children}</div>
      <LandingFooter />
    </div>
  );
}
