package com.autotrader.autotraderbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Removed @Configuration annotation to prevent duplicate bean creation
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    /**
     * S3 specific properties
     */
    private S3 s3 = new S3();

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

    // Getter and Setter for s3
    public S3 getS3() {
        return s3;
    }

    public void setS3(S3 s3) {
        this.s3 = s3;
    }
}
