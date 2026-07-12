package com.caryo.marketplace.payload.response;

import com.caryo.marketplace.model.UserPreferences;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserPreferencesResponse {

    private boolean emailNotifications;
    private boolean pushNotifications;
    private boolean newMessages;
    private boolean listingExpiry;
    private boolean priceDrops;
    private boolean newsletter;
    private boolean marketing;
    private boolean showPhone;
    private boolean showEmail;

    public static UserPreferencesResponse fromEntity(UserPreferences preferences) {
        UserPreferencesResponse response = new UserPreferencesResponse();
        response.setEmailNotifications(preferences.isEmailNotifications());
        response.setPushNotifications(preferences.isPushNotifications());
        response.setNewMessages(preferences.isNewMessages());
        response.setListingExpiry(preferences.isListingExpiry());
        response.setPriceDrops(preferences.isPriceDrops());
        response.setNewsletter(preferences.isNewsletter());
        response.setMarketing(preferences.isMarketing());
        response.setShowPhone(preferences.isShowPhone());
        response.setShowEmail(preferences.isShowEmail());
        return response;
    }
}
