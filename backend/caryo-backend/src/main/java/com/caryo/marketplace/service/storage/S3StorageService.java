package com.caryo.marketplace.service.storage;

import com.caryo.marketplace.exception.StorageException;
import com.caryo.marketplace.exception.StorageFileNotFoundException;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * S3-based implementation of {@link StorageService}.
 * Handles file storage operations using Amazon S3 or S3-compatible services (MinIO).
 *
 * <p>Key features:
 * <ul>
 *   <li>Server-side copy/move operations (no data download to server)</li>
 *   <li>Paginated listing for large buckets</li>
 *   <li>Signed URL generation for temporary access</li>
 *   <li>CDN and public URL support</li>
 *   <li>Automatic bucket routing based on file type</li>
 * </ul>
 *
 * <p>This service requires:
 * <ul>
 *   <li>{@link S3Client} - AWS SDK S3 client</li>
 *   <li>{@link StorageConfigurationManager} - Bucket and configuration management</li>
 *   <li>{@link StorageUrlGenerator} - URL generation for different access patterns</li>
 * </ul>
 *
 * @see StorageService
 * @see StorageKeyGenerator
 * @see NoOpStorageService for test environments
 */
@Slf4j
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final StorageConfigurationManager configManager;
    private final StorageUrlGenerator urlGenerator;

    /**
     * Initializes the S3 storage service and verifies bucket accessibility.
     *
     * <p>Called automatically after bean construction. Validates that the S3 client,
     * configuration manager, and URL generator are properly injected, then verifies
     * the default bucket exists and is accessible.
     *
     * @throws StorageException if bucket name is not configured or bucket doesn't exist
     */
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
        } catch (Exception e) {
            // Handle connection failures gracefully (e.g., MinIO not running in CI/testing)
            log.warn("Could not connect to S3 service at initialization. This may be expected in testing environments. Error: {}", e.getMessage());
            log.info("S3StorageService will continue to operate but file operations may fail until S3 connection is available");
            // Don't throw exception - allow application to start
        }
    }

    /**
     * Stores a file in S3 with the specified key.
     *
     * @param file The file to store (must not be null or empty)
     * @param key The storage key/path (e.g., "temp/uuid.jpg" or "dealers/logos/file.png")
     * @return The storage key on success
     * @throws StorageException if file is null/empty, key is invalid, or S3 operation fails
     */
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

    /**
     * Loads a file from S3 as a Spring Resource.
     *
     * @param key The storage key of the file to load
     * @return A Resource wrapping the S3 input stream
     * @throws StorageException if key is invalid or S3 operation fails
     * @throws StorageFileNotFoundException if the file doesn't exist
     */
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

    /**
     * Deletes a file from S3.
     *
     * @param key The storage key of the file to delete
     * @return true if deletion succeeded, false if key is invalid or deletion failed
     */
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

    /**
     * Deletes all objects from the default bucket.
     *
     * <p><strong>Warning:</strong> This is a destructive operation that removes all files.
     * Use with caution, typically only in test cleanup scenarios.
     *
     * @throws StorageException if the deletion operation fails
     */
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

    /**
     * Not implemented for S3 storage.
     *
     * <p>S3 doesn't support filesystem-style path listing. Use {@link #listByPrefix(String)}
     * to list objects with a common prefix.
     *
     * @return An empty stream (always)
     */
    @Override
    public Stream<Path> loadAll() {
        log.warn("loadAll is not implemented for S3. Returning empty stream.");
        return Stream.empty();
    }

    /**
     * Not supported for S3 storage.
     *
     * <p>S3 objects are not accessible via filesystem paths. Use {@link #loadAsResource(String)}
     * to load file content, or {@link #getSignedUrl(String, long)} for direct URL access.
     *
     * @param key The storage key (ignored)
     * @return Never returns
     * @throws UnsupportedOperationException always
     */
    @Override
    public Path load(String key) {
        throw new UnsupportedOperationException("Loading as Path is not supported in S3.");
    }

    /**
     * Generates a URL for accessing a file.
     *
     * <p>Returns either a signed URL (with expiration) or a public URL depending on
     * the storage configuration. Signed URLs provide temporary access without
     * requiring authentication.
     *
     * @param key The storage key of the file
     * @param expirationSeconds URL validity period in seconds (ignored for public URLs)
     * @return The generated URL (signed or public)
     * @throws StorageException if key is invalid, expiration is negative, or URL generation fails
     */
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

    /**
     * Copies a file from one storage key to another using server-side S3 copy.
     *
     * <p>This operation is performed entirely on the S3 server side, meaning the file
     * content is never downloaded to the application server. This makes it efficient
     * for large files.
     *
     * @param sourceKey The source storage key (e.g., "temp/uuid.jpg")
     * @param destinationKey The destination storage key (e.g., "dealers/logos/uuid.jpg")
     * @return The destination key on success
     * @throws StorageException if either key is invalid or the S3 copy operation fails
     * @throws StorageFileNotFoundException if the source file doesn't exist
     */
    @Override
    public String copy(String sourceKey, String destinationKey) {
        if (!StringUtils.hasText(sourceKey)) {
            throw new StorageException("Source key cannot be null or empty");
        }
        if (!StringUtils.hasText(destinationKey)) {
            throw new StorageException("Destination key cannot be null or empty");
        }

        try {
            final String bucketName = configManager.getDefaultBucketName();
            log.debug("Copying file from '{}' to '{}' in bucket '{}'", sourceKey, destinationKey, bucketName);

            CopyObjectRequest copyRequest = CopyObjectRequest.builder()
                    .sourceBucket(bucketName)
                    .sourceKey(sourceKey)
                    .destinationBucket(bucketName)
                    .destinationKey(destinationKey)
                    .build();

            s3Client.copyObject(copyRequest);
            log.info("Successfully copied file from '{}' to '{}'", sourceKey, destinationKey);
            return destinationKey;

        } catch (NoSuchKeyException e) {
            throw new StorageFileNotFoundException("Source file not found: " + sourceKey, e);
        } catch (S3Exception e) {
            throw new StorageException("Failed to copy file from " + sourceKey + " to " + destinationKey, e);
        }
    }

    /**
     * Moves a file from one storage key to another.
     *
     * <p>Implemented as a server-side copy followed by delete. If the delete fails,
     * the method logs a warning but still returns successfully (the file exists at
     * the destination). The orphaned source file will be cleaned up by the scheduled
     * temp cleanup job.
     *
     * @param sourceKey The source storage key (e.g., "temp/uuid.jpg")
     * @param destinationKey The destination storage key (e.g., "dealers/logos/uuid.jpg")
     * @return The destination key on success
     * @throws StorageException if copy fails
     * @throws StorageFileNotFoundException if source file doesn't exist
     */
    @Override
    public String move(String sourceKey, String destinationKey) {
        copy(sourceKey, destinationKey);

        try {
            delete(sourceKey);
            log.info("Successfully moved file from '{}' to '{}'", sourceKey, destinationKey);
        } catch (Exception e) {
            log.warn("File copied to '{}' but failed to delete source '{}'. "
                    + "Source will be cleaned up by the temp cleanup job.", destinationKey, sourceKey, e);
        }

        return destinationKey;
    }

    /**
     * Lists all objects in S3 with the specified prefix.
     *
     * <p>Uses paginated listing to handle large result sets. Returns metadata about
     * each object including the key, last modified timestamp, and size in bytes.
     *
     * <p>Example usage:
     * <pre>{@code
     * List<StorageObjectInfo> tempFiles = storageService.listByPrefix("temp/");
     * for (StorageObjectInfo file : tempFiles) {
     *     if (file.lastModified().isBefore(cutoffTime)) {
     *         storageService.delete(file.key());
     *     }
     * }
     * }</pre>
     *
     * @param prefix The key prefix to filter by (e.g., "temp/" or "dealers/logos/")
     * @return List of StorageObjectInfo containing key, lastModified, and size for each object
     * @throws StorageException if prefix is invalid or S3 operation fails
     */
    @Override
    public List<StorageObjectInfo> listByPrefix(String prefix) {
        if (!StringUtils.hasText(prefix)) {
            throw new StorageException("Prefix cannot be null or empty");
        }

        List<StorageObjectInfo> results = new ArrayList<>();
        final String bucketName = configManager.getDefaultBucketName();

        try {
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();

            ListObjectsV2Response listResponse;
            do {
                listResponse = s3Client.listObjectsV2(listRequest);

                if (listResponse.contents() != null) {
                    listResponse.contents().stream()
                            .filter(Objects::nonNull)
                            .map(obj -> new StorageObjectInfo(obj.key(), obj.lastModified(), obj.size()))
                            .forEach(results::add);
                }

                listRequest = listRequest.toBuilder()
                        .continuationToken(listResponse.nextContinuationToken())
                        .build();

            } while (Boolean.TRUE.equals(listResponse.isTruncated()));

            log.debug("Listed {} objects with prefix '{}'", results.size(), prefix);
            return results;

        } catch (S3Exception e) {
            throw new StorageException("Failed to list objects with prefix: " + prefix, e);
        }
    }
}
