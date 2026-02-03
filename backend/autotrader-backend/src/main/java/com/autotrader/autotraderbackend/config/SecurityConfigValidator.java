package com.autotrader.autotraderbackend.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;

/**
 * Validates security-critical configuration on application startup.
 * Fails fast in production if secrets are missing or set to known defaults.
 */
@Component
@Slf4j
public class SecurityConfigValidator {

    private final Environment env;

    private static final Set<String> KNOWN_WEAK_JWT_SECRETS = Set.of(
        "defaultsecretkey123456789012345678901234567890",
        "autotraderSecretKey123456789012345678901234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    );

    private static final Set<String> KNOWN_DEFAULT_PASSWORDS = Set.of(
        "autotrader", "postgres", "password", "admin", "root", "changeme"
    );

    public SecurityConfigValidator(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void validateSecurityConfiguration() {
        boolean isProduction = isProductionProfile();

        validateJwtSecret(isProduction);
        validateDatabaseCredentials(isProduction);
        validateStorageCredentials(isProduction);

        if (isProduction) {
            log.info("Security configuration validation completed for production profile");
        }
    }

    private void validateJwtSecret(boolean isProduction) {
        String jwtSecret = env.getProperty("app.jwtSecret");

        if (jwtSecret == null || jwtSecret.isBlank()) {
            if (isProduction) {
                throw new IllegalStateException(
                    "FATAL: JWT_SECRET is not configured. Application cannot start in production without a valid JWT secret. " +
                    "Generate one with: openssl rand -base64 64"
                );
            }
            log.warn("JWT_SECRET is not configured. This is acceptable for development only.");
            return;
        }

        if (KNOWN_WEAK_JWT_SECRETS.contains(jwtSecret)) {
            if (isProduction) {
                throw new IllegalStateException(
                    "FATAL: JWT_SECRET is set to a known default value. " +
                    "Generate a strong secret with: openssl rand -base64 64"
                );
            }
            log.warn("Using a known default JWT secret. This is acceptable for development only.");
        }
    }

    private void validateDatabaseCredentials(boolean isProduction) {
        String dbPassword = env.getProperty("spring.datasource.password", "");

        if (KNOWN_DEFAULT_PASSWORDS.contains(dbPassword)) {
            if (isProduction) {
                log.error("SECURITY: Database password is set to a known default value. Change it immediately for production!");
            } else {
                log.debug("Using default database password (acceptable for development)");
            }
        }
    }

    private void validateStorageCredentials(boolean isProduction) {
        String minioAccessKey = env.getProperty("minio.access-key", "");
        String minioSecretKey = env.getProperty("minio.secret-key", "");

        if ("minioadmin".equals(minioAccessKey) || "minioadmin".equals(minioSecretKey)) {
            if (isProduction) {
                log.error("SECURITY: MinIO credentials are set to default 'minioadmin'. Change them for production!");
            } else {
                log.debug("Using default MinIO credentials (acceptable for development)");
            }
        }
    }

    private boolean isProductionProfile() {
        String[] activeProfiles = env.getActiveProfiles();
        return Arrays.stream(activeProfiles)
            .anyMatch(p -> "prod".equals(p) || "production".equals(p));
    }
}
