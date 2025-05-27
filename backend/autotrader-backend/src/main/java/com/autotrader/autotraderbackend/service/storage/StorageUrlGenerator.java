package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Advanced URL generator for storage files that supports multiple CDN providers,
 * different storage backends, and configurable URL generation strategies.
 * 
 * Supported providers:
 * - AWS S3 (production)
 * - MinIO (development/testing)
 * - Scaleway Object Storage
 * - Google Cloud Storage (future)
 * - Azure Blob Storage (future)
 */
@Slf4j
@Service
public class StorageUrlGenerator {

    private final StorageProperties storageProperties;
    private final StorageConfigurationManager configManager;
    private final S3Presigner s3Presigner;
    
    // Cache for computed base URLs
    private final Map<String, String> baseUrlCache = new ConcurrentHashMap<>();

    public StorageUrlGenerator(StorageProperties storageProperties, 
                              StorageConfigurationManager configManager,
                              S3Presigner s3Presigner) {
        this.storageProperties = storageProperties;
        this.configManager = configManager;
        this.s3Presigner = s3Presigner;
        log.info("StorageUrlGenerator initialized for provider: {}", detectStorageProvider());
    }

    /**
     * Generate the appropriate URL for a storage key based on configuration.
     * 
     * @param key The storage key
     * @param urlType The type of URL to generate (PUBLIC, SIGNED, CDN)
     * @param expirationSeconds Expiration for signed URLs (ignored for public URLs)
     * @return Generated URL
     */
    public String generateUrl(String key, UrlType urlType, long expirationSeconds) {
        String bucketName = configManager.getBucketName(configManager.getFileTypeFromKey(key));
        StorageProvider provider = detectStorageProvider();
        
        log.debug("Generating {} URL for key: {} with provider: {}", urlType, key, provider);
        
        switch (urlType) {
            case PUBLIC:
                return generatePublicUrl(bucketName, key, provider);
            case SIGNED:
                return generateSignedUrl(bucketName, key, provider, expirationSeconds);
            case CDN:
                return generateCdnUrl(bucketName, key, provider);
            default:
                throw new IllegalArgumentException("Unsupported URL type: " + urlType);
        }
    }

    /**
     * Generate a public URL for direct access to the file.
     */
    private String generatePublicUrl(String bucketName, String key, StorageProvider provider) {
        String baseUrl = getBaseUrlForProvider(provider, bucketName);
        return baseUrl + "/" + key;
    }

