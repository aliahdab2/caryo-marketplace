# Integrating HashiCorp Vault with Spring Boot Backend

This guide explains how to integrate HashiCorp Vault with the Spring Boot backend of the Caryo Marketplace project.

## Dependencies

Add the following dependencies to your `build.gradle`:

```gradle
dependencies {
    // Existing dependencies
    
    // Vault integration
    implementation 'org.springframework.cloud:spring-cloud-starter-vault-config:4.0.1'
    implementation 'org.springframework.cloud:spring-cloud-starter-bootstrap:4.0.1'
}
```

## Configuration

### Bootstrap Configuration

Create a `bootstrap.yml` file in `src/main/resources`:

```yaml
spring:
  application:
    name: caryo-backend
  cloud:
    vault:
      host: vault
      port: 8200
      scheme: http
      authentication: approle
      app-role:
        role-id: ${VAULT_ROLE_ID}
        secret-id: ${VAULT_SECRET_ID}
      kv:
        enabled: true
        backend: kv
        default-context: application
        application-name: caryo-backend
        profile-separator: '/'
      fail-fast: true
```

### Environment Variables

Set the following environment variables in your development environment:

```bash
export VAULT_ROLE_ID=your-role-id-from-vault-init
export VAULT_SECRET_ID=your-secret-id-from-vault-init
```

For Docker, add these to your `docker-compose.dev.yml`:

```yaml
services:
  backend:
    # Existing configuration
    environment:
      - VAULT_ROLE_ID=your-role-id-from-vault-init
      - VAULT_SECRET_ID=your-secret-id-from-vault-init
```

## Usage in Application

### Accessing Secrets

You can access secrets in your Spring Boot application using `@Value` annotations:

```java
@Service
public class DatabaseService {

    @Value("${database.postgres.username}")
    private String dbUsername;
    
    @Value("${database.postgres.password}")
    private String dbPassword;
    
    // Use the secrets in your code
}
```

### Dynamic Configuration

Vault can also be used with `@ConfigurationProperties`:

```java
@ConfigurationProperties(prefix = "email.smtp")
@Component
public class EmailConfig {
    private String host;
    private int port;
    private String username;
    private String password;
    
    // Getters and setters
}
```

## Testing

For testing with Vault, you can use the Vault test container:

```java
@SpringBootTest
@Testcontainers
@ContextConfiguration(initializers = VaultInitializer.class)
public class YourIntegrationTest {

    @Container
    public static VaultContainer<?> vaultContainer = new VaultContainer<>("vault:1.13")
            .withVaultToken("testvaulttoken")
            .withSecretInVault("kv/data/database/postgres", 
                "{ \"data\": { \"username\": \"test\", \"password\": \"testpass\" } }");

    // Your tests
}
```

## CI/CD Integration

For GitHub Actions, update your workflow to include:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Import Secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: ${{ secrets.VAULT_ADDR }}
          method: approle
          roleId: ${{ secrets.VAULT_ROLE_ID }}
          secretId: ${{ secrets.VAULT_SECRET_ID }}
          secrets: |
            kv/data/database/postgres username | POSTGRES_USER ;
            kv/data/database/postgres password | POSTGRES_PASSWORD ;
            kv/data/redis/main password | REDIS_PASSWORD ;
            kv/data/storage/minio access_key | MINIO_ACCESS_KEY ;
            kv/data/storage/minio secret_key | MINIO_SECRET_KEY
```

## Production Considerations

For production:

1. Use a proper production Vault setup with:
   - High availability configuration
   - Auto-unsealing
   - Regular backups
   - Proper authentication methods

2. Implement secret rotation:
   - Database credentials
   - API keys
   - JWT signing keys

3. Set up monitoring and alerting:
   - Seal/unseal status
   - Token expiration
   - Access logs

## Troubleshooting

### Common Issues

1. **Connection Issues**:
   - Ensure Vault is running and accessible
   - Check network connectivity between services
   - Verify hostname resolution in Docker

2. **Authentication Issues**:
   - Validate role ID and secret ID
   - Check policies and permissions
   - Verify token TTLs

3. **Missing Secrets**:
   - Ensure secrets are properly created in the correct path
   - Check your application is requesting the correct path
