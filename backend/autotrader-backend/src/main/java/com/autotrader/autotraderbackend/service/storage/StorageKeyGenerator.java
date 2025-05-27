package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Service for generating consistent and configurable storage keys.
 * Handles the naming conventions and structure for file storage keys.
 * All patterns are configurable through application properties.
 */
@Slf4j
@Service
public class StorageKeyGenerator {

    private final StorageProperties storageProperties;
    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Constructor with dependency injection of storage properties.
     */
    public StorageKeyGenerator(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
        log.info("StorageKeyGenerator initialized with configurable patterns");
    }

    /**
     * Generate a storage key for listing media files.
     *
     * @param listingId      The listing ID
     * @param originalFilename The original filename
     * @return Generated storage key
     */
    public String generateListingMediaKey(Long listingId, String originalFilename) {
        String safeFilename = sanitizeFilename(originalFilename);
        String timestamp = getCurrentTimestamp();
        String pattern = storageProperties.getKeyPatterns().getListingMedia();
        
        String key = pattern
                .replace("{listingId}", String.valueOf(listingId))
                .replace("{timestamp}", timestamp)
                .replace("{filename}", safeFilename);
        
        log.debug("Generated listing media key: {} for listingId: {}, filename: {}", key, listingId, originalFilename);
        return key;
    }

    /**
     * Generate a storage key for user avatar files.
     *
     * @param userId         The user ID
     * @param originalFilename The original filename
     * @return Generated storage key
     */
    public String generateUserAvatarKey(Long userId, String originalFilename) {
        String safeFilename = sanitizeFilename(originalFilename);
        String timestamp = getCurrentTimestamp();
        String pattern = storageProperties.getKeyPatterns().getUserAvatar();
        
        String key = pattern
                .replace("{userId}", String.valueOf(userId))
                .replace("{timestamp}", timestamp)
                .replace("{filename}", safeFilename);
        
        log.debug("Generated user avatar key: {} for userId: {}, filename: {}", key, userId, originalFilename);
        return key;
    }

    /**
     * Generate a storage key for temporary uploads.
     *
     * @param originalFilename The original filename
     * @return Generated storage key
     */
    public String generateTempUploadKey(String originalFilename) {
        String safeFilename = sanitizeFilename(originalFilename);
        String uuid = UUID.randomUUID().toString();
        String pattern = storageProperties.getKeyPatterns().getTempUploads();
        
        String key = pattern
                .replace("{uuid}", uuid)
                .replace("{filename}", safeFilename);
        
        log.debug("Generated temp upload key: {} for filename: {}", key, originalFilename);
        return key;
    }

    /**
     * Generate a storage key for sample data files.
     *
     * @param category   The category (e.g., "cars", "users")
     * @param filename   The filename
     * @return Generated storage key
     */
    public String generateSampleDataKey(String category, String filename) {
        String safeFilename = sanitizeFilename(filename);
        String safeCategory = sanitizeFilename(category);
        String pattern = storageProperties.getKeyPatterns().getSampleData();
        
        String key = pattern
                .replace("{category}", safeCategory)
                .replace("{filename}", safeFilename);
        
        log.debug("Generated sample data key: {} for category: {}, filename: {}", key, category, filename);
        return key;
    }

    /**
     * Generate a storage key for document files.
     *
     * @param category   The document category
     * @param filename   The filename
     * @return Generated storage key
     */
    public String generateDocumentKey(String category, String filename) {
        String safeFilename = sanitizeFilename(filename);
        String safeCategory = sanitizeFilename(category);
        String timestamp = getCurrentTimestamp();
        String pattern = storageProperties.getKeyPatterns().getDocuments();
        
        String key = pattern
                .replace("{category}", safeCategory)
                .replace("{timestamp}", timestamp)
                .replace("{filename}", safeFilename);
        
        log.debug("Generated document key: {} for category: {}, filename: {}", key, category, filename);
        return key;
    }

    /**
     * Generate a storage key for thumbnail files.
     *
     * @param originalPath The path of the original file
     * @param filename     The thumbnail filename
     * @return Generated storage key
     */
    public String generateThumbnailKey(String originalPath, String filename) {
        String safeFilename = sanitizeFilename(filename);
        String safeOriginalPath = sanitizeFilename(originalPath);
        String pattern = storageProperties.getKeyPatterns().getThumbnails();
        
        String key = pattern
                .replace("{originalPath}", safeOriginalPath)
                .replace("{filename}", safeFilename);
        
        log.debug("Generated thumbnail key: {} for originalPath: {}, filename: {}", key, originalPath, filename);
        return key;
    }

    /**
     * Generate a storage key for backup files.
     *
     * @param category The backup category
     * @param filename The filename
     * @return Generated storage key
     */
    public String generateBackupKey(String category, String filename) {
        String safeFilename = sanitizeFilename(filename);
        String safeCategory = sanitizeFilename(category);
        String date = getCurrentDate();
        String pattern = storageProperties.getKeyPatterns().getBackups();
        
        String key = pattern
                .replace("{date}", date)
                .replace("{category}", safeCategory)
                .replace("{filename}", safeFilename);
        
        log.debug("Generated backup key: {} for category: {}, filename: {}", key, category, filename);
        return key;
    }

