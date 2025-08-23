import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useOptimizedUser } from '@/hooks/useOptimizedSession';
import * as authUtils from '@/utils/auth';

// Mock the auth utils
jest.mock('@/utils/auth');
const mockGetSession = authUtils.getSession as jest.MockedFunction<typeof authUtils.getSession>;

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useSession as mockUseSession } from 'next-auth/react';

// Component that uses session data (simulates FavoriteButton)
const SessionConsumer = ({ id }: { id: number }) => {
  const user = useOptimizedUser();
  return <div data-testid={`consumer-${id}`}>{user?.name || 'No user'}</div>;
};

// Simulate a page with many session consumers (like search page with many listings)
const SearchPageSimulation = ({ listingCount = 20 }: { listingCount?: number }) => {
  return (
    <div>
      {/* Navbar */}
      <SessionConsumer id={0} />
      
      {/* Main content with multiple listings, each with a favorite button */}
      {Array.from({ length: listingCount }, (_, i) => (
        <div key={i}>
          <SessionConsumer id={i + 1} />
        </div>
      ))}
      
      {/* Footer */}
      <SessionConsumer id={listingCount + 1} />
    </div>
  );
};

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes like production
        gcTime: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('Session Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle 20 session consumers with only 1 API call (search page simulation)', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['ROLE_USER'],
    };

    (mockUseSession as jest.Mock).mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();
    const startTime = performance.now();

    render(
      <Wrapper>
        <SearchPageSimulation listingCount={20} />
      </Wrapper>
    );

    // Wait for all components to render
    await waitFor(() => {
      expect(document.querySelector('[data-testid="consumer-0"]')).toHaveTextContent('Test User');
      expect(document.querySelector('[data-testid="consumer-20"]')).toHaveTextContent('Test User');
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Performance assertions
    expect(mockGetSession).toHaveBeenCalledTimes(1); // Only 1 API call despite 22 consumers
    expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second

    // Verify all consumers received the data
    for (let i = 0; i <= 21; i++) {
      const consumer = document.querySelector(`[data-testid="consumer-${i}"]`);
      expect(consumer).toHaveTextContent('Test User');
    }
  });

  it('should handle 50 session consumers efficiently (stress test)', async () => {
    const mockUser = {
      id: '456',
      name: 'Stress Test User',
      email: 'stress@example.com',
      roles: ['ROLE_USER'],
    };

    (mockUseSession as jest.Mock).mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();
    const startTime = performance.now();

    render(
      <Wrapper>
        <SearchPageSimulation listingCount={50} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="consumer-0"]')).toHaveTextContent('Stress Test User');
      expect(document.querySelector('[data-testid="consumer-50"]')).toHaveTextContent('Stress Test User');
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Even with 52 session consumers, should only make 1 API call
    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(renderTime).toBeLessThan(2000); // Should still be fast

    console.log(`Rendered 52 session consumers in ${renderTime.toFixed(2)}ms with 1 API call`);
  });

  it('should demonstrate performance improvement over hypothetical direct calls', async () => {
    // This test shows what would happen if each component made its own API call
    const mockUser = {
      id: '789',
      name: 'Performance User',
      email: 'perf@example.com',
      roles: ['ROLE_USER'],
    };

    (mockUseSession as jest.Mock).mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();

    // Simulate the old behavior where each component would make its own call
    const OLD_BEHAVIOR_CALL_COUNT = 20; // Each of 20 components making its own call
    
    render(
      <Wrapper>
        <SearchPageSimulation listingCount={20} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="consumer-0"]')).toHaveTextContent('Performance User');
    });

    const actualCalls = mockGetSession.mock.calls.length;
    const callReduction = ((OLD_BEHAVIOR_CALL_COUNT - actualCalls) / OLD_BEHAVIOR_CALL_COUNT) * 100;

    expect(actualCalls).toBe(1);
    expect(callReduction).toBe(95); // 95% reduction in API calls

    console.log(`Performance improvement: ${callReduction}% reduction in API calls (${OLD_BEHAVIOR_CALL_COUNT} → ${actualCalls})`);
  });

  it('should maintain performance across multiple page navigations', async () => {
    const mockUser = {
      id: '999',
      name: 'Navigation User',
      email: 'nav@example.com',
      roles: ['ROLE_USER'],
    };

    (mockUseSession as jest.Mock).mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();

    // Simulate multiple page navigations
    const { unmount, rerender } = render(
      <Wrapper>
        <SearchPageSimulation listingCount={10} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="consumer-0"]')).toHaveTextContent('Navigation User');
    });

    expect(mockGetSession).toHaveBeenCalledTimes(1);

    // Simulate navigation to another page
    unmount();
    
    rerender(
      <Wrapper>
        <SearchPageSimulation listingCount={15} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="consumer-0"]')).toHaveTextContent('Navigation User');
    });

    // Should still only have 1 call due to caching
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('should measure memory usage efficiency', async () => {
    const mockUser = {
      id: '111',
      name: 'Memory Test User',
      email: 'memory@example.com',
      roles: ['ROLE_USER'],
    };

    (mockUseSession as jest.Mock).mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();

    // Measure memory before
    const memoryBefore = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0;

    render(
      <Wrapper>
        <SearchPageSimulation listingCount={30} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="consumer-0"]')).toHaveTextContent('Memory Test User');
    });

    // Measure memory after
    const memoryAfter = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0;
    const memoryUsed = memoryAfter - memoryBefore;

    // With React Query's efficient caching, memory usage should be reasonable
    // This is more of a monitoring test than a strict assertion
    console.log(`Memory used for 32 session consumers: ${memoryUsed} bytes`);
    
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });
});
