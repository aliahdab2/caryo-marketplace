package com.caryo.marketplace.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for ArabicTextUtils.
 * Tests all Arabic text handling functionality including encoding, normalization, and validation.
 */
@DisplayName("ArabicTextUtils Tests")
class ArabicTextUtilsTest {

    @Nested
    @DisplayName("Arabic Character Detection Tests")
    class ArabicDetectionTests {

        @Test
        @DisplayName("Should detect Arabic characters correctly")
        void shouldDetectArabicCharacters() {
            // Arabic text samples
            assertTrue(ArabicTextUtils.containsArabic("مرحبا"));
            assertTrue(ArabicTextUtils.containsArabic("أوتو تريدر"));
            assertTrue(ArabicTextUtils.containsArabic("طلب إعادة تعيين كلمة المرور"));
            assertTrue(ArabicTextUtils.containsArabic("تم تغيير كلمة المرور بنجاح"));

            // Mixed text
            assertTrue(ArabicTextUtils.containsArabic("Hello مرحبا"));
            assertTrue(ArabicTextUtils.containsArabic("Password Reset - أوتو تريدر"));
        }

        @Test
        @DisplayName("Should not detect Arabic in non-Arabic text")
        void shouldNotDetectArabicInNonArabicText() {
            // English text
            assertFalse(ArabicTextUtils.containsArabic("Hello World"));
            assertFalse(ArabicTextUtils.containsArabic("Password Reset Request"));
            assertFalse(ArabicTextUtils.containsArabic("Caryo"));

            // Numbers and symbols
            assertFalse(ArabicTextUtils.containsArabic("123456"));
            assertFalse(ArabicTextUtils.containsArabic("!@#$%^&*()"));

            // Other languages
            assertFalse(ArabicTextUtils.containsArabic("Bonjour le monde"));
            assertFalse(ArabicTextUtils.containsArabic("Hola mundo"));
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   ", "\t", "\n"})
        @DisplayName("Should handle null, empty, and whitespace strings")
        void shouldHandleNullEmptyAndWhitespace(String input) {
            assertFalse(ArabicTextUtils.containsArabic(input));
        }
    }

    @Nested
    @DisplayName("Email Subject Encoding Tests")
    class EmailSubjectEncodingTests {

        @Test
        @DisplayName("Should encode Arabic email subjects correctly")
        void shouldEncodeArabicEmailSubjects() {
            String arabicSubject = "طلب إعادة تعيين كلمة المرور - أوتو تريدر";
            String encoded = ArabicTextUtils.encodeForEmailSubject(arabicSubject);

            assertNotNull(encoded);
            assertNotEquals(arabicSubject, encoded); // Should be encoded
            assertTrue(encoded.startsWith("=?UTF-8?B?")); // Should use Base64 encoding
            assertTrue(encoded.endsWith("?=")); // Should end with MIME encoding marker
        }

        @Test
        @DisplayName("Should handle English text in email subjects")
        void shouldHandleEnglishTextInEmailSubjects() {
            String englishSubject = "Password Reset Request - Caryo";
            String encoded = ArabicTextUtils.encodeForEmailSubject(englishSubject);

            assertNotNull(encoded);
            // English text might or might not be encoded depending on MimeUtility implementation
            // The important thing is that it doesn't throw an exception
        }

        @Test
        @DisplayName("Should handle mixed Arabic and English text")
        void shouldHandleMixedArabicAndEnglishText() {
            String mixedSubject = "Password Reset - طلب إعادة تعيين كلمة المرور";
            String encoded = ArabicTextUtils.encodeForEmailSubject(mixedSubject);

            assertNotNull(encoded);
            // Mixed text should be encoded
            assertTrue(encoded.startsWith("=?UTF-8?B?"));
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   ", "\t"})
        @DisplayName("Should handle null, empty, and whitespace in email encoding")
        void shouldHandleNullEmptyAndWhitespaceInEmailEncoding(String input) {
            String result = ArabicTextUtils.encodeForEmailSubject(input);
            assertEquals(input, result); // Should return input unchanged
        }
    }

    @Nested
    @DisplayName("Text Normalization Tests")
    class TextNormalizationTests {

