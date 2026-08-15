import * as Sentry from "@sentry/nextjs";
import { sentryRuntimeOptions } from "@/lib/sentry";

Sentry.init(sentryRuntimeOptions());
