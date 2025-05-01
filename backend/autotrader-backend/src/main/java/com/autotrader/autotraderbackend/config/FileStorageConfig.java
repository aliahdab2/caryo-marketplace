package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import com.autotrader.autotraderbackend.service.storage.LocalStorageService;
import com.autotrader.autotraderbackend.service.storage.S3StorageService;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import com.autotrader.autotraderbackend.service.storage.DelegatingStorageService;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.stream.Stream;

/**
 * Configuration for storage services using both S3 and local file system.
 * This configuration reads properties from application.properties and
 * creates the appropriate storage service beans.
 */
@Configuration
@Slf4j
public class FileStorageConfig {

    private S3StorageService s3StorageServiceInstance; // Keep track for cleanup

    /**
     * Create a local file system storage service.
     */
    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
    public LocalStorageService localStorageService(StorageProperties properties) {
        log.info("Creating LocalStorageService bean. Upload directory: {}", properties.getLocation());
        LocalStorageService service = new LocalStorageService(properties);
        service.init(); // Initialize the service
        return service;
    }

    /**
     * Create an S3 storage service if enabled.
     */
    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "s3")
    public S3StorageService s3StorageService(StorageProperties properties) {
        log.info("Creating S3StorageService bean. Bucket: {}, Region: {}", properties.getS3().getBucketName(), properties.getS3().getRegion());
        this.s3StorageServiceInstance = new S3StorageService(properties);
        this.s3StorageServiceInstance.init(); // Initialize the service
        return this.s3StorageServiceInstance;
    }

    /**
     * Create the primary storage service based on configuration.
     */
    @Bean
    @Primary
    public StorageService storageService(StorageProperties properties,
                                         ObjectProvider<LocalStorageService> localStorageServiceProvider,
                                         ObjectProvider<S3StorageService> s3StorageServiceProvider) {

        String storageType = properties.getType();
        log.info("Configuring storage service. Configured type: {}", storageType);

        // Attempt to get instances from providers
        S3StorageService s3Service = s3StorageServiceProvider.getIfAvailable();
        LocalStorageService localService = localStorageServiceProvider.getIfAvailable();

        if ("local".equalsIgnoreCase(storageType)) {
            // --- LOCAL ONLY --- 
            log.info("Configuration selected: Local storage only.");
            if (localService != null) {
                log.info("Using Local storage as primary.");
                return localService;
            } else {
                 log.error("Local storage service (primary) could not be initialized.");
                 return createDummyStorageService();
            }
        } else if ("s3".equalsIgnoreCase(storageType)) {
            // --- S3 ONLY --- 
            log.info("Configuration selected: S3 storage only.");
            if (s3Service != null) {
                log.info("Using S3 storage as primary.");
                return s3Service;
            } else {
                log.error("S3 storage service is configured but could not be initialized. No fallback configured.");
                return createDummyStorageService();
            }
        } else if ("s3_with_local_fallback".equalsIgnoreCase(storageType)) {
            // --- S3 PRIMARY WITH LOCAL FALLBACK --- 
            log.info("Configuration selected: S3 primary with Local fallback.");
            if (s3Service != null && localService != null) {
                log.info("Initializing DelegatingStorageService with S3 primary and Local fallback.");
                return new DelegatingStorageService(s3Service, localService);
            } else if (s3Service != null) { // S3 ok, but Local failed
                log.warn("S3 service initialized, but Local fallback service failed. Proceeding with S3 only.");
                return s3Service;
            } else if (localService != null) { // S3 failed, but Local ok
                log.error("Primary S3 service failed to initialize. Falling back to Local storage only.");
                return localService;
            } else { // Both failed
                log.error("Both S3 primary and Local fallback services failed to initialize.");
                return createDummyStorageService();
            }
        } else {
            // --- INVALID OR DEFAULT (treat as local for safety) --- 
            log.warn("Invalid or unspecified storage.type: '{}'. Defaulting to local storage.", storageType);
            if (localService != null) {
                return localService;
            } else {
                 log.error("Default local storage service could not be initialized.");
                 return createDummyStorageService();
            }
        }
    }


    /**
     * Clean up resources when the application shuts down.
     */
    @PreDestroy
    public void onDestroy() {
        log.info("Cleaning up storage resources...");
        if (this.s3StorageServiceInstance != null) {
            try {
                log.info("Closing S3StorageService resources.");
                this.s3StorageServiceInstance.close(); // Call the close method
            } catch (Exception e) {
                log.error("Error closing S3StorageService: {}", e.getMessage(), e);
            }
        } else {
             log.info("No S3StorageService instance to clean up.");
        }
         log.info("Storage resource cleanup finished.");
    }

    /**
     * Creates a dummy StorageService that logs warnings and does nothing.
     * Used when primary and fallback services cannot be initialized.
     */
    private StorageService createDummyStorageService() {
        log.warn("Creating a dummy StorageService. File operations will not work.");
        // Return an anonymous implementation matching the StorageService interface
        return new StorageService() {
            @Override
            public void init() { log.warn("DummyStorageService: init called."); }

            @Override
            public String store(MultipartFile file, String key) { // Updated signature to match interface
                log.warn("DummyStorageService: store called, file '{}' with key '{}' not stored.", file.getOriginalFilename(), key);
                throw new StorageException("Storage service not configured.");
            }

            @Override
            public Stream<Path> loadAll() { // Correct signature (no arguments)
                 log.warn("DummyStorageService: loadAll called.");
                 return Stream.empty();
            }

            @Override
            public Path load(String key) { // Updated parameter name for clarity
                 log.warn("DummyStorageService: load called for key '{}'.", key);
                 throw new StorageFileNotFoundException("Storage service not configured, file not found: " + key);
            }

            @Override
            public Resource loadAsResource(String key) { // Updated parameter name for clarity
                 log.warn("DummyStorageService: loadAsResource called for key '{}'.", key);
                 throw new StorageFileNotFoundException("Storage service not configured, file not found: " + key);
            }

            @Override
            public boolean delete(String key) { // Correct return type and parameter name
                 log.warn("DummyStorageService: delete called for key '{}'.", key);
                 return false; // Indicate deletion failed or wasn't performed
            }

            @Override
            public void deleteAll() {
                 log.warn("DummyStorageService: deleteAll called.");
            }

             @Override
             public String getSignedUrl(String key, long expirationSeconds) { // Correct signature
                 log.warn("DummyStorageService: getSignedUrl called for key '{}'.", key);
                 // Throwing exception as dummy service cannot generate URLs
                 throw new UnsupportedOperationException("DummyStorageService does not support generating signed URLs.");
             }

             // Removed close() method as it's not part of the StorageService interface
        };
    }
}
