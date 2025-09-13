package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.payload.request.CreateModelRequest;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CarModelService smart activation logic
 * Tests the auto-activation of parent brands when models are activated
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CarModelService Smart Activation Tests")
class CarModelServiceSmartActivationTest {

    @Mock
    private CarModelRepository carModelRepository;

    @Mock
    private CarBrandService carBrandService;

    @InjectMocks
    private CarModelService carModelService;

    private CarBrand inactiveBrand;
    private CarBrand activeBrand;
    private CarModel inactiveModel;
    private CarModel activeModel;

    @BeforeEach
    void setUp() {
        // Create test brands
        inactiveBrand = new CarBrand();
        inactiveBrand.setId(1L);
        inactiveBrand.setName("Toyota");
        inactiveBrand.setDisplayNameEn("Toyota");
        inactiveBrand.setDisplayNameAr("تويوتا");
        inactiveBrand.setIsActive(false); // Inactive brand

        activeBrand = new CarBrand();
        activeBrand.setId(2L);
        activeBrand.setName("Honda");
        activeBrand.setDisplayNameEn("Honda");
        activeBrand.setDisplayNameAr("هوندا");
        activeBrand.setIsActive(true); // Active brand

        // Create test models
        inactiveModel = new CarModel();
        inactiveModel.setId(1L);
        inactiveModel.setName("Camry");
        inactiveModel.setDisplayNameEn("Camry");
        inactiveModel.setDisplayNameAr("كامري");
        inactiveModel.setIsActive(false); // Inactive model
        inactiveModel.setBrand(inactiveBrand);

        activeModel = new CarModel();
        activeModel.setId(2L);
        activeModel.setName("Civic");
        activeModel.setDisplayNameEn("Civic");
        activeModel.setDisplayNameAr("سيفيك");
        activeModel.setIsActive(true); // Active model
        activeModel.setBrand(activeBrand);
    }

    @Test
    @DisplayName("Should auto-activate parent brand when activating model with inactive brand")
    void shouldAutoActivateParentBrandWhenActivatingModel() {
        // Given: Model with inactive parent brand
        CarModel modelToUpdate = new CarModel();
        modelToUpdate.setName("Camry");
        modelToUpdate.setDisplayNameEn("Camry");
        modelToUpdate.setDisplayNameAr("كامري");
        modelToUpdate.setIsActive(true); // Activating the model
        modelToUpdate.setBrand(inactiveBrand);

        when(carModelRepository.findById(1L)).thenReturn(java.util.Optional.of(inactiveModel));
        when(carModelRepository.save(any(CarModel.class))).thenReturn(inactiveModel);

        // When: Updating the model to active
        carModelService.updateModel(1L, modelToUpdate);

        // Then: Parent brand should be auto-activated
        verify(carBrandService, times(1)).updateBrand(eq(1L), any(CarBrand.class));
        verify(carModelRepository, times(1)).save(any(CarModel.class));
    }

    @Test
    @DisplayName("Should not auto-activate parent brand when activating model with already active brand")
    void shouldNotAutoActivateAlreadyActiveBrand() {
        // Given: Model with active parent brand
        CarModel modelToUpdate = new CarModel();
        modelToUpdate.setName("Civic");
        modelToUpdate.setDisplayNameEn("Civic");
        modelToUpdate.setDisplayNameAr("سيفيك");
        modelToUpdate.setIsActive(true); // Activating the model
        modelToUpdate.setBrand(activeBrand);

        when(carModelRepository.findById(2L)).thenReturn(java.util.Optional.of(activeModel));
        when(carModelRepository.save(any(CarModel.class))).thenReturn(activeModel);

        // When: Updating the model to active
        carModelService.updateModel(2L, modelToUpdate);

        // Then: Parent brand should NOT be updated (already active)
        verify(carBrandService, never()).updateBrand(any(Long.class), any(CarBrand.class));
        verify(carModelRepository, times(1)).save(any(CarModel.class));
    }

