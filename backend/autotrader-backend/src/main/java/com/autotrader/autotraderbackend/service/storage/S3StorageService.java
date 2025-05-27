package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner; // Keep for future use with presigned URLs
    private final String bucketName;
    private final long defaultExpirationSeconds;

    // Constructor: Dependency Injection for S3Client and S3Presigner
    public S3StorageService(StorageProperties properties, S3Client s3Client, S3Presigner s3Presigner) {
        this.bucketName = properties.getS3().getBucketName();
        this.defaultExpirationSeconds = properties.getS3().getSignedUrlExpirationSeconds();
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner; // Keep for future use

        log.info("Configured S3StorageService. Bucket: {}, Expiration: {}s",
                bucketName, defaultExpirationSeconds);
    }

    @Override
    @PostConstruct
    public void init() {
        try {
            // Verifying if the S3 bucket exists and is accessible
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("S3 bucket '{}' exists and is accessible.", bucketName);
        } catch (NoSuchBucketException e) {
            log.error("S3 bucket '{}' does not exist! Please create it.", bucketName);
            throw new StorageException("S3 bucket not found: " + bucketName, e);
        } catch (S3Exception e) {
            log.error("Error accessing S3 bucket '{}': {}", bucketName, e.awsErrorDetails().errorMessage(), e);
            throw new StorageException("Could not verify S3 bucket access", e);
        }
    }

    @Override
    public String store(MultipartFile file, String key) {
        if (file.isEmpty()) {
            throw new StorageException("Cannot store empty file.");
        }

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return key;

        } catch (IOException | S3Exception e) {
            throw new StorageException("Failed to store file: " + key, e);
        }
    }

    @Override
    public Resource loadAsResource(String key) {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> object = s3Client.getObject(request);
            return new InputStreamResource(object) {
                @Override
                public String getFilename() {
                    return key;
                }

                @Override
                public long contentLength() throws IOException {
                    return object.response().contentLength();
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
        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
            return true;

        } catch (S3Exception e) {
            log.error("Failed to delete file: {}", key, e);
            return false;
        }
    }

    @Override
    public void deleteAll() {
        try {
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder().bucket(bucketName).build();
            ListObjectsV2Response listResponse;

            do {
                listResponse = s3Client.listObjectsV2(listRequest);

                if (!listResponse.contents().isEmpty()) {
                    List<ObjectIdentifier> toDelete = listResponse.contents().stream()
                            .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                            .collect(Collectors.toList());

                    DeleteObjectsRequest deleteRequest = DeleteObjectsRequest.builder()
                            .bucket(bucketName)
                            .delete(Delete.builder().objects(toDelete).build())
                            .build();

                    s3Client.deleteObjects(deleteRequest);
                }

                listRequest = listRequest.toBuilder()
                        .continuationToken(listResponse.nextContinuationToken())
                        .build();

            } while (Boolean.TRUE.equals(listResponse.isTruncated()));

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
        try {
            // For development with public bucket access, return direct URL to avoid signature issues
            // when transforming Docker internal hostnames to localhost
            String directUrl = "http://localhost:9000/" + bucketName + "/" + key;
            log.info("S3StorageService: Returning direct URL for development: {}", directUrl);
            return directUrl;
            
            /* 
            // Original presigned URL implementation - commented out for development
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .getObjectRequest(getObjectRequest)
                    .signatureDuration(Duration.ofSeconds(expirationSeconds > 0 ? expirationSeconds : defaultExpirationSeconds))
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            URL generatedUrl = presignedRequest.url();
            String originalUrlString = generatedUrl.toString();
            
            log.info("S3StorageService: Original presigned URL: {}", originalUrlString);
            log.info("S3StorageService: Host: {}, Path: {}, Port: {}", 
                    generatedUrl.getHost(), generatedUrl.getPath(), generatedUrl.getPort());

            // Apply workaround for MinIO URLs to fix both hostname and bucket path
            String host = generatedUrl.getHost();
            String path = generatedUrl.getPath();
            
            // Check if this is a MinIO URL (localhost, 127.0.0.1, or Docker internal hostname)
            boolean isMinioUrl = "localhost".equals(host) || "127.0.0.1".equals(host) || 
                               host.contains("minio") || host.endsWith(".minio");
            
            if (isMinioUrl) {
                boolean needsHostFix = !("localhost".equals(host) || "127.0.0.1".equals(host));
                boolean needsPathFix = !path.startsWith("/" + bucketName + "/");
                
                if (needsHostFix || needsPathFix) {
                    log.warn("S3StorageService: Fixing MinIO URL - Host fix needed: {}, Path fix needed: {}", 
                            needsHostFix, needsPathFix);
                    
                    // Fix hostname to localhost for external access
                    String newHost = needsHostFix ? "localhost" : host;
                    
                    // Fix path to include bucket name
                    String newPath = needsPathFix ? "/" + bucketName + path : path;
                    
                    String query = generatedUrl.getQuery();
                    
                    String fixedUrlString = generatedUrl.getProtocol() + "://" + newHost + 
                                (generatedUrl.getPort() != -1 ? ":" + generatedUrl.getPort() : "") +
                                newPath + 
                                (query != null ? "?" + query : "");
                    
                    log.info("S3StorageService: Fixed presigned URL: {}", fixedUrlString);
                    return fixedUrlString;
                } else {
                    log.info("S3StorageService: MinIO URL is already correct, no fix needed");
                }
            }

            return originalUrlString;
            */

        } catch (Exception e) {
            throw new StorageException("Failed to generate URL for: " + key, e);
        }
    }
}
