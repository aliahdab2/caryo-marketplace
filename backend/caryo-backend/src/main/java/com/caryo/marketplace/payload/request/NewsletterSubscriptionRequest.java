package com.caryo.marketplace.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for newsletter subscription.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsletterSubscriptionRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Size(max = 2, message = "Language code must be 2 characters")
    private String preferredLanguage = "en";

    @Size(max = 50, message = "Source must not exceed 50 characters")
    private String source = "homepage";
}
