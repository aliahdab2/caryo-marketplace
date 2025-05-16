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

## Jest Mocking Best Practices

When mocking components and modules in Jest, follow these guidelines to avoid common issues:

### Proper Component Mocking

When mocking components with Jest, avoid referencing variables from outer scope in the mock factory:

```tsx
// DON'T DO THIS - will cause "not allowed to reference out-of-scope variables" error
jest.mock('@/components/MyComponent', () => {
  const MockComponent = ({ onAction }) => { // Error: Using variables from outer scope
    React.useEffect(() => {
      // This will cause an error
    }, []);
    return <div>Mocked</div>;
  };
  return MockComponent;
});

// DO THIS INSTEAD - safe approach using function declaration
jest.mock('@/components/MyComponent', () => {
  return function MockComponent(props) {
    // Access props safely without React references
    if (props.autoStart) {
      setTimeout(() => props.onAction(), 100);
    }
    return <div>Mocked</div>;
  };
});
```

### Handling Test-Specific Mocks

When you need to modify a mock for a specific test:

```tsx
// DON'T nest jest.mock inside a test - it won't work
test('my test', () => {
  jest.mock('@/components/MyComponent', () => { // Error: jest.mock must be at top level
    return () => <div>Mocked for this test</div>;
  });
});

// DO THIS INSTEAD - override the existing mock for a specific test
test('my test', () => {
  // Save the original implementation
  const originalMock = jest.requireMock('@/components/MyComponent').default;
  
  // Override the mock implementation temporarily
  jest.requireMock('@/components/MyComponent').default = function(props) {
    return <div>Mocked specifically for this test</div>;
  };
  
  // Test your component...
  
  // Restore the original mock implementation for other tests
  jest.requireMock('@/components/MyComponent').default = originalMock;
});
```

### Handling Timeouts

For tests that involve asynchronous operations, increase the timeout and use waitFor:

```tsx
test('handles async operations properly', async () => {
  // Your test code here
  await waitFor(() => {
    expect(someCondition).toBeTruthy();
  }, { timeout: 5000 }); // Increase timeout for waitFor
}, 10000); // Increase the overall test timeout
```

These practices will help prevent common errors like:
- "The module factory of jest.mock() is not allowed to reference any out-of-scope variables"
- "Exceeded timeout of X ms for a test"
- "Error: Invalid variable access: _jsxFileName"

## userEvent vs fireEvent

When testing user interactions, there are two main ways to simulate events:

1. **userEvent**: More realistic simulation of user behavior (mouse movements, pointer events, keyboard events)
   ```tsx
   // More realistic but can cause timing issues
   await userEvent.click(button);
   await userEvent.type(input, 'test');
   ```

2. **fireEvent**: Direct event triggering (less realistic but more reliable for simple tests)
   ```tsx
   // More reliable for simple tests
   fireEvent.click(button);
   fireEvent.change(input, { target: { value: 'test' } });
   ```

Guidelines for choosing between them:

- Use **userEvent** when:
  - Testing complex user interactions
  - Testing accessibility features
  - Need to test realistic user behavior sequences

- Use **fireEvent** when:
  - Testing simple click handlers
  - Encountering timing issues with userEvent
  - Tests need to be synchronous for reliability
  - Working with mocked components where realistic events aren't necessary

Example of fixing timing issues by switching from userEvent to fireEvent:

```tsx
// Original test with timing issues
test('calls handler when clicked', async () => {
  const handler = jest.fn();
  render(<Button onClick={handler}>Click me</Button>);
  
  // This can sometimes fail with timeout errors
  await userEvent.click(screen.getByRole('button'));
  
  // This might not execute if the previous line times out
  expect(handler).toHaveBeenCalled();
}, 10000); // Even with timeout, might be unreliable

// Fixed version
test('calls handler when clicked', () => {
  const handler = jest.fn();
  render(<Button onClick={handler}>Click me</Button>);
  
  // Direct event triggering - synchronous and reliable
  fireEvent.click(screen.getByRole('button'));
  
  expect(handler).toHaveBeenCalled();
});
```

## Test Directory Structure

For consistency and organization, we follow these conventions for test file placement:

### Main Test Directory

All tests should be placed in the `/src/tests` directory, organized by feature or module. This approach keeps tests separate from implementation code while maintaining a parallel structure.

```
/src
  /tests
    /auth
      signin.test.tsx
      signup.test.tsx
      auth-service.test.ts
    /components
      navbar.test.tsx
    /utils
      formatter.test.ts
```

### Legacy Structure (Deprecated)

Previously, some tests were placed in a `__tests__` directory following Jest's default convention:

```
/src
  /__tests__
    /auth
      signin.test.tsx
```

We are standardizing on the `/src/tests` structure. Any tests found in the `/__tests__` directory should be moved to the corresponding location in `/src/tests`.

### Component-Level Tests

For simple component tests that are tightly coupled to a single component, you may place the test alongside the component:

```
/src/components/Button/
  Button.tsx
  Button.test.tsx
  Button.module.css
```

This approach is suitable for UI components with minimal dependencies, but for components with complex integration requirements, prefer the main test directory structure.
