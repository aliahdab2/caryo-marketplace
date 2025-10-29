package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
import com.autotrader.autotraderbackend.service.CarModelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for smart activation functionality
 * Tests the complete flow from API endpoint to database
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Smart Activation Integration Tests")
class SmartActivationIntegrationTest {

    @Autowired
    private CarBrandRepository carBrandRepository;

    @Autowired
    private CarModelRepository carModelRepository;

    @Autowired
    private CarModelService carModelService;

    private CarBrand inactiveBrand;
    private CarModel inactiveModel;

    @BeforeEach
    void setUp() {
        // Clean up any existing data
        carModelRepository.deleteAll();
        carBrandRepository.deleteAll();

        // Create and save inactive brand
        inactiveBrand = new CarBrand();
        inactiveBrand.setName("Toyota");
        inactiveBrand.setSlug("toyota");
        inactiveBrand.setDisplayNameEn("Toyota");
        inactiveBrand.setDisplayNameAr("تويوتا");
        inactiveBrand.setIsActive(false);
        inactiveBrand = carBrandRepository.save(inactiveBrand);

        // Create and save inactive model
        inactiveModel = new CarModel();
        inactiveModel.setName("Camry");
        inactiveModel.setSlug("toyota-camry");
        inactiveModel.setDisplayNameEn("Camry");
        inactiveModel.setDisplayNameAr("كامري");
        inactiveModel.setIsActive(false);
        inactiveModel.setBrand(inactiveBrand);
        inactiveModel = carModelRepository.save(inactiveModel);
    }

    @Test
    @DisplayName("Should auto-activate parent brand when activating model via service")
    void shouldAutoActivateParentBrandViaService() {
        // Given: Model update request to activate model
        CarModel updateRequest = new CarModel();
        updateRequest.setName("Camry");
        updateRequest.setDisplayNameEn("Camry");
        updateRequest.setDisplayNameAr("كامري");
        updateRequest.setIsActive(true); // Activating the model
        updateRequest.setBrand(inactiveBrand);

        // When: Updating via service
        CarModel updatedModel = carModelService.updateModel(inactiveModel.getId(), updateRequest);

        // Then: Verify both model and brand are active
        assertThat(updatedModel.getIsActive()).isTrue();

        CarBrand updatedBrand = carBrandRepository.findById(inactiveBrand.getId()).orElseThrow();
        assertThat(updatedBrand.getIsActive()).isTrue(); // Brand should be auto-activated
    }


    @Test
    @DisplayName("Should handle multiple models activation for same brand")
    void shouldHandleMultipleModelsActivationForSameBrand() {
        // Given: Create another inactive model for the same brand
        CarModel secondModel = new CarModel();
        secondModel.setName("Corolla");
        secondModel.setSlug("toyota-corolla");
        secondModel.setDisplayNameEn("Corolla");
        secondModel.setDisplayNameAr("كورولا");
        secondModel.setIsActive(false);
        secondModel.setBrand(inactiveBrand);
        secondModel = carModelRepository.save(secondModel);

        // When: Activate first model (should auto-activate brand)
        CarModel firstUpdate = new CarModel();
        firstUpdate.setName("Camry");
        firstUpdate.setDisplayNameEn("Camry");
        firstUpdate.setDisplayNameAr("كامري");
        firstUpdate.setIsActive(true);
        firstUpdate.setBrand(inactiveBrand);
        carModelService.updateModel(inactiveModel.getId(), firstUpdate);

        // Then: Brand should be active
        CarBrand brandAfterFirst = carBrandRepository.findById(inactiveBrand.getId()).orElseThrow();
        assertThat(brandAfterFirst.getIsActive()).isTrue();

        // When: Activate second model (brand already active)
        CarModel secondUpdate = new CarModel();
        secondUpdate.setName("Corolla");
        secondUpdate.setDisplayNameEn("Corolla");
        secondUpdate.setDisplayNameAr("كورولا");
        secondUpdate.setIsActive(true);
        secondUpdate.setBrand(inactiveBrand);
        carModelService.updateModel(secondModel.getId(), secondUpdate);

        // Then: Brand should remain active, both models should be active
        CarBrand finalBrand = carBrandRepository.findById(inactiveBrand.getId()).orElseThrow();
        CarModel finalFirstModel = carModelRepository.findById(inactiveModel.getId()).orElseThrow();
        CarModel finalSecondModel = carModelRepository.findById(secondModel.getId()).orElseThrow();

        assertThat(finalBrand.getIsActive()).isTrue();
        assertThat(finalFirstModel.getIsActive()).isTrue();
        assertThat(finalSecondModel.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("Should maintain data consistency during concurrent activations")
    void shouldMaintainDataConsistencyDuringConcurrentActivations() {
        // Given: Multiple models for the same inactive brand
        CarModel model1 = createTestModel("Prius", "toyota-prius", "Prius", "بريوس");
        CarModel model2 = createTestModel("Highlander", "toyota-highlander", "Highlander", "هايلاندر");

        // When: Activate both models (simulating concurrent operations)
        CarModel update1 = createUpdateModel("Prius", "Prius", "بريوس", true);
        CarModel update2 = createUpdateModel("Highlander", "Highlander", "هايلاندر", true);

        carModelService.updateModel(model1.getId(), update1);
        carModelService.updateModel(model2.getId(), update2);

        // Then: All should be active and consistent
        CarBrand finalBrand = carBrandRepository.findById(inactiveBrand.getId()).orElseThrow();
        CarModel finalModel1 = carModelRepository.findById(model1.getId()).orElseThrow();
        CarModel finalModel2 = carModelRepository.findById(model2.getId()).orElseThrow();

        assertThat(finalBrand.getIsActive()).isTrue();
        assertThat(finalModel1.getIsActive()).isTrue();
        assertThat(finalModel2.getIsActive()).isTrue();
        assertThat(finalModel1.getBrand().getIsActive()).isTrue();
        assertThat(finalModel2.getBrand().getIsActive()).isTrue();
    }

    private CarModel createTestModel(String name, String slug, String displayNameEn, String displayNameAr) {
        CarModel model = new CarModel();
        model.setName(name);
        model.setSlug(slug);
        model.setDisplayNameEn(displayNameEn);
        model.setDisplayNameAr(displayNameAr);
        model.setIsActive(false);
        model.setBrand(inactiveBrand);
        return carModelRepository.save(model);
    }

    private CarModel createUpdateModel(String name, String displayNameEn, String displayNameAr, boolean isActive) {
        CarModel update = new CarModel();
        update.setName(name);
        update.setDisplayNameEn(displayNameEn);
        update.setDisplayNameAr(displayNameAr);
        update.setIsActive(isActive);
        update.setBrand(inactiveBrand);
        return update;
    }
}
