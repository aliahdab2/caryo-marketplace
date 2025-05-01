package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.util.Collections;
import java.util.stream.Stream;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class S3StorageServiceTest {

    private S3StorageService s3StorageService;

    @Mock
    private StorageProperties properties;

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @BeforeEach
    void setUp() {
        properties = mock(StorageProperties.class, RETURNS_DEEP_STUBS);
        s3Client = mock(S3Client.class);
        s3Presigner = mock(S3Presigner.class);
        
        // Setup S3 properties
        StorageProperties.S3 s3Props = mock(StorageProperties.S3.class);
        when(properties.getS3()).thenReturn(s3Props);
        when(s3Props.getBucketName()).thenReturn("test-bucket");
        when(s3Props.getSignedUrlExpirationSeconds()).thenReturn(3600L);
        
        s3StorageService = new S3StorageService(properties, s3Client, s3Presigner);
        
        // Mock the init call for headBucket
        HeadBucketResponse headBucketResponse = HeadBucketResponse.builder().build();
        when(s3Client.headBucket(any(HeadBucketRequest.class))).thenReturn(headBucketResponse);
    }

    @Test
    void testStore() throws IOException {
        String key = "test_key";

        // Create mock file
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("text/plain");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("test data".getBytes()));
        when(file.getSize()).thenReturn(9L);

        // Simulate the S3 store behavior
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
            .thenReturn(PutObjectResponse.builder().build());

        String result = s3StorageService.store(file, key);

        // Verify
        assertEquals(key, result);
        verify(s3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void testLoadAsResource() {
        String key = "test_key";

        // Create mock response
        GetObjectResponse response = GetObjectResponse.builder()
                .contentLength(9L)
                .build();
        ResponseInputStream<GetObjectResponse> responseStream = 
                new ResponseInputStream<>(response, new ByteArrayInputStream("test data".getBytes()));

        // Simulate loading the object from S3
        when(s3Client.getObject(any(GetObjectRequest.class))).thenReturn(responseStream);

        Resource resource = s3StorageService.loadAsResource(key);

        // Verify
        assertNotNull(resource);
        verify(s3Client, times(1)).getObject(any(GetObjectRequest.class));
    }
    
    @Test
    void testLoadThrowsUnsupportedOperation() {
        String key = "test_key";
        
        // The load method should throw UnsupportedOperationException since 
        // loading as Path is not supported in S3
        assertThrows(UnsupportedOperationException.class, () -> {
            s3StorageService.load(key);
        });
    }

    @Test
    void testDelete() {
        String key = "test_key";

        // Simulate S3 delete behavior
        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
            .thenReturn(DeleteObjectResponse.builder().build());

        boolean result = s3StorageService.delete(key);

        assertTrue(result);
        verify(s3Client, times(1)).deleteObject(any(DeleteObjectRequest.class));
    }
    
    @Test
    void testDeleteFailed() {
        String key = "test_key";

        // Simulate S3 delete failure
        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
            .thenThrow(S3Exception.builder().build());

        boolean result = s3StorageService.delete(key);

        assertFalse(result);
        verify(s3Client, times(1)).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void testDeleteAll() {
        // Simulate listing objects
        S3Object s3Object = S3Object.builder().key("test-file.txt").build();
        ListObjectsV2Response listResponse = ListObjectsV2Response.builder()
                .contents(Collections.singletonList(s3Object))
                .isTruncated(false)
                .build();
                
        // Simulate deleting objects
        DeleteObjectsResponse deleteResponse = DeleteObjectsResponse.builder().build();
        
        when(s3Client.listObjectsV2(any(ListObjectsV2Request.class))).thenReturn(listResponse);
        when(s3Client.deleteObjects(any(DeleteObjectsRequest.class))).thenReturn(deleteResponse);

        // Execute deleteAll
        s3StorageService.deleteAll();

        // Verify correct methods were called
        verify(s3Client, times(1)).listObjectsV2(any(ListObjectsV2Request.class));
        verify(s3Client, times(1)).deleteObjects(any(DeleteObjectsRequest.class));
    }
    
    @Test
    void testInitSuccessful() {
        // Already mocked in setup method, just need to call init
        s3StorageService.init();
        
        verify(s3Client, times(1)).headBucket(any(HeadBucketRequest.class));
    }
    
    @Test
    void testInitFailedBucketNotFound() {
        // Mock bucket not found
        when(s3Client.headBucket(any(HeadBucketRequest.class)))
            .thenThrow(NoSuchBucketException.builder().build());
            
        // Verify that StorageException is thrown
        StorageException exception = assertThrows(StorageException.class, () -> {
            s3StorageService.init();
        });
        
        assertTrue(exception.getMessage().contains("S3 bucket not found"));
    }
    
    @Test
    void testGetSignedUrl() throws MalformedURLException { // Add throws declaration
        String key = "test_key";
        long expirationSeconds = 3600;
        
        // Create mock presigned URL 
        PresignedGetObjectRequest presignedRequest = mock(PresignedGetObjectRequest.class);
        // Mock url() to return a URL object using URI.create().toURL()
        URL mockUrl = URI.create("https://test-bucket.s3.amazonaws.com/" + key).toURL();
        when(presignedRequest.url()).thenReturn(mockUrl);
        
        // Mock S3Presigner behavior
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class)))
            .thenReturn(presignedRequest);
            
        // Execute method
        String url = s3StorageService.getSignedUrl(key, expirationSeconds);
        
        // Verify
        assertEquals("https://test-bucket.s3.amazonaws.com/test_key", url);
        verify(s3Presigner, times(1)).presignGetObject(any(GetObjectPresignRequest.class));
    }
    
    @Test
    void testLoadAsResourceNotFound() {
        String key = "missing_file.txt";
        
        // Mock S3 throwing NoSuchKeyException 
        when(s3Client.getObject(any(GetObjectRequest.class)))
            .thenThrow(NoSuchKeyException.builder().build());
            
        // Execute and verify
        StorageFileNotFoundException exception = assertThrows(StorageFileNotFoundException.class, () -> {
            s3StorageService.loadAsResource(key);
        });
        
        assertTrue(exception.getMessage().contains("File not found"));
    }
    
    @Test
    void testStoreEmptyFileThrows() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);
        
        StorageException exception = assertThrows(StorageException.class, () -> {
            s3StorageService.store(file, "key");
        });
        
        assertTrue(exception.getMessage().contains("empty file"));
    }
    
    @Test
    void testLoadAllReturnsEmptyStream() {
        // S3StorageService's loadAll returns an empty stream
        Stream<java.nio.file.Path> stream = s3StorageService.loadAll(); // Use java.nio.file.Path
        assertNotNull(stream);
        assertEquals(0, stream.count());
    }
}
