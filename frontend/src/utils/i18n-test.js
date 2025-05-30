// i18n-test.js - Debug utility for i18next HTTP backend
console.log('Testing i18n HTTP backend');

// Simple HTTP request to test if translation files are accessible
async function testTranslationEndpoint() {
  try {
    const response = await fetch('/locales/en/auth.json');
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    console.log('Successfully loaded auth translations:', data);
    return true;
  } catch (error) {
    console.error('Error loading translations:', error);
    return false;
  }
}

// Test for auth.json accessibility
window.testI18nBackend = async () => {
  console.log('Testing i18next HTTP backend...');
  const success = await testTranslationEndpoint();
  if (success) {
    console.log('✅ i18next HTTP backend is working correctly!');
  } else {
    console.error('❌ i18next HTTP backend test failed!');
    console.log('Try these debugging steps:');
    console.log('1. Ensure /public/locales folder exists with en/auth.json and ar/auth.json');
    console.log('2. Check Next.js static file serving configuration');
    console.log('3. Verify HTTP backend loadPath in i18n.ts matches actual file locations');
  }
};

// Auto-run the test in development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.testI18nBackend();
    }, 2000);
  });
}

export { testTranslationEndpoint };
