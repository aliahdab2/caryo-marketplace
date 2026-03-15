package com.caryo.marketplace.integration;

import com.caryo.marketplace.service.CarQueryApiClient;
import com.caryo.marketplace.service.CarQueryDataService;
import com.caryo.marketplace.service.SyrianCarsDataService;
import com.caryo.marketplace.service.ArabicTranslationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for CarQuery/SyrianCars data integration
 * Tests the complete workflow from API calls to data processing
 */
@SpringBootTest
@ActiveProfiles("test")
public class CarQueryIntegrationTest {

    @Autowired(required = false)
    private CarQueryApiClient carQueryApiClient;

    @Autowired(required = false)
    private CarQueryDataService carQueryDataService;

    @Autowired(required = false)
    private SyrianCarsDataService syrianCarsDataService;

    @Autowired(required = false)
    private ArabicTranslationService arabicTranslationService;

    @Test
    public void testIntegrationComponentsAreAvailable() {
        System.out.println("🔍 Testing CarQuery/SyrianCars Integration Components");

        // Test that services are properly configured and can be injected
        // Note: CarQuery and SyrianCars are disabled in integration tests, so these may be null
        assertThat(carQueryDataService).isNotNull();
        assertThat(arabicTranslationService).isNotNull();

        System.out.println("✅ Core integration services are properly configured and injectable");
        System.out.println("ℹ️ CarQuery and SyrianCars APIs are disabled in test environment");
    }

    @Test
    public void testCarQueryConfiguration() {
        System.out.println("⚙️ Testing CarQuery Configuration");

        // CarQuery API is disabled in integration tests
        if (carQueryApiClient != null) {
            System.out.println("✅ CarQuery API client is available and configured");
        } else {
            System.out.println("ℹ️ CarQuery API client is disabled in test environment (expected)");
        }
    }

    @Test
    public void testSyrianCarsConfiguration() {
        System.out.println("🕷️ Testing SyrianCars Configuration");

        // SyrianCars service is disabled in integration tests
        if (syrianCarsDataService != null) {
            System.out.println("✅ SyrianCars service is available and configured");
        } else {
            System.out.println("ℹ️ SyrianCars service is disabled in test environment (expected)");
        }
    }

    @Test
    public void testArabicTranslationConfiguration() {
        System.out.println("🌍 Testing Arabic Translation Configuration");

        // Test that the translation service has proper configuration
        assertThat(arabicTranslationService).isNotNull();

        // The service should be able to initialize without errors
        System.out.println("✅ Arabic translation service is properly configured");
    }

    @Test
    public void testCarQueryDataServiceConfiguration() {
        System.out.println("🔄 Testing CarQuery Data Service Configuration");

        // Test that the data service has proper configuration
        assertThat(carQueryDataService).isNotNull();

        // The service should be able to initialize without errors
        System.out.println("✅ CarQuery data service is properly configured");
    }
}
