package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;


class FileControllerTest {
    @Mock
    private StorageService storageService;

    @InjectMocks
    private FileController fileController;

    private AutoCloseable closeable;

    @BeforeEach
    void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
    }

    @AfterEach
    void tearDown() throws Exception {
        closeable.close();
    }

    @Test
    void uploadFile_success_withListingId() {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "data".getBytes());
        when(storageService.store(any(MultipartFile.class), anyString())).thenReturn("http://url");
        ResponseEntity<Map<String, String>> response = fileController.uploadFile(file, 123L);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody(), "Response body should not be null");
        assertTrue(response.getBody().containsKey("url"));
        assertTrue(response.getBody().containsKey("key"));
    }

    @Test
    void uploadFile_success_withoutListingId() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "data".getBytes());
        when(storageService.store(any(MultipartFile.class), anyString())).thenReturn("http://url");
        ResponseEntity<Map<String, String>> response = fileController.uploadFile(file, null);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody(), "Response body should not be null");
        assertTrue(response.getBody().containsKey("url"));
        assertTrue(response.getBody().containsKey("key"));
    }

    @Test
    void uploadFile_emptyFile_throws() {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);
        StorageException ex = assertThrows(StorageException.class, () -> fileController.uploadFile(file, 1L));
        assertTrue(ex.getMessage().contains("empty file"));
    }

    @Test
    void uploadFile_nullContentType_throws() {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", null, "data".getBytes());
        StorageException ex = assertThrows(StorageException.class, () -> fileController.uploadFile(file, 1L));
        assertTrue(ex.getMessage().contains("Unsupported file type"));
    }

    @Test
    void uploadFile_invalidContentType_throws() {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "data".getBytes());
        StorageException ex = assertThrows(StorageException.class, () -> fileController.uploadFile(file, 1L));
        assertTrue(ex.getMessage().contains("Unsupported file type"));
    }

    @Test
    void getFile_success_jpg() {
        ByteArrayResource resource = new ByteArrayResource("data".getBytes()) {
            @Override
            public String getFilename() { return "file.jpg"; }
        };
        when(storageService.loadAsResource("key1")).thenReturn(resource);
        ResponseEntity<Resource> response = fileController.getFile("key1");
        assertEquals(MediaType.IMAGE_JPEG, response.getHeaders().getContentType());
        assertEquals("attachment; filename=\"file.jpg\"", response.getHeaders().getFirst("Content-Disposition"));
        assertSame(resource, response.getBody());
    }

    @Test
    void getFile_success_pdf() {
        ByteArrayResource resource = new ByteArrayResource("data".getBytes()) {
            @Override
            public String getFilename() { return "file.pdf"; }
        };
        when(storageService.loadAsResource("key2")).thenReturn(resource);
        ResponseEntity<Resource> response = fileController.getFile("key2");
        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
    }

    @Test
    void getFile_success_unknownType() {
        ByteArrayResource resource = new ByteArrayResource("data".getBytes()) {
            @Override
            public String getFilename() { return "file.unknown"; }
        };
        when(storageService.loadAsResource("key3")).thenReturn(resource);
        ResponseEntity<Resource> response = fileController.getFile("key3");
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, response.getHeaders().getContentType());
    }

    @Test
    void getSignedUrl_success() {
        when(storageService.getSignedUrl("key", 123L)).thenReturn("http://signed");
        ResponseEntity<Map<String, String>> response = fileController.getSignedUrl("key", 123L);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody(), "Response body should not be null");
        assertEquals("http://signed", response.getBody().get("url"));
    }

    @Test
    void deleteFile_success() {
        when(storageService.delete("key")).thenReturn(true);
        ResponseEntity<Map<String, String>> response = fileController.deleteFile("key");
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody(), "Response body should not be null");
        assertTrue(response.getBody().get("message").contains("successfully"));
    }

    @Test
    void deleteFile_notFound() {
        when(storageService.delete("key")).thenReturn(false);
        ResponseEntity<Map<String, String>> response = fileController.deleteFile("key");
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody(), "Response body should not be null");
        assertTrue(response.getBody().get("message").contains("not found"));
    }

    @Test
    void isAllowedFileType_allCases() throws Exception {
        // Use reflection to access a private method
        java.lang.reflect.Method m = FileController.class.getDeclaredMethod("isAllowedFileType", String.class);
        m.setAccessible(true);
        assertTrue((Boolean) m.invoke(fileController, "image/jpeg"));
        assertTrue((Boolean) m.invoke(fileController, "image/png"));
        assertTrue((Boolean) m.invoke(fileController, "image/gif"));
        assertTrue((Boolean) m.invoke(fileController, "image/webp"));
        assertTrue((Boolean) m.invoke(fileController, "application/pdf"));
        assertTrue((Boolean) m.invoke(fileController, "application/msword"));
        assertTrue((Boolean) m.invoke(fileController, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        assertFalse((Boolean) m.invoke(fileController, "text/plain"));
        assertFalse((Boolean) m.invoke(fileController, "application/zip"));
        assertFalse((Boolean) m.invoke(fileController, (Object) null));
    }
}
