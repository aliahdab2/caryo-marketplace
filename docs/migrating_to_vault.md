# Migrating from Hardcoded Secrets to HashiCorp Vault

This guide provides a step-by-step approach to migrate hardcoded secrets in the Caryo Marketplace project to HashiCorp Vault.

## Migration Strategy

### 1. Inventory of Current Secrets

First, identify all secrets currently used in the application:

- Database credentials
- Redis passwords
- JWT signing keys
- MinIO/S3 credentials
- SMTP credentials
- API keys and tokens
- OAuth client secrets

### 2. Create Migration Plan

For each type of secret:

1. Determine the appropriate path in Vault
2. Define the access policies needed
3. Plan the code changes required
4. Set up a testing strategy
5. Define a rollback procedure

### 3. Order of Migration

Migrate in this order to minimize risk:

1. Non-critical services first (e.g., analytics)
2. Development and staging environments
3. Test environments
4. Production environment (after thorough testing)

## Implementation Steps

### Step 1: Set Up Vault Server

Follow the instructions in `secrets_management.md` to set up Vault server with Docker Compose.

### Step 2: Store Current Secrets in Vault

Use the `vault-init.sh` script as a template, but replace placeholder values with actual production values:

```bash
# Example for database credentials
vault kv put kv/database/postgres \
  username=actual_username \
  password=actual_password
```

### Step 3: Update Backend Configuration

1. Remove hardcoded database configuration in `application.yml`:

**Before:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/caryo
    username: postgres
    password: hardcoded_password
```

**After:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/caryo
    # Username and password will come from Vault
```

2. Add Vault configuration in `bootstrap.yml` as described in `spring_vault_integration.md`

3. Modify service classes to use Vault-provided secrets:

**Before:**
```java
@Configuration
public class DatabaseConfig {
    
    @Bean
    public DataSource dataSource() {
        return DataSourceBuilder.create()
                .url("jdbc:postgresql://postgres:5432/caryo")
                .username("postgres")
                .password("hardcoded_password")
                .build();
    }
}
```

**After:**
```java
@Configuration
public class DatabaseConfig {
    
    @Value("${database.postgres.username}")
    private String dbUsername;
    
    @Value("${database.postgres.password}")
    private String dbPassword;
    
    @Bean
    public DataSource dataSource() {
        return DataSourceBuilder.create()
                .url("jdbc:postgresql://postgres:5432/caryo")
                .username(dbUsername)
                .password(dbPassword)
                .build();
    }
}
```

### Step 4: Update Docker Compose Configuration

1. Add Vault service to `docker-compose.yml`
2. Configure backend service to connect to Vault:

```yaml
services:
  backend:
    # Existing configuration
    environment:
      - VAULT_ADDR=http://vault:8200
      - VAULT_ROLE_ID=${VAULT_ROLE_ID}
      - VAULT_SECRET_ID=${VAULT_SECRET_ID}
    depends_on:
      - vault
      # Other dependencies
```

### Step 5: Update CI/CD Configuration

Follow the instructions in `vault_github_actions_integration.md` to:

1. Configure GitHub Actions to use Vault
2. Update workflow files to fetch secrets from Vault
3. Remove secrets from GitHub repository settings (once Vault integration is confirmed working)

### Step 6: Testing the Migration

1. **Local Testing**:
   - Start local environment with Vault using `docker-compose up`
   - Verify the application can retrieve secrets from Vault
   - Test all functionality that uses secrets

2. **CI/CD Testing**:
   - Run the updated CI/CD pipeline with Vault integration
   - Ensure all tests pass with secrets from Vault
   - Verify deployment works correctly

3. **Staging Testing**:
   - Deploy to staging environment using Vault for secrets
   - Run integration tests in staging
   - Verify all features work as expected

### Step 7: Production Migration

1. **Preparation**:
   - Set up production-grade Vault server
   - Configure high availability and backup
   - Store production secrets in Vault

2. **Gradual Rollout**:
   - Deploy the Vault-integrated application to production
   - Monitor for any issues
   - Be prepared to rollback if necessary

3. **Completion**:
   - Remove all hardcoded secrets from configuration files
   - Update documentation to reflect the new secrets management approach

## Security Considerations

### Secret Rotation

Once migrated to Vault:

1. Immediately rotate all secrets that were previously hardcoded
2. Set up regular rotation schedules:
   - Database credentials: Monthly
   - API keys: Quarterly
   - JWT signing keys: Quarterly
   - Service credentials: Monthly

### Access Control

1. Implement strict policies in Vault:
   - Give services access only to the secrets they need
   - Use different policies for development, staging, and production
   - Implement approval workflows for sensitive secret access

### Monitoring and Auditing

1. Enable audit logging in Vault
2. Monitor Vault access logs
3. Set up alerts for:
   - Excessive secret access
   - Failed authentication attempts
   - Secret modifications

## Rollback Plan

If issues arise during migration:

1. Keep the old configuration with hardcoded secrets temporarily
2. Implement feature flags to switch between Vault and hardcoded secrets
3. If problems occur, switch back to hardcoded secrets until resolved

## Conclusion

Migrating from hardcoded secrets to Vault improves:

1. Security: Centralized management, encryption, access control
2. Compliance: Audit trails, secret rotation, access policies
3. Operations: Simplified secret management, reduced risk
4. Development: Consistent access patterns, reduced exposure

Follow this guide step by step to ensure a smooth migration with minimal disruption.
