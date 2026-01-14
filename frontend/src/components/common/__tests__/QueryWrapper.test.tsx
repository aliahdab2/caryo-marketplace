import { render, screen, fireEvent } from '@testing-library/react';
import { UseQueryResult } from '@tanstack/react-query';
import { QueryWrapper } from '../QueryWrapper';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Helper to create mock query results
function createMockQuery<T>(overrides: Partial<UseQueryResult<T, Error>>): UseQueryResult<T, Error> {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetching: false,
    isStale: false,
    refetch: jest.fn(),
    status: 'pending',
    fetchStatus: 'idle',
    ...overrides,
  } as UseQueryResult<T, Error>;
}

describe('QueryWrapper', () => {
  describe('Loading state', () => {
    it('should render default skeleton when loading', () => {
      const query = createMockQuery({ isLoading: true });
      const { container } = render(
        <QueryWrapper query={query}>
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render CardSkeleton when loadingVariant is card', () => {
      const query = createMockQuery({ isLoading: true });
      const { container } = render(
        <QueryWrapper query={query} loadingVariant="card" loadingCount={2}>
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      expect(container.querySelectorAll('.animate-pulse')).toHaveLength(2);
    });

    it('should render custom loading component when provided', () => {
      const query = createMockQuery({ isLoading: true });
      render(
        <QueryWrapper
          query={query}
          loadingComponent={<div data-testid="custom-loader">Loading...</div>}
        >
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should render error display when there is an error', () => {
      const query = createMockQuery({ error: new Error('Failed to load') });
      render(
        <QueryWrapper query={query}>
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', () => {
      const refetch = jest.fn();
      const query = createMockQuery({ error: new Error('Failed'), refetch });
      render(
        <QueryWrapper query={query}>
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(refetch).toHaveBeenCalled();
    });

    it('should render custom error component when provided', () => {
      const query = createMockQuery({ error: new Error('Failed') });
      render(
        <QueryWrapper
          query={query}
          errorComponent={<div data-testid="custom-error">Custom Error</div>}
        >
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render empty state when data is empty array', () => {
      const query = createMockQuery({ data: [], isSuccess: true });
      render(
        <QueryWrapper query={query} emptyVariant="listings">
          {(data) => <div>{(data as unknown[]).length} items</div>}
        </QueryWrapper>
      );
      expect(screen.getByText('No listings')).toBeInTheDocument();
    });

    it('should render empty state with custom message', () => {
      const query = createMockQuery({ data: [], isSuccess: true });
      render(
        <QueryWrapper
          query={query}
          emptyTitle="No Items Found"
          emptyMessage="Please try a different search"
        >
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      expect(screen.getByText('No Items Found')).toBeInTheDocument();
      expect(screen.getByText('Please try a different search')).toBeInTheDocument();
    });

    it('should use custom isEmpty function', () => {
      const query = createMockQuery({ 
        data: { items: [], total: 0 }, 
        isSuccess: true 
      });
      render(
        <QueryWrapper
          query={query}
          isEmpty={(data) => data.items.length === 0}
        >
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });

    it('should render custom empty component when provided', () => {
      const query = createMockQuery({ data: [], isSuccess: true });
      render(
        <QueryWrapper
          query={query}
          emptyComponent={<div data-testid="custom-empty">Custom Empty</div>}
        >
          {() => <div>Content</div>}
        </QueryWrapper>
      );
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });
  });

  describe('Success state', () => {
    it('should render children with data when query is successful', () => {
      const query = createMockQuery({ 
        data: [{ id: 1, name: 'Item 1' }], 
        isSuccess: true 
      });
      render(
        <QueryWrapper query={query}>
          {(data) => (
            <ul>
              {data.map((item: { id: number; name: string }) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          )}
        </QueryWrapper>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should handle paginated response format', () => {
      const query = createMockQuery({ 
        data: { content: [{ id: 1 }], total: 1 }, 
        isSuccess: true 
      });
      render(
        <QueryWrapper query={query}>
          {(data) => <div>Total: {data.content.length}</div>}
        </QueryWrapper>
      );
      expect(screen.getByText('Total: 1')).toBeInTheDocument();
    });
  });
});
