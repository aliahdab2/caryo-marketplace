# Database Migrations Guide

This document describes the database migration strategy for the Caryo Marketplace project.

## Directory Structure

```
src/main/resources/db/
├── migration/           # Core migrations (all environments)
│   ├── V1__Initial_Schema.sql       # Base database schema
│   └── V2__reference_data.sql       # Essential reference data
├── dev/                # Development-specific migrations
│   └── R__sample_car_listings.sql   # Sample data for development
└── test/               # Test-specific migrations
    └── R__test_data.sql            # Minimal test data for testing
```

## Migration Types

### Core Migrations (`db/migration/`)
- Run in all environments (dev, test, prod)
- Contains essential schema and reference data
- Uses versioned migrations (V1__, V2__, etc.)
- Must be backwards compatible
- Never contains environment-specific data

### Development Migrations (`db/dev/`)
- Only run in development environment
- Contains sample data for development
- Uses repeatable migrations (R__)
- Can be modified and rerun as needed
- Includes realistic sample data for testing features

### Test Migrations (`db/test/`)
- Only run in test environment
- Contains minimal test data
- Uses repeatable migrations (R__)
- Focused on providing just enough data for tests
- Uses predictable data values for assertions

## Migration Naming Convention

### Versioned Migrations (V__)
- Format: `V{version}__{description}.sql`
- Example: `V1__initial_schema.sql`
- Used for schema changes and core reference data
- Version numbers must be sequential
- Cannot be modified once applied

### Repeatable Migrations (R__)
- Format: `R__{description}.sql`
- Example: `R__sample_car_listings.sql`
- Run after versioned migrations
- Can be modified and will be rerun when changed
- Used for reference data and test data

## Running Migrations

### Development Environment
```bash
./gradlew flywayMigrateDev
```
- Runs core migrations from `db/migration/`
- Runs development data from `db/dev/`
- Includes sample car listings and test users

### Test Environment
```bash
./gradlew flywayMigrateTest
```
- Runs core migrations from `db/migration/`
- Runs test data from `db/test/`
- Uses minimal dataset focused on testing

### Production Environment
```bash
./gradlew flywayMigrateProd
```
- Only runs core migrations from `db/migration/`
- No sample or test data
- Clean disabled for safety

## Database Management Tasks

### Reset Test Database
```bash
./gradlew resetTestDb
```
This will:
1. Drop the test database if it exists
2. Create a new test database
3. Run all test migrations

### Individual Tasks
- `./gradlew createTestDb` - Create test database
- `./gradlew dropTestDb` - Drop test database
- `./gradlew flywayInfo` - Show migration status
- `./gradlew flywayValidate` - Validate migrations
- `./gradlew flywayRepair` - Repair migration metadata

## Best Practices

1. **Version Control**
   - All migrations should be version controlled
   - Never modify a versioned migration thats been committed
   - Use new versions for schema changes

2. **Backwards Compatibility**
   - Ensure migrations can run in sequence
   - Consider data preservation when modifying schemas
   - Use repeatable migrations for data that may change

3. **Testing**
   - Test migrations in development before committing
   - Use minimal test data in `test` environment
   - Keep test data focused and predictable

4. **Environment Separation**
   - Keep environment-specific data in appropriate folders
   - Use repeatable migrations for environment-specific data
   - Never include test/sample data in production migrations

5. **Documentation**
   - Comment complex SQL operations
   - Include description in migration filename
   - Update this guide when adding new migration types

## Troubleshooting

### Common Issues

1. **Migration Checksum Mismatch**
   - Caused by modifying an existing migration
   - Solution: Create a new migration instead

2. **Missing Dependencies**
   - Ensure all referenced tables exist
   - Check migration order (versions)
   - Verify all required reference data is present

3. **Test Database Issues**
   ```bash
   # Reset the test database completely
   ./gradlew resetTestDb
   ```

### Getting Help
- Check Flyway documentation: https://flywaydb.org/documentation/
- Review migration history: `./gradlew flywayInfo`
- Validate migrations: `./gradlew flywayValidate`
