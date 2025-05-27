package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final StorageConfigurationManager configManager;
    private final StorageUrlGenerator urlGenerator;

    @Override
    @PostConstruct
    public void init() {
        Objects.requireNonNull(s3Client, "S3Client cannot be null");
        Objects.requireNonNull(configManager, "StorageConfigurationManager cannot be null");
        Objects.requireNonNull(urlGenerator, "StorageUrlGenerator cannot be null");
        
        final String bucketName = configManager.getDefaultBucketName();
        if (!StringUtils.hasText(bucketName)) {
            throw new StorageException("Default bucket name cannot be null or empty");
        }
        
        log.info("Initializing S3StorageService with configuration manager and URL generator. Default bucket: {}, Base URL: {}",
                bucketName, configManager.getStorageBaseUrl());
        
        try {
            // Verifying if the S3 bucket exists and is accessible
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("S3 bucket '{}' exists and is accessible.", bucketName);
        } catch (NoSuchBucketException e) {
            log.error("S3 bucket '{}' does not exist! Please create it.", bucketName);
            throw new StorageException("S3 bucket not found: " + bucketName, e);
        } catch (S3Exception e) {
            log.error("Error accessing S3 bucket '{}': {}", bucketName, 
                    Optional.ofNullable(e.awsErrorDetails())
                            .map(AwsErrorDetails::errorMessage)
                            .orElse("Unknown error"), e);
            throw new StorageException("Could not verify S3 bucket access", e);
        }
    }

    @Override
    public String store(MultipartFile file, String key) {
        Objects.requireNonNull(file, "File cannot be null");
        if (!StringUtils.hasText(key)) {
            throw new StorageException("Storage key cannot be null or empty");
        }
        if (file.isEmpty()) {
            throw new StorageException("Cannot store empty file");
        }

        try {
            final String bucketName = configManager.getBucketName(configManager.getFileTypeFromKey(key));
            log.debug("Storing file with key '{}' to bucket '{}'", key, bucketName);
            
            final PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(Optional.ofNullable(file.getContentType())
                            .filter(StringUtils::hasText)
                            .orElse("application/octet-stream"))
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Successfully stored file with key: {} in bucket: {}", key, bucketName);
            return key;

        } catch (IOException | S3Exception e) {
            throw new StorageException("Failed to store file: " + key, e);
        }
    }

    @Override
    public Resource loadAsResource(String key) {
        if (!StringUtils.hasText(key)) {
            throw new StorageException("Storage key cannot be null or empty");
        }
        
        try {
            final String bucketName = configManager.getBucketName(configManager.getFileTypeFromKey(key));
            log.debug("Loading file with key '{}' from bucket '{}'", key, bucketName);
            
            final GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            final ResponseInputStream<GetObjectResponse> object = s3Client.getObject(request);
            return new InputStreamResource(object) {
                @Override
                public String getFilename() {
                    return key;
                }

                @Override
                public long contentLength() throws IOException {
                    return Objects.requireNonNullElse(object.response().contentLength(), -1L);
                }
            };

        } catch (NoSuchKeyException e) {
            throw new StorageFileNotFoundException("File not found: " + key, e);
        } catch (S3Exception e) {
            throw new StorageException("Could not read file: " + key, e);
        }
    }

    @Override
    public boolean delete(String key) {
        if (!StringUtils.hasText(key)) {
            log.warn("Cannot delete file with null or empty key");
            return false;
        }
        
        try {
            final String bucketName = configManager.getBucketName(configManager.getFileTypeFromKey(key));
            log.debug("Deleting file with key '{}' from bucket '{}'", key, bucketName);
            
            final DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
            log.info("Successfully deleted file with key: {} from bucket: {}", key, bucketName);
            return true;

        } catch (S3Exception e) {
            log.error("Failed to delete file: {}", key, e);
            return false;
        }
    }

    @Override
    public void deleteAll() {
        try {
            final String bucketName = configManager.getDefaultBucketName();
            log.warn("Deleting all objects from bucket: {}", bucketName);
            
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .build();
            
            ListObjectsV2Response listResponse;

            do {
                listResponse = s3Client.listObjectsV2(listRequest);

                if (Objects.nonNull(listResponse.contents()) && !listResponse.contents().isEmpty()) {
                    final List<ObjectIdentifier> toDelete = listResponse.contents().stream()
                            .filter(Objects::nonNull)
                            .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                            .collect(Collectors.toList());

                    if (!toDelete.isEmpty()) {
                        final DeleteObjectsRequest deleteRequest = DeleteObjectsRequest.builder()
                                .bucket(bucketName)
                                .delete(Delete.builder().objects(toDelete).build())
                                .build();

                        s3Client.deleteObjects(deleteRequest);
                        log.debug("Deleted {} objects from bucket: {}", toDelete.size(), bucketName);
                    }
                }

                listRequest = listRequest.toBuilder()
                        .continuationToken(listResponse.nextContinuationToken())
                        .build();

            } while (Boolean.TRUE.equals(listResponse.isTruncated()));

            log.info("Successfully deleted all objects from bucket: {}", bucketName);

        } catch (S3Exception e) {
            throw new StorageException("Could not delete all files from bucket", e);
        }
    }

    @Override
    public Stream<Path> loadAll() {
        log.warn("loadAll is not implemented for S3. Returning empty stream.");
        return Stream.empty();
    }

    @Override
    public Path load(String key) {
        throw new UnsupportedOperationException("Loading as Path is not supported in S3.");
    }

    @Override
    public String getSignedUrl(String key, long expirationSeconds) {
        if (!StringUtils.hasText(key)) {
            throw new StorageException("Storage key cannot be null or empty");
        }
        if (expirationSeconds < 0) {
            throw new StorageException("Expiration seconds cannot be negative");
        }
        
        log.debug("Generating URL for key: {} with expiration: {}", key, expirationSeconds);
        
        try {
            // Use the sophisticated URL generator that handles multiple providers
            final StorageUrlGenerator.UrlType urlType = configManager.isPublicAccessEnabled() 
                    ? StorageUrlGenerator.UrlType.PUBLIC 
                    : StorageUrlGenerator.UrlType.SIGNED;
            
            final String url = urlGenerator.generateUrl(key, urlType, expirationSeconds);
            log.info("Generated {} URL: {}", urlType.name().toLowerCase(), url);
            return url;
            
        } catch (Exception e) {
            throw new StorageException("Failed to generate URL for key: " + key, e);
        }
    }

    /**
     * Generate a CDN URL for the file if CDN is configured.
     * 
     * @param key The storage key (must not be null or empty)
     * @return CDN URL or fallback to public URL
     * @throws StorageException if key is invalid or URL generation fails
     */
    public String getCdnUrl(String key) {
        if (!StringUtils.hasText(key)) {
            throw new StorageException("Storage key cannot be null or empty");
        }
        
        try {
            final String url = urlGenerator.generateUrl(key, StorageUrlGenerator.UrlType.CDN, 0);
            log.debug("Generated CDN URL for key: {} -> {}", key, url);
            return url;
        } catch (Exception e) {
            throw new StorageException("Failed to generate CDN URL for key: " + key, e);
        }
    }

    /**
     * Generate a public URL for direct access (no expiration).
     * 
     * @param key The storage key (must not be null or empty)
     * @return Public URL
     * @throws StorageException if key is invalid or URL generation fails
     */
    public String getPublicUrl(String key) {
        if (!StringUtils.hasText(key)) {
            throw new StorageException("Storage key cannot be null or empty");
        }
        
        try {
            final String url = urlGenerator.generateUrl(key, StorageUrlGenerator.UrlType.PUBLIC, 0);
            log.debug("Generated public URL for key: {} -> {}", key, url);
            return url;
        } catch (Exception e) {
            throw new StorageException("Failed to generate public URL for key: " + key, e);
        }
    }
}
