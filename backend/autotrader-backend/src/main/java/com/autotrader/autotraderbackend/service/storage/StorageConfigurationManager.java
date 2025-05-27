package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Centralized storage configuration manager that provides consistent
 * access to storage settings across the application.
 * 
 * This service acts as a single source of truth for:
 * - Bucket name resolution
 * - Storage key pattern management
 * - Environment-specific configuration
 * - Storage provider abstraction
 */
@Slf4j
@Service
public class StorageConfigurationManager {

    private final StorageProperties storageProperties;
    private final StorageKeyGenerator keyGenerator;
    
    // Cache for frequently accessed configuration values
    private final Map<String, String> configCache = new ConcurrentHashMap<>();

    public StorageConfigurationManager(StorageProperties storageProperties, StorageKeyGenerator keyGenerator) {
        this.storageProperties = storageProperties;
        this.keyGenerator = keyGenerator;
        log.info("StorageConfigurationManager initialized");
    }

    /**
     * Get the appropriate bucket name for a given file type or context.
     * 
     * @param fileType The type of file (e.g., "listing-media", "user-avatar", "temp")
     * @return The bucket name to use
     */
    public String getBucketName(String fileType) {
        // For now, we use a single bucket, but this can be extended to support
        // multiple buckets based on file type or other criteria
        return storageProperties.getS3().getBucketName() != null 
            ? storageProperties.getS3().getBucketName() 
            : storageProperties.getGeneral().getDefaultBucketName();
    }

    /**
     * Get the default bucket name.
     * 
     * @return The default bucket name
     */
    public String getDefaultBucketName() {
        return getBucketName("default");
    }

    /**
     * Get the base URL for direct access to storage files.
     * 
     * @return The base URL for storage access
     */
    public String getStorageBaseUrl() {
        return configCache.computeIfAbsent("baseUrl", k -> {
            String endpointUrl = storageProperties.getS3().getEndpointUrl();
            String bucketName = getDefaultBucketName();
            
            if (endpointUrl != null && bucketName != null) {
                // Handle path-style vs virtual-hosted-style URLs
                if (storageProperties.getS3().isPathStyleAccessEnabled()) {
                    return endpointUrl + "/" + bucketName;
                } else {
                    // Virtual-hosted-style (for AWS S3)
                    return "https://" + bucketName + ".s3." + storageProperties.getS3().getRegion() + ".amazonaws.com";
                }
            }
            
            return storageProperties.getGeneral().getBaseUrl();
        });
    }

    /**
     * Check if public access is enabled for storage.
     * 
     * @return true if public access is enabled
     */
    public boolean isPublicAccessEnabled() {
        return storageProperties.getGeneral().isPublicAccessEnabled();
    }

    /**
     * Get the storage region.
     * 
     * @return The storage region
     */
    public String getStorageRegion() {
        return storageProperties.getS3().getRegion() != null 
            ? storageProperties.getS3().getRegion() 
            : storageProperties.getGeneral().getDefaultRegion();
    }

    /**
     * Check if S3 storage is enabled.
     * 
     * @return true if S3 storage is enabled
     */
    public boolean isS3StorageEnabled() {
        return storageProperties.getS3().isEnabled();
    }

    /**
     * Get the signed URL expiration time in seconds.
     * 
     * @return Expiration time in seconds
     */
    public long getSignedUrlExpirationSeconds() {
        return storageProperties.getS3().getSignedUrlExpirationSeconds();
    }

    /**
     * Generate a storage key for a given file type with parameters.
     * 
     * @param fileType The type of file
     * @param parameters Variable parameters for key generation
     * @return Generated storage key
     */
    public String generateStorageKey(String fileType, Object... parameters) {
        switch (fileType.toLowerCase()) {
            case "listing-media":
                if (parameters.length >= 2 && parameters[0] instanceof Long && parameters[1] instanceof String) {
                    return keyGenerator.generateListingMediaKey((Long) parameters[0], (String) parameters[1]);
                }
                break;
            case "user-avatar":
                if (parameters.length >= 2 && parameters[0] instanceof Long && parameters[1] instanceof String) {
                    return keyGenerator.generateUserAvatarKey((Long) parameters[0], (String) parameters[1]);
                }
                break;
            case "temp-upload":
                if (parameters.length >= 1 && parameters[0] instanceof String) {
                    return keyGenerator.generateTempUploadKey((String) parameters[0]);
                }
                break;
            case "sample-data":
                if (parameters.length >= 2 && parameters[0] instanceof String && parameters[1] instanceof String) {
                    return keyGenerator.generateSampleDataKey((String) parameters[0], (String) parameters[1]);
                }
                break;
            case "document":
                if (parameters.length >= 2 && parameters[0] instanceof String && parameters[1] instanceof String) {
                    return keyGenerator.generateDocumentKey((String) parameters[0], (String) parameters[1]);
                }
                break;
            case "thumbnail":
                if (parameters.length >= 2 && parameters[0] instanceof String && parameters[1] instanceof String) {
                    return keyGenerator.generateThumbnailKey((String) parameters[0], (String) parameters[1]);
                }
                break;
            case "backup":
                if (parameters.length >= 2 && parameters[0] instanceof String && parameters[1] instanceof String) {
                    return keyGenerator.generateBackupKey((String) parameters[0], (String) parameters[1]);
                }
                break;
            case "log":
                if (parameters.length >= 2 && parameters[0] instanceof String && parameters[1] instanceof String) {
                    return keyGenerator.generateLogKey((String) parameters[0], (String) parameters[1]);
                }
                break;
            default:
                log.warn("Unknown file type for key generation: {}", fileType);
        }
        
        throw new IllegalArgumentException("Invalid file type or parameters for key generation: " + fileType);
    }

    /**
     * Get the file type from a storage key.
     * 
     * @param storageKey The storage key
     * @return The detected file type
     */
    public String getFileTypeFromKey(String storageKey) {
        if (keyGenerator.isListingMediaKey(storageKey)) {
            return "listing-media";
        } else if (keyGenerator.isUserAvatarKey(storageKey)) {
            return "user-avatar";
        } else if (keyGenerator.isTempUploadKey(storageKey)) {
            return "temp-upload";
        } else if (storageKey.startsWith("samples/")) {
            return "sample-data";
        } else if (storageKey.startsWith("documents/")) {
            return "document";
        } else if (storageKey.startsWith("thumbnails/")) {
            return "thumbnail";
        } else if (storageKey.startsWith("backups/")) {
            return "backup";
        } else if (storageKey.startsWith("logs/")) {
            return "log";
        }
        
        return "unknown";
    }

    /**
     * Clear the configuration cache (useful for testing or configuration updates).
     */
    public void clearCache() {
        configCache.clear();
        log.debug("Storage configuration cache cleared");
    }

    /**
     * Get all current storage configuration as a map (useful for debugging).
     * 
     * @return Map of current configuration values
     */
    public Map<String, Object> getConfigurationSnapshot() {
        Map<String, Object> snapshot = new ConcurrentHashMap<>();
        snapshot.put("defaultBucketName", getDefaultBucketName());
        snapshot.put("storageBaseUrl", getStorageBaseUrl());
        snapshot.put("publicAccessEnabled", isPublicAccessEnabled());
        snapshot.put("storageRegion", getStorageRegion());
        snapshot.put("s3StorageEnabled", isS3StorageEnabled());
        snapshot.put("signedUrlExpirationSeconds", getSignedUrlExpirationSeconds());
        return snapshot;
    }
}