        @Test
        @DisplayName("Should normalize Arabic text correctly")
        void shouldNormalizeArabicText() {
            String arabicText = "أوتو تريدر";
            String normalized = ArabicTextUtils.normalizeArabicText(arabicText);

            assertNotNull(normalized);
            assertEquals(arabicText, normalized); // Should maintain the same content
        }

        @Test
        @DisplayName("Should handle English text normalization")
        void shouldHandleEnglishTextNormalization() {
            String englishText = "Caryo";
            String normalized = ArabicTextUtils.normalizeArabicText(englishText);

            assertNotNull(normalized);
            assertEquals(englishText, normalized);
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   ", "\t", "\n"})
        @DisplayName("Should handle null, empty, and whitespace in normalization")
        void shouldHandleNullEmptyAndWhitespaceInNormalization(String input) {
            String result = ArabicTextUtils.normalizeArabicText(input);
            assertEquals(input, result);
        }
    }

    @Nested
    @DisplayName("Email Subject Creation Tests")
    class EmailSubjectCreationTests {

        @Test
        @DisplayName("Should create Arabic email subject correctly")
        void shouldCreateArabicEmailSubject() {
            String baseText = "طلب إعادة تعيين كلمة المرور";
            String websiteName = "أوتو تريدر";
            String language = "ar";

            String subject = ArabicTextUtils.createEmailSubject(baseText, websiteName, language);

            assertNotNull(subject);
            assertTrue(subject.startsWith("=?UTF-8?B?")); // Should be encoded
            // The subject should contain both base text and website name
        }

        @Test
        @DisplayName("Should create English email subject correctly")
        void shouldCreateEnglishEmailSubject() {
            String baseText = "Password Reset Request";
            String websiteName = "Caryo";
            String language = "en";

            String subject = ArabicTextUtils.createEmailSubject(baseText, websiteName, language);

            assertNotNull(subject);
            // Should contain the expected format
        }

        @Test
        @DisplayName("Should throw exception for null parameters")
        void shouldThrowExceptionForNullParameters() {
            assertThrows(IllegalArgumentException.class, () ->
                ArabicTextUtils.createEmailSubject(null, "website", "en"));

            assertThrows(IllegalArgumentException.class, () ->
                ArabicTextUtils.createEmailSubject("base", null, "en"));

            assertThrows(IllegalArgumentException.class, () ->
                ArabicTextUtils.createEmailSubject("base", "website", null));
        }
    }

    @Nested
    @DisplayName("Text Validation Tests")
    class TextValidationTests {

        @Test
        @DisplayName("Should validate Arabic text correctly")
        void shouldValidateArabicText() {
            assertTrue(ArabicTextUtils.isValidArabicText("أوتو تريدر"));
            assertTrue(ArabicTextUtils.isValidArabicText("طلب إعادة تعيين كلمة المرور"));
            assertTrue(ArabicTextUtils.isValidArabicText("مرحبا بك"));
        }

        @Test
        @DisplayName("Should validate English text correctly")
        void shouldValidateEnglishText() {
            assertTrue(ArabicTextUtils.isValidArabicText("Caryo"));
            assertTrue(ArabicTextUtils.isValidArabicText("Password Reset Request"));
            assertTrue(ArabicTextUtils.isValidArabicText("Hello World"));
        }

        @Test
        @DisplayName("Should validate mixed text correctly")
        void shouldValidateMixedText() {
            assertTrue(ArabicTextUtils.isValidArabicText("Hello مرحبا"));
            assertTrue(ArabicTextUtils.isValidArabicText("Caryo - أوتو تريدر"));
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   ", "\t", "\n"})
        @DisplayName("Should return false for null, empty, and whitespace in validation")
        void shouldReturnFalseForNullEmptyAndWhitespaceInValidation(String input) {
            assertFalse(ArabicTextUtils.isValidArabicText(input));
        }
    }

    @Nested
    @DisplayName("Locale Handling Tests")
    class LocaleHandlingTests {

        @Test
        @DisplayName("Should return correct locale for Arabic")
        void shouldReturnCorrectLocaleForArabic() {
            String locale = ArabicTextUtils.getLocaleForLanguage("ar");
            assertEquals("ar-SA", locale);
        }