    /**
     * Generate a storage key for log files.
     *
     * @param level    The log level
     * @param filename The filename
     * @return Generated storage key
     */
    public String generateLogKey(String level, String filename) {
        String safeFilename = sanitizeFilename(filename);
        String safeLevel = sanitizeFilename(level);
        String date = getCurrentDate();
        String pattern = storageProperties.getKeyPatterns().getLogs();
        
        String key = pattern
                .replace("{date}", date)
                .replace("{level}", safeLevel)
                .replace("{filename}", safeFilename);
        
        log.debug("Generated log key: {} for level: {}, filename: {}", key, level, filename);
        return key;
    }

    /**
     * Generate a custom storage key with a given pattern.
     *
     * @param pattern      The pattern with placeholders
     * @param replacements Key-value pairs for placeholder replacement
     * @return Generated storage key
     */
    public String generateCustomKey(String pattern, String... replacements) {
        if (replacements.length % 2 != 0) {
            throw new IllegalArgumentException("Replacements must be provided in key-value pairs");
        }
        
        String key = pattern;
        for (int i = 0; i < replacements.length; i += 2) {
            String placeholder = "{" + replacements[i] + "}";
            String value = sanitizeFilename(replacements[i + 1]);
            key = key.replace(placeholder, value);
        }
        
        log.debug("Generated custom key: {} from pattern: {}", key, pattern);
        return key;
    }

    /**
     * Extract the directory path from a storage key.
     *
     * @param storageKey The storage key
     * @return Directory path (without the filename)
     */
    public String getDirectoryPath(String storageKey) {
        if (storageKey == null || !storageKey.contains("/")) {
            return "";
        }
        return storageKey.substring(0, storageKey.lastIndexOf("/"));
    }

    /**
     * Extract the filename from a storage key.
     *
     * @param storageKey The storage key
     * @return Filename
     */
    public String getFilename(String storageKey) {
        if (storageKey == null || !storageKey.contains("/")) {
            return storageKey;
        }
        return storageKey.substring(storageKey.lastIndexOf("/") + 1);
    }

    /**
     * Check if a storage key matches a specific pattern.
     *
     * @param storageKey The storage key to check
     * @param prefix     The prefix to match against
     * @return true if the key starts with the prefix
     */
    public boolean isKeyOfType(String storageKey, String prefix) {
        return storageKey != null && storageKey.startsWith(prefix);
    }

    /**
     * Sanitize filename to prevent path traversal and invalid characters.
     *
     * @param filename The original filename
     * @return Sanitized filename
     */
    private String sanitizeFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return "file";
        }
        
        // Remove path traversal attempts and invalid characters
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_")
                      .replaceAll("_{2,}", "_") // Replace multiple underscores with single
                      .replaceAll("^_+|_+$", ""); // Remove leading/trailing underscores
    }

    /**
     * Get current timestamp in a consistent format.
     *
     * @return Formatted timestamp string
     */
    private String getCurrentTimestamp() {
        return LocalDateTime.now().format(TIMESTAMP_FORMAT);
    }

    /**
     * Get current date in a consistent format.
     *
     * @return Formatted date string
     */
    private String getCurrentDate() {
        return LocalDateTime.now().format(DATE_FORMAT);
    }

    /**
     * Get the default bucket name from configuration.
     *
     * @return Default bucket name
     */
    public String getDefaultBucketName() {
        return storageProperties.getGeneral().getDefaultBucketName();
    }

    /**
     * Get the configured bucket name for S3 storage.
     *
     * @return S3 bucket name
     */
    public String getS3BucketName() {
        return storageProperties.getS3().getBucketName();
    }

    /**
     * Check if a storage key is for listing media.
     *
     * @param storageKey The storage key to check
     * @return true if the key is for listing media
     */
    public boolean isListingMediaKey(String storageKey) {
        String pattern = storageProperties.getKeyPatterns().getListingMedia();
        String prefix = pattern.substring(0, pattern.indexOf("/{"));
        return isKeyOfType(storageKey, prefix);
    }

    /**
     * Check if a storage key is for user avatars.
     *
     * @param storageKey The storage key to check
     * @return true if the key is for user avatars
     */
    public boolean isUserAvatarKey(String storageKey) {
        String pattern = storageProperties.getKeyPatterns().getUserAvatar();
        String prefix = pattern.substring(0, pattern.indexOf("/{"));
        return isKeyOfType(storageKey, prefix);
    }

    /**
     * Check if a storage key is for temporary uploads.
     *
     * @param storageKey The storage key to check
     * @return true if the key is for temporary uploads
     */
    public boolean isTempUploadKey(String storageKey) {
        String pattern = storageProperties.getKeyPatterns().getTempUploads();
        String prefix = pattern.substring(0, pattern.indexOf("/{"));
        return isKeyOfType(storageKey, prefix);
    }
}
