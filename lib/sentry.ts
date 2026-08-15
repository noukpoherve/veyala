import * as Sentry from "@sentry/nextjs";

/** Shared SDK options for browser, Node, and Edge. No-op when the DSN is unset. */
export function sentryRuntimeOptions(): Parameters<typeof Sentry.init>[0] {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    },
  };
}

/** Log locally and report unexpected failures to Sentry (when configured). */
export function reportError(error: unknown, context: string): void {
  console.error(`[${context}]`, error);
  Sentry.captureException(error, { tags: { context } });
}
