package com.autotrader.autotraderbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Comprehensive storage configuration properties that support multiple storage backends.
 * Designed to be environment-agnostic and easily configurable between development (MinIO)
 * and production (AWS S3) environments.
 */
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    /**
     * S3-compatible storage properties (supports both AWS S3 and MinIO)
     */
    private S3 s3 = new S3();

    /**
     * Key generation patterns for different file types
     */
    private KeyPatterns keyPatterns = new KeyPatterns();

    /**
     * General storage configuration
     */
    private General general = new General();

    /**
     * General storage configuration
     */
    public static class General {
        private String defaultBucketName = "app-assets";
        private String baseUrl;
        private boolean publicAccessEnabled = false;
        private String defaultRegion = "us-east-1";

        // Getters and Setters
        public String getDefaultBucketName() { return defaultBucketName; }
        public void setDefaultBucketName(String defaultBucketName) { this.defaultBucketName = defaultBucketName; }
        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
        public boolean isPublicAccessEnabled() { return publicAccessEnabled; }
        public void setPublicAccessEnabled(boolean publicAccessEnabled) { this.publicAccessEnabled = publicAccessEnabled; }
        public String getDefaultRegion() { return defaultRegion; }
        public void setDefaultRegion(String defaultRegion) { this.defaultRegion = defaultRegion; }
    }

    /**
     * Key generation patterns configuration
     */
    public static class KeyPatterns {
        private String listingMedia = "listings/{listingId}/{timestamp}_{filename}";
        private String userAvatar = "users/{userId}/avatar_{timestamp}_{filename}";
        private String tempUploads = "temp/{uuid}_{filename}";
        private String sampleData = "samples/{category}/{filename}";
        private String documents = "documents/{category}/{timestamp}_{filename}";
        private String thumbnails = "thumbnails/{originalPath}/{filename}";
        private String backups = "backups/{date}/{category}/{filename}";
        private String logs = "logs/{date}/{level}/{filename}";

        // Getters and Setters
        public String getListingMedia() { return listingMedia; }
        public void setListingMedia(String listingMedia) { this.listingMedia = listingMedia; }
        public String getUserAvatar() { return userAvatar; }
        public void setUserAvatar(String userAvatar) { this.userAvatar = userAvatar; }
        public String getTempUploads() { return tempUploads; }
        public void setTempUploads(String tempUploads) { this.tempUploads = tempUploads; }
        public String getSampleData() { return sampleData; }
        public void setSampleData(String sampleData) { this.sampleData = sampleData; }
        public String getDocuments() { return documents; }
        public void setDocuments(String documents) { this.documents = documents; }
        public String getThumbnails() { return thumbnails; }
        public void setThumbnails(String thumbnails) { this.thumbnails = thumbnails; }
        public String getBackups() { return backups; }
        public void setBackups(String backups) { this.backups = backups; }
        public String getLogs() { return logs; }
        public void setLogs(String logs) { this.logs = logs; }
    }

    /**
     * S3 configuration properties
     */
    public static class S3 {
        private boolean enabled = true; // Added enabled field with default true
        private String bucketName;
        private String region;
        private String accessKeyId;
        private String secretAccessKey;
        private String endpointUrl; // Optional: for S3 compatible storage
        private boolean pathStyleAccessEnabled = false; // Optional: for S3 compatible storage
        private long signedUrlExpirationSeconds = 3600; // Default to 1 hour

        // Getter and Setter for enabled
        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        // Explicit Getters
        public String getBucketName() {
            return bucketName;
        }

        public String getRegion() {
            return region;
        }

        public String getAccessKeyId() {
            return accessKeyId;
        }

        public String getSecretAccessKey() {
            return secretAccessKey;
        }

        public String getEndpointUrl() {
            return endpointUrl;
        }

        public boolean isPathStyleAccessEnabled() {
            return pathStyleAccessEnabled;
        }

        public long getSignedUrlExpirationSeconds() {
            return signedUrlExpirationSeconds;
        }

        // Explicit Setters
        public void setBucketName(String bucketName) {
            this.bucketName = bucketName;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public void setAccessKeyId(String accessKeyId) {
            this.accessKeyId = accessKeyId;
        }

        public void setSecretAccessKey(String secretAccessKey) {
            this.secretAccessKey = secretAccessKey;
        }

        public void setEndpointUrl(String endpointUrl) {
            this.endpointUrl = endpointUrl;
        }

        public void setPathStyleAccessEnabled(boolean pathStyleAccessEnabled) {
            this.pathStyleAccessEnabled = pathStyleAccessEnabled;
        }

        public void setSignedUrlExpirationSeconds(long signedUrlExpirationSeconds) {
            this.signedUrlExpirationSeconds = signedUrlExpirationSeconds;
        }
    }

    // Main class getters and setters
    public S3 getS3() {
        return s3;
    }

    public void setS3(S3 s3) {
        this.s3 = s3;
    }

    public KeyPatterns getKeyPatterns() {
        return keyPatterns;
    }

    public void setKeyPatterns(KeyPatterns keyPatterns) {
        this.keyPatterns = keyPatterns;
    }

    public General getGeneral() {
        return general;
    }

    public void setGeneral(General general) {
        this.general = general;
    }
}
