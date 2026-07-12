import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Only enable in production or if explicitly enabled via env
  // This prevents 403 errors when keys are domain-restricted
  enabled: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true",

  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample 10% of transactions to keep quota/noise manageable; errors are always captured
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// Required by Sentry to instrument Next.js navigation transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
