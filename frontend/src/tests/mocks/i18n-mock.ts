import ReactActual from 'react'; // Import React with a different name to avoid conflicts

// Define mockI18nInstance at the top level of the module
const mockTranslations: Record<string, string> = {
  'logo': 'Caryo Logo',
  'appName': 'Caryo Marketplace',
  'welcomeBack': 'Welcome Back!',
  'signInDescription': 'Sign in to access your account and continue your journey with us.',
  'privacy_policy': 'Privacy Policy',
  'terms_of_service': 'Terms of Service',
  'signIn': 'sign_in', // Changed back to match test expectation
  'fieldRequired': 'fieldRequired', // Changed to return the key
  'verificationRequired': 'Verification is required to proceed.',
  'errors:invalidCredentials': 'Invalid username or password. Please try again.',
  'loginSuccess': 'login successful', // Changed to match test expectation
  'redirecting': 'Redirecting...',
  'username': 'Username',
  'usernamePlaceholder': 'Enter your username',
  'password': 'Password',
  'passwordPlaceholder': 'Enter your password',
  'forgotPassword': 'Forgot Password?',
  'loading': 'Loading...',
  'or': 'Or',
  'continueWithGoogle': 'Continue with Google',
  'dontHaveAccount': "Don't have an account?",
  'signUp': 'Sign Up',
  'auth.continueWithGoogle': 'Continue with Google', // For GoogleAuthButton
  'auth.signingIn': 'Signing in...', // For GoogleAuthButton
  'auth.signIn': 'Sign In', // For general use
  'auth.username': 'Username',
  'auth.password': 'Password',
  
  // Common translations
  'common:loading': 'Loading...',
  'common:authRequired': 'Authentication Required',
  'common:addToFavorites': 'Add to favorites',
  'common:removeFromFavorites': 'Remove from favorites',
  'common:error': 'An error occurred',
  
  // Listings translations
  'listings.addToFavorites': 'Add to favorites',
  'listings.removeFromFavorites': 'Remove from favorites',
  
  // Favorites related translations
  'favorites:loading': 'Loading your favorites...',
  'favorites:title': 'My Favorites',
  'favorites:noFavorites': 'No Favorite Vehicles',
  'favorites:emptyState': 'No Favorites Yet',
  'favorites:error': 'Error loading favorites',
  
  // Password change related translations
  'auth.changePassword': 'Change Password',
  'auth.currentPassword': 'Current Password',
  'auth.newPassword': 'New Password',
  'auth.confirmNewPassword': 'Confirm New Password',
  'auth.passwordMinLength': 'Must be at least 8 characters long',
  'auth.changing': 'Changing...',
  'auth.passwordChanged': 'Password changed successfully',
  'auth.passwordMismatch': 'Passwords do not match',
  'auth.incorrectPassword': 'Current password is incorrect',
  'cancel': 'Cancel',
  
  // Dashboard translations
  'dashboard.profile': 'Profile',
  'dashboard.edit': 'Edit',
  'dashboard.role': 'Role',
  'dashboard.accountInfo': 'Account Information',
  'dashboard.contactInfo': 'Contact Information',
  'dashboard.bio': 'Bio',
  'dashboard.noBio': 'No bio available',
  'dashboard.accountSecurity': 'Account Security',
  'dashboard.lastUpdated': 'Last updated',
  'dashboard.twoFactorAuth': 'Two-Factor Authentication',
  'dashboard.improveAccountSecurity': 'Improve your account security',
  'dashboard.setupTwoFactor': 'Setup Two-Factor',
  'dashboard.manageProfile': 'Manage your profile information and preferences',
  'dashboard.editProfile': 'Edit Profile',
  'dashboard.updateInfo': 'Update your personal information',
  'dashboard.manageSecuritySettings': 'Manage your security settings and authentication methods',
  'dashboard.recommendPasswordUpdate': 'Recommended: Update your password regularly',
  'dashboard.tellUsAboutYourself': 'Tell us about yourself...',
  'dashboard.emailCannotBeChanged': 'Email address cannot be changed',
  
  // Contact information
  'contactInformation.memberSince': 'Member since',
  'contactInformation.phone': 'Phone',
  'contactInformation.location': 'Location',
  'contactInformation.notProvided': 'Not provided',
  'contactInformation.enterPhone': 'Enter your phone number',
  'contactInformation.enterLocation': 'Enter your location',
  
  // Auth related
  'auth.userId': 'User ID',
  'auth.passwordsDoNotMatch': 'New passwords do not match',
  'auth.passwordTooShort': 'New password must be at least 8 characters long',
  'auth.passwordChangeSuccess': 'Password changed successfully',
  'auth.passwordChangeFailed': 'Failed to change password',
  'auth.networkError': 'Network error. Please try again.',
  
  // General
  'notAvailable': 'Not available',
};

