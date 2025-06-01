Internationalization (i18n) Best Practices Guide
For Caryo Marketplace

This guide outlines best practices for implementing and maintaining translations in the Caryo Marketplace application, which supports both English and Arabic languages.

Table of Contents
Key Structure and Organization

Translation File Management

Translation Usage in Components

Type Safety and Code Quality

Handling Dynamic Content

RTL Support

Performance Considerations

Translation Workflow

Testing Translations

Flat vs. Nested Translation Keys

Backend Translation Strategies

Frontend-Backend Integration

1. Key Structure and Organization
Namespace Organization
Organize translation files by component or route namespace rather than by content type.

✅ DO:

pgsql
Copy
Edit
/public/locales/en/login.json  
/public/locales/ar/login.json  
/public/locales/en/dashboard.json  
/public/locales/ar/dashboard.json  
/public/locales/en/button.json  
/public/locales/ar/button.json  
❌ DON'T:

pgsql
Copy
Edit
buttons.json, labels.json, errors.json (by content type)
Key Hierarchy
Use flat key structure with consistent naming conventions:

✅ DO:

json
Copy
Edit
{
  "auth.signIn": "Sign In",
  "auth.username": "Username",
  "auth.password": "Password"
}
❌ DON'T:

json
Copy
Edit
{
  "auth": {
    "signIn": "Sign In",
    "username": "Username"
  }
}
Naming Conventions
Use consistent camelCase keys:

✅ DO:

json
Copy
Edit
{
  "auth.signIn": "Sign In",
  "auth.passwordRequirements": "Password must be..."
}
❌ DON'T mix styles:

json
Copy
Edit
{
  "auth.sign_in": "Sign In",
  "auth.passwordRequirements": "Password must be..."
}
2. Translation File Management
Directory Structure
Use a single source of truth in the public/locales folder for all translations.

Organize translations by namespaces (routes/components):

pgsql
Copy
Edit
/public/locales/en/
  login.json
  dashboard.json
  button.json

/public/locales/ar/
  login.json
  dashboard.json
  button.json
Avoid duplicating translation files in component folders during early project stages to reduce maintenance complexity.

Version Control
Track translation files in version control (git).

Document major structural changes.

Completeness
✅ Ensure all keys are present in all language files:

json
Copy
Edit
// en/login.json
{"signIn": "Sign In"}

// ar/login.json
{"signIn": "تسجيل الدخول"}
❌ Don't leave missing keys:

json
Copy
Edit
// ar/login.json
{}
Translation Context
Add descriptions to improve clarity for translators:

json
Copy
Edit
{
  "welcome": "Welcome back, {{name}}!",
  "@welcome": {
    "description": "Greeting after user logs in",
    "context": "{{name}} is user's display name"
  }
}
3. Translation Usage in Components
Use namespaces that match your translation JSON file names:

javascript
Copy
Edit
const { t } = useTranslation('login');
t('signIn');
Use interpolation for dynamic values:

✅ DO:

javascript
Copy
Edit
t('greeting', { name: userName }); // "Hello, {{name}}!"
❌ DON'T:

javascript
Copy
Edit
t('greeting') + ' ' + userName
Reuse common keys to avoid duplication:

✅ DO:

javascript
Copy
Edit
t('common:submit')
4. Type Safety and Code Quality
Use TypeScript for better reliability:

Define translation key types per namespace.

Create typed hooks for translations.

Use linting to disallow hardcoded strings and detect missing keys.

Example:

typescript
Copy
Edit
type LoginKeys = 'signIn' | 'invalidCredentials';

export function useLoginTranslation() {
  const { t } = useTranslation('login');
  return { t: (key: LoginKeys) => t(key) };
}
5. Handling Dynamic Content
Pluralization
json
Copy
Edit
{
  "item": "{{count}} item",
  "item_plural": "{{count}} items"
}
Date and Currency Formatting
Use built-in Intl APIs:

