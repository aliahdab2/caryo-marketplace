# GitHub Copilot Instructions for Caryo Marketplace

## Project Overview
Caryo Marketplace is a bilingual (English/Arabic) car marketplace application built with:
- Backend: Spring Boot 3.2.3 (Java 21)
- Database: PostgreSQL 14 (dev/prod), H2 (test)
- Frontend: Next.js

## Key Architectural Decisions

### Database Design
1. **Multi-Language Support**
   - Tables use `_en` and `_ar` suffix for bilingual fields
   - Example: `name_en`, `name_ar` for display names

2. **Database Environments**
   - Development/Production: PostgreSQL 14
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
-- Prefer PostgreSQL 14 compatible syntax
INSERT INTO table_name (column1, column2) 
VALUES ('value1', 'value2')
ON CONFLICT (unique_column) DO UPDATE 
SET column1 = EXCLUDED.column1,
    column2 = EXCLUDED.column2;

-- Not: MERGE statements (PostgreSQL 15+ only)
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
