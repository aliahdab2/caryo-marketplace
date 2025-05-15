# Frontend Testing Guide

This guide outlines how to run tests and understand the testing setup for the Caryo Marketplace frontend application.

## Testing Tools

The frontend testing infrastructure uses the following tools:

- **Jest**: Main testing framework
- **React Testing Library**: For testing React components
- **@testing-library/user-event**: For simulating user interactions
- **jest-environment-jsdom**: A testing environment that simulates a browser-like DOM

## Running Tests

### Basic Commands

- **Run all tests once**:
  ```bash
  npm test
  ```

- **Run tests in watch mode** (tests re-run when files change):
  ```bash
  npm run test:watch
  ```

- **Run tests with coverage report**:
  ```bash
  npm run test:coverage
  ```

### Test Structure

Tests are organized by feature and component, primarily located in the `/src/tests` directory. The RTL (Right-to-Left) layout tests are a good example of how tests are structured:

- `rtl-layout.test.tsx`: Tests for general RTL layout functionality
- `rtl-visual-rendering.test.tsx`: Tests for visual aspects of RTL layouts
- `rtl-conditional-loading.test.tsx`: Tests for conditional loading of RTL stylesheets

## Writing Tests

### Best Practices

1. **Component Tests**: Focus on testing behavior, not implementation details:
   ```tsx
   test('language switcher changes language when clicked', async () => {
     render(<LanguageSwitcher />);
     await userEvent.click(screen.getByRole('button', { name: /change language/i }));
     expect(screen.getByText(/english/i)).toBeInTheDocument();
   });
   ```

2. **Use data-testid sparingly**: Prefer using accessible queries like `getByRole`, `getByLabelText`, etc.

3. **Test user flows**: Focus on what the user experiences rather than internal state

4. **Snapshot testing**: Use sparingly for UI components that change infrequently

### Test Configuration

- Tests are configured in `jest.config.mjs`
- Test setup happens in `jest.setup.js`
- Style and file mocks are in the `__mocks__` directory

## Known Issues and Solutions

### Punycode Deprecation Warning

When running tests, you might see a deprecation warning about the `punycode` module. We've implemented a solution to handle this warning:

1. Installed the userland `punycode` package
2. Updated test scripts with `--no-deprecation` flag
3. Added warning suppression in `jest.setup.js`

For more details about this issue and its solution, see [fixing_punycode_warning.md](/docs/fixing_punycode_warning.md).

## RTL Testing

For Right-to-Left (RTL) layout testing, we have specialized test utilities and components:

- `rtl-test-utils.ts`: Utilities for RTL testing, including direction toggling and screenshot capture
- `RTLTestComponent.tsx` and `RTLVisualTest.tsx`: Components for visual testing of RTL layouts

### Running RTL Tests

RTL tests are automatically included when running `npm test`. If you want to focus on just RTL tests:

```bash
npm test -- -t "RTL"
```

## Test Coverage

We aim for comprehensive test coverage, especially for core components and utility functions. The coverage report shows current coverage metrics and identifies areas that need improvement.

To view a detailed coverage report:

1. Run `npm run test:coverage`
2. Open the generated HTML report in `coverage/lcov-report/index.html`

## Future Testing Improvements

1. **Increase coverage**: Currently at around 1% overall, focusing on critical components first
2. **Component isolation**: Move more tests closer to their component implementations
3. **E2E testing**: Implement Cypress for end-to-end testing of critical user flows
4. **Visual regression testing**: Consider tools like Percy or Chromatic
