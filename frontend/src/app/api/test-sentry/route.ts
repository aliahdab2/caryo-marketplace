// Test route for Sentry error tracking

export async function GET() {
  throw new Error("Test Error: Checking if Sentry is working!");
}
