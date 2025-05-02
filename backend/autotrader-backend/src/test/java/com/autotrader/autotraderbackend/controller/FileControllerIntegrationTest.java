package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;


import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
class FileControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StorageService storageService;

    @Test
    @WithMockUser(roles = "USER")
    void uploadFile_valid() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "data".getBytes());
        when(storageService.store(any(), anyString())).thenReturn("http://url");
        mockMvc.perform(multipart("/api/files/upload")
                .file(file)
                .param("listingId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("http://url"))
                .andExpect(jsonPath("$.key").exists());
    }

    @Test
    @WithMockUser(roles = "USER")
    void uploadFile_invalidType() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "data".getBytes());
        mockMvc.perform(multipart("/api/files/upload")
                .file(file))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(roles = "USER")
    void uploadFile_empty() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);
        mockMvc.perform(multipart("/api/files/upload")
                .file(file))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void getFile_unauthenticated() throws Exception {
        when(storageService.loadAsResource(anyString())).thenReturn(new org.springframework.core.io.ByteArrayResource("data".getBytes()) {
            @Override public String getFilename() { return "file.jpg"; }
        });
        mockMvc.perform(get("/api/files/key1"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("file.jpg")))
                .andExpect(content().contentType(MediaType.IMAGE_JPEG));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getSignedUrl_valid() throws Exception {
        when(storageService.getSignedUrl(anyString(), anyLong())).thenReturn("http://signed");
        mockMvc.perform(get("/api/files/signed")
                .param("key", "key1")
                .param("expiration", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("http://signed"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteFile_admin() throws Exception {
        when(storageService.delete(anyString())).thenReturn(true);
        mockMvc.perform(delete("/api/files/key1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("successfully")));
    }

    @Test
    @WithMockUser(roles = "USER")
    void deleteFile_forbiddenForUser() throws Exception {
        mockMvc.perform(delete("/api/files/key1"))
                .andExpect(status().isForbidden());
    }
}
