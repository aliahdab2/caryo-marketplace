import { render, screen } from '@testing-library/react';
import ClientProviders from '../ClientProviders';

// Mock the providers
jest.mock('../QueryProvider', () => {
  return function MockQueryProvider({ children }: { children: React.ReactNode }) {
    return <div data-testid="query-provider">{children}</div>;
  };
});

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

describe('ClientProviders', () => {
  it('should render children with both providers', () => {
    render(
      <ClientProviders>
        <div data-testid="test-child">Test Child</div>
      </ClientProviders>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
  });

  it('should wrap SessionProvider inside QueryProvider', () => {
    render(
      <ClientProviders>
        <div data-testid="nested-child">Nested Child</div>
      </ClientProviders>
    );

    const queryProvider = screen.getByTestId('query-provider');
    const sessionProvider = screen.getByTestId('session-provider');
    const child = screen.getByTestId('nested-child');

    // Check that SessionProvider is inside QueryProvider
    expect(queryProvider).toContainElement(sessionProvider);
    expect(sessionProvider).toContainElement(child);
  });
});
