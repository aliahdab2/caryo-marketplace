package com.caryo.marketplace.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Full update of the user's notification and privacy preferences (PUT semantics —
 * every field is required).
 */
@Getter
@Setter
@NoArgsConstructor
public class UserPreferencesRequest {

    @NotNull
    private Boolean emailNotifications;

    @NotNull
    private Boolean pushNotifications;

    @NotNull
    private Boolean newMessages;

    @NotNull
    private Boolean listingExpiry;

    @NotNull
    private Boolean priceDrops;

    @NotNull
    private Boolean newsletter;

    @NotNull
    private Boolean marketing;

    @NotNull
    private Boolean showPhone;

    @NotNull
    private Boolean showEmail;
}
