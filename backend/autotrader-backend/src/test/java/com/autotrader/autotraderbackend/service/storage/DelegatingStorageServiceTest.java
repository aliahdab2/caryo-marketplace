package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DelegatingStorageServiceTest {

    @Test
    void init_CallsBothAndHandlesExceptions() {
        doThrow(new RuntimeException("primary fail")).when(primary).init();
        doThrow(new RuntimeException("fallback fail")).when(fallback).init();
        // Should not throw
        assertDoesNotThrow(() -> delegatingService.init());
        verify(primary).init();
        verify(fallback).init();
    }

    @Test
    void load_ReturnsPathFromFallback() {
        Path path = mock(Path.class);
        when(fallback.load("key")).thenReturn(path);
        assertEquals(path, delegatingService.load("key"));
        verify(fallback).load("key");
    }

    @Test
    void load_ThrowsIfFallbackFails() {
        when(fallback.load("key")).thenThrow(new RuntimeException("fail"));
        assertThrows(StorageFileNotFoundException.class, () -> delegatingService.load("key"));
    }

    @Test
    void deleteAll_CallsBothAndHandlesExceptions() {
        doThrow(new RuntimeException("primary fail")).when(primary).deleteAll();
        doThrow(new RuntimeException("fallback fail")).when(fallback).deleteAll();
        // Should not throw
        assertDoesNotThrow(() -> delegatingService.deleteAll());
        verify(primary).deleteAll();
        verify(fallback).deleteAll();
    }

    @Test
    void loadAll_ReturnsStreamFromFallback() {
        Stream<Path> stream = Stream.of(mock(Path.class));
        when(fallback.loadAll()).thenReturn(stream);
        assertEquals(stream, delegatingService.loadAll());
    }

    @Test
    void loadAll_ReturnsEmptyStreamIfFallbackFails() {
        when(fallback.loadAll()).thenThrow(new RuntimeException("fail"));
        assertEquals(0, delegatingService.loadAll().count());
    }
    private S3StorageService primary;
    private LocalStorageService fallback;
    private DelegatingStorageService delegatingService;

    @BeforeEach
    void setUp() {
        primary = mock(S3StorageService.class);
        fallback = mock(LocalStorageService.class);
        delegatingService = new DelegatingStorageService(primary, fallback);
    }

    @Test
    void store_UsesPrimaryIfNoException() {
        MultipartFile file = mock(MultipartFile.class);
        when(primary.store(file, "key")).thenReturn("primary-key");
        String result = delegatingService.store(file, "key");
        assertEquals("primary-key", result);
        verify(primary).store(file, "key");
        verify(fallback, never()).store(any(), any());
    }

    @Test
    void store_FallbacksToLocalIfPrimaryFails() {
        MultipartFile file = mock(MultipartFile.class);
        when(primary.store(file, "key")).thenThrow(new StorageException("fail"));
        when(fallback.store(file, "key")).thenReturn("fallback-key");
        String result = delegatingService.store(file, "key");
        assertEquals("fallback-key", result);
        verify(primary).store(file, "key");
        verify(fallback).store(file, "key");
    }

    @Test
    void store_ThrowsIfBothFail() {
        MultipartFile file = mock(MultipartFile.class);
        when(primary.store(file, "key")).thenThrow(new StorageException("fail"));
        when(fallback.store(file, "key")).thenThrow(new StorageException("fail2"));
        StorageException ex = assertThrows(StorageException.class, () -> delegatingService.store(file, "key"));
        assertTrue(ex.getMessage().contains("both primary and fallback"));
    }

    @Test
    void loadAll_DelegatesToFallback() {
        Stream<Path> stream = Stream.of(mock(Path.class));
        when(fallback.loadAll()).thenReturn(stream);
        assertEquals(stream, delegatingService.loadAll());
        verify(fallback).loadAll();
    }

    @Test
    void loadAsResource_UsesPrimaryIfNoException() {
        Resource resource = mock(Resource.class);
        when(primary.loadAsResource("key")).thenReturn(resource);
        assertEquals(resource, delegatingService.loadAsResource("key"));
        verify(primary).loadAsResource("key");
        verify(fallback, never()).loadAsResource(any());
    }

    @Test
    void loadAsResource_FallbacksIfPrimaryFails() {
        Resource resource = mock(Resource.class);
        when(primary.loadAsResource("key")).thenThrow(new StorageFileNotFoundException("fail"));
        when(fallback.loadAsResource("key")).thenReturn(resource);
        assertEquals(resource, delegatingService.loadAsResource("key"));
        verify(primary).loadAsResource("key");
        verify(fallback).loadAsResource("key");
    }

    @Test
    void loadAsResource_ThrowsIfBothFail() {
        when(primary.loadAsResource("key")).thenThrow(new StorageFileNotFoundException("fail"));
        when(fallback.loadAsResource("key")).thenThrow(new StorageFileNotFoundException("fail2"));
        assertThrows(StorageFileNotFoundException.class, () -> delegatingService.loadAsResource("key"));
    }

    @Test
    void delete_TrueIfEitherDeletes() {
        when(primary.delete("key")).thenReturn(true);
        when(fallback.delete("key")).thenReturn(false);
        assertTrue(delegatingService.delete("key"));
        when(primary.delete("key")).thenReturn(false);
        when(fallback.delete("key")).thenReturn(true);
        assertTrue(delegatingService.delete("key"));
    }

    @Test
    void delete_FalseIfNeitherDeletes() {
        when(primary.delete("key")).thenReturn(false);
        when(fallback.delete("key")).thenReturn(false);
        assertFalse(delegatingService.delete("key"));
    }

    @Test
    void deleteAll_DelegatesToBoth() {
        delegatingService.deleteAll();
        verify(primary).deleteAll();
        verify(fallback).deleteAll();
    }

    @Test
    void getSignedUrl_UsesPrimaryIfNoException() {
        when(primary.getSignedUrl("key", 60L)).thenReturn("url1");
        assertEquals("url1", delegatingService.getSignedUrl("key", 60L));
        verify(primary).getSignedUrl("key", 60L);
        verify(fallback, never()).getSignedUrl(any(), anyLong());
    }

    @Test
    void getSignedUrl_FallbacksIfPrimaryFails() {
        when(primary.getSignedUrl("key", 60L)).thenThrow(new UnsupportedOperationException("fail"));
        when(fallback.getSignedUrl("key", 60L)).thenReturn("url2");
        assertEquals("url2", delegatingService.getSignedUrl("key", 60L));
        verify(primary).getSignedUrl("key", 60L);
        verify(fallback).getSignedUrl("key", 60L);
    }

    @Test
    void getSignedUrl_ThrowsIfBothFail() {
        when(primary.getSignedUrl("key", 60L)).thenThrow(new UnsupportedOperationException("fail"));
        when(fallback.getSignedUrl("key", 60L)).thenThrow(new UnsupportedOperationException("fail2"));
        assertThrows(UnsupportedOperationException.class, () -> delegatingService.getSignedUrl("key", 60L));
    }
}
