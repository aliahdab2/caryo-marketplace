package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.model.UserPreferences;
import com.caryo.marketplace.payload.request.UserPreferencesRequest;
import com.caryo.marketplace.payload.response.UserPreferencesResponse;
import com.caryo.marketplace.repository.UserPreferencesRepository;
import com.caryo.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for reading and updating per-user notification/privacy preferences.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserPreferencesService {

    private final UserPreferencesRepository userPreferencesRepository;
    private final UserRepository userRepository;

    /**
     * Get the user's preferences; users without a stored row get the defaults.
     */
    @Transactional(readOnly = true)
    public UserPreferencesResponse getPreferences(String username) {
        User user = findUser(username);
        UserPreferences preferences = userPreferencesRepository.findByUserId(user.getId())
                .orElseGet(UserPreferences::new);
        return UserPreferencesResponse.fromEntity(preferences);
    }

    /**
     * Full update (upsert) of the user's preferences.
     */
    @Transactional
    public UserPreferencesResponse updatePreferences(String username, UserPreferencesRequest request) {
        User user = findUser(username);
        UserPreferences preferences = userPreferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserPreferences created = new UserPreferences();
                    created.setUserId(user.getId());
                    return created;
                });

        preferences.setEmailNotifications(request.getEmailNotifications());
        preferences.setPushNotifications(request.getPushNotifications());
        preferences.setNewMessages(request.getNewMessages());
        preferences.setListingExpiry(request.getListingExpiry());
        preferences.setPriceDrops(request.getPriceDrops());
        preferences.setNewsletter(request.getNewsletter());
        preferences.setMarketing(request.getMarketing());
        preferences.setShowPhone(request.getShowPhone());
        preferences.setShowEmail(request.getShowEmail());

        UserPreferences saved = userPreferencesRepository.save(preferences);
        log.info("Updated preferences for user: {}", username);
        return UserPreferencesResponse.fromEntity(saved);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }
}
