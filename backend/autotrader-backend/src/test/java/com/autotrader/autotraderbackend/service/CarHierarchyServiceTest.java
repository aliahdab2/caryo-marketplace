package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.BrandActivationException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarHierarchyServiceTest {

    @Mock
    private CarBrandRepository carBrandRepository;

    @Mock
    private CarModelRepository carModelRepository;
    
    @Mock
    private CarListingRepository carListingRepository;

    @InjectMocks
    private CarHierarchyService carHierarchyService;

    private CarBrand testBrand;
    private CarModel testModel;

    @BeforeEach
    void setUp() {
        testBrand = new CarBrand();
        testBrand.setId(1L);
        testBrand.setName("Toyota");
        testBrand.setDisplayNameEn("Toyota");
        testBrand.setDisplayNameAr("تويوتا");
        testBrand.setIsActive(false);

        testModel = new CarModel();
        testModel.setId(1L);
        testModel.setName("Camry");
        testModel.setDisplayNameEn("Camry");
        testModel.setDisplayNameAr("كامري");
        testModel.setIsActive(true);
        testModel.setBrand(testBrand);
    }

    @Test
    void brandHasModels_WithModels_ShouldReturnTrue() {
        // Arrange
        List<CarModel> models = Arrays.asList(testModel);
        when(carModelRepository.findByBrandId(1L)).thenReturn(models);

        // Act
        boolean result = carHierarchyService.brandHasModels(1L);

        // Assert
        assertTrue(result);
        verify(carModelRepository, times(1)).findByBrandId(1L);
    }

    @Test
    void brandHasModels_WithoutModels_ShouldReturnFalse() {
        // Arrange
        when(carModelRepository.findByBrandId(1L)).thenReturn(Arrays.asList());

        // Act
        boolean result = carHierarchyService.brandHasModels(1L);

        // Assert
        assertFalse(result);
        verify(carModelRepository, times(1)).findByBrandId(1L);
    }

    @Test
    void cascadeDeactivateFromBrand_WithActiveModels_ShouldDeactivateSuccessfully() {
        // Arrange
        when(carModelRepository.countActiveByBrandId(1L)).thenReturn(2L);
        when(carListingRepository.countActiveByBrandId(1L)).thenReturn(5L);
        when(carModelRepository.deactivateByBrandId(1L)).thenReturn(2);
        when(carListingRepository.deactivateByBrandId(1L)).thenReturn(5);

        // Act
        CarHierarchyService.HierarchyOperationResult result = carHierarchyService.cascadeDeactivateFromBrand(1L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals(1L, result.getBrandId());
        assertEquals(2L, result.getInitialActiveModels());
        assertEquals(5L, result.getInitialActiveListings());
        assertEquals(2, result.getDeactivatedModels());
        assertEquals(5, result.getDeactivatedListings());
        
        verify(carModelRepository, times(1)).countActiveByBrandId(1L);
        verify(carListingRepository, times(1)).countActiveByBrandId(1L);
        verify(carModelRepository, times(1)).deactivateByBrandId(1L);
        verify(carListingRepository, times(1)).deactivateByBrandId(1L);
    }

    @Test
    void cascadeDeactivateFromBrand_WithNoActiveModels_ShouldReturnSuccessWithoutDeactivation() {
        // Arrange
        when(carModelRepository.countActiveByBrandId(1L)).thenReturn(0L);
        when(carListingRepository.countActiveByBrandId(1L)).thenReturn(0L);

        // Act
        CarHierarchyService.HierarchyOperationResult result = carHierarchyService.cascadeDeactivateFromBrand(1L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals(1L, result.getBrandId());
        assertEquals(0L, result.getInitialActiveModels());
        assertEquals(0L, result.getInitialActiveListings());
        assertEquals(0, result.getDeactivatedModels());
        assertEquals(0, result.getDeactivatedListings());
        
        verify(carModelRepository, times(1)).countActiveByBrandId(1L);
        verify(carModelRepository, never()).deactivateByBrandId(any());
        verify(carListingRepository, never()).deactivateByBrandId(any());
    }

    @Test
    void cascadeDeactivateFromModels_WithActiveListings_ShouldDeactivateSuccessfully() {
        // Arrange
        List<Long> modelIds = Arrays.asList(1L, 2L);
        when(carListingRepository.countActiveByModelIds(modelIds)).thenReturn(3L);
        when(carListingRepository.deactivateByModelIds(modelIds)).thenReturn(3);

        // Act
        CarHierarchyService.HierarchyOperationResult result = carHierarchyService.cascadeDeactivateFromModels(modelIds);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals(modelIds, result.getModelIds());
        assertEquals(3L, result.getInitialActiveListings());
        assertEquals(3, result.getDeactivatedListings());
        
        verify(carListingRepository, times(1)).countActiveByModelIds(modelIds);
        verify(carListingRepository, times(1)).deactivateByModelIds(modelIds);
    }

    @Test
    void cascadeDeactivateFromModels_WithEmptyModelIds_ShouldReturnSuccessWithoutDeactivation() {
        // Arrange
        List<Long> modelIds = Arrays.asList();

        // Act
        CarHierarchyService.HierarchyOperationResult result = carHierarchyService.cascadeDeactivateFromModels(modelIds);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals(modelIds, result.getModelIds());
        assertEquals(0L, result.getInitialActiveListings());
        assertEquals(0, result.getDeactivatedListings());
        
        verify(carListingRepository, never()).countActiveByModelIds(any());
        verify(carListingRepository, never()).deactivateByModelIds(any());
    }

    @Test
    void autoActivateBrand_WithInactiveBrand_ShouldActivateBrand() {
        // Arrange
        when(carBrandRepository.findById(1L)).thenReturn(Optional.of(testBrand));
        when(carBrandRepository.save(any(CarBrand.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        carHierarchyService.autoActivateBrand(1L, "Camry");

        // Assert
        verify(carBrandRepository, times(1)).findById(1L);
        verify(carBrandRepository, times(1)).save(testBrand);
        assertTrue(testBrand.getIsActive());
    }

    @Test
    void autoActivateBrand_WithActiveBrand_ShouldNotSaveBrand() {
        // Arrange
        testBrand.setIsActive(true);
        when(carBrandRepository.findById(1L)).thenReturn(Optional.of(testBrand));

        // Act
        carHierarchyService.autoActivateBrand(1L, "Camry");

        // Assert
        verify(carBrandRepository, times(1)).findById(1L);
        verify(carBrandRepository, never()).save(any());
    }

    @Test
    void validateBrandActivation_WithModels_ShouldNotThrowException() {
        // Arrange
        List<CarModel> models = Arrays.asList(testModel);
        when(carModelRepository.findByBrandId(1L)).thenReturn(models);

        // Act & Assert
        assertDoesNotThrow(() -> carHierarchyService.validateBrandActivation(1L, "Toyota"));
        verify(carModelRepository, times(1)).findByBrandId(1L);
    }

    @Test
    void validateBrandActivation_WithoutModels_ShouldThrowException() {
        // Arrange
        when(carModelRepository.findByBrandId(1L)).thenReturn(Arrays.asList());

        // Act & Assert
        BrandActivationException exception = assertThrows(BrandActivationException.class, () -> {
            carHierarchyService.validateBrandActivation(1L, "Toyota");
        });
        
        assertTrue(exception.getMessage().contains("Cannot activate brand 'Toyota'"));
        assertTrue(exception.getMessage().contains("no associated models"));
        verify(carModelRepository, times(1)).findByBrandId(1L);
    }
}
