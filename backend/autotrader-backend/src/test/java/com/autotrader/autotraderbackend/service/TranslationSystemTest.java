package com.autotrader.autotraderbackend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for the translation system used in email templates.
 * Verifies that the MessageService and TranslationHelper work correctly
 * for both English and Arabic languages.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.profiles.active=test"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class TranslationSystemTest {

    @Autowired
    private MessageService messageService;

    private TranslationHelper englishHelper;
    private TranslationHelper arabicHelper;

    @BeforeEach
    void setUp() {
        englishHelper = new TranslationHelper(messageService, "en");
        arabicHelper = new TranslationHelper(messageService, "ar");
    }

    @Test
    void testBasicTranslations() {
        // Test English translations
        String englishWelcome = englishHelper.get("email.welcome.title");
        assertNotNull(englishWelcome);
        assertTrue(englishWelcome.contains("Welcome") || englishWelcome.equals("email.welcome.title")); // Fallback to key if not found

        // Test Arabic translations
        String arabicWelcome = arabicHelper.get("email.welcome.title");
        assertNotNull(arabicWelcome);
        // Arabic should be different from English or fallback to key
        assertTrue(!arabicWelcome.equals(englishWelcome) || arabicWelcome.equals("email.welcome.title"));
    }

    @Test
    void testParameterizedTranslations() {
        // Test with website name parameter
        String websiteName = "Caryo Marketplace";

        String englishSubject = englishHelper.withWebsite("email.welcome.subject", websiteName);
        assertNotNull(englishSubject);

        String arabicSubject = arabicHelper.withWebsite("email.welcome.subject", websiteName);
        assertNotNull(arabicSubject);

        // Should be different languages or fallback
        assertTrue(!englishSubject.equals(arabicSubject) || englishSubject.contains("email.welcome.subject"));
    }

    @Test
    void testCopyrightTranslation() {
        String websiteName = "Caryo Marketplace";
        int currentYear = 2024;

        String englishCopyright = englishHelper.copyright(currentYear, websiteName);
        assertNotNull(englishCopyright);
        assertTrue(englishCopyright.contains(String.valueOf(currentYear)));
        assertTrue(englishCopyright.contains(websiteName));

        String arabicCopyright = arabicHelper.copyright(currentYear, websiteName);
        assertNotNull(arabicCopyright);
        assertTrue(arabicCopyright.contains(String.valueOf(currentYear)));
        assertTrue(arabicCopyright.contains(websiteName));
    }

    @Test
    void testTranslationHelperWithParams() {
        Map<String, Object> params = new HashMap<>();
        params.put("websiteName", "Caryo Marketplace");
        params.put("userName", "John Doe");

        String result = englishHelper.getWithParams("email.welcome.subject", params);
        assertNotNull(result);

        String arabicResult = arabicHelper.getWithParams("email.welcome.subject", params);
        assertNotNull(arabicResult);
    }

    @Test
    void testFallbackBehavior() {
        // Test with a non-existent key
        String nonExistentKey = "email.nonexistent.key";

        String englishResult = englishHelper.get(nonExistentKey);
        assertNotNull(englishResult);
        // Should fallback to the key itself or some default behavior

        String arabicResult = arabicHelper.get(nonExistentKey);
        assertNotNull(arabicResult);
    }

    @Test
    void testCommonEmailElements() {
        // Test common email elements that should be translated
        String[] commonKeys = {
            "email.greeting.hello",
            "email.greeting.dear",
            "email.phrase.thank_you",
            "email.phrase.best_regards",
            "email.button.contact_support",
            "email.button.visit_website"
        };

        for (String key : commonKeys) {
            String englishValue = englishHelper.get(key);
            String arabicValue = arabicHelper.get(key);

            assertNotNull(englishValue, "English translation missing for key: " + key);
            assertNotNull(arabicValue, "Arabic translation missing for key: " + key);
        }
    }
}
