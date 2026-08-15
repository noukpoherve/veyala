import { oauthProviderFlags } from "@/lib/auth";
import { signInWithProvider } from "@/app/(auth)/oauth-actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
      />
    </svg>
  );
}

// function GitHubIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
//       <path
//         fill="currentColor"
//         d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
//       />
//     </svg>
//   );
// }

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45ZM22 2H2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"
      />
    </svg>
  );
}

/** Social sign-in section shown on login/register when providers are enabled. */
export function OAuthButtons({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  if (!oauthProviderFlags.google && !oauthProviderFlags.linkedin_oidc) return null;

  return (
    <>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase text-muted-foreground">ou</span>
        <Separator className="flex-1" />
      </div>

      {oauthProviderFlags.google ? (
        <form action={signInWithProvider.bind(null, "google", callbackUrl)}>
          <Button variant="outline" className="w-full" type="submit">
            <GoogleIcon />
            Continuer avec Google
          </Button>
        </form>
      ) : null}

      {/* {oauthProviderFlags.github ? (
        <form action={signInWithProvider.bind(null, "github", callbackUrl)}>
          <Button variant="outline" className="w-full" type="submit">
            <GitHubIcon />
            Continuer avec GitHub
          </Button>
        </form>
      ) : null} */}

      {oauthProviderFlags.linkedin_oidc ? (
        <form action={signInWithProvider.bind(null, "linkedin_oidc", callbackUrl)}>
          <Button variant="outline" className="w-full" type="submit">
            <LinkedInIcon />
            Continuer avec LinkedIn
          </Button>
        </form>
      ) : null}
    </>
  );
}
