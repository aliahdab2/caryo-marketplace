import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import AuthDataHandler from '../AuthDataHandler';
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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch for the backend API call
global.fetch = jest.fn();

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('AuthDataHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    (fetch as jest.Mock).mockClear();
    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render without crashing when user is authenticated', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
      isAdmin: true,
      accessToken: 'mock-access-token',
    };

    (mockUseSession as jest.Mock).mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();

    const { container } = render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    // AuthDataHandler should render without crashing (it returns null)
    expect(container.firstChild).toBeNull();
  });

  it('should render without crashing when user is unauthenticated', async () => {
    (mockUseSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue(null);

    const Wrapper = createTestWrapper();

    const { container } = render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    // AuthDataHandler should render without crashing (it returns null)
    expect(container.firstChild).toBeNull();
  });

  it('should render without crashing while loading', () => {
    (mockUseSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const Wrapper = createTestWrapper();

    const { container } = render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    // AuthDataHandler should render without crashing (it returns null)
    expect(container.firstChild).toBeNull();
  });

  it('should use the optimized session hook correctly', () => {
    (mockUseSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    // Verify that the component uses the session hook
    expect(mockUseSession).toHaveBeenCalled();
  });
});
