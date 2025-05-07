package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.service.storage.S3StorageService;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class ListingMediaS3IntegrationTest extends IntegrationTestWithS3 {

    @Autowired
    private S3StorageService s3StorageService;

    private S3Client s3Client;

    @BeforeEach
    void setUpS3Client() {
        // Initialize S3Client for test verification, configured for MinIO
        String endpoint = String.format("http://%s:%d", minioContainer.getHost(), minioContainer.getMappedPort(9000));
        s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(minioContainer.getUserName(), minioContainer.getPassword())
                ))
                .region(Region.US_EAST_1) // Must match the region used by the application
                .forcePathStyle(true) // Important for MinIO
                .build();
    }

    @Test
    void testUploadImage_Success() throws IOException {
        String originalFilename = "test-image.jpg";
        String contentType = "image/jpeg";
        byte[] content = "dummy image content".getBytes();
        MockMultipartFile mockFile = new MockMultipartFile("file", originalFilename, contentType, content);

        String fileKey = "listings/images/" + UUID.randomUUID().toString() + "-" + originalFilename;

        String s3Url = s3StorageService.store(mockFile, fileKey);

        assertNotNull(s3Url);
        assertTrue(s3Url.endsWith(fileKey));

        // Log the returned S3 URL for debugging
        System.out.println("Returned S3 URL: " + s3Url);

        // Adjust the assertion to match the actual URL format
        assertTrue(s3Url.contains(fileKey));

        // Verify file exists in S3
        assertDoesNotThrow(() -> s3Client.headObject(HeadObjectRequest.builder()
                .bucket(BUCKET_NAME)
                .key(fileKey)
                .build()));
    }

    @Test
    void testUploadVideo_Success() throws IOException {
        String originalFilename = "test-video.mp4";
        String contentType = "video/mp4";
        byte[] content = "dummy video content".getBytes();
        MockMultipartFile mockFile = new MockMultipartFile("file", originalFilename, contentType, content);
        String fileKey = "listings/videos/" + UUID.randomUUID().toString() + "-" + originalFilename;

        String s3Url = s3StorageService.store(mockFile, fileKey);

        assertNotNull(s3Url);
        assertTrue(s3Url.endsWith(fileKey));

        // Verify file exists in S3
        assertDoesNotThrow(() -> s3Client.headObject(HeadObjectRequest.builder()
                .bucket(BUCKET_NAME)
                .key(fileKey)
                .build()));
    }

    @Test
    void testDeleteFile_Success() throws IOException {
        String originalFilename = "file-to-delete.txt";
        String contentType = "text/plain";
        byte[] content = "dummy content".getBytes();
        MockMultipartFile mockFile = new MockMultipartFile("file", originalFilename, contentType, content);
        String fileKey = "listings/others/" + UUID.randomUUID().toString() + "-" + originalFilename;

        // Upload a file first
        s3StorageService.store(mockFile, fileKey);

        // Verify it was uploaded
        assertDoesNotThrow(() -> s3Client.headObject(HeadObjectRequest.builder()
                .bucket(BUCKET_NAME)
                .key(fileKey)
                .build()));

        // Delete the file
        s3StorageService.delete(fileKey);

        // Verify file no longer exists in S3
        assertThrows(NoSuchKeyException.class, () -> s3Client.headObject(HeadObjectRequest.builder()
                .bucket(BUCKET_NAME)
                .key(fileKey)
                .build()));
    }

    @Test
    void testDeleteFile_NonExistent() {
        String nonExistentFileKey = "listings/others/non-existent-file.txt";

        // Attempting to delete a non-existent file should not throw an error
        // (S3 deleteObject is idempotent) but log a warning in a real app.
        // Here, we just ensure it doesn't fail the test.
        assertDoesNotThrow(() -> s3StorageService.delete(nonExistentFileKey));
    }
}
