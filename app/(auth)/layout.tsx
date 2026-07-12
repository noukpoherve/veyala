import type { ReactNode } from "react";

/** Shared shell for login/register/verify pages: aurora background + centered card. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-aurora relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="orb -top-32 left-[-6%] size-[480px] [animation-duration:9s]"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="orb -bottom-24 right-[-8%] size-[420px] [animation-duration:7s]"
        style={{ background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)" }}
      />
      {children}
    </main>
  );
}
