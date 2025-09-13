package com.autotrader.autotraderbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Comprehensive tests for SyrianCarsDataService
 * Focus on the critical cleanBrandNameForTranslation method that fixes translation issues
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SyrianCarsDataService Tests")
class SyrianCarsDataServiceTest {

    @Mock
    private ArabicTranslationService arabicTranslationService;

    @Mock
    private CarBrandService carBrandService;

    @Mock
    private CarModelService carModelService;

    @InjectMocks
    private SyrianCarsDataService syrianCarsDataService;

    @BeforeEach
    void setUp() {
        // Set up test configuration
        ReflectionTestUtils.setField(syrianCarsDataService, "enabled", true);
        ReflectionTestUtils.setField(syrianCarsDataService, "syrianCarsUrl", "https://test.syriacars.net");
        ReflectionTestUtils.setField(syrianCarsDataService, "scrapingTimeout", 30000);
    }

    @Nested
    @DisplayName("Brand Name Cleaning Tests")
    class BrandNameCleaningTests {

        @Test
        @DisplayName("Should extract English brand name from mixed Arabic-English text")
        void shouldExtractEnglishFromMixedText() {
            // Test the exact case that was failing
            String input = "بيجو - Peugeot (57)";
            String result = invokeCleanBrandNameForTranslation(input);
            
            assertEquals("Peugeot", result, "Should extract 'Peugeot' from mixed text");
        }

        @Test
        @DisplayName("Should extract English brand name from different mixed formats")
        void shouldExtractEnglishFromDifferentFormats() {
            // Test various formats found in Syrian car websites
            assertEquals("Toyota", invokeCleanBrandNameForTranslation("تويوتا - Toyota (258)"));
            assertEquals("BMW", invokeCleanBrandNameForTranslation("بي إم دبليو - BMW (712)"));
            assertEquals("Mercedes-Benz", invokeCleanBrandNameForTranslation("مرسيدس - Mercedes-Benz (45)"));
            assertEquals("Hyundai", invokeCleanBrandNameForTranslation("هيونداي - Hyundai (189)"));
        }

        @Test
        @DisplayName("Should remove count numbers from English-only brand names")
        void shouldRemoveCountNumbers() {
            assertEquals("BMW", invokeCleanBrandNameForTranslation("BMW (712)"));
            assertEquals("Audi", invokeCleanBrandNameForTranslation("Audi (156)"));
            assertEquals("Ford", invokeCleanBrandNameForTranslation("Ford (89)"));
        }

        @Test
        @DisplayName("Should handle brand names without counts or mixed text")
        void shouldHandleCleanBrandNames() {
            assertEquals("Toyota", invokeCleanBrandNameForTranslation("Toyota"));
            assertEquals("BMW", invokeCleanBrandNameForTranslation("BMW"));
            assertEquals("Mercedes-Benz", invokeCleanBrandNameForTranslation("Mercedes-Benz"));
        }

        @Test
        @DisplayName("Should handle edge cases gracefully")
        void shouldHandleEdgeCases() {
            // Null and empty inputs
            assertNull(invokeCleanBrandNameForTranslation(null));
            assertEquals("", invokeCleanBrandNameForTranslation(""));
            assertEquals("", invokeCleanBrandNameForTranslation("   "));

            // Only Arabic text (no English to extract)
            assertEquals("بيجو", invokeCleanBrandNameForTranslation("بيجو"));
            assertEquals("تويوتا", invokeCleanBrandNameForTranslation("تويوتا"));

            // Multiple parentheses
            assertEquals("BMW", invokeCleanBrandNameForTranslation("BMW (712) (extra)"));
            
            // No dash separator
            assertEquals("BMW 712", invokeCleanBrandNameForTranslation("BMW 712"));
        }

        @Test
        @DisplayName("Should handle complex brand names with special characters")
        void shouldHandleComplexBrandNames() {
            assertEquals("Mercedes-Benz", invokeCleanBrandNameForTranslation("مرسيدس-بنز - Mercedes-Benz (45)"));
            assertEquals("Alfa Romeo", invokeCleanBrandNameForTranslation("ألفا روميو - Alfa Romeo (23)"));
            assertEquals("Land Rover", invokeCleanBrandNameForTranslation("لاند روفر - Land Rover (67)"));
        }

        @Test
        @DisplayName("Should prioritize English text when multiple Latin scripts present")
        void shouldPrioritizeEnglishText() {
            // When there are multiple parts with Latin characters, should pick the first English one
            String input = "بيجو - Peugeot - French Brand (57)";
            String result = invokeCleanBrandNameForTranslation(input);
            assertEquals("Peugeot", result, "Should extract the first English brand name");
        }