    /**
     * Generate a signed URL for temporary access to the file.
     */
    private String generateSignedUrl(String bucketName, String key, StorageProvider provider, long expirationSeconds) {
        if (provider == StorageProvider.MINIO && configManager.isPublicAccessEnabled()) {
            // For MinIO in development with public access, return direct URL
            log.debug("Using direct URL for MinIO with public access");
            return generatePublicUrl(bucketName, key, provider);
        }
        
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            long expiration = expirationSeconds > 0 ? expirationSeconds : configManager.getSignedUrlExpirationSeconds();
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .getObjectRequest(getObjectRequest)
                    .signatureDuration(Duration.ofSeconds(expiration))
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            String originalUrl = presignedRequest.url().toString();
            
            // Apply provider-specific URL fixes
            return applyProviderUrlFixes(originalUrl, bucketName, key, provider);
            
        } catch (Exception e) {
            log.error("Failed to generate signed URL for key: {}, falling back to public URL", key, e);
            return generatePublicUrl(bucketName, key, provider);
        }
    }

    /**
     * Generate a CDN URL if CDN is configured.
     */
    private String generateCdnUrl(String bucketName, String key, StorageProvider provider) {
        String cdnBaseUrl = getCdnBaseUrl();
        if (cdnBaseUrl != null && !cdnBaseUrl.isEmpty()) {
            return cdnBaseUrl + "/" + key;
        }
        
        // Fall back to public URL if no CDN is configured
        log.debug("No CDN configured, falling back to public URL");
        return generatePublicUrl(bucketName, key, provider);
    }

    /**
     * Get the base URL for a specific storage provider.
     */
    private String getBaseUrlForProvider(StorageProvider provider, String bucketName) {
        String cacheKey = provider.name() + ":" + bucketName;
        return baseUrlCache.computeIfAbsent(cacheKey, k -> {
            switch (provider) {
                case AWS_S3:
                    return generateAwsS3BaseUrl(bucketName);
                case MINIO:
                    return generateMinioBaseUrl(bucketName);
                case SCALEWAY:
                    return generateScalewayBaseUrl(bucketName);
                case GOOGLE_CLOUD:
                    return generateGoogleCloudBaseUrl(bucketName);
                case AZURE_BLOB:
                    return generateAzureBlobBaseUrl(bucketName);
                default:
                    return generateGenericBaseUrl(bucketName);
            }
        });
    }

    /**
     * Generate AWS S3 base URL.
     */
    private String generateAwsS3BaseUrl(String bucketName) {
        String region = configManager.getStorageRegion();
        if (storageProperties.getS3().isPathStyleAccessEnabled()) {
            return String.format("https://s3.%s.amazonaws.com/%s", region, bucketName);
        } else {
            return String.format("https://%s.s3.%s.amazonaws.com", bucketName, region);
        }
    }

    /**
     * Generate MinIO base URL.
     */
    private String generateMinioBaseUrl(String bucketName) {
        String endpointUrl = storageProperties.getS3().getEndpointUrl();
        if (endpointUrl == null) {
            endpointUrl = "http://localhost:9000";
        }
        
        // MinIO typically uses path-style access
        return endpointUrl + "/" + bucketName;
    }

    /**
     * Generate Scaleway Object Storage base URL.
     */
    private String generateScalewayBaseUrl(String bucketName) {
        String region = configManager.getStorageRegion();
        // Scaleway Object Storage format
        return String.format("https://%s.s3.%s.scw.cloud", bucketName, region);
    }

    /**
     * Generate Google Cloud Storage base URL.
     */
    private String generateGoogleCloudBaseUrl(String bucketName) {
        // Google Cloud Storage public URL format
        return String.format("https://storage.googleapis.com/%s", bucketName);
    }

    /**
     * Generate Azure Blob Storage base URL.
     */
    private String generateAzureBlobBaseUrl(String bucketName) {
        // Azure Blob Storage format (would need account name from config)
        String accountName = getAzureAccountName(); // Would come from config
        return String.format("https://%s.blob.core.windows.net/%s", accountName, bucketName);
    }

    /**
     * Generate generic base URL based on endpoint configuration.
     */
    private String generateGenericBaseUrl(String bucketName) {
        String endpointUrl = storageProperties.getS3().getEndpointUrl();
        if (endpointUrl == null) {
            endpointUrl = configManager.getStorageBaseUrl();
        }
        
        if (storageProperties.getS3().isPathStyleAccessEnabled()) {
            return endpointUrl + "/" + bucketName;
        } else {
            // Virtual-hosted-style (might not work for all providers)
            try {
                URI uri = new URI(endpointUrl);
                return uri.getScheme() + "://" + bucketName + "." + uri.getHost() + 
                       (uri.getPort() != -1 ? ":" + uri.getPort() : "");
            } catch (URISyntaxException e) {
                log.warn("Invalid endpoint URL, falling back to path-style: {}", endpointUrl);
                return endpointUrl + "/" + bucketName;
            }
        }
    }

    /**
     * Apply provider-specific URL fixes for signed URLs.
     */
    private String applyProviderUrlFixes(String originalUrl, String bucketName, String key, StorageProvider provider) {
        if (provider == StorageProvider.MINIO) {
            return applyMinioUrlFixes(originalUrl, bucketName);
        }
        
        // Other providers might need specific fixes in the future
        return originalUrl;
    }

    /**
     * Apply MinIO-specific URL fixes.
     */
    private String applyMinioUrlFixes(String originalUrl, String bucketName) {
        try {
            URI uri = new URI(originalUrl);
            String host = uri.getHost();
            String path = uri.getPath();
            
            // Check if this is a MinIO URL that needs fixing
            boolean isMinioUrl = "localhost".equals(host) || "127.0.0.1".equals(host) || 
                               host.contains("minio") || host.endsWith(".minio");
            
            if (isMinioUrl) {
                boolean needsHostFix = !("localhost".equals(host) || "127.0.0.1".equals(host));
                boolean needsPathFix = !path.startsWith("/" + bucketName + "/");
                
                if (needsHostFix || needsPathFix) {
                    log.debug("Applying MinIO URL fixes - Host fix: {}, Path fix: {}", needsHostFix, needsPathFix);
                    
                    String newHost = needsHostFix ? "localhost" : host;
                    String newPath = needsPathFix ? "/" + bucketName + path : path;
                    String query = uri.getQuery();
                    
                    return uri.getScheme() + "://" + newHost + 
                           (uri.getPort() != -1 ? ":" + uri.getPort() : "") +
                           newPath + 
                           (query != null ? "?" + query : "");
                }
            }
            
            return originalUrl;
            
        } catch (URISyntaxException e) {
            log.warn("Failed to parse URL for MinIO fixes: {}", originalUrl, e);
            return originalUrl;
        }
    }

    /**
     * Detect the storage provider based on configuration.
     */
    private StorageProvider detectStorageProvider() {
        String endpointUrl = storageProperties.getS3().getEndpointUrl();
        
        if (endpointUrl == null || endpointUrl.contains("amazonaws.com")) {
            return StorageProvider.AWS_S3;
        } else if (endpointUrl.contains("localhost") || endpointUrl.contains("minio")) {
            return StorageProvider.MINIO;
        } else if (endpointUrl.contains("scw.cloud")) {
            return StorageProvider.SCALEWAY;
        } else if (endpointUrl.contains("googleapis.com")) {
            return StorageProvider.GOOGLE_CLOUD;
        } else if (endpointUrl.contains("blob.core.windows.net")) {
            return StorageProvider.AZURE_BLOB;
        } else {
            return StorageProvider.GENERIC;
        }
    }

    /**
     * Get CDN base URL from configuration.
     */
    private String getCdnBaseUrl() {
        // This would come from additional configuration
        // For now, return null (no CDN configured)
        return null;
    }

    /**
     * Get Azure account name from configuration.
     */
    private String getAzureAccountName() {
        // This would come from additional configuration
        return "defaultaccount";
    }

    /**
     * Clear the base URL cache.
     */
    public void clearCache() {
        baseUrlCache.clear();
        log.debug("StorageUrlGenerator cache cleared");
    }

    /**
     * URL generation types.
     */
    public enum UrlType {
        PUBLIC,    // Direct public access URL
        SIGNED,    // Temporary signed URL
        CDN        // CDN URL if configured
    }

    /**
     * Supported storage providers.
     */
    public enum StorageProvider {
        AWS_S3,
        MINIO,
        SCALEWAY,
        GOOGLE_CLOUD,
        AZURE_BLOB,
        GENERIC
    }
}
