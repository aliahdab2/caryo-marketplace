# Sentry Monitoring Guide

## 1. How it Works

Sentry automatically captures:

- **Unhandles Exceptions**: Crashes that break the app.
- **API Errors**: Failed backend requests (500 errors).
- **Performance**: Slow page loads and API calls.

## 2. How to Test (Verify it works)

### Method A: Client-Side Crash

1. Open your browser console.
2. Type `throw new Error("Sentry Test Client Error!");`
3. Hit Enter.
4. Check your Sentry Dashboard -> Issues.

### Method B: Server-Side Crash (API)

You can create a temporary API route to test server reporting.

1. Create `frontend/src/app/api/sentry-test/route.ts`:

   ```typescript
   import { NextResponse } from "next/server";

   export async function GET() {
     throw new Error("Sentry Test Server Error!");
   }
   ```

2. Visit `http://localhost:3000/api/sentry-test`.
3. Check Sentry Dashboard.

## 3. How to Use in Code

### Catching Errors Manually

If you have a `try/catch` block and want to report the error without crashing the app:

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  await failingFunction();
} catch (error) {
  // Log to Sentry but keep app running
  Sentry.captureException(error);
}
```

### Adding User Context

To know _who_ had the error:

```typescript
Sentry.setUser({
  id: "123",
  email: "john@doe.com",
});
```

(We should add this to our Auth flow later).

## 4. Viewing Errors

1. Go to [sentry.io/organizations/caryo/issues](https://sentry.io).
2. Click on an Issue to see:
   - **Stack Trace**: Which line of code failed.
   - **Breadcrumbs**: What the user did before the crash (clicked button X, visited page Y).
   - **Device**: Browser, OS, Screen size.