const mockI18nInstance = {
  language: 'en',
  languages: ['en', 'ar'],
  changeLanguage: jest.fn((lang: string, callback?: (err: Error | null, t: (key: string) => string) => void) => {
    mockI18nInstance.language = lang;
    if (callback) callback(null, (key: string) => mockTranslations[key] || key); // Simulate callback with no error
    return Promise.resolve((key: string) => mockTranslations[key] || key);
  }),
  getFixedT: jest.fn((_lng: string, _ns: string | string[], key: string) => mockTranslations[key] || key as string),
  init: jest.fn(),
  loadNamespaces: jest.fn((_namespaces: string | string[]) => Promise.resolve()),
  isInitialized: true,
  t: jest.fn((key: string | string[], options?: Record<string, unknown> | string) => {
    const actualKey = Array.isArray(key) ? key[0] : key;
    if (options && typeof options === 'object' && 'count' in options && options.count !== undefined) {
      return mockTranslations[`${actualKey}_plural_${options.count}`] || `${actualKey}_plural_${options.count}`;
    }
    return mockTranslations[actualKey] || actualKey;
  }),
  use: jest.fn().mockReturnThis(),
  on: jest.fn(),
  off: jest.fn(),
  options: {},
  services: {
    formatter: {
      add: jest.fn(),
    },
    interpolator: {
      init: jest.fn(),
      reset: jest.fn(),
      interpolate: jest.fn(),
      nest: jest.fn(),
    },
    languageDetector: {
      type: 'languageDetector' as const,
      init: jest.fn(),
      detect: jest.fn(() => 'en'),
      cacheUserLanguage: jest.fn(),
    },
    backendConnector: {
      backend: {
        type: 'backend' as const,
        init: jest.fn(),
        read: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
      state: {},
      loaded: jest.fn(),
      load: jest.fn(),
      queue: [],
      running: false,
      retries: 0,
      retryTimeout: 0,
      toJSON: jest.fn(),
    },
  },
  isLanguageChangingTo: undefined as string | undefined,
  hasLoadedNamespace: jest.fn((_ns: string) => true),
  setDefaultNamespace: jest.fn(),
  defaultNS: 'translation',
  reloadResources: jest.fn(),
  hasResourceBundle: jest.fn((_lng: string, _ns: string) => true),
  getResourceBundle: jest.fn((_lng: string, _ns: string) => ({})),
  addResourceBundle: jest.fn(),
  removeResourceBundle: jest.fn(),
  loadLanguages: jest.fn(),
  dir: jest.fn((_lng?: string) => 'ltr' as 'ltr' | 'rtl'),
  cloneInstance: jest.fn().mockReturnThis(),
  toJSON: jest.fn(() => ({})),
};

jest.mock('i18next', () => ({
  __esModule: true,
  default: mockI18nInstance,
}));

jest.mock('i18next-browser-languagedetector', () => ({
  type: 'languageDetector' as const,
  init: jest.fn(),
  detect: jest.fn(() => 'en'),
  cacheUserLanguage: jest.fn(),
}));

jest.mock('i18next-http-backend', () => ({
    type: 'backend' as const,
    init: jest.fn(),
    read: jest.fn((language: string, namespace: string, callback: (error: Error | null, data: Record<string, string> | null) => void) => {
        if (namespace === 'common') {
            callback(null, { greeting: 'Hello' });
        } else {
            callback(null, {});
        }
    }),
}));

// Define these components outside of the jest.mock call for react-i18next
const MockWithTranslationComponent = (Component: ReactActual.ComponentType<Record<string, unknown>>) => {
  const WrappedComponent = (props: Record<string, unknown>) => {
      const componentProps = { ...props, t: (key: string) => mockTranslations[key] || key, i18n: mockI18nInstance };
      return ReactActual.createElement(Component, componentProps);
  };
  WrappedComponent.displayName = `WithTranslation(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

const MockTranslationComponent = ({ children }: { children: (t: (key: string) => string, options: { i18n: typeof mockI18nInstance, ready: boolean }) => ReactActual.ReactNode }) => {
  if (typeof children === 'function') {
    return children((key: string) => mockTranslations[key] || key, { i18n: mockI18nInstance, ready: true });
  }
  return null;
};
MockTranslationComponent.displayName = 'Translation';

const MockI18nextProvider = ({ children }: { children: ReactActual.ReactNode }) => children;
MockI18nextProvider.displayName = 'I18nextProvider';

const MockTrans = ({ i18nKey, children }: { i18nKey?: string, children?: ReactActual.ReactNode | ((str: string) => ReactActual.ReactNode) }) => {
  if (typeof children === 'function') {
    return children(i18nKey || '');
  }
  if (children) return children;
  return i18nKey || '';
};
MockTrans.displayName = 'Trans';


jest.mock('react-i18next', () => {
  // Now we can reference the components defined above
  return {
    __esModule: true,
    initReactI18next: { // This needs to be an object with type and init
        type: '3rdParty' as const,
        init: jest.fn(),
    },
    useTranslation: () => ({
      t: (key: string | string[], options?: Record<string, unknown> | string) => {
        const actualKey = Array.isArray(key) ? key[0] : key;
        if (options && typeof options === 'object' && 'count' in options && options.count !== undefined) {
          return mockTranslations[`${actualKey}_plural_${options.count}`] || `${actualKey}_plural_${options.count}`;
        }
        return mockTranslations[actualKey] || actualKey;
      },
      i18n: mockI18nInstance,
      ready: true,
    }),
    I18nextProvider: MockI18nextProvider,
    Trans: MockTrans,
    withTranslation: MockWithTranslationComponent,
    Translation: MockTranslationComponent,
  };
});
