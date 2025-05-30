// Mock for i18next in tests

// Common translations to use in tests
const mockTranslations: Record<string, string> = {
  // Common keys
  'signin': 'Sign In',
  'sign_in': 'Sign In', // Added the key with underscore
  'signup': 'Sign Up',
  'username': 'Username',
  'password': 'Password',
  'forgotPassword': 'Forgot password?',
  'verificationRequired': 'Verification required before login.',
  'fieldRequired': 'This field is required.',
  'or': 'Or',
  'continueWithGoogle': 'Continue with Google',
  'dont_have_account': 'Don\'t have an account?',
  'sign_up': 'Sign Up',
  
  // Add more translations as needed for tests
};

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string) => mockTranslations[key] || key,
      i18n: {
        changeLanguage: jest.fn(),
        language: 'en',
        dir: () => 'ltr',
      },
    };
  },
  // Add any other exports from react-i18next that you use
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock i18next
jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    t: (key: string) => mockTranslations[key] || key,
    changeLanguage: jest.fn(),
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockResolvedValue(null),
  },
}));

// Mock i18next-http-backend
jest.mock('i18next-http-backend', () => ({
  __esModule: true,
  default: jest.fn(),
}));

export { mockTranslations };
