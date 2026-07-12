package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.model.UserPreferences;
import com.caryo.marketplace.payload.request.UserPreferencesRequest;
import com.caryo.marketplace.payload.response.UserPreferencesResponse;
import com.caryo.marketplace.repository.UserPreferencesRepository;
import com.caryo.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserPreferencesServiceTest {

    @Mock
    private UserPreferencesRepository userPreferencesRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserPreferencesService userPreferencesService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(7L);
        user.setUsername("testuser");
    }

    private UserPreferencesRequest fullRequest(boolean value) {
        UserPreferencesRequest request = new UserPreferencesRequest();
        request.setEmailNotifications(value);
        request.setPushNotifications(value);
        request.setNewMessages(value);
        request.setListingExpiry(value);
        request.setPriceDrops(value);
        request.setNewsletter(value);
        request.setMarketing(value);
        request.setShowPhone(value);
        request.setShowEmail(value);
        return request;
    }

    @Test
    void getPreferences_WithoutStoredRow_ShouldReturnDefaults() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userPreferencesRepository.findByUserId(7L)).thenReturn(Optional.empty());

        UserPreferencesResponse response = userPreferencesService.getPreferences("testuser");

        // Defaults mirror the previously hardcoded UI defaults
        assertTrue(response.isEmailNotifications());
        assertFalse(response.isPushNotifications());
        assertTrue(response.isNewMessages());
        assertTrue(response.isListingExpiry());
        assertFalse(response.isPriceDrops());
        assertTrue(response.isNewsletter());
        assertFalse(response.isMarketing());
        assertFalse(response.isShowPhone());
        assertFalse(response.isShowEmail());
    }

    @Test
    void getPreferences_WithStoredRow_ShouldReturnStoredValues() {
        UserPreferences stored = new UserPreferences();
        stored.setUserId(7L);
        stored.setEmailNotifications(false);
        stored.setShowPhone(true);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userPreferencesRepository.findByUserId(7L)).thenReturn(Optional.of(stored));

        UserPreferencesResponse response = userPreferencesService.getPreferences("testuser");

        assertFalse(response.isEmailNotifications());
        assertTrue(response.isShowPhone());
    }

    @Test
    void updatePreferences_WithoutStoredRow_ShouldCreateRow() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userPreferencesRepository.findByUserId(7L)).thenReturn(Optional.empty());
        when(userPreferencesRepository.save(any(UserPreferences.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesResponse response =
                userPreferencesService.updatePreferences("testuser", fullRequest(true));

        ArgumentCaptor<UserPreferences> captor = ArgumentCaptor.forClass(UserPreferences.class);
        verify(userPreferencesRepository).save(captor.capture());
        assertEquals(7L, captor.getValue().getUserId());
        assertTrue(response.isMarketing());
        assertTrue(response.isShowEmail());
    }

    @Test
    void updatePreferences_WithStoredRow_ShouldUpdateInPlace() {
        UserPreferences stored = new UserPreferences();
        stored.setId(3L);
        stored.setUserId(7L);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userPreferencesRepository.findByUserId(7L)).thenReturn(Optional.of(stored));
        when(userPreferencesRepository.save(any(UserPreferences.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesResponse response =
                userPreferencesService.updatePreferences("testuser", fullRequest(false));

        ArgumentCaptor<UserPreferences> captor = ArgumentCaptor.forClass(UserPreferences.class);
        verify(userPreferencesRepository).save(captor.capture());
        assertEquals(3L, captor.getValue().getId());
        assertFalse(response.isEmailNotifications());
        assertFalse(response.isNewMessages());
    }

    @Test
    void getPreferences_WithUnknownUser_ShouldThrowNotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userPreferencesService.getPreferences("ghost"));
    }
}
