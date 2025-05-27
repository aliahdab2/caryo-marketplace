package com.autotrader.autotraderbackend.service.storage;

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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.util.Collections;
import java.util.stream.Stream;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class S3StorageServiceTest {

    private S3StorageService s3StorageService;

    @Mock
    private S3Client s3Client;

    @Mock
    private StorageConfigurationManager configManager;

    @Mock
    private StorageUrlGenerator urlGenerator;

    @BeforeEach
    void setUp() {
        s3Client = mock(S3Client.class);
        configManager = mock(StorageConfigurationManager.class);
        urlGenerator = mock(StorageUrlGenerator.class);
        
        // Setup configuration manager defaults
        when(configManager.getDefaultBucketName()).thenReturn("test-bucket");
        when(configManager.getBucketName(anyString())).thenReturn("test-bucket");
        when(configManager.getFileTypeFromKey(anyString())).thenReturn("listing-media");
        when(configManager.getStorageBaseUrl()).thenReturn("http://localhost:9000");
        when(configManager.isPublicAccessEnabled()).thenReturn(false);
        
        // Setup URL generator defaults
        when(urlGenerator.generateUrl(anyString(), any(StorageUrlGenerator.UrlType.class), anyLong()))
                .thenReturn("http://localhost:9000/test-bucket/test-key");
        
        s3StorageService = new S3StorageService(s3Client, configManager, urlGenerator);
        
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
    void testGetSignedUrl() throws MalformedURLException {
        String key = "test_key";
        long expirationSeconds = 3600;
        String expectedUrl = "http://localhost:9000/test-bucket/test_key?X-Amz-Expires=3600";
        
        // Mock URL generator behavior
        when(urlGenerator.generateUrl(eq(key), eq(StorageUrlGenerator.UrlType.SIGNED), eq(expirationSeconds)))
                .thenReturn(expectedUrl);
        when(configManager.isPublicAccessEnabled()).thenReturn(false); // Force signed URL
            
        // Execute method
        String url = s3StorageService.getSignedUrl(key, expirationSeconds);
        
        // Verify
        assertEquals(expectedUrl, url);
        verify(urlGenerator, times(1)).generateUrl(eq(key), eq(StorageUrlGenerator.UrlType.SIGNED), eq(expirationSeconds));
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
    
    @Test
    void testGetPublicUrl() {
        String key = "test_key";
        String expectedUrl = "http://localhost:9000/test-bucket/test_key";
        
        // Mock URL generator behavior
        when(urlGenerator.generateUrl(eq(key), eq(StorageUrlGenerator.UrlType.PUBLIC), eq(0L)))
                .thenReturn(expectedUrl);
            
        // Execute method
        String url = s3StorageService.getPublicUrl(key);
        
        // Verify
        assertEquals(expectedUrl, url);
        verify(urlGenerator, times(1)).generateUrl(eq(key), eq(StorageUrlGenerator.UrlType.PUBLIC), eq(0L));
    }
    
    @Test
    void testGetCdnUrl() {
        String key = "test_key";
        String expectedUrl = "https://cdn.example.com/test-bucket/test_key";
        
        // Mock URL generator behavior
        when(urlGenerator.generateUrl(eq(key), eq(StorageUrlGenerator.UrlType.CDN), eq(0L)))
                .thenReturn(expectedUrl);
            
        // Execute method
        String url = s3StorageService.getCdnUrl(key);
        
        // Verify
        assertEquals(expectedUrl, url);
        verify(urlGenerator, times(1)).generateUrl(eq(key), eq(StorageUrlGenerator.UrlType.CDN), eq(0L));
    }
    
    @Test
    void testGetSignedUrlWithPublicAccess() {
        String key = "test_key";
        long expirationSeconds = 3600;
        String expectedUrl = "http://localhost:9000/test-bucket/test_key";
        
        // Mock URL generator behavior for public access
        when(configManager.isPublicAccessEnabled()).thenReturn(true); // Force public URL
        when(urlGenerator.generateUrl(eq(key), eq(StorageUrlGenerator.UrlType.PUBLIC), eq(expirationSeconds)))
                .thenReturn(expectedUrl);
            
        // Execute method
        String url = s3StorageService.getSignedUrl(key, expirationSeconds);
        
        // Verify
        assertEquals(expectedUrl, url);
        verify(urlGenerator, times(1)).generateUrl(eq(key), eq(StorageUrlGenerator.UrlType.PUBLIC), eq(expirationSeconds));
    }
    
    @Test
    void testGetSignedUrlWithNullKey() {
        // Test validation
        StorageException exception = assertThrows(StorageException.class, () -> {
            s3StorageService.getSignedUrl(null, 3600);
        });
        
        assertTrue(exception.getMessage().contains("Storage key cannot be null or empty"));
    }
    
    @Test
    void testGetSignedUrlWithEmptyKey() {
        // Test validation
        StorageException exception = assertThrows(StorageException.class, () -> {
            s3StorageService.getSignedUrl("", 3600);
        });
        
        assertTrue(exception.getMessage().contains("Storage key cannot be null or empty"));
    }
    
    @Test
    void testGetSignedUrlWithNegativeExpiration() {
        // Test validation
        StorageException exception = assertThrows(StorageException.class, () -> {
            s3StorageService.getSignedUrl("test_key", -1);
        });
        
        assertTrue(exception.getMessage().contains("Expiration seconds cannot be negative"));
    }
}
