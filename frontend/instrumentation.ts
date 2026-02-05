import * as Sentry from "@sentry/nextjs";

export async function register() {
  Sentry.init({
    // Only enable in production or if explicitly enabled via env
    // This prevents 403 errors when keys are domain-restricted
    enabled: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true",

    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}

// Capture errors from nested React Server Components
export const onRequestError = Sentry.captureRequestError;
