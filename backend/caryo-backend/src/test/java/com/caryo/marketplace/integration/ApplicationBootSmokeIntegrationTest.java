package com.caryo.marketplace.integration;

import com.caryo.marketplace.test.IntegrationTestWithS3;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boots the FULL application context against real infrastructure (PostgreSQL
 * + Redis via Testcontainers) with production-like wiring: Flyway migrations,
 * the Redis-backed cache manager, and every CommandLineRunner (including the
 * reference-data initializers).
 *
 * This exists because nothing else exercises a real boot: unit tests run on
 * H2 with the simple cache, and the e2e suite reuses whatever backend
 * container happens to be running. When Redis caching was enabled in March
 * 2026 with broken dev wiring, startup crashed — and no check noticed for
 * four months. It also runs Hibernate's ddl-auto=validate (the production
 * default) against the Flyway-built schema, so entity/migration drift fails
 * here instead of on a production deploy — exactly how it caught the V51
 * comment-swallowed migration and five other drifted objects (fixed in V63).
 * A failure here means the application cannot start as configured, regardless
 * of what the unit tests say.
 *
 * Extends {@link IntegrationTestWithS3} for the MinIO container so the real
 * S3StorageService wiring boots too (storage.s3.enabled=true), matching the
 * production stack: PostgreSQL + Redis + S3.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("integration")
@DisplayName("Application Boot Smoke Test")
class ApplicationBootSmokeIntegrationTest extends IntegrationTestWithS3 {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("caryo_smoke")
            .withUsername("test")
            .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void infrastructure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");

        // Production cache wiring — the exact configuration whose breakage
        // went unnoticed in March. spring.cache.type=redis activates the
        // RedisCacheManager bean in CacheConfig.
        registry.add("spring.cache.type", () -> "redis");
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));

        // No mail server in this environment; its absence is environmental,
        // not an application wiring failure, so keep it out of the verdict.
        registry.add("management.health.mail.enabled", () -> "false");

        // app.jwtSecret resolves from the JWT_SECRET env var in production;
        // supply the same dummy test key the unit-test profile uses.
        registry.add("app.jwtSecret", () ->
                "testSuperSecretKeyForJWTTokenGenerationThatIsLongEnoughForHS256AlgorithmAndShouldBeAtLeast256BitsLongForTesting");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private CacheManager cacheManager;

    // Plain JDK HTTP client: TestRestTemplate pulls in Apache HttpClient 5,
    // which has a httpcore5 version conflict on this test classpath.
    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .GET()
                .build();
        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Test
    @DisplayName("Full context boots and reports healthy against real Postgres and Redis")
    void applicationBootsHealthy() throws Exception {
        HttpResponse<String> health = get("/actuator/health");

        assertThat(health.statusCode()).isEqualTo(200);
        assertThat(health.body()).contains("\"status\":\"UP\"");
    }

    @Test
    @DisplayName("Redis-backed cache manager is active, not a silent fallback")
    void redisCacheManagerIsActive() {
        assertThat(cacheManager)
                .as("spring.cache.type=redis must wire RedisCacheManager; a different "
                        + "implementation means production cache wiring is broken")
                .isInstanceOf(RedisCacheManager.class);
    }

    @Test
    @DisplayName("Cacheable reference data is served end-to-end through the real cache")
    void referenceDataServedThroughCache() throws Exception {
        HttpResponse<String> response = get("/api/v1/reference-data");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isNotBlank();
    }
}
