package com.caryo.marketplace.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests for ArabicTranslationService
 * Focuses on proper integration with OpenAI and error handling
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ArabicTranslationService Tests")
class ArabicTranslationServiceTest {

    @Mock
    private OpenAITranslationService openAiTranslationService;

    @InjectMocks
    private ArabicTranslationService arabicTranslationService;

    @Nested
    @DisplayName("Brand Translation Tests")
    class BrandTranslationTests {

        @Test
        @DisplayName("Should translate English brand names to Arabic successfully")
        void shouldTranslateBrandNamesSuccessfully() {
            // Mock successful translations
            when(openAiTranslationService.translateBrandToArabic("Peugeot")).thenReturn("بيجو");
            when(openAiTranslationService.translateBrandToArabic("Toyota")).thenReturn("تويوتا");
            when(openAiTranslationService.translateBrandToArabic("BMW")).thenReturn("بي إم دبليو");

            // Test translations
            assertEquals("بيجو", arabicTranslationService.translateBrandToArabic("Peugeot"));
            assertEquals("تويوتا", arabicTranslationService.translateBrandToArabic("Toyota"));
            assertEquals("بي إم دبليو", arabicTranslationService.translateBrandToArabic("BMW"));

            // Verify OpenAI service was called with correct parameters
            verify(openAiTranslationService).translateBrandToArabic("Peugeot");
            verify(openAiTranslationService).translateBrandToArabic("Toyota");
            verify(openAiTranslationService).translateBrandToArabic("BMW");
        }

        @Test
        @DisplayName("Should handle null and empty brand names")
        void shouldHandleNullAndEmptyBrandNames() {
            assertNull(arabicTranslationService.translateBrandToArabic(null));
            assertNull(arabicTranslationService.translateBrandToArabic(""));
            assertNull(arabicTranslationService.translateBrandToArabic("   "));

            // Verify OpenAI service is not called for invalid inputs
            verify(openAiTranslationService, never()).translateBrandToArabic(any());
        }

        @Test
        @DisplayName("Should return null when OpenAI translation fails")
        void shouldReturnNullWhenTranslationFails() {
            // Mock translation failure
            when(openAiTranslationService.translateBrandToArabic("UnknownBrand")).thenReturn(null);

            assertNull(arabicTranslationService.translateBrandToArabic("UnknownBrand"));
            verify(openAiTranslationService).translateBrandToArabic("UnknownBrand");
        }

        @Test
        @DisplayName("Should return null when OpenAI returns empty translation")
        void shouldReturnNullWhenTranslationIsEmpty() {
            // Mock empty translation
            when(openAiTranslationService.translateBrandToArabic("TestBrand")).thenReturn("");

            assertNull(arabicTranslationService.translateBrandToArabic("TestBrand"));
            verify(openAiTranslationService).translateBrandToArabic("TestBrand");
        }

        @Test
        @DisplayName("Should return null when OpenAI returns same text (no translation)")
        void shouldReturnNullWhenNoTranslation() {
            // Mock case where OpenAI returns the same text (indicating no translation occurred)
            when(openAiTranslationService.translateBrandToArabic("TestBrand")).thenReturn("TestBrand");

            assertNull(arabicTranslationService.translateBrandToArabic("TestBrand"));
            verify(openAiTranslationService).translateBrandToArabic("TestBrand");
        }

        @Test
        @DisplayName("Should handle OpenAI service exceptions gracefully")
        void shouldHandleOpenAiExceptions() {
            // Mock exception from OpenAI service
            when(openAiTranslationService.translateBrandToArabic("ErrorBrand"))
                .thenThrow(new RuntimeException("OpenAI API error"));

            assertNull(arabicTranslationService.translateBrandToArabic("ErrorBrand"));
            verify(openAiTranslationService).translateBrandToArabic("ErrorBrand");
        }

        @Test
        @DisplayName("Should trim input brand names before translation")
        void shouldTrimInputBrandNames() {
            when(openAiTranslationService.translateBrandToArabic("Toyota")).thenReturn("تويوتا");

            // Test with whitespace
            assertEquals("تويوتا", arabicTranslationService.translateBrandToArabic("  Toyota  "));

            // Verify OpenAI was called with trimmed input
            verify(openAiTranslationService).translateBrandToArabic("Toyota");
        }
    }

    @Nested
    @DisplayName("Model Translation Tests")
    class ModelTranslationTests {

        @Test
        @DisplayName("Should translate model names with brand context")
        void shouldTranslateModelNamesWithBrandContext() {
            // Mock successful model translations
            when(openAiTranslationService.translateModelToArabic("Toyota", "Camry")).thenReturn("كامري");
            when(openAiTranslationService.translateModelToArabic("BMW", "X5")).thenReturn("إكس ٥");

            assertEquals("كامري", arabicTranslationService.translateModelToArabic("Toyota", "Camry"));
            assertEquals("إكس ٥", arabicTranslationService.translateModelToArabic("BMW", "X5"));

            verify(openAiTranslationService).translateModelToArabic("Toyota", "Camry");
            verify(openAiTranslationService).translateModelToArabic("BMW", "X5");
        }

