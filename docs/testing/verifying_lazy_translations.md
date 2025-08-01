# Verifying Translation Lazy Loading

This document explains how to verify that lazy loading of translations is working correctly in the Caryo Marketplace application.

## Built-in Verification Tools

The application includes several built-in tools to help verify that translations are being lazy-loaded correctly:

### 1. Translation Debugger Overlay

In development mode, a small debugger overlay appears in the bottom right corner of the screen. This overlay shows:

- Which translation namespaces are currently loaded
- Which namespaces are not loaded yet
- The current language

Click the overlay to expand it and see more details.

### 2. Console Logging

The application logs detailed information about translation loading to the browser console:

- **Namespace Loading**: When a component requests a namespace to be loaded
- **Cache Hits**: When a component requests a namespace that's already loaded
- **Loading Time**: Performance measurements for namespace loading
- **Missing Keys**: Any translation keys that are missing in the current language

Look for console messages with prefixes like:
- `[i18n Loading]`
- `[i18n Cache Hit]`
- `[i18n Performance]`
- `[i18n Event]`
- `[i18n Missing]`

## How to Test Lazy Loading

To verify that lazy loading is working correctly:

1. **Clear Browser Cache and Storage**:
   - Open DevTools (F12 or Cmd+Option+I)
   - Go to Application tab
   - Clear site data (localStorage, sessionStorage, cookies)

2. **Open Network Tab**:
   - In DevTools, go to Network tab
   - Filter by "locales" to see translation file requests
   - Check "Disable cache" to ensure fresh requests

3. **Test Different Routes**:
   - Navigate to different pages and observe which translation files are loaded
   - The dashboard should only load dashboard-related translations
   - The sign-in page should only load auth-related translations

4. **Verify in Console**:
   - Open browser console (Console tab in DevTools)
   - Look for the logging messages mentioned above
   - Verify that only needed namespaces are loaded when components mount

## Expected Behavior

With correct lazy loading implementation:

1. When you first load the application, only the common namespace should be loaded
2. When you navigate to the sign-in page, the auth namespace should be loaded
3. When you navigate to the dashboard, the dashboard namespace should be loaded
4. When you go back to a page you've already visited, no new translations should be loaded (cache hit)

## Network Analysis

To verify at the network level:

1. Observe the network requests in the Network tab
2. You should see requests for JSON files from `/locales/[language]/[namespace].json`
3. These requests should only happen when you first visit a page that needs a specific namespace
4. When revisiting the same page, no new requests should be made

## Performance Impact

Lazy loading should result in:

1. Faster initial page load (fewer translation files loaded upfront)
2. Lower memory usage (only required translations are kept in memory)
3. Better performance on routes that only need a subset of translations

## Verifying Lazy Loading with Server-Side Rendering (SSR)

When SSR is enabled, it's crucial to verify that lazy-loaded translations work seamlessly between the server and the client.

1.  **Check Server Logs**:
    *   Inspect your server-side logs for any errors related to i18next, translation loading, or missing keys during the server rendering process.
    *   Ensure that the server is correctly configured to detect the user's language and load the appropriate initial namespaces.

2.  **Inspect Initial HTML Response**:
    *   Use your browser's "View Page Source" option (or `curl` the URL) to inspect the raw HTML sent by the server.
    *   Verify that the text content for components rendered on the server is correctly translated into the detected language.
    *   Ensure that only the necessary translation namespaces for the initial view are embedded or preloaded, as per your SSR strategy.

3.  **Verify Client-Side Hydration**:
    *   Open the browser's developer console.
    *   Navigate to a page that uses lazy-loaded translations.
    *   Observe the console for any warnings or errors from React or i18next regarding content mismatch during hydration (e.g., "Warning: Text content did not match. Server: \"Translated Text\" Client: \"key.name\"").
    *   Ensure there is no "flash of untranslated content" (FOUC) where keys are briefly visible before being replaced by translations.

4.  **Compare Server and Client Output**:
    *   After the page fully loads and hydrates on the client, compare the rendered output with the initial HTML source.
    *   The translated content should be consistent.

5.  **Test Language Switching with SSR**:
    *   If your application allows language switching, test this functionality.
    *   Ensure that changing the language updates translations correctly on both subsequent server-rendered navigation (if applicable) and client-side transitions.

6.  **Network Analysis for SSR**:
    *   When SSR is active, the initial page load might not trigger client-side requests for namespaces already rendered by the server.
    *   Subsequent client-side navigations or interactions that require new namespaces should still trigger the lazy-loading XHR requests as expected.
    *   Verify this behavior in the Network tab of your browser's developer tools.

## Common Issues with SSR and Lazy Loading

*   **Mismatched Content**: The server renders one thing, and the client renders another, often due to differences in language detection or loaded namespaces.
*   **Hydration Errors**: React may complain if the client-side render pass produces different markup than the server.
*   **`document` or `window` not defined errors**: Accessing browser-specific globals on the server during i18next initialization or in translation-related utility functions. Ensure such calls are guarded (e.g., `typeof window !== 'undefined'`).
*   **Incorrect Language Detection on Server**: The server might not correctly determine the user's preferred language, leading to the wrong translations being preloaded.

By following these steps, you can ensure that your lazy-loading setup for translations is robust and works correctly in an SSR environment.

## Common Issues

If you notice any of these issues, lazy loading might not be working correctly:

1. All translation namespaces load on initial page load
2. The same namespace is loaded multiple times
3. Excessive network requests for translation files
4. Missing translations that should be available

## Fixing Issues

If you encounter issues with lazy loading:

1. Check the `useLazyTranslation` hook implementation
2. Verify that components are using the hook correctly
3. Ensure i18next configuration has `partialBundledLanguages: true` and `preload: false`
4. Check that namespaces are defined correctly in the i18n configuration
