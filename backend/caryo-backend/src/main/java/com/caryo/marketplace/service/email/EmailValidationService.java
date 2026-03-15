package com.caryo.marketplace.service.email;

import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

/**
 * Service responsible for email input validation.
 * Validates email addresses, content, and various email-related inputs.
 */
@Service
@Slf4j
public class EmailValidationService {

    private static final List<String> SUPPORTED_LANGUAGES = Arrays.asList("en", "ar");

    /**
     * Validate inputs for templated emails.
     *
     * @throws IllegalArgumentException if validation fails
     */
    public void validateTemplatedEmailInputs(String to, String subject, String templateName, String language) {
        if (!StringUtils.hasText(to)) {
            throw new IllegalArgumentException("Email recipient cannot be null or empty");
        }
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("Email subject cannot be null or empty");
        }
        if (!StringUtils.hasText(templateName)) {
            throw new IllegalArgumentException("Template name cannot be null or empty");
        }
        validateLanguage(language);
    }

    /**
     * Validate inputs for simple emails.
     *
     * @throws IllegalArgumentException if validation fails
     */
    public void validateSimpleEmailInputs(String to, String subject, String text) {
        if (!StringUtils.hasText(to)) {
            throw new IllegalArgumentException("Email recipient cannot be null or empty");
        }
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("Email subject cannot be null or empty");
        }
        if (!StringUtils.hasText(text)) {
            throw new IllegalArgumentException("Email text cannot be null or empty");
        }
    }

    /**
     * Validate inputs for listing-related emails.
     *
     * @return true if inputs are valid, false otherwise
     */
    public boolean validateListingEmailInputs(User seller, CarListing listing, String language) {
        if (seller == null) {
            log.warn("Cannot send listing email: seller is null");
            return false;
        }
        if (!StringUtils.hasText(seller.getEmail())) {
            log.warn("Cannot send listing email: seller email is null or empty for user: {}", seller.getUsername());
            return false;
        }
        if (listing == null) {
            log.warn("Cannot send listing email: listing is null");
            return false;
        }
        validateLanguage(language);
        return true;
    }

    /**
     * Validate inputs for user-related emails.
     *
     * @return true if inputs are valid, false otherwise
     */
    public boolean validateUserEmailInputs(User user, String language) {
        if (user == null) {
            log.warn("Cannot send user email: user is null");
            return false;
        }
        if (!StringUtils.hasText(user.getEmail())) {
            log.warn("Cannot send user email: user email is null or empty for user: {}", user.getUsername());
            return false;
        }
        validateLanguage(language);
        return true;
    }

    /**
     * Validate inputs for contact form emails.
     *
     * @throws IllegalArgumentException if validation fails
     */
    public void validateContactFormInputs(String name, String email, String message, String language) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Contact form name cannot be null or empty");
        }
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Contact form email cannot be null or empty");
        }
        if (!StringUtils.hasText(message)) {
            throw new IllegalArgumentException("Contact form message cannot be null or empty");
        }
        validateLanguage(language);
    }

    /**
     * Validate inputs for contact form confirmation emails.
     *
     * @throws IllegalArgumentException if validation fails
     */
    public void validateContactFormConfirmationInputs(String name, String email, String language) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Contact form confirmation name cannot be null or empty");
        }
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Contact form confirmation email cannot be null or empty");
        }
        validateLanguage(language);
    }

    /**
     * Validate inputs for newsletter emails.
     *
     * @throws IllegalArgumentException if validation fails
     */
    public void validateNewsletterEmailInputs(String email, String language) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Newsletter email cannot be null or empty");
        }
        validateLanguage(language);
    }

    /**
     * Validate renewal days parameter.
     *
     * @throws IllegalArgumentException if validation fails
     */
    public void validateRenewalDays(int renewalDays) {
        if (renewalDays <= 0) {
            throw new IllegalArgumentException("Renewal days must be positive, got: " + renewalDays);
        }
        if (renewalDays > 365) {
            throw new IllegalArgumentException("Renewal days cannot exceed 365, got: " + renewalDays);
        }
    }

    /**
     * Validate password reset inputs.
     *
     * @throws IllegalArgumentException if validation fails
     */
    public void validatePasswordResetInputs(String email, String username, String resetUrl) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Email is required for password reset");
        }
        if (!StringUtils.hasText(username)) {
            throw new IllegalArgumentException("Username is required for password reset");
        }
        if (!StringUtils.hasText(resetUrl)) {
            throw new IllegalArgumentException("Reset URL is required for password reset");
        }
    }

    /**
     * Basic email format validation.
     *
     * @param email the email to validate
     * @return true if valid format, false otherwise
     */
    public boolean isValidEmailFormat(String email) {
        return StringUtils.hasText(email) &&
               email.contains("@") &&
               email.contains(".") &&
               email.length() > 5 &&
               !email.startsWith("@") &&
               !email.endsWith("@");
    }

    /**
     * Validate language parameter.
     *
     * @throws IllegalArgumentException if language is not supported
     */
    public void validateLanguage(String language) {
        if (!SUPPORTED_LANGUAGES.contains(language)) {
            throw new IllegalArgumentException("Unsupported language: " + language + ". Supported: " + SUPPORTED_LANGUAGES);
        }
    }

    /**
     * Get the default language.
     */
    public String getDefaultLanguage() {
        return "en";
    }

    /**
     * Check if a language is supported.
     */
    public boolean isLanguageSupported(String language) {
        return SUPPORTED_LANGUAGES.contains(language);
    }

    /**
     * Get the list of supported languages.
     */
    public List<String> getSupportedLanguages() {
        return SUPPORTED_LANGUAGES;
    }
}
