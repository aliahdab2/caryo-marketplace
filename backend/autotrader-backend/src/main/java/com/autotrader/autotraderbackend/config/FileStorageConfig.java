package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.service.storage.S3StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Configuration for S3-compatible storage service.
 */
@Configuration
@Slf4j
public class FileStorageConfig {

    /**
     * Create an S3 storage service. This is the primary StorageService bean.
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "storage.s3.enabled", havingValue = "true", matchIfMissing = false)
    public S3StorageService s3StorageService(StorageProperties properties, S3Client s3Client, S3Presigner s3Presigner) {
        log.info("Creating S3StorageService bean. Bucket: {}, Region: {}", properties.getS3().getBucketName(), properties.getS3().getRegion());
        // The init() method will be called by @PostConstruct in S3StorageService
        return new S3StorageService(properties, s3Client, s3Presigner);
    }

    /**
     * Create an S3Client bean for S3StorageService.
     */
    @Bean
    @ConditionalOnProperty(name = "storage.s3.enabled", havingValue = "true", matchIfMissing = false)
    public S3Client s3Client(StorageProperties properties) {
        StorageProperties.S3 s3Props = properties.getS3(); // Get S3 properties once
        log.info("Creating S3Client bean. Endpoint: {}, Region: {}", s3Props.getEndpointUrl(), s3Props.getRegion()); // Use getEndpointUrl()
        return S3Client.builder()
                .endpointOverride(URI.create(s3Props.getEndpointUrl())) // Use getEndpointUrl()
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(
                                s3Props.getAccessKeyId(), // Use getAccessKeyId()
                                s3Props.getSecretAccessKey() // Use getSecretAccessKey()
                        )
                ))
                .region(Region.of(s3Props.getRegion()))
                .forcePathStyle(s3Props.isPathStyleAccessEnabled())
                .build();
    }

    /**
     * Create an S3Presigner bean for S3StorageService.
     * Note: This will fail if the s3-presigner dependency is commented out.
     */
    @Bean
    @ConditionalOnProperty(name = "storage.s3.enabled", havingValue = "true", matchIfMissing = false)
    public S3Presigner s3Presigner(StorageProperties properties) {
        StorageProperties.S3 s3Props = properties.getS3(); // Get S3 properties once
        log.info("Creating S3Presigner bean. Endpoint: {}, Region: {}", s3Props.getEndpointUrl(), s3Props.getRegion()); // Use getEndpointUrl()
        return S3Presigner.builder()
                .endpointOverride(URI.create(s3Props.getEndpointUrl())) // Use getEndpointUrl()
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(
                                s3Props.getAccessKeyId(), // Use getAccessKeyId()
                                s3Props.getSecretAccessKey() // Use getSecretAccessKey()
                        )
                ))
                .region(Region.of(s3Props.getRegion()))
                .build();
    }
}