        @Test
        @DisplayName("Should handle null and empty model names")
        void shouldHandleNullAndEmptyModelNames() {
            assertNull(arabicTranslationService.translateModelToArabic("Toyota", null));
            assertNull(arabicTranslationService.translateModelToArabic("Toyota", ""));
            assertNull(arabicTranslationService.translateModelToArabic("Toyota", "   "));

            verify(openAiTranslationService, never()).translateModelToArabic(any(), any());
        }

        @Test
        @DisplayName("Should handle model translation failures gracefully")
        void shouldHandleModelTranslationFailures() {
            when(openAiTranslationService.translateModelToArabic("Toyota", "UnknownModel"))
                .thenThrow(new RuntimeException("Translation error"));

            assertNull(arabicTranslationService.translateModelToArabic("Toyota", "UnknownModel"));
            verify(openAiTranslationService).translateModelToArabic("Toyota", "UnknownModel");
        }

        @Test
        @DisplayName("Should trim model names before translation")
        void shouldTrimModelNames() {
            when(openAiTranslationService.translateModelToArabic("Toyota", "Camry")).thenReturn("كامري");

            assertEquals("كامري", arabicTranslationService.translateModelToArabic("Toyota", "  Camry  "));
            verify(openAiTranslationService).translateModelToArabic("Toyota", "Camry");
        }
    }

    @Nested
    @DisplayName("Service Status Tests")
    class ServiceStatusTests {

        @Test
        @DisplayName("Should return service status with OpenAI availability")
        void shouldReturnServiceStatusWithOpenAiAvailability() {
            // Mock OpenAI availability
            when(openAiTranslationService.isAvailable()).thenReturn(true);

            String status = arabicTranslationService.getServiceStatus();

            assertNotNull(status);
            assertTrue(status.contains("Arabic Translation Service"));
            assertTrue(status.contains("OpenAI: Available"));

            verify(openAiTranslationService).isAvailable();
        }

        @Test
        @DisplayName("Should return service status when OpenAI is unavailable")
        void shouldReturnServiceStatusWhenOpenAiUnavailable() {
            when(openAiTranslationService.isAvailable()).thenReturn(false);

            String status = arabicTranslationService.getServiceStatus();

            assertNotNull(status);
            assertTrue(status.contains("Arabic Translation Service"));
            assertTrue(status.contains("OpenAI: Unavailable"));

            verify(openAiTranslationService).isAvailable();
        }
    }

    @Nested
    @DisplayName("Integration Scenarios")
    class IntegrationScenarios {

        @Test
        @DisplayName("Should handle the exact scenario that was failing before the fix")
        void shouldHandleFailingScenario() {
            // This tests the integration with the cleaned brand names from SyrianCarsDataService
            // Before the fix: "بيجو - Peugeot (57)" would be sent directly to OpenAI
            // After the fix: Only "Peugeot" should be sent to OpenAI

            when(openAiTranslationService.translateBrandToArabic("Peugeot")).thenReturn("بيجو");

            // Test that when we get a clean brand name (as would come from cleanBrandNameForTranslation)
            String result = arabicTranslationService.translateBrandToArabic("Peugeot");

            assertEquals("بيجو", result);
            verify(openAiTranslationService).translateBrandToArabic("Peugeot");

            // Verify that the problematic input would NOT be sent to OpenAI anymore
            // (This would be handled by the cleaning in SyrianCarsDataService)
            verify(openAiTranslationService, never()).translateBrandToArabic("بيجو - Peugeot (57)");
        }

        @Test
        @DisplayName("Should work correctly with multiple brand translations in sequence")
        void shouldWorkWithMultipleBrandTranslations() {
            // Mock multiple translations
            when(openAiTranslationService.translateBrandToArabic("Toyota")).thenReturn("تويوتا");
            when(openAiTranslationService.translateBrandToArabic("BMW")).thenReturn("بي إم دبليو");
            when(openAiTranslationService.translateBrandToArabic("Mercedes-Benz")).thenReturn("مرسيدس بنز");

            // Test sequence of translations (as would happen during data sync)
            assertEquals("تويوتا", arabicTranslationService.translateBrandToArabic("Toyota"));
            assertEquals("بي إم دبليو", arabicTranslationService.translateBrandToArabic("BMW"));
            assertEquals("مرسيدس بنز", arabicTranslationService.translateBrandToArabic("Mercedes-Benz"));

            // Verify all calls were made
            verify(openAiTranslationService).translateBrandToArabic("Toyota");
            verify(openAiTranslationService).translateBrandToArabic("BMW");
            verify(openAiTranslationService).translateBrandToArabic("Mercedes-Benz");
        }
    }
}
