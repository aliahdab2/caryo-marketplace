---
name: new-migration
description: Create a new Flyway database migration with proper versioning and conventions
user-invocable: true
---

# Create Flyway Migration

## Migration Location

```
backend/autotrader-backend/src/main/resources/db/migration/
```

## Naming Convention

```
V{next_number}__{Description_with_underscores}.sql
```

- **Double underscore** between version and description
- Description uses **underscores** between words, **PascalCase** each word
- Example: `V59__Add_payment_status_column.sql`

## Workflow

1. **Find the latest version number**:
   ```bash
   ls backend/autotrader-backend/src/main/resources/db/migration/ | sort -V | tail -1
   ```

2. **Increment by 1** for the new migration

3. **Write the SQL file** following these patterns:

### Common Patterns (from existing migrations)

**Create table:**
```sql
CREATE TABLE table_name (
    id BIGSERIAL PRIMARY KEY,
    -- columns
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_table_name_column ON table_name(column);
```

**Add column:**
```sql
ALTER TABLE table_name ADD COLUMN column_name TYPE;
```

**Add foreign key:**
```sql
ALTER TABLE child_table
    ADD CONSTRAINT fk_child_parent
    FOREIGN KEY (parent_id) REFERENCES parent_table(id);
```

**Add enum/status column:**
```sql
ALTER TABLE table_name ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
```

## Rules

- Migrations are **immutable** once committed — never edit an existing migration
- Always include `NOT NULL` with a `DEFAULT` when adding columns to existing tables (avoids breaking existing rows)
- Use `BIGSERIAL` for primary keys
- Use `TIMESTAMP` (not `DATETIME`) for date columns
- Add indexes for columns used in WHERE clauses or JOINs
- Test with: `cd backend/autotrader-backend && SPRING_PROFILES_ACTIVE=test ./gradlew test --no-daemon`

## Entity Mapping

After creating the migration, update or create the corresponding JPA entity in:
```
backend/autotrader-backend/src/main/java/com/autotrader/autotraderbackend/model/
```
