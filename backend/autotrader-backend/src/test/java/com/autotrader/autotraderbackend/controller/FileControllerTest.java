package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;


import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    @Mock
    private StorageService storageService;

    @InjectMocks
    private FileController fileController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(fileController).build();
    }

    @Test
    void testUploadFile_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "test image content".getBytes()
        );

        when(storageService.store(any(MockMultipartFile.class), anyString()))
                .thenReturn("http://localhost:8080/api/files/listings/1/some-uuid.jpg");

        mockMvc.perform(multipart("/api/files/upload")
                        .file(file)
                        .param("listingId", "1")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("http://localhost:8080/api/files/listings/1/some-uuid.jpg"))
                .andExpect(jsonPath("$.key").exists());
    }

    @Test
    void testUploadFile_EmptyFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[0]
        );

        mockMvc.perform(multipart("/api/files/upload")
                        .file(file)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest()); // Expecting bad request due to StorageException
                // Add more specific exception handling checks if needed
    }

    @Test
    void testGetFile_Success() throws Exception {
        String fileKey = "listings/1/test.jpg";
        Resource resource = new ByteArrayResource("test content".getBytes());
        
        // Mock the behavior of loadAsResource to return a resource with a filename
        when(storageService.loadAsResource(fileKey)).thenReturn(new ByteArrayResource(resource.getContentAsByteArray()) {
            @Override
            public String getFilename() {
                return "test.jpg"; // Ensure the resource has a filename
            }
        });

        mockMvc.perform(get("/api/files/{key}", fileKey))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"test.jpg\""))
                .andExpect(content().bytes("test content".getBytes()));
    }

    @Test
    void testGetSignedUrl_Success() throws Exception {
        String fileKey = "private/confidential.pdf";
        String signedUrl = "http://s3.amazon.com/bucket/private/confidential.pdf?sig=123";

        when(storageService.getSignedUrl(fileKey, 3600L)).thenReturn(signedUrl);

        mockMvc.perform(get("/api/files/signed")
                        .param("key", fileKey)
                        .param("expiration", "3600"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(signedUrl));
    }

    @Test
    void testDeleteFile_Success() throws Exception {
        String fileKey = "listings/1/old-image.png";

        when(storageService.delete(fileKey)).thenReturn(true);

        mockMvc.perform(delete("/api/files/{key}", fileKey))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("File deleted successfully"));
    }

    @Test
    void testDeleteFile_NotFound() throws Exception {
        String fileKey = "listings/1/non-existent.png";

        when(storageService.delete(fileKey)).thenReturn(false);

        mockMvc.perform(delete("/api/files/{key}", fileKey))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("File not found or could not be deleted"));
    }
}
