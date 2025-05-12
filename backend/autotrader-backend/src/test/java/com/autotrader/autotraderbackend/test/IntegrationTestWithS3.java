package com.autotrader.autotraderbackend.test;

import org.junit.jupiter.api.BeforeAll;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.containers.wait.strategy.WaitAllStrategy;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;

import java.net.URI;
import java.time.Duration;

/**
 * Abstract base class for integration tests that require S3 storage (using MinIO).
 * Provides a common setup for MinIO container, bucket creation, and property configuration.
 * <p>
 * Any test class that needs S3 storage should extend this class and add its own
 * required annotations like @SpringBootTest and @ActiveProfiles.
 */
@Testcontainers
public abstract class IntegrationTestWithS3 {

    @Container
    protected static MinIOContainer minioContainer = new MinIOContainer("minio/minio:RELEASE.2023-09-04T19-57-37Z")
            .withExposedPorts(9000)
            // Combine wait strategies: wait for health endpoint AND listening port
            .waitingFor(new WaitAllStrategy()
                            .withStrategy(Wait.forHttp("/minio/health/live")
                                            .forStatusCode(200))
                            .withStrategy(Wait.forListeningPort()) // Add wait for port 9000
                            .withStartupTimeout(Duration.ofSeconds(20))); // Increase timeout slightly

    protected static final String BUCKET_NAME = "autotrader-assets";
    // No static S3Client or endpoint; use local client in @BeforeAll

    /**
     * Dynamically set Spring properties based on the MinIO container.
     * This ensures that the application will use the test container instead of
     * trying to connect to a real S3 service.
     * Also initializes the S3Client used for bucket setup.
     */
    @DynamicPropertySource
    static void minioProperties(DynamicPropertyRegistry registry) {
        if (!minioContainer.isRunning()) {
            System.err.println("Warning: MinIO container was not running in @DynamicPropertySource. Starting it explicitly.");
            minioContainer.start();
        }
        String endpoint = String.format("http://%s:%d", minioContainer.getHost(), minioContainer.getMappedPort(9000));
        System.out.println("Setting MinIO endpoint for Spring: " + endpoint);
        registry.add("storage.s3.enabled", () -> "true"); // Added this line
        registry.add("storage.s3.endpointUrl", () -> endpoint);
        registry.add("storage.s3.accessKeyId", minioContainer::getUserName);
        registry.add("storage.s3.secretAccessKey", minioContainer::getPassword);
        registry.add("storage.s3.bucketName", () -> BUCKET_NAME);
        registry.add("storage.s3.region", () -> "us-east-1");
        registry.add("storage.s3.pathStyleAccessEnabled", () -> "true");
    }

    /**
     * Create the required S3 bucket in the MinIO container before any tests run,
     * using the S3Client initialized in @DynamicPropertySource.
     */
    @BeforeAll
    static void ensureBucketExists() {
        String endpoint = String.format("http://%s:%d", minioContainer.getHost(), minioContainer.getMappedPort(9000));
        S3Client s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(minioContainer.getUserName(), minioContainer.getPassword())
                ))
                .region(Region.US_EAST_1)
                .forcePathStyle(true)
                .build();
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(BUCKET_NAME).build());
            System.out.println("Bucket '" + BUCKET_NAME + "' already exists.");
        } catch (NoSuchBucketException e) {
            System.out.println("Bucket '" + BUCKET_NAME + "' does not exist. Creating...");
            s3Client.createBucket(CreateBucketRequest.builder().bucket(BUCKET_NAME).build());
            System.out.println("Bucket '" + BUCKET_NAME + "' created.");
        } catch (Exception ex) {
            System.err.println("Error ensuring bucket exists: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Failed to ensure MinIO bucket exists", ex);
        } finally {
            s3Client.close();
        }
    }

}
