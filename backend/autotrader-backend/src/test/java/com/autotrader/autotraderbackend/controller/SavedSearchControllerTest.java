package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.SavedSearchRequest;
import com.autotrader.autotraderbackend.payload.response.SavedSearchResponse;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
import com.autotrader.autotraderbackend.security.services.UserDetailsServiceImpl;
import com.autotrader.autotraderbackend.service.SavedSearchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SavedSearchController.class)
@Import(com.autotrader.autotraderbackend.config.TestSecurityConfig.class)
@ActiveProfiles("test")
class SavedSearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SavedSearchService savedSearchService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    private SavedSearchRequest testRequest;
    private SavedSearchResponse testResponse;

    @BeforeEach
    void setUp() {
        Map<String, Object> filters = new HashMap<>();
        filters.put("brandSlugs", Arrays.asList("toyota", "honda"));
        filters.put("minPrice", 10000);
        filters.put("maxPrice", 50000);

        Map<String, Object> notificationPrefs = new HashMap<>();
        notificationPrefs.put("email", true);
        notificationPrefs.put("frequency", "immediate");

        testRequest = new SavedSearchRequest();
        testRequest.setNameEn("My Toyota Search");
        testRequest.setNameAr("بحث تويوتا");
        testRequest.setFilters(filters);
        testRequest.setNotificationPreferences(notificationPrefs);

        testResponse = new SavedSearchResponse();
        testResponse.setId(UUID.randomUUID());
        testResponse.setNameEn("My Toyota Search");
        testResponse.setNameAr("بحث تويوتا");
        testResponse.setFilters(filters);
        testResponse.setNotificationPreferences(notificationPrefs);
        testResponse.setIsActive(true);
        testResponse.setCreatedAt(LocalDateTime.now());
        testResponse.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createSavedSearch_Success() throws Exception {
        // Given
        when(savedSearchService.createSavedSearch(any(SavedSearchRequest.class), eq("testuser")))
                .thenReturn(testResponse);

        // When & Then
        mockMvc.perform(post("/api/saved-searches")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nameEn").value("My Toyota Search"))
                .andExpect(jsonPath("$.nameAr").value("بحث تويوتا"))
                .andExpect(jsonPath("$.isActive").value(true));

        verify(savedSearchService).createSavedSearch(any(SavedSearchRequest.class), eq("testuser"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getUserSavedSearches_Success() throws Exception {
        // Given
        List<SavedSearchResponse> searches = Arrays.asList(testResponse);
        when(savedSearchService.getUserSavedSearches("testuser")).thenReturn(searches);

        // When & Then
        mockMvc.perform(get("/api/saved-searches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].nameEn").value("My Toyota Search"));

        verify(savedSearchService).getUserSavedSearches("testuser");
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getSavedSearchById_Success() throws Exception {
        // Given
        UUID searchId = testResponse.getId();
        when(savedSearchService.getSavedSearchById(searchId, "testuser")).thenReturn(testResponse);

        // When & Then
        mockMvc.perform(get("/api/saved-searches/{id}", searchId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameEn").value("My Toyota Search"))
                .andExpect(jsonPath("$.id").value(searchId.toString()));

        verify(savedSearchService).getSavedSearchById(searchId, "testuser");
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateSavedSearch_Success() throws Exception {
        // Given
        UUID searchId = testResponse.getId();
        when(savedSearchService.updateSavedSearch(eq(searchId), any(SavedSearchRequest.class), eq("testuser")))
                .thenReturn(testResponse);

        // When & Then
        mockMvc.perform(put("/api/saved-searches/{id}", searchId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameEn").value("My Toyota Search"));

        verify(savedSearchService).updateSavedSearch(eq(searchId), any(SavedSearchRequest.class), eq("testuser"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void deleteSavedSearch_Success() throws Exception {
        // Given
        UUID searchId = UUID.randomUUID();
        doNothing().when(savedSearchService).deleteSavedSearch(searchId, "testuser");

        // When & Then
        mockMvc.perform(delete("/api/saved-searches/{id}", searchId)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(savedSearchService).deleteSavedSearch(searchId, "testuser");
    }

    @Test
    void createSavedSearch_Unauthorized() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/saved-searches")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRequest)))
                .andExpect(status().isUnauthorized());

        verify(savedSearchService, never()).createSavedSearch(any(), any());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createSavedSearch_InvalidRequest_BadRequest() throws Exception {
        // Given - invalid request without required fields
        SavedSearchRequest invalidRequest = new SavedSearchRequest();
        invalidRequest.setNameEn(""); // Invalid: blank name

        // When & Then
        mockMvc.perform(post("/api/saved-searches")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(savedSearchService, never()).createSavedSearch(any(), any());
    }
}
