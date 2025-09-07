# Auth Test Constants

This directory contains simple, reusable constants for authentication testing.

## The Problem

We have **18 test files** with duplicated auth mock code. Instead of complex factories that don't work with Jest, we use simple constants that can be copied directly.

## Usage Examples

### 1. Copy-Paste the Standard Mock (Recommended)

```typescript
// Copy these directly into your test file
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => ({ type: 'div', props: { children } }),
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        roles: ['ROLE_USER']
      },
      accessToken: 'test-token',
      expires: '2030-01-01T00:00:00.000Z'
    },
    status: 'authenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('@/hooks/useOptimizedSession', () => ({
  useOptimizedSession: () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      roles: ['ROLE_USER']
    },
    isAuthenticated: true,
    isLoading: false,
    status: 'authenticated',
    session: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        roles: ['ROLE_USER']
      },
      accessToken: 'test-token',
      expires: '2030-01-01T00:00:00.000Z'
    },
    refreshSession: jest.fn()
  }),
  useOptimizedUser: () => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
    roles: ['ROLE_USER']
  })
}));
```

### 2. For Navbar Tests (Different User)

```typescript
// Use the testuser variant for navbar-specific tests
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => ({ type: 'div', props: { children } }),
  useSession: () => ({
    data: {
      user: {
        id: '123',
        name: 'testuser',
        email: 'testuser@example.com',
        image: 'https://example.com/avatar.jpg',
        roles: ['ROLE_USER']
      },
      accessToken: 'test-token',
      expires: '2030-01-01T00:00:00.000Z'
    },
    status: 'authenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn()
}));
```

## Why This Approach Works

1. **Jest Compatible**: No variable references in mock factories
2. **Simple**: Just copy-paste the constants you need
3. **Maintainable**: When you need to change mock data, update in one place
4. **No Magic**: Clear what's happening in each test file
5. **Flexible**: Easy to modify for specific test scenarios

## Available Constants

Use these constants from `auth-mocks.ts` when creating custom mocks:

- `MOCK_USER`: Standard test user
- `MOCK_SESSION`: Standard test session
- `TESTUSER_MOCK_USER`: Alternative user for navbar tests
- `TESTUSER_MOCK_SESSION`: Alternative session for navbar tests

## Benefits

1. **Consistency**: All tests use the same mock data structure
2. **Maintainability**: Changes to auth structure only need updates in one place
3. **Readability**: Clear, semantic test setup
4. **Flexibility**: Easy to create custom scenarios when needed
5. **DRY**: No more duplicated mock code across 19+ test files

## Migration Guide

### Before (Duplicated Mocks)
```typescript
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => ({ type: 'div', props: { children } }),
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        // ... 20+ lines of duplicated mock setup
      }
    }
  })
}));
```

### After (Mock Constants)
```typescript
import { NEXTAUTH_MOCKS, OPTIMIZED_SESSION_MOCKS } from '@/tests/mocks/auth-mocks';
jest.mock('next-auth/react', () => NEXTAUTH_MOCKS.AUTHENTICATED);
jest.mock('@/hooks/useOptimizedSession', () => OPTIMIZED_SESSION_MOCKS.AUTHENTICATED);
```

**Result**: 20+ lines reduced to 3 lines! 🎉
