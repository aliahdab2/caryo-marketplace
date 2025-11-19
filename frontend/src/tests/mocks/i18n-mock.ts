import ReactActual from 'react'; // Import React with a different name to avoid conflicts
import fs from 'fs';
import path from 'path';

// Function to load translations from JSON files
const loadTranslations = (): Record<string, string> => {
  const translations: Record<string, string> = {};

  try {
    // Load common translation files
    const localesDir = path.join(process.cwd(), 'public', 'locales', 'en');

    // Load auth translations
    try {
      const authPath = path.join(localesDir, 'auth.json');
      if (fs.existsSync(authPath)) {
        const authTranslations = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        Object.entries(authTranslations).forEach(([key, value]) => {
          translations[`auth:${key}`] = value as string; // Namespace pattern (preferred)
          translations[key] = value as string; // Direct access for auth pages
        });
      }
    } catch (error) {
      console.warn('Could not load auth translations:', error);
    }

    // Load upgradeModal translations
    try {
      const upgradeModalPath = path.join(localesDir, 'upgradeModal.json');
      if (fs.existsSync(upgradeModalPath)) {
        const upgradeModalTranslations = JSON.parse(fs.readFileSync(upgradeModalPath, 'utf8'));
        Object.entries(upgradeModalTranslations).forEach(([key, value]) => {
          translations[`upgradeModal:${key}`] = value as string; // Namespace pattern (preferred)
        });
      }
    } catch (error) {
      console.warn('Could not load upgradeModal translations:', error);
    }

    // Load common translations
    try {
      const commonPath = path.join(localesDir, 'common.json');
      if (fs.existsSync(commonPath)) {
        const commonTranslations = JSON.parse(fs.readFileSync(commonPath, 'utf8'));
        Object.entries(commonTranslations).forEach(([key, value]) => {
          translations[`common:${key}`] = value as string; // Namespace pattern (preferred)
          translations[key] = value as string; // Direct access for common strings
        });
      }
    } catch (error) {
      console.warn('Could not load common translations:', error);
    }

    // Load dashboard translations
    try {
      const dashboardPath = path.join(localesDir, 'dashboard.json');
      if (fs.existsSync(dashboardPath)) {
        const dashboardTranslations = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));
        Object.entries(dashboardTranslations).forEach(([key, value]) => {
          translations[`dashboard:${key}`] = value as string;
          translations[key] = value as string; // Also support direct key access
        });
      }
    } catch (error) {
      console.warn('Could not load dashboard translations:', error);
    }

    // Load profile translations
    try {
      const profilePath = path.join(localesDir, 'profile.json');
      if (fs.existsSync(profilePath)) {
        const profileTranslations = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        Object.entries(profileTranslations).forEach(([key, value]) => {
          translations[`profile:${key}`] = value as string; // Namespace pattern (preferred)
          translations[key] = value as string; // Direct access for profile components
        });
      }
    } catch (error) {
      console.warn('Could not load profile translations:', error);
    }

  } catch (error) {
    console.warn('Could not load translation files, using fallback:', error);
  }

  return translations;
};

// Define mockI18nInstance at the top level of the module
// We load real translations from JSON files for better maintainability
const mockTranslations: Record<string, string> = {
  ...loadTranslations(), // Load real translations first
  
  // Only keep test-specific overrides that differ from production
  'signIn': 'sign_in', // Test expects this specific format
  'fieldRequired': 'fieldRequired', // Test expects the key itself
  'loginSuccess': 'login successful', // Test expects lowercase
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
    
    // Handle interpolation for welcome message
    if (actualKey === 'welcome' && options && typeof options === 'object' && 'name' in options) {
      return `Welcome to your dashboard, ${options.name}`;
    }
    
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
