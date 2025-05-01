package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.service.storage.LocalStorageService;
import com.autotrader.autotraderbackend.service.storage.S3StorageService;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import com.autotrader.autotraderbackend.service.storage.DelegatingStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.ObjectProvider;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import static org.mockito.Mockito.*;

import static org.junit.jupiter.api.Assertions.*;

public class FileStorageConfigTest {

    @InjectMocks
    private FileStorageConfig fileStorageConfig;

    @Mock
    private StorageProperties properties;

    @Mock
    private ObjectProvider<LocalStorageService> localStorageServiceProvider;

    @Mock
    private ObjectProvider<S3StorageService> s3StorageServiceProvider;

    @Mock
    private LocalStorageService localStorageService;

    @Mock
    private S3StorageService s3StorageService;

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLocalStorageServiceCreation() {
        when(properties.getType()).thenReturn("local");
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(localStorageService);
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(null);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService);
        assertEquals(localStorageService, storageService, "Should return LocalStorageService when type is 'local'");
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }

    @Test
    void testS3StorageServiceCreation() {
        when(properties.getType()).thenReturn("s3");
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(s3StorageService);
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(null);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService);
        assertEquals(s3StorageService, storageService, "Should return S3StorageService when type is 's3'");
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }

    @Test
    void testS3WithLocalFallbackStorageServiceCreation() {
        when(properties.getType()).thenReturn("s3_with_local_fallback");
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(localStorageService);
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(s3StorageService);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService);
        assertInstanceOf(DelegatingStorageService.class, storageService, "Should return DelegatingStorageService for 's3_with_local_fallback'");
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }

    @Test
    void testDummyStorageServiceCreationWhenInvalidTypeAndNoServices() {
        when(properties.getType()).thenReturn("invalid");
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(null);
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(null);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService, "Should return a dummy service, not null");
        assertFalse(storageService instanceof LocalStorageService);
        assertFalse(storageService instanceof S3StorageService);
        assertFalse(storageService instanceof DelegatingStorageService);
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }
    
    @Test
    void testDefaultToLocalWhenInvalidTypeButLocalAvailable() {
        when(properties.getType()).thenReturn("invalid");
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(localStorageService); // Local is available
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(null);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService);
        assertEquals(localStorageService, storageService, "Should default to LocalStorageService when type is invalid but local is available");
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }
    
    @Test
    void testDummyStorageServiceWhenS3ConfiguredButUnavailable() {
        when(properties.getType()).thenReturn("s3");
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(null);
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(null);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService);
        assertFalse(storageService instanceof S3StorageService);
        assertFalse(storageService instanceof LocalStorageService);
        assertFalse(storageService instanceof DelegatingStorageService);
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }
    
     @Test
    void testFallbackToS3OnlyWhenLocalFailsInDelegateMode() {
        when(properties.getType()).thenReturn("s3_with_local_fallback");
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(null);
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(s3StorageService);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService);
        assertEquals(s3StorageService, storageService, "Should fallback to S3 only if local fails in delegate mode");
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }
    
    @Test
    void testFallbackToLocalOnlyWhenS3FailsInDelegateMode() {
        when(properties.getType()).thenReturn("s3_with_local_fallback");
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(localStorageService);
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(null);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService);
        assertEquals(localStorageService, storageService, "Should fallback to Local only if S3 fails in delegate mode");
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }
    
    @Test
    void testDummyWhenBothFailInDelegateMode() {
        when(properties.getType()).thenReturn("s3_with_local_fallback");
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(null);
        when(s3StorageServiceProvider.getIfAvailable()).thenReturn(null);

        StorageService storageService = fileStorageConfig.storageService(properties, localStorageServiceProvider, s3StorageServiceProvider);

        assertNotNull(storageService);
        assertFalse(storageService instanceof S3StorageService);
        assertFalse(storageService instanceof LocalStorageService);
        assertFalse(storageService instanceof DelegatingStorageService);
        verify(localStorageServiceProvider).getIfAvailable();
        verify(s3StorageServiceProvider).getIfAvailable();
    }
}
