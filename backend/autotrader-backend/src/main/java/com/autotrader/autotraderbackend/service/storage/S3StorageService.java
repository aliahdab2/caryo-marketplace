package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
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

@Service
@Slf4j
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;
    private final long defaultExpirationSeconds;

    // Constructor: Dependency Injection for S3Client and S3Presigner
    public S3StorageService(StorageProperties properties, S3Client s3Client, S3Presigner s3Presigner) {
        this.bucketName = properties.getS3().getBucketName();
        this.defaultExpirationSeconds = properties.getS3().getSignedUrlExpirationSeconds();
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;

        log.info("Configured S3StorageService. Bucket: {}, Expiration: {}s",
                bucketName, defaultExpirationSeconds);
    }

    @Override
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
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .getObjectRequest(getObjectRequest)
                    .signatureDuration(Duration.ofSeconds(expirationSeconds > 0 ? expirationSeconds : defaultExpirationSeconds))
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();

        } catch (S3Exception e) {
            throw new StorageException("Failed to generate pre-signed URL for: " + key, e);
        }
    }
}