javascript
Copy
Edit
new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount);
Language-Specific Layout
Render components conditionally:

jsx
Copy
Edit
{i18n.language === 'ar' ? <RtlLayout /> : <LtrLayout />}
6. RTL Support
✅ Set document direction on language change:

javascript
Copy
Edit
const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
};
✅ Use CSS logical properties:

css
Copy
Edit
padding-inline-start: 1rem;
padding-inline-end: 2rem;
✅ Test thoroughly in both RTL and LTR modes.

7. Performance Considerations
Best Practices
Use lazy loading of namespaces relevant to the current page/component.

Avoid loading all translation files upfront.

Use code splitting.

Example Lazy Loading
javascript
Copy
Edit
useEffect(() => {
  i18n.loadNamespaces('settings').then(() => setLoaded(true));
}, []);
Optimized Initial Load
Configure i18n:

javascript
Copy
Edit
ns: ['common'],
defaultNS: 'common',
preload: false
8. Translation Workflow
Add new keys to default language JSON files in public/locales/en/.

Add context/descriptions to assist translators.

Add placeholder or translated keys to other language files (e.g., Arabic).

Track changes and review translations via PRs.

Automate key consistency checks.

9. Testing Translations
✅ Automated tests to ensure all keys exist in all languages:

javascript
Copy
Edit
expect(arKeys).toEqual(expect.arrayContaining(enKeys));
✅ Visual tests for overflow, layout issues, RTL correctness.

✅ Native speaker review for contextual accuracy.

10. Flat vs. Nested Translation Keys
Use flat keys for simplicity and performance:

json
Copy
Edit
{
  "auth.signIn": "Sign In",
  "auth.error": "Invalid credentials"
}
Advantages:

Easier lookup and refactoring

Better tooling support

Faster loading

11. Backend Translation Strategies
Spring Boot Internationalization
Use database-driven translations for dynamic content.

Use resource bundle .properties files for static content/messages.

Database-Driven Translations Example
java
Copy
Edit
@Entity
public class CarModel {
    @Id
    private Long id;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "name_ar", nullable = false)
    private String nameAr;

    public String getLocalizedName(Locale locale) {
        return locale.getLanguage().equals("ar") ? nameAr : nameEn;
    }
}
Resource Bundle Example
bash
Copy
Edit
/resources/messages/messages_en.properties  
/resources/messages/messages_ar.properties  
java
Copy
Edit
@Autowired
private MessageSource messageSource;

public String getErrorMessage(String code, Locale locale) {
    return messageSource.getMessage(code, null, locale);
}
12. Frontend-Backend Integration
API Response Handling
Return bilingual content:

json
Copy
Edit
{
  "id": 1,
  "name": {
    "en": "Toyota Camry",
    "ar": "تويوتا كامري"
  }
}
Or localized content based on Accept-Language header:

sql
Copy
Edit
GET /api/cars/1  
Accept-Language: ar
Response:

json
Copy
Edit
{
  "id": 1,
  "name": "تويوتا كامري"
}
Error Message Handling
Return error messages in requested language:

json
Copy
Edit
{
  "status": 400,
  "message": {
    "en": "Invalid input parameters",
    "ar": "معلمات الإدخال غير صالحة"
  }
}
Translation Key Consistency
Keep keys consistent between frontend and backend:

properties
Copy
Edit
// Backend (messages.properties)
validation.email.invalid=Invalid email address

// Frontend (login.json)
{
  "validation.email.invalid": "Invalid email address"
}
Additional Resources
React i18next Documentation

Next.js Internationalization

Spring Boot Internationalization

W3C I18n Best Practices

Summary of Best Approach for Starting Your Project
Use a single source of truth for translation files inside public/locales.

Organize translation JSON files by page/component namespaces (e.g., login.json, dashboard.json).

Load namespaces lazily as needed for performance.

Avoid duplicating translation files next to components initially — keep it simple.

Add context and maintain completeness across languages.

Ensure smooth frontend-backend i18n integration.

