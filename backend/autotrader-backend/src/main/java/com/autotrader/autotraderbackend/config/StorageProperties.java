package com.autotrader.autotraderbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Removed @Configuration annotation to prevent duplicate bean creation
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    /**
     * Storage type (s3 or local)
     */
    private String type = "local";

    /**
     * Base location for local file storage
     */
    private String location = "upload-dir";

    /**
     * Base URL for accessing stored files
     */
    private String baseUrl = "http://localhost:8080/api/files";

    /**
     * S3 specific properties
     */
    private S3 s3 = new S3();

    /**
     * S3 configuration properties
     */
    public static class S3 {
        private String bucketName;
        private String region;
        private String accessKeyId;
        private String secretAccessKey;
        private String endpointUrl; // Optional: for S3 compatible storage
        private boolean pathStyleAccessEnabled = false; // Optional: for S3 compatible storage
        private long signedUrlExpirationSeconds = 3600; // Default to 1 hour

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public S3 getS3() {
        return s3;
    }

    public void setS3(S3 s3) {
        this.s3 = s3;
    }
}
