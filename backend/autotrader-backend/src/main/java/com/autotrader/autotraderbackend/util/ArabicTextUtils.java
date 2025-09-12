package com.autotrader.autotraderbackend.util;

import jakarta.mail.internet.MimeUtility;
import lombok.extern.slf4j.Slf4j;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * Centralized utility for handling Arabic text encoding across the application.
 *
 * <p>This utility provides consistent Arabic text handling for:</p>
 * <ul>
 *   <li>Email subjects and content</li>
 *   <li>Message localization</li>
 *   <li>Text validation and normalization</li>
 *   <li>Character encoding for different contexts</li>
 * </ul>
 *
 * <p>All Arabic text handling should use this utility to ensure consistency
 * and proper encoding throughout the application.</p>
 *
 * @since 1.0
 */
@Slf4j
public final class ArabicTextUtils {


    
    private static final Pattern ARABIC_PATTERN = Pattern.compile("\\p{InArabic}");
    
    // Private constructor to prevent instantiation
    private ArabicTextUtils() {
        throw new UnsupportedOperationException("ArabicTextUtils is a utility class and cannot be instantiated");
    }
    
    /**
     * Checks if a string contains Arabic characters.
     * 
     * @param text The text to check
     * @return true if the text contains Arabic characters, false otherwise
     */
    public static boolean containsArabic(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        return ARABIC_PATTERN.matcher(text).find();
    }
    
    /**
     * Properly encodes text for email subjects using MimeUtility.
     * This is the standard way to handle Arabic text in email subjects.
     * 
     * @param text The text to encode
     * @return Properly encoded text for email subjects
     */
    public static String encodeForEmailSubject(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }
        
        try {
            // Use MimeUtility with Base64 encoding for Arabic text
            return MimeUtility.encodeText(text, StandardCharsets.UTF_8.name(), "B");
        } catch (Exception e) {
            log.warn("Failed to encode text for email subject: {}", e.getMessage());
            return text; // Fallback to original text
        }
    }
    
    /**
     * Normalizes Arabic text for consistent handling.
     * 
     * @param text The text to normalize
     * @return Normalized Arabic text
     */
    public static String normalizeArabicText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }
        
        // Ensure proper UTF-8 encoding
        return new String(text.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
    }
    
    /**
     * Creates a localized subject for emails with proper Arabic encoding.
     * 
     * @param baseText The base text (e.g., "Password Reset Request")
     * @param websiteName The website name to append
     * @param language The language code ("en" or "ar")
     * @return Properly encoded subject for emails
     */
    public static String createEmailSubject(String baseText, String websiteName, String language) {
        if (baseText == null || websiteName == null || language == null) {
            throw new IllegalArgumentException("All parameters must be non-null");
        }
        
        String subject;
        if ("ar".equals(language)) {
            // For Arabic, concatenate with proper spacing
            subject = baseText + " - " + websiteName;
        } else {
            // For English, use standard format
            subject = baseText + " - " + websiteName;
        }
        
        // Encode the subject for email
        return encodeForEmailSubject(subject);
    }
    
    /**
     * Validates that text is properly formatted for Arabic content.
     * 
     * @param text The text to validate
     * @return true if the text is valid for Arabic content
     */
    public static boolean isValidArabicText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        
        // Check if text contains Arabic characters
        if (!containsArabic(text)) {
            return true; // Non-Arabic text is also valid
        }
        
        // Validate UTF-8 encoding
        try {
            byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
            String decoded = new String(bytes, StandardCharsets.UTF_8);
            return text.equals(decoded);
        } catch (Exception e) {
            log.warn("Invalid Arabic text encoding: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Gets the appropriate locale for Arabic text processing.
     * 
     * @param language The language code
     * @return The appropriate locale string
     */
    public static String getLocaleForLanguage(String language) {
        if ("ar".equals(language)) {
            return "ar-SA";
        } else {
            return "en-US";
        }
    }
    
    /**
     * Debug method to log Arabic text encoding information.
     * 
     * @param text The text to debug
     * @param context The context where the text is used
     */
    public static void debugArabicEncoding(String text, String context) {
        if (text == null) {
            log.debug("{}: Text is null", context);
            return;
        }
        
        log.debug("{}: Text='{}'", context, text);
        log.debug("{}: Contains Arabic: {}", context, containsArabic(text));
        log.debug("{}: UTF-8 bytes: {}", context, 
            java.util.Arrays.toString(text.getBytes(StandardCharsets.UTF_8)));
        log.debug("{}: Length: {}", context, text.length());
    }
}
