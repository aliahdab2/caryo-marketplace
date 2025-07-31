# Database Migration Guide for Caryo Marketplace

This guide outlines the standard procedures and best practices for creating and managing database migrations in the Caryo Marketplace project.

## Migration Directory Structure

```
db/
  migration/         # Version migrations (V*__) and repeatable migrations (R__)
    postgresql/      # PostgreSQL-specific migrations
    h2/              # H2-specific migrations
  postgresql/        # PostgreSQL-specific scripts
  h2/                # H2-specific scripts
  scripts/           # Utility scripts for database operations
  test/              # Scripts used in tests
```

## Migration Types

1. **Versioned Migrations (`V*__`)**: 
   - These migrations are applied exactly once in order of version number
   - Examples: `V1__Initial_Schema.sql`, `V2__reference_data.sql`

2. **Repeatable Migrations (`R__`)**:
   - These migrations are applied every time their checksum changes
   - Typically used for reference data, views, or procedures
   - Examples: `R__reference_data.sql`, `R__sample_car_listings.sql`

3. **Database-Specific Migrations**:
   - Located in `postgresql/` or `h2/` subdirectories
   - Used when migration syntax differs between database engines

## Creating a New Migration

### 1. Use the Template

Start by copying the template from `db/migration/TEMPLATE.sql`:

```sql
-- Migration: {description}
-- Created: {date}
-- Author: {author}

-- Description:
-- {detailed description of what this migration does}

-- Prerequisites:
-- {list any dependencies or required state}

-- PostgreSQL Notes:
-- {any PostgreSQL-specific considerations}

-- H2 Notes:
-- {any H2-specific considerations}

-- Validate pre-conditions
-- Add validation queries here to ensure the migration can proceed safely

-- Migration Script
-- Main migration logic goes here

-- Post-migration validation
-- Add validation queries here to verify the migration was successful

-- Rollback Script (if needed)
/*
-- Instructions for rolling back this migration
*/
```

### 2. Name Your Migration File

For versioned migrations:
- Format: `V{version}__{description}.sql`
- Example: `V9__Add_favorite_listings_table.sql`

For repeatable migrations:
- Format: `R__{description}.sql`
- Example: `R__update_search_views.sql`

### 3. Follow SQL Style Guidelines

#### Use PostgreSQL 14 Compatible Syntax

```sql
-- Prefer:
INSERT INTO brands (name_en, name_ar) 
VALUES ('Toyota', 'تويوتا')
ON CONFLICT (name_en) DO UPDATE 
SET name_ar = EXCLUDED.name_ar;

-- Not: MERGE statements (PostgreSQL 15+ only)
```

#### Always Include Bilingual Fields

```sql
-- Table Creation Example
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    CONSTRAINT uk_categories_name_en UNIQUE (name_en),
    CONSTRAINT uk_categories_name_ar UNIQUE (name_ar)
);

-- Indexes for Both Languages
CREATE INDEX idx_categories_name_en ON categories(name_en);
CREATE INDEX idx_categories_name_ar ON categories(name_ar);
```

### 4. Include Pre and Post Conditions

Always validate the state before and after your migration:

```sql
-- Pre-conditions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands') THEN
        RAISE EXCEPTION 'Prerequisite table "brands" does not exist';
    END IF;
END
$$;

-- Migration
ALTER TABLE models ADD COLUMN popular BOOLEAN NOT NULL DEFAULT FALSE;

-- Post-conditions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'popular'
    ) THEN
        RAISE EXCEPTION 'Migration failed: "popular" column not added to models table';
    END IF;
END
$$;
```

### 5. Include Rollback Procedures

Always document how to reverse your migration:

```sql
-- Migration
ALTER TABLE car_listings ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_car_listings_featured ON car_listings(featured);

-- Rollback Script
/*
DROP INDEX IF EXISTS idx_car_listings_featured;
ALTER TABLE car_listings DROP COLUMN IF EXISTS featured;
*/
```

## Database-Specific Migrations

When PostgreSQL and H2 require different SQL syntax:

1. Create the main migration file in `db/migration/`
2. Create a PostgreSQL-specific version in `db/migration/postgresql/`
3. Create an H2-specific version in `db/migration/h2/`

Example:

```
db/migration/V10__Complex_function.sql          # Base migration with common parts
db/migration/postgresql/V10__Complex_function.sql  # PostgreSQL-specific parts
db/migration/h2/V10__Complex_function.sql         # H2-specific parts
```

## Testing Migrations

Always test your migrations against both PostgreSQL and H2:

