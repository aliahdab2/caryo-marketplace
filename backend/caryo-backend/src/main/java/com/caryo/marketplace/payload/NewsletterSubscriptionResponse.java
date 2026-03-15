package com.caryo.marketplace.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload for newsletter subscription operations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsletterSubscriptionResponse {

    private boolean success;
    private String message;
    private String email;
    private boolean alreadySubscribed;
    private boolean requiresConfirmation;

    public static NewsletterSubscriptionResponse success(String email, String message) {
        return new NewsletterSubscriptionResponse(true, message, email, false, true);
    }

    public static NewsletterSubscriptionResponse alreadyExists(String email, String message) {
        return new NewsletterSubscriptionResponse(true, message, email, true, false);
    }

    public static NewsletterSubscriptionResponse error(String message) {
        return new NewsletterSubscriptionResponse(false, message, null, false, false);
    }
}
