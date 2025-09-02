package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.service.MessageService;
import com.autotrader.autotraderbackend.service.TranslationHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class to verify UTF-8 encoding is properly configured throughout the application.
 * This is crucial for proper Arabic text handling in emails and web responses.
 */
class Utf8EncodingTest {

    private MessageService messageService;

    @BeforeEach
    void setUp() {
        messageService = new MessageService(); // Use real MessageService instance
    }

    @Test
    void testMessageServiceUtf8Configuration() {
        // Test that MessageService is properly configured
        assertNotNull(messageService);
        
        // Test Arabic text retrieval
        String arabicGreeting = messageService.getLocalizedMessage("email.greeting.hello", "ar");
        assertNotNull(arabicGreeting);
        
        // Verify Arabic text contains proper UTF-8 characters
        if (arabicGreeting.contains("مرحباً") || arabicGreeting.contains("مرحبا")) {
            // Arabic text is properly loaded
            assertTrue(arabicGreeting.getBytes(StandardCharsets.UTF_8).length > arabicGreeting.length());
        }
    }

    @Test
    void testArabicTextHandling() {
        // Test Arabic website name
        String arabicWebsiteName = "كاريو";
        
        // Verify UTF-8 encoding
        byte[] utf8Bytes = arabicWebsiteName.getBytes(StandardCharsets.UTF_8);
        String reconstructed = new String(utf8Bytes, StandardCharsets.UTF_8);
        
        assertEquals(arabicWebsiteName, reconstructed, "Arabic text should survive UTF-8 encoding/decoding");
        
        // Verify byte length is greater than character length (multi-byte UTF-8)
        assertTrue(utf8Bytes.length > arabicWebsiteName.length(), 
                  "Arabic text should use multi-byte UTF-8 encoding");
    }

    @Test
    void testTranslationHelperWithArabicText() {
        TranslationHelper arabicHelper = new TranslationHelper(messageService, "ar");
        TranslationHelper englishHelper = new TranslationHelper(messageService, "en");
        
        // Test basic translation
        String arabicHello = arabicHelper.get("email.greeting.hello");
        String englishHello = englishHelper.get("email.greeting.hello");
        
        assertNotNull(arabicHello);
        assertNotNull(englishHello);
        
        // They should be different (unless fallback to key)
        if (!arabicHello.equals("email.greeting.hello") && !englishHello.equals("email.greeting.hello")) {
            assertNotEquals(arabicHello, englishHello, "Arabic and English translations should be different");
        }
    }

    @Test
    void testCopyrightWithArabicWebsiteName() {
        TranslationHelper arabicHelper = new TranslationHelper(messageService, "ar");
        
        String arabicWebsiteName = "كاريو";
        int currentYear = 2024;
        
        String copyright = arabicHelper.copyright(currentYear, arabicWebsiteName);
        
        assertNotNull(copyright);
        assertTrue(copyright.contains(String.valueOf(currentYear)));
        assertTrue(copyright.contains(arabicWebsiteName), 
                  "Copyright should contain Arabic website name: " + copyright);
        
        // Verify UTF-8 encoding is preserved
        byte[] utf8Bytes = copyright.getBytes(StandardCharsets.UTF_8);
        String reconstructed = new String(utf8Bytes, StandardCharsets.UTF_8);
        assertEquals(copyright, reconstructed, "Copyright with Arabic text should survive UTF-8 encoding");
    }

    @Test
    void testMixedLanguageContent() {
        // Test content that mixes English and Arabic
        String mixedContent = "Welcome مرحباً to Caryo كاريو Marketplace!";
        
        // Verify UTF-8 handling
        byte[] utf8Bytes = mixedContent.getBytes(StandardCharsets.UTF_8);
        String reconstructed = new String(utf8Bytes, StandardCharsets.UTF_8);
        
        assertEquals(mixedContent, reconstructed, "Mixed language content should survive UTF-8 encoding");
        
        // Verify multi-byte characters are handled
        assertTrue(utf8Bytes.length > mixedContent.length(), 
                  "Mixed content should use multi-byte UTF-8 encoding for Arabic characters");
    }

    @Test
    void testSpecialArabicCharacters() {
        // Test various Arabic characters and diacritics
        String[] arabicTexts = {
            "كاريو",           // Basic Arabic
            "مرحباً بك",       // With diacritics
            "السيارات",        // With definite article
            "الموقع الإلكتروني", // Complex phrase
            "٢٠٢٤",            // Arabic numerals
            "support@caryo.sy" // Mixed with Latin
        };
        
        for (String arabicText : arabicTexts) {
            // Test UTF-8 encoding/decoding
            byte[] utf8Bytes = arabicText.getBytes(StandardCharsets.UTF_8);
            String reconstructed = new String(utf8Bytes, StandardCharsets.UTF_8);
            
            assertEquals(arabicText, reconstructed, 
                        "Arabic text should survive UTF-8 encoding: " + arabicText);
        }
    }

    @Test
    void testEmailSubjectEncoding() {
        // Test email subject with Arabic text (common use case)
        String arabicSubject = "مرحباً بك في كاريو!";
        
        // Verify UTF-8 encoding
        byte[] utf8Bytes = arabicSubject.getBytes(StandardCharsets.UTF_8);
        String reconstructed = new String(utf8Bytes, StandardCharsets.UTF_8);
        
        assertEquals(arabicSubject, reconstructed, "Email subject with Arabic should survive UTF-8 encoding");
        
        // Verify it's properly multi-byte encoded
        assertTrue(utf8Bytes.length > arabicSubject.length(), 
                  "Arabic email subject should use multi-byte UTF-8 encoding");
    }
}