1. Test with PostgreSQL:
   ```bash
   ./gradlew bootRun --args='--spring.profiles.active=dev'
   ```

2. Test with H2:
   ```bash
   ./gradlew bootRun
   ```

## Common PostgreSQL / H2 Differences

| Feature | PostgreSQL | H2 |
|---------|------------|---|
| Case Sensitivity | Case-sensitive by default | Case-insensitive by default |
| JSON Functions | Rich JSON support | Limited JSON support |
| Text Search | Has `tsvector` and `tsquery` | Uses simpler LIKE or regex |
| Sequences | `nextval('seq')` | `NEXT VALUE FOR seq` |
| Returning Data | Supports `RETURNING` | No direct equivalent |

## Best Practices

1. **Keep migrations small and focused**
   - Each migration should do one thing

2. **Test both database environments**
   - Verify migrations work in both PostgreSQL and H2

3. **Bilingual support**
   - Always include both `_en` and `_ar` columns for display names

4. **Indexes**
   - Consider adding indexes for both language columns
   - Add indexes for frequently queried columns

5. **Validation**
   - Include pre/post validation for safety
   - Document prerequisites

6. **Rollback procedures**
   - Always include instructions for reversing a migration

7. **Idempotent when possible**
   - Use `IF NOT EXISTS` and `IF EXISTS` where appropriate

8. **Document specific considerations**
   - Note any performance implications
   - Document any platform-specific behaviors

## Examples

### Adding a New Table

```sql
-- Migration: Add favorites table
-- Created: 2023-05-15
-- Author: Dev Team

-- Description:
-- Creates a new table to store user favorite listings

-- Prerequisites:
-- Tables users and car_listings must exist

-- Validate pre-conditions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Prerequisite table "users" does not exist';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_listings') THEN
        RAISE EXCEPTION 'Prerequisite table "car_listings" does not exist';
    END IF;
END
$$;

-- Migration Script
CREATE TABLE user_favorites (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    car_listing_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_listing FOREIGN KEY (car_listing_id) REFERENCES car_listings(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_listing UNIQUE (user_id, car_listing_id)
);

CREATE INDEX idx_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_favorites_car_listing_id ON user_favorites(car_listing_id);

-- Post-migration validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
        RAISE EXCEPTION 'Migration failed: "user_favorites" table not created';
    END IF;
END
$$;

-- Rollback Script
/*
DROP TABLE IF EXISTS user_favorites;
*/
```

### Modifying an Existing Table

```sql
-- Migration: Add denormalized columns to car_listings
-- Created: 2023-06-10
-- Author: Dev Team

-- Description:
-- Adds denormalized columns to car_listings table for faster queries and API responses

-- Prerequisites:
-- car_listings table must exist

-- Validate pre-conditions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_listings') THEN
        RAISE EXCEPTION 'Prerequisite table "car_listings" does not exist';
    END IF;
END
$$;

-- Migration Script
ALTER TABLE car_listings ADD COLUMN brand_name_en VARCHAR(100);
ALTER TABLE car_listings ADD COLUMN brand_name_ar VARCHAR(100);
ALTER TABLE car_listings ADD COLUMN model_name_en VARCHAR(100);
ALTER TABLE car_listings ADD COLUMN model_name_ar VARCHAR(100);

-- Create indexes for better search performance
CREATE INDEX idx_car_listings_brand_name_en ON car_listings(brand_name_en);
CREATE INDEX idx_car_listings_brand_name_ar ON car_listings(brand_name_ar);
CREATE INDEX idx_car_listings_model_name_en ON car_listings(model_name_en);
CREATE INDEX idx_car_listings_model_name_ar ON car_listings(model_name_ar);

-- Post-migration validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'car_listings' AND column_name = 'brand_name_en'
    ) THEN
        RAISE EXCEPTION 'Migration failed: "brand_name_en" column not added to car_listings table';
    END IF;
END
$$;

-- Rollback Script
/*
DROP INDEX IF EXISTS idx_car_listings_model_name_ar;
DROP INDEX IF EXISTS idx_car_listings_model_name_en;
DROP INDEX IF EXISTS idx_car_listings_brand_name_ar;
DROP INDEX IF EXISTS idx_car_listings_brand_name_en;
ALTER TABLE car_listings DROP COLUMN IF EXISTS model_name_ar;
ALTER TABLE car_listings DROP COLUMN IF EXISTS model_name_en;
ALTER TABLE car_listings DROP COLUMN IF EXISTS brand_name_ar;
ALTER TABLE car_listings DROP COLUMN IF EXISTS brand_name_en;
*/
```
