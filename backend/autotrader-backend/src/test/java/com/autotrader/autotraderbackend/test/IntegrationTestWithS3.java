package com.autotrader.autotraderbackend.test;

import org.junit.jupiter.api.BeforeAll;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MinIOContainer;
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

/**
 * Abstract base class for integration tests that require MinIO S3 storage.
 * Provides a common setup for MinIO container, bucket creation, and property configuration.
 * 
 * Any test class that needs S3 storage should extend this class and add its own
 * required annotations like @SpringBootTest and @ActiveProfiles.
 */
@Testcontainers
public abstract class IntegrationTestWithS3 {

    @Container
    protected static MinIOContainer minioContainer = new MinIOContainer("minio/minio:RELEASE.2023-09-04T19-57-37Z")
            .withExposedPorts(9000);

    protected static final String BUCKET_NAME = "autotrader-assets";
    // Store the endpoint URL derived in DynamicPropertySource
    private static String dynamicS3Endpoint;

    /**
     * Dynamically set Spring properties based on the MinIO container.
     * This ensures that the application will use the test container instead of
     * trying to connect to a real S3 service.
     */
    @DynamicPropertySource
    static void minioProperties(DynamicPropertyRegistry registry) {
        // Container should be started automatically by Testcontainers before this method
        // Ensure container is running before getting properties (defensive check)
        if (!minioContainer.isRunning()) {
             System.err.println("Warning: MinIO container was not running in @DynamicPropertySource. Starting it explicitly.");
             minioContainer.start();
        }

        dynamicS3Endpoint = String.format("http://%s:%d", minioContainer.getHost(), minioContainer.getMappedPort(9000));
        System.out.println("Setting MinIO endpoint for Spring: " + dynamicS3Endpoint); // Add logging

        registry.add("storage.s3.endpointUrl", () -> dynamicS3Endpoint);
        registry.add("storage.s3.accessKeyId", minioContainer::getUserName);
        registry.add("storage.s3.secretAccessKey", minioContainer::getPassword);
        registry.add("storage.s3.bucketName", () -> BUCKET_NAME);
        registry.add("storage.s3.region", () -> "us-east-1");
        registry.add("storage.s3.pathStyleAccessEnabled", () -> "true");
    }

    /**
     * Create the required S3 bucket in the MinIO container before any tests run.
     * This ensures that the application's initialization of S3StorageService won't fail.
     */
    @BeforeAll
    static void ensureBucketExists() {
        // Use the endpoint derived in DynamicPropertySource
        if (dynamicS3Endpoint == null) {
             // This case should ideally not happen if DynamicPropertySource runs first
             System.err.println("Warning: dynamicS3Endpoint was null in @BeforeAll. Re-calculating.");
             // Ensure container is running before getting properties
             if (!minioContainer.isRunning()) {
                 System.err.println("Error: MinIO container is not running in @BeforeAll. Cannot create bucket.");
                 throw new IllegalStateException("MinIO container failed to start.");
             }
             dynamicS3Endpoint = String.format("http://%s:%d", minioContainer.getHost(), minioContainer.getMappedPort(9000));
        }
        
        System.out.println("Ensuring bucket exists using endpoint: " + dynamicS3Endpoint); // Add logging

        S3Client s3Client = S3Client.builder()
                .endpointOverride(URI.create(dynamicS3Endpoint)) // Use the stored endpoint
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(minioContainer.getUserName(), minioContainer.getPassword())
                ))
                .region(Region.US_EAST_1)
                .forcePathStyle(true)
                .build();
        try {
            // Attempt to check if bucket exists
            s3Client.headBucket(HeadBucketRequest.builder().bucket(BUCKET_NAME).build());
            System.out.println("Bucket '" + BUCKET_NAME + "' already exists.");
        } catch (NoSuchBucketException e) {
            // Bucket doesn't exist, create it
            System.out.println("Bucket '" + BUCKET_NAME + "' does not exist. Creating...");
            s3Client.createBucket(CreateBucketRequest.builder().bucket(BUCKET_NAME).build());
            System.out.println("Bucket '" + BUCKET_NAME + "' created.");
        } catch (Exception ex) { // Catch broader exceptions during setup
             System.err.println("Error ensuring bucket exists: " + ex.getMessage());
             ex.printStackTrace(); // Print stack trace for debugging
             throw new RuntimeException("Failed to ensure MinIO bucket exists", ex); // Re-throw to fail the test setup
        } finally {
            s3Client.close();
        }
    }
}
