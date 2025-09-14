package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.payload.request.SavedSearchRequest;
import com.autotrader.autotraderbackend.payload.response.SavedSearchResponse;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.SavedSearch;
import com.autotrader.autotraderbackend.model.ModelStatus;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.ModelStatus;
import com.autotrader.autotraderbackend.repository.SavedSearchRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedSearchServiceTest {

    @Mock
    private SavedSearchRepository savedSearchRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private SavedSearchMatchingService matchingService;

    @InjectMocks
    private SavedSearchService savedSearchService;

    private User testUser;
    private SavedSearch testSavedSearch;
    private SavedSearchRequest testRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");

        Map<String, Object> filters = new HashMap<>();
        filters.put("brandSlugs", Arrays.asList("toyota", "honda"));
        filters.put("minPrice", 10000);
        filters.put("maxPrice", 50000);

        Map<String, Object> notificationPrefs = new HashMap<>();
        notificationPrefs.put("email", true);
        notificationPrefs.put("frequency", "immediate");

        testSavedSearch = new SavedSearch();
        testSavedSearch.setId(UUID.randomUUID());
        testSavedSearch.setUser(testUser);
        testSavedSearch.setNameEn("My Toyota Search");
        testSavedSearch.setNameAr("بحث تويوتا");
        testSavedSearch.setFilters(filters);
        testSavedSearch.setNotificationPreferences(notificationPrefs);
        testSavedSearch.setIsActive(true);
        testSavedSearch.setCreatedAt(LocalDateTime.now());
        testSavedSearch.setUpdatedAt(LocalDateTime.now());

        testRequest = new SavedSearchRequest();
        testRequest.setNameEn("My Toyota Search");
        testRequest.setNameAr("بحث تويوتا");
        testRequest.setFilters(filters);
        testRequest.setNotificationPreferences(notificationPrefs);

        // Setup default mocks for match count calculation (lenient to avoid unnecessary stubbing errors)
        lenient().when(carListingRepository.findAll()).thenReturn(Collections.emptyList());
    }

    @Test
    void createSavedSearch_Success() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.save(any(SavedSearch.class))).thenReturn(testSavedSearch);

        // When
        SavedSearchResponse result = savedSearchService.createSavedSearch(testRequest, "testuser");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getNameEn()).isEqualTo("My Toyota Search");
        assertThat(result.getNameAr()).isEqualTo("بحث تويوتا");
        assertThat(result.getFilters()).containsEntry("brandSlugs", Arrays.asList("toyota", "honda"));
        assertThat(result.getIsActive()).isTrue();

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).save(any(SavedSearch.class));
    }

    @Test
    void createSavedSearch_UserNotFound_ThrowsException() {
        // Given
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> savedSearchService.createSavedSearch(testRequest, "nonexistent"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User")
                .hasMessageContaining("nonexistent");

        verify(userRepository).findByUsername("nonexistent");
        verify(savedSearchRepository, never()).save(any());
    }

    @Test
    void getUserSavedSearches_Success() {
        // Given
        List<SavedSearch> searches = Arrays.asList(testSavedSearch);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.findByUserAndIsActiveTrueOrderByCreatedAtDesc(testUser))
                .thenReturn(searches);

        // When
        List<SavedSearchResponse> result = savedSearchService.getUserSavedSearches("testuser");

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNameEn()).isEqualTo("My Toyota Search");
        assertThat(result.get(0).getStatus() == ModelStatus.ACTIVE).isTrue();

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).findByUserAndIsActiveTrueOrderByCreatedAtDesc(testUser);
    }

    @Test
    void getUserSavedSearches_EmptyList() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.findByUserAndIsActiveTrueOrderByCreatedAtDesc(testUser))
                .thenReturn(Collections.emptyList());

        // When
        List<SavedSearchResponse> result = savedSearchService.getUserSavedSearches("testuser");

        // Then
        assertThat(result).isEmpty();

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).findByUserAndIsActiveTrueOrderByCreatedAtDesc(testUser);
    }

    @Test
    void getSavedSearchById_Success() {
        // Given
        UUID searchId = testSavedSearch.getId();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.findByIdAndUser(searchId, testUser)).thenReturn(testSavedSearch);

        // When
        SavedSearchResponse result = savedSearchService.getSavedSearchById(searchId, "testuser");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(searchId);
        assertThat(result.getNameEn()).isEqualTo("My Toyota Search");

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).findByIdAndUser(searchId, testUser);
    }

    @Test
    void getSavedSearchById_NotFound_ThrowsException() {
        // Given
        UUID searchId = UUID.randomUUID();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.findByIdAndUser(searchId, testUser)).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> savedSearchService.getSavedSearchById(searchId, "testuser"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("SavedSearch")
                .hasMessageContaining(searchId.toString());

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).findByIdAndUser(searchId, testUser);
    }

    @Test
    void updateSavedSearch_Success() {
        // Given
        UUID searchId = testSavedSearch.getId();
        SavedSearchRequest updateRequest = new SavedSearchRequest();
        updateRequest.setNameEn("Updated Toyota Search");
        
        Map<String, Object> updatedFilters = new HashMap<>();
        updatedFilters.put("brandSlugs", Arrays.asList("toyota"));
        updatedFilters.put("minPrice", 15000);
        updateRequest.setFilters(updatedFilters);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.findByIdAndUser(searchId, testUser)).thenReturn(testSavedSearch);
        when(savedSearchRepository.save(testSavedSearch)).thenReturn(testSavedSearch);

        // When
        SavedSearchResponse result = savedSearchService.updateSavedSearch(searchId, updateRequest, "testuser");

        // Then
        assertThat(result).isNotNull();
        assertThat(testSavedSearch.getNameEn()).isEqualTo("Updated Toyota Search");
        assertThat(testSavedSearch.getFilters()).containsEntry("minPrice", 15000);

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).findByIdAndUser(searchId, testUser);
        verify(savedSearchRepository).save(testSavedSearch);
    }

    @Test
    void updateSavedSearch_NotFound_ThrowsException() {
        // Given
        UUID searchId = UUID.randomUUID();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.findByIdAndUser(searchId, testUser)).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> savedSearchService.updateSavedSearch(searchId, testRequest, "testuser"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("SavedSearch")
                .hasMessageContaining(searchId.toString());

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).findByIdAndUser(searchId, testUser);
        verify(savedSearchRepository, never()).save(any());
    }

    @Test
    void deleteSavedSearch_Success() {
        // Given
        UUID searchId = testSavedSearch.getId();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.findByIdAndUser(searchId, testUser)).thenReturn(testSavedSearch);
        when(savedSearchRepository.save(testSavedSearch)).thenReturn(testSavedSearch);

        // When
        savedSearchService.deleteSavedSearch(searchId, "testuser");

        // Then
        assertThat(testSavedSearch.getStatus() == ModelStatus.ACTIVE).isFalse();

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).findByIdAndUser(searchId, testUser);
        verify(savedSearchRepository).save(testSavedSearch);
    }

    @Test
    void deleteSavedSearch_NotFound_ThrowsException() {
        // Given
        UUID searchId = UUID.randomUUID();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.findByIdAndUser(searchId, testUser)).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> savedSearchService.deleteSavedSearch(searchId, "testuser"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("SavedSearch")
                .hasMessageContaining(searchId.toString());

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).findByIdAndUser(searchId, testUser);
        verify(savedSearchRepository, never()).save(any());
    }

    @Test
    void getUserSavedSearchCount_Success() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(savedSearchRepository.countByUserAndIsActiveTrue(testUser)).thenReturn(3L);

        // When
        long result = savedSearchService.getUserSavedSearchCount("testuser");

        // Then
        assertThat(result).isEqualTo(3L);

        verify(userRepository).findByUsername("testuser");
        verify(savedSearchRepository).countByUserAndIsActiveTrue(testUser);
    }

    @Test
    void processNewListingForNotifications_Success() {
        // Given
        // This is more of a placeholder test since the full implementation
        // would require CarListing creation and complex matching logic

        // When & Then
        // Should not throw any exception
        assertThatCode(() -> savedSearchService.processNewListingForNotifications(null))
                .doesNotThrowAnyException();
    }
}