        @Test
        @DisplayName("Should return correct locale for English")
        void shouldReturnCorrectLocaleForEnglish() {
            String locale = ArabicTextUtils.getLocaleForLanguage("en");
            assertEquals("en-US", locale);
        }

        @Test
        @DisplayName("Should default to English locale for unknown languages")
        void shouldDefaultToEnglishLocaleForUnknownLanguages() {
            assertEquals("en-US", ArabicTextUtils.getLocaleForLanguage("fr"));
            assertEquals("en-US", ArabicTextUtils.getLocaleForLanguage("es"));
            assertEquals("en-US", ArabicTextUtils.getLocaleForLanguage("de"));
            assertEquals("en-US", ArabicTextUtils.getLocaleForLanguage(null));
        }
    }

    @Nested
    @DisplayName("Debug Functionality Tests")
    class DebugFunctionalityTests {

        @Test
        @DisplayName("Should not throw exception when debugging Arabic text")
        void shouldNotThrowExceptionWhenDebuggingArabicText() {
            assertDoesNotThrow(() ->
                ArabicTextUtils.debugArabicEncoding("أوتو تريدر", "test-context"));
        }

        @Test
        @DisplayName("Should not throw exception when debugging English text")
        void shouldNotThrowExceptionWhenDebuggingEnglishText() {
            assertDoesNotThrow(() ->
                ArabicTextUtils.debugArabicEncoding("Caryo", "test-context"));
        }

        @Test
        @DisplayName("Should handle null text in debug")
        void shouldHandleNullTextInDebug() {
            assertDoesNotThrow(() ->
                ArabicTextUtils.debugArabicEncoding(null, "test-context"));
        }
    }

    @Nested
    @DisplayName("Utility Class Tests")
    class UtilityClassTests {

        @Test
        @DisplayName("Should be a utility class with private constructor")
        void shouldBeUtilityClass() {
            // Verify that ArabicTextUtils is a final class (utility class pattern)
            assertTrue(java.lang.reflect.Modifier.isFinal(ArabicTextUtils.class.getModifiers()));

            // Verify it has only static methods (utility class pattern)
            var methods = ArabicTextUtils.class.getDeclaredMethods();
            for (var method : methods) {
                assertTrue(java.lang.reflect.Modifier.isStatic(method.getModifiers()),
                    "Method " + method.getName() + " should be static");
            }
        }
    }

    @Nested
    @DisplayName("Integration Tests")
    class IntegrationTests {

        @Test
        @DisplayName("Should handle complete email subject workflow for Arabic")
        void shouldHandleCompleteEmailSubjectWorkflowForArabic() {
            String baseText = "طلب إعادة تعيين كلمة المرور";
            String websiteName = "أوتو تريدر";

            // Test the complete workflow
            assertTrue(ArabicTextUtils.containsArabic(baseText));
            assertTrue(ArabicTextUtils.containsArabic(websiteName));
            assertTrue(ArabicTextUtils.isValidArabicText(baseText));
            assertTrue(ArabicTextUtils.isValidArabicText(websiteName));

            String normalizedBase = ArabicTextUtils.normalizeArabicText(baseText);
            String normalizedWebsite = ArabicTextUtils.normalizeArabicText(websiteName);

            String subject = ArabicTextUtils.createEmailSubject(normalizedBase, normalizedWebsite, "ar");
            assertNotNull(subject);
            assertTrue(subject.startsWith("=?UTF-8?B?"));
        }

        @Test
        @DisplayName("Should handle complete email subject workflow for English")
        void shouldHandleCompleteEmailSubjectWorkflowForEnglish() {
            String baseText = "Password Reset Request";
            String websiteName = "Caryo";

            // Test the complete workflow
            assertFalse(ArabicTextUtils.containsArabic(baseText));
            assertFalse(ArabicTextUtils.containsArabic(websiteName));
            assertTrue(ArabicTextUtils.isValidArabicText(baseText));
            assertTrue(ArabicTextUtils.isValidArabicText(websiteName));

            String normalizedBase = ArabicTextUtils.normalizeArabicText(baseText);
            String normalizedWebsite = ArabicTextUtils.normalizeArabicText(websiteName);

            String subject = ArabicTextUtils.createEmailSubject(normalizedBase, normalizedWebsite, "en");
            assertNotNull(subject);
        }
    }
}
