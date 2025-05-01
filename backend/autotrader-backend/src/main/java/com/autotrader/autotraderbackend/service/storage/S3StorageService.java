package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;


/**
 * Implementation of StorageService that uses Amazon S3 for storage.
 */
@Service
@Slf4j
public class S3StorageService implements StorageService, AutoCloseable {

    private S3Client s3Client;
    private final String bucketName;
    private final String region;
    private final long defaultExpirationSeconds;
    private final StorageProperties properties;

    public S3StorageService(StorageProperties properties) {
        this.properties = properties;
        this.bucketName = properties.getS3().getBucketName();
        this.region = properties.getS3().getRegion();
        this.defaultExpirationSeconds = properties.getS3().getSignedUrlExpirationSeconds(); 
        log.info("Configuring S3StorageService. Bucket: {}, Region: {}, Default URL Expiration: {}s",
                 bucketName, region, defaultExpirationSeconds);
        initializeS3Client();
    }

    private void initializeS3Client() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                properties.getS3().getAccessKeyId(),
                properties.getS3().getSecretAccessKey()
        );

        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
        log.debug("S3Client created successfully.");
    }

    @Override
    public void init() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("S3 bucket '{}' exists and is accessible.", bucketName);
        } catch (NoSuchBucketException e) {
            log.error("S3 bucket '{}' does not exist! Please create it.", bucketName);
            throw new StorageException("S3 bucket not found: " + bucketName, e);
        } catch (S3Exception e) {
            log.error("Error accessing S3 bucket '{}': {} (Status code: {})", bucketName, e.getMessage(), e.statusCode(), e);
            throw new StorageException("Could not verify S3 bucket access", e);
        }
    }

    @Override
    public String store(MultipartFile file, String key) {
        if (file.isEmpty()) {
            log.warn("Attempted to store empty file with key: {}", key);
            throw new StorageException("Failed to store empty file.");
        }
        try {
            log.debug("Storing file to S3. Key: {}, ContentType: {}, Size: {}", key, file.getContentType(), file.getSize());

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Stored file '{}' in S3 bucket '{}'.", key, bucketName);

            return key; 
        } catch (IOException e) {
            log.error("IOException during S3 store operation for key '{}': {}", key, e.getMessage(), e);
            throw new StorageException("Failed to store file due to IO error.", e);
        } catch (S3Exception e) {
            log.error("S3Exception during S3 store operation for key '{}': {} (Status code: {})", key, e.getMessage(), e.statusCode(), e);
            throw new StorageException("Failed to store file in S3.", e);
        }
    }

    @Override
    public Stream<Path> loadAll() {
        log.warn("loadAll() is not efficiently implemented for S3StorageService. Returning empty stream.");
        return Stream.empty();
    }

    @Override
    public Path load(String key) {
        log.warn("load(Path) is not directly supported by S3StorageService without downloading. Throwing exception for key '{}'.", key);
        throw new UnsupportedOperationException("Loading as Path is not directly supported for S3 objects.");
    }

    @Override
    public Resource loadAsResource(String key) {
        try {
            log.debug("Loading S3 object '{}' from bucket '{}' as resource.", key, bucketName);
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(getObjectRequest);
            return new InputStreamResource(s3Object) {
                @Override
                public String getFilename() {
                    return key;
                }
                @Override
                public long contentLength() throws IOException {
                    return s3Object.response().contentLength();
                }
            };
        } catch (NoSuchKeyException e) {
            log.warn("S3 object not found: key '{}', bucket '{}'", key, bucketName);
            throw new StorageFileNotFoundException("Could not read file from S3: " + key, e);
        } catch (S3Exception e) {
            log.error("S3Exception during S3 loadAsResource for key '{}': {} (Status code: {})", key, e.getMessage(), e.statusCode(), e);
            throw new StorageException("Could not read file from S3: " + key, e);
        }
    }

    @Override
    public boolean delete(String key) {
        try {
            log.info("Deleting S3 object '{}' from bucket '{}'.", key, bucketName);
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
            return true;
        } catch (S3Exception e) {
            log.error("S3Exception during S3 delete for key '{}': {} (Status code: {})", key, e.getMessage(), e.statusCode(), e);
            return false;
        }
    }

    @Override
    public void deleteAll() {
        log.warn("deleteAll() called on S3 bucket '{}'. This will delete ALL objects in the bucket.", bucketName);
        try {
            ListObjectsV2Request listReq = ListObjectsV2Request.builder().bucket(bucketName).build();
            ListObjectsV2Response listRes;
            do {
                listRes = s3Client.listObjectsV2(listReq);
                if (!listRes.contents().isEmpty()) {
                    List<ObjectIdentifier> toDelete = listRes.contents().stream()
                            .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                            .collect(Collectors.toList());

                    DeleteObjectsRequest deleteReq = DeleteObjectsRequest.builder()
                            .bucket(bucketName)
                            .delete(Delete.builder().objects(toDelete).build())
                            .build();
                    s3Client.deleteObjects(deleteReq);
                    log.info("Deleted {} objects from S3 bucket '{}'.", toDelete.size(), bucketName);
                }
                listReq = listReq.toBuilder().continuationToken(listRes.nextContinuationToken()).build();
            } while (Boolean.TRUE.equals(listRes.isTruncated()));
            log.info("Finished deleteAll operation for S3 bucket '{}'.", bucketName);
        } catch (S3Exception e) {
            log.error("S3Exception during deleteAll for bucket '{}': {} (Status code: {})", bucketName, e.getMessage(), e.statusCode(), e);
            throw new StorageException("Could not delete all objects from S3 bucket: " + bucketName, e);
        }
    }

    @Override
    public String getSignedUrl(String key, long expirationSeconds) {
        try (S3Presigner presigner = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(s3Client.serviceClientConfiguration().credentialsProvider())
                .build()) {

            log.debug("Generating pre-signed URL for S3 object '{}', expiration: {}s", key, expirationSeconds);
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(expirationSeconds > 0 ? expirationSeconds : defaultExpirationSeconds))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedGetObjectRequest = presigner.presignGetObject(presignRequest);
            String url = presignedGetObjectRequest.url().toString();
            log.info("Generated pre-signed URL for S3 object '{}': {}", key, url);
            return url;

        } catch (S3Exception e) {
            log.error("S3Exception generating pre-signed URL for key '{}': {} (Status code: {})", key, e.getMessage(), e.statusCode(), e);
            throw new StorageException("Could not generate pre-signed URL for S3 object: " + key, e);
        }
    }

    @Override
    public void close() {
        log.info("Closing S3Client.");
        if (s3Client != null) {
            s3Client.close();
        }
    }
}