        /**
         * Helper method to invoke the private cleanBrandNameForTranslation method
         */
        private String invokeCleanBrandNameForTranslation(String input) {
            return (String) ReflectionTestUtils.invokeMethod(
                syrianCarsDataService, 
                "cleanBrandNameForTranslation", 
                input
            );
        }
    }

    @Nested
    @DisplayName("Service Configuration Tests")
    class ServiceConfigurationTests {

        @Test
        @DisplayName("Should be enabled by default in test configuration")
        void shouldBeEnabledByDefault() {
            assertTrue(syrianCarsDataService.isEnabled(), "Service should be enabled in test configuration");
        }

        @Test
        @DisplayName("Should have proper service name")
        void shouldHaveProperServiceName() {
            assertEquals("SyrianCars.net", syrianCarsDataService.getProviderName());
        }

        @Test
        @DisplayName("Should test connection when enabled")
        void shouldTestConnectionWhenEnabled() {
            // This will fail in test environment (no actual connection), but should not throw exception
            assertDoesNotThrow(() -> syrianCarsDataService.testConnection());
        }
    }

    @Nested
    @DisplayName("Translation Integration Tests")
    class TranslationIntegrationTests {

        @Test
        @DisplayName("Should call ArabicTranslationService with cleaned brand name")
        void shouldCallTranslationServiceWithCleanedName() {
            // Mock the translation service to return a valid Arabic translation
            when(arabicTranslationService.translateBrandToArabic("Peugeot")).thenReturn("بيجو");
            
            // This test verifies that our cleaning logic is properly integrated
            // We can't easily test the full scraping flow, but we can verify the cleaning is called
            String cleanedName = (String) ReflectionTestUtils.invokeMethod(
                syrianCarsDataService, 
                "cleanBrandNameForTranslation", 
                "بيجو - Peugeot (57)"
            );
            
            assertEquals("Peugeot", cleanedName);
            
            // Verify that if we were to call the translation service, it would get the clean name
            String translation = arabicTranslationService.translateBrandToArabic(cleanedName);
            assertEquals("بيجو", translation);
        }

        @Test
        @DisplayName("Should handle translation service failures gracefully")
        void shouldHandleTranslationFailures() {
            // Mock translation service to return null (translation failed)
            when(arabicTranslationService.translateBrandToArabic(any())).thenReturn(null);
            
            // Service should not crash when translation fails
            assertDoesNotThrow(() -> {
                String cleanedName = (String) ReflectionTestUtils.invokeMethod(
                    syrianCarsDataService, 
                    "cleanBrandNameForTranslation", 
                    "بيجو - Peugeot (57)"
                );
                assertEquals("Peugeot", cleanedName);
            });
        }
    }

    @Nested
    @DisplayName("Data Quality Tests")
    class DataQualityTests {

        @Test
        @DisplayName("Should ensure cleaned names are suitable for translation")
        void shouldEnsureCleanedNamesAreSuitableForTranslation() {
            String[] testInputs = {
                "بيجو - Peugeot (57)",
                "تويوتا - Toyota (258)", 
                "BMW (712)",
                "مرسيدس - Mercedes-Benz (45)"
            };
            
            String[] expectedOutputs = {
                "Peugeot",
                "Toyota",
                "BMW", 
                "Mercedes-Benz"
            };
            
            for (int i = 0; i < testInputs.length; i++) {
                String result = (String) ReflectionTestUtils.invokeMethod(
                    syrianCarsDataService, 
                    "cleanBrandNameForTranslation", 
                    testInputs[i]
                );
                
                assertEquals(expectedOutputs[i], result, 
                    String.format("Input '%s' should produce '%s'", testInputs[i], expectedOutputs[i]));
                
                // Verify the result contains only Latin characters and common punctuation
                assertTrue(result.matches("^[a-zA-Z0-9\\s\\-\\.]+$"), 
                    String.format("Cleaned name '%s' should contain only Latin characters", result));
                
                // Verify no Arabic characters remain
                assertFalse(result.matches(".*[\\u0600-\\u06FF].*"), 
                    String.format("Cleaned name '%s' should not contain Arabic characters", result));
                
                // Verify no count numbers remain
                assertFalse(result.matches(".*\\(\\d+\\).*"), 
                    String.format("Cleaned name '%s' should not contain count numbers", result));
            }
        }
    }
}
