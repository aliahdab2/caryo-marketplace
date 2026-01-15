# E2E Test Fixtures

This folder contains test data and assets used by E2E tests.

## Files

- `test-car-image.jpg` - Sample car image for listing creation tests
- `test-data.ts` - Reusable test data objects

## Adding New Fixtures

Place any static files (images, PDFs, etc.) in this folder and reference them in tests:

```typescript
await page.locator('input[type="file"]').setInputFiles('./e2e/fixtures/test-car-image.jpg');
```