    @Test
    @DisplayName("Should not auto-activate parent brand when deactivating model")
    void shouldNotAutoActivateWhenDeactivatingModel() {
        // Given: Active model being deactivated
        CarModel modelToUpdate = new CarModel();
        modelToUpdate.setName("Camry");
        modelToUpdate.setDisplayNameEn("Camry");
        modelToUpdate.setDisplayNameAr("كامري");
        modelToUpdate.setIsActive(false); // Deactivating the model
        modelToUpdate.setBrand(inactiveBrand);

        // Set up active model initially
        CarModel currentlyActiveModel = new CarModel();
        currentlyActiveModel.setId(1L);
        currentlyActiveModel.setName("Camry");
        currentlyActiveModel.setDisplayNameEn("Camry");
        currentlyActiveModel.setDisplayNameAr("كامري");
        currentlyActiveModel.setIsActive(true); // Currently active
        currentlyActiveModel.setBrand(inactiveBrand);

        when(carModelRepository.findById(1L)).thenReturn(java.util.Optional.of(currentlyActiveModel));
        when(carModelRepository.save(any(CarModel.class))).thenReturn(currentlyActiveModel);

        // When: Updating the model to inactive
        carModelService.updateModel(1L, modelToUpdate);

        // Then: Parent brand should NOT be auto-activated
        verify(carBrandService, never()).updateBrand(any(Long.class), any(CarBrand.class));
        verify(carModelRepository, times(1)).save(any(CarModel.class));
    }

    @Test
    @DisplayName("Should not auto-activate parent brand when model is already active")
    void shouldNotAutoActivateWhenModelAlreadyActive() {
        // Given: Model that is already active
        CarModel modelToUpdate = new CarModel();
        modelToUpdate.setName("Camry");
        modelToUpdate.setDisplayNameEn("Camry");
        modelToUpdate.setDisplayNameAr("كامري");
        modelToUpdate.setIsActive(true); // Keeping active
        modelToUpdate.setBrand(inactiveBrand);

        // Set up already active model
        CarModel currentlyActiveModel = new CarModel();
        currentlyActiveModel.setId(1L);
        currentlyActiveModel.setName("Camry");
        currentlyActiveModel.setDisplayNameEn("Camry");
        currentlyActiveModel.setDisplayNameAr("كامري");
        currentlyActiveModel.setIsActive(true); // Already active
        currentlyActiveModel.setBrand(inactiveBrand);

        when(carModelRepository.findById(1L)).thenReturn(java.util.Optional.of(currentlyActiveModel));
        when(carModelRepository.save(any(CarModel.class))).thenReturn(currentlyActiveModel);

        // When: Updating the model (no status change)
        carModelService.updateModel(1L, modelToUpdate);

        // Then: Parent brand should NOT be auto-activated (no activation happening)
        verify(carBrandService, never()).updateBrand(any(Long.class), any(CarBrand.class));
        verify(carModelRepository, times(1)).save(any(CarModel.class));
    }

    @Test
    @DisplayName("Should handle brand change during model update with smart activation")
    void shouldHandleBrandChangeWithSmartActivation() {
        // Given: Model being moved to a different inactive brand and activated
        CarBrand newInactiveBrand = new CarBrand();
        newInactiveBrand.setId(3L);
        newInactiveBrand.setName("Nissan");
        newInactiveBrand.setDisplayNameEn("Nissan");
        newInactiveBrand.setDisplayNameAr("نيسان");
        newInactiveBrand.setIsActive(false);

        CarModel modelToUpdate = new CarModel();
        modelToUpdate.setName("Camry");
        modelToUpdate.setDisplayNameEn("Camry");
        modelToUpdate.setDisplayNameAr("كامري");
        modelToUpdate.setIsActive(true); // Activating the model
        modelToUpdate.setBrand(newInactiveBrand); // Moving to different brand

        when(carModelRepository.findById(1L)).thenReturn(java.util.Optional.of(inactiveModel));
        when(carBrandService.getBrandById(3L)).thenReturn(newInactiveBrand);
        when(carModelRepository.save(any(CarModel.class))).thenReturn(inactiveModel);

        // When: Updating the model with brand change and activation
        carModelService.updateModel(1L, modelToUpdate);

        // Then: New parent brand should be auto-activated
        verify(carBrandService, times(1)).updateBrand(eq(3L), any(CarBrand.class));
        verify(carBrandService, times(1)).getBrandById(3L);
        verify(carModelRepository, times(1)).save(any(CarModel.class));
    }

