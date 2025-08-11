# GitHub Copilot Instructions for Caryo Marketplace

## Project Overview
Caryo Marketplace is a bilingual (English/Arabic) car marketplace application built with:
- Backend: Spring Boot 3.2.3 (Java 21)
- Database: PostgreSQL 16 (dev/prod), H2 (test)
- Frontend: Next.js

## Key Architectural Decisions

### Database Design
1. **Multi-Language Support**
   - Tables use `_en` and `_ar` suffix for bilingual fields
   - Example: `name_en`, `name_ar` for display names

2. **Database Environments**
   - Development/Production: PostgreSQL 16
   - Testing: H2 in-memory database
   - Migrations must be compatible with both

3. **Migration Patterns**
   - Version migrations in `db/migration/`
   - Environment-specific migrations in `db/postgresql/` or `db/h2/`
   - Always include rollback procedures
   - Validate pre/post conditions

### Code Style Guidelines

#### SQL
```sql
-- Prefer PostgreSQL 16 compatible syntax
INSERT INTO table_name (column1, column2) 
VALUES ('value1', 'value2')
ON CONFLICT (unique_column) DO UPDATE 
SET column1 = EXCLUDED.column1,
    column2 = EXCLUDED.column2;

-- Prefer: MERGE statements for upserts (PostgreSQL 16 fully supports)
```

#### Java/Spring Boot
```java
// Always include both English and Arabic fields
@Column(name = "name_en")
private String nameEn;

@Column(name = "name_ar")
private String nameAr;

// Use meaningful variable names
@Column(name = "listing_status")
@Enumerated(EnumType.STRING)
private ListingStatus listingStatus;
```

### Error Handling Standards
1. **Database Errors**
   - Always check for existence before operations
   - Use appropriate error codes and messages
   - Include Arabic translations for user-facing errors

2. **API Responses**
   - Follow standard REST practices
   - Include both English and Arabic messages
   - Use proper HTTP status codes

## Development Environment

### Docker Development Environment
```bash
# Start all services
./autotrader.sh dev start

# Rebuild and start
./autotrader.sh dev rebuild

# Stop all services
./autotrader.sh dev stop

# View logs
./autotrader.sh dev logs

# Access specific service logs
./autotrader.sh dev logs <service-name>
```

## Common Tasks

### Creating New Migrations
1. Check existing schema and dependencies
2. Use the template from `db/migration/TEMPLATE.sql`
3. Test against both H2 and PostgreSQL
4. Include validation queries
5. Document rollback procedure

### Running the Application
```bash
# Development with PostgreSQL
./gradlew bootRun --args='--spring.profiles.active=dev'

# Testing with H2
./gradlew bootRun
```

## Repository Structure
```
backend/
  autotrader-backend/
    src/
      main/
        resources/
          db/
            migration/    # Version migrations
            postgresql/   # PostgreSQL specific
            h2/          # H2 specific
          application.properties
          application-dev.properties
```

## Troubleshooting Guide

### Database Connection Issues
1. Check PostgreSQL service:
   ```bash
   brew services list | grep postgres
   ```
2. Verify user permissions:
   ```sql
   SELECT current_user;
   \du
   ```
3. Check database existence:
   ```sql
   \l
   ```

### Migration Failures
1. Verify SQL syntax compatibility
2. Check schema version history
3. Validate table/column existence
4. Review migration order

## Additional Notes

### Documentation
- Always update relevant documentation when making changes
- Include bilingual descriptions where applicable
- Document environment-specific configurations
- Follow the [Translation Guide for Developers](docs/translation_guide_for_developers.md) for i18n implementation

### Translation Guidelines
**CRITICAL: ALL translations must follow the project's translation guide strictly.**

- **MANDATORY**: Follow the [Translation Guide for Developers](docs/development/translation_guide_for_developers.md) for ALL i18n implementation
- **NO HARDCODED STRINGS**: Never use hardcoded text in UI components - always use translation keys
- **RTL COMPLIANCE**: The project supports Arabic RTL layout - all UI must work in both LTR and RTL modes
- **BILINGUAL SYSTEM**: Every user-facing string requires both English and Arabic translations

#### Critical Translation Rules:
1. **Flat Key Structure**: 
   - ✅ DO: `{"signIn": "Sign In", "username": "Username"}`
   - ❌ DON'T: `{"auth": {"signIn": "Sign In"}}`

2. **Namespace Organization**: 
   - ✅ DO: Organize by component/route (`login.json`, `dashboard.json`, `listings.json`)
   - ❌ DON'T: Organize by content type (`buttons.json`, `errors.json`)

3. **Key Naming**: 
   - ✅ DO: Use camelCase (`passwordRequirements`, `videoProTip`)
   - ❌ DON'T: Mix styles (`password_requirements`, `video-pro-tip`)

4. **Usage in Components**:
   ```typescript
   // ✅ Correct usage
   const { t } = useTranslation('listings');
   t('videoProTip', 'Pro tip: Videos increase engagement');
   
   // ❌ Wrong - hardcoded text
   "Pro tip: Videos increase engagement"
   
   // ❌ Wrong - nested key access
   t('listings.videoProTip')
   ```

5. **Complete Coverage**: 
   - Every key in `en/*.json` MUST exist in `ar/*.json`
   - Include fallback values in `t()` calls
   - Test in both languages before committing

6. **RTL Support**:
   - Use CSS logical properties (`margin-inline-start` not `margin-left`)
   - Test UI layout in both Arabic (RTL) and English (LTR)
   - Ensure text direction works correctly

7. **Database Fields**: 
   - Use `name_en` and `name_ar` pattern for bilingual database fields
   - Return localized content based on Accept-Language header
   - Support both single-language and bilingual API responses

8. **Performance**: 
   - Use `useLazyTranslation` for on-demand namespace loading
   - Load only required namespaces per component
   - Check `ready` state before rendering translated content

#### Common Translation Mistakes to Avoid:
- ❌ **Hardcoded strings**: `"Pro tip: Videos increase engagement"`
- ❌ **Partial translations**: Only English provided, missing Arabic
- ❌ **Nested keys in flat structure**: `t('auth.signIn')` when using namespace
- ❌ **Missing fallbacks**: `t('key')` without fallback value
- ❌ **Wrong namespace**: Using `common:` when key should be in specific namespace
- ❌ **Inconsistent naming**: Mixing `camelCase`, `snake_case`, `kebab-case`
- ❌ **RTL issues**: Using `margin-left` instead of `margin-inline-start`

#### Pre-commit Translation Checklist:
1. ✅ All UI text uses translation keys
2. ✅ Both English and Arabic translations provided
3. ✅ Keys follow flat camelCase structure
4. ✅ Proper namespace organization
5. ✅ Fallback values included in `t()` calls
6. ✅ Tested in both LTR and RTL modes
7. ✅ No hardcoded strings remaining

### Testing
- Write tests for both H2 and PostgreSQL environments
- Include rollback scenarios in tests
- Test bilingual content handling

### Security
- Never commit sensitive credentials
- Use environment variables for secrets
- Follow Spring Security best practices

## Reminders
1. Always test with both databases
2. Keep migrations idempotent
3. Include bilingual support
4. Document breaking changes
5. Follow established naming conventions

## Change Management
- Document all breaking changes
- Include upgrade instructions
- Provide rollback procedures
- Test migration paths
