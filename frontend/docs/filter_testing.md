# Filter Functionality Testing

This document explains the test structure for the filtering functionality in the Caryo Marketplace application.

## Test Files

1. **HomeSearchBar Component Test**  
   Path: `/src/components/search/__tests__/HomeSearchBar.test.tsx`  
   This test verifies that the search bar component on the home page functions correctly, including:
   - Rendering all dropdown elements
   - Loading and displaying brands correctly
   - Enabling the model dropdown only after a brand is selected
   - Constructing the correct URL parameters when searching

2. **Listings Page Test**  
   Path: `/src/app/listings/__tests__/listings-page.test.tsx`  
   This test verifies that the listings page handles filtering correctly, including:
   - Rendering with search parameters from the URL
   - Handling filter changes from the UI
   - Maintaining URL parameters after updating filters
   - Displaying the correct number of filtered listings

3. **Integration Test**  
   Path: `/src/tests/integration/search-listings-integration.test.tsx`  
   This test verifies the end-to-end flow from search to listings display:
   - Parameters correctly passed from HomeSearchBar to ListingsPage
   - Filters applied correctly across component boundaries
   - URL state properly maintained during the user journey

## Running the Tests

Use the provided script to run all filter functionality tests:

```bash
# Run all filter tests
./scripts/run-filter-tests.sh
```

Or run individual test files:

```bash
# Test just the HomeSearchBar
npm test -- --testPathPattern=src/components/search/__tests__/HomeSearchBar.test.tsx

# Test just the Listings page
npm test -- --testPathPattern=src/app/listings/__tests__/listings-page.test.tsx

# Test the integration
npm test -- --testPathPattern=src/tests/integration/search-listings-integration.test.tsx
```

## Test Coverage

These tests verify the following key aspects:

1. **Parameter Consistency**: Ensuring that parameters like `brand` (not `make`) are used consistently
2. **Filter Application**: Verifying that selected filters correctly affect the displayed listings
3. **URL State Management**: Checking that URL parameters are properly updated and maintained
4. **Layout Stability**: Ensuring that the UI remains stable during filtering and page transitions

## Preventing Future Bugs

These tests help prevent several types of bugs:

- Parameter naming inconsistencies (e.g., using `make` vs. `brand`)
- Filter application errors (e.g., filtering by ID instead of name)
- URL parameter handling issues
- Layout shifts during page transitions
- Loading state display problems

By regularly running these tests, we can ensure that the filtering functionality remains stable and consistent as the application evolves.