    @Test
    @DisplayName("Should auto-activate brand when creating active model with inactive brand")
    void shouldAutoActivateBrandWhenCreatingActiveModel() {
        // Given
        CreateModelRequest createRequest = new CreateModelRequest();
        createRequest.setBrandId(1L);
        createRequest.setName("New Model");
        createRequest.setDisplayNameEn("New Model");
        createRequest.setDisplayNameAr("موديل جديد");

        CarModel savedModel = new CarModel();
        savedModel.setId(1L);
        savedModel.setName("New Model");
        savedModel.setDisplayNameEn("New Model");
        savedModel.setDisplayNameAr("موديل جديد");
        savedModel.setIsActive(true);
        savedModel.setBrand(inactiveBrand);

        when(carBrandService.getBrandById(1L)).thenReturn(inactiveBrand);
        when(carModelRepository.findBySlug(anyString())).thenReturn(Optional.empty());
        when(carModelRepository.save(any(CarModel.class))).thenReturn(savedModel);

        // When
        CarModel result = carModelService.createModel(createRequest);

        // Then
        verify(carBrandService).updateBrand(eq(1L), any(CarBrand.class));
        verify(carModelRepository).save(any(CarModel.class));
        assertThat(result.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("Should not auto-activate brand when creating active model with already active brand")
    void shouldNotAutoActivateBrandWhenBrandAlreadyActive() {
        // Given
        CreateModelRequest createRequest = new CreateModelRequest();
        createRequest.setBrandId(2L);
        createRequest.setName("New Model");
        createRequest.setDisplayNameEn("New Model");
        createRequest.setDisplayNameAr("موديل جديد");

        CarModel savedModel = new CarModel();
        savedModel.setId(1L);
        savedModel.setName("New Model");
        savedModel.setDisplayNameEn("New Model");
        savedModel.setDisplayNameAr("موديل جديد");
        savedModel.setIsActive(true);
        savedModel.setBrand(activeBrand);

        when(carBrandService.getBrandById(2L)).thenReturn(activeBrand);
        when(carModelRepository.findBySlug(anyString())).thenReturn(Optional.empty());
        when(carModelRepository.save(any(CarModel.class))).thenReturn(savedModel);

        // When
        CarModel result = carModelService.createModel(createRequest);

        // Then
        verify(carBrandService, never()).updateBrand(any(Long.class), any(CarBrand.class));
        verify(carModelRepository).save(any(CarModel.class));
        assertThat(result.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("Should not auto-activate brand when creating inactive model")
    void shouldNotAutoActivateBrandWhenCreatingInactiveModel() {
        // Given
        CreateModelRequest createRequest = new CreateModelRequest();
        createRequest.setBrandId(1L);
        createRequest.setName("Inactive Model");
        createRequest.setDisplayNameEn("Inactive Model");
        createRequest.setDisplayNameAr("موديل غير نشط");
        createRequest.setIsActive(false); // Creating inactive model

        CarModel savedModel = new CarModel();
        savedModel.setId(1L);
        savedModel.setName("Inactive Model");
        savedModel.setDisplayNameEn("Inactive Model");
        savedModel.setDisplayNameAr("موديل غير نشط");
        savedModel.setIsActive(false);
        savedModel.setBrand(inactiveBrand);

        when(carBrandService.getBrandById(1L)).thenReturn(inactiveBrand);
        when(carModelRepository.findBySlug(anyString())).thenReturn(Optional.empty());
        when(carModelRepository.save(any(CarModel.class))).thenReturn(savedModel);

        // When
        CarModel result = carModelService.createModel(createRequest);

        // Then: Brand should NOT be activated since model is inactive
        verify(carBrandService, never()).updateBrand(any(Long.class), any(CarBrand.class));
        verify(carModelRepository).save(any(CarModel.class));
        assertThat(result.getIsActive()).isFalse();
    }
}
