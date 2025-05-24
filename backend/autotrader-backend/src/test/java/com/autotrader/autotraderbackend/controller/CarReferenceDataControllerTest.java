package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.service.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarReferenceDataControllerTest {

    @Mock
    private CarConditionService carConditionService;
    
    @Mock
    private DriveTypeService driveTypeService;
    
    @Mock
    private BodyStyleService bodyStyleService;
    
    @Mock
    private FuelTypeService fuelTypeService;
    
    @Mock
    private TransmissionService transmissionService;
    
    @Mock
    private SellerTypeService sellerTypeService;
    
    @Mock
    private CarBrandService carBrandService;
    
    @Mock
    private CarModelService carModelService;
    
    @InjectMocks
    private CarReferenceDataController carReferenceDataController;

    @Test
    void getAllActiveBrands_ShouldReturnListOfBrands() {
        // Arrange
        CarBrand brand1 = new CarBrand();
        brand1.setId(1L);
        brand1.setName("Toyota");
        brand1.setDisplayNameEn("Toyota");
        brand1.setDisplayNameAr("تويوتا");
        brand1.setIsActive(true);
        
        CarBrand brand2 = new CarBrand();
        brand2.setId(2L);
        brand2.setName("Nissan");
        brand2.setDisplayNameEn("Nissan");
        brand2.setDisplayNameAr("نيسان");
        brand2.setIsActive(true);
        
        List<CarBrand> expectedBrands = Arrays.asList(brand1, brand2);
        
        when(carBrandService.getActiveBrands()).thenReturn(expectedBrands);
        
        // Act
        ResponseEntity<List<CarBrand>> response = carReferenceDataController.getAllActiveBrands();
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedBrands, response.getBody());
        verify(carBrandService, times(1)).getActiveBrands();
    }
    
    @Test
    void getAllActiveBrands_WhenNoBrands_ShouldReturnEmptyList() {
        // Arrange
        when(carBrandService.getActiveBrands()).thenReturn(Collections.emptyList());
        
        // Act
        ResponseEntity<List<CarBrand>> response = carReferenceDataController.getAllActiveBrands();
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
        verify(carBrandService, times(1)).getActiveBrands();
    }
    
    @Test
    void getActiveModelsByBrand_ShouldReturnListOfModels() {
        // Arrange
        Long brandId = 1L;
        
        CarModel model1 = new CarModel();
        model1.setId(1L);
        model1.setName("Corolla");
        model1.setDisplayNameEn("Corolla");
        model1.setDisplayNameAr("كورولا");
        model1.setIsActive(true);
        
        CarModel model2 = new CarModel();
        model2.setId(2L);
        model2.setName("Camry");
        model2.setDisplayNameEn("Camry");
        model2.setDisplayNameAr("كامري");
        model2.setIsActive(true);
        
        List<CarModel> expectedModels = Arrays.asList(model1, model2);
        
        when(carModelService.getActiveModelsByBrandId(brandId)).thenReturn(expectedModels);
        
        // Act
        ResponseEntity<List<CarModel>> response = carReferenceDataController.getActiveModelsByBrand(brandId);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedModels, response.getBody());
        verify(carModelService, times(1)).getActiveModelsByBrandId(brandId);
    }
    
    @Test
    void getActiveModelsByBrand_WhenNoModels_ShouldReturnEmptyList() {
        // Arrange
        Long brandId = 1L;
        when(carModelService.getActiveModelsByBrandId(brandId)).thenReturn(Collections.emptyList());
        
        // Act
        ResponseEntity<List<CarModel>> response = carReferenceDataController.getActiveModelsByBrand(brandId);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
        verify(carModelService, times(1)).getActiveModelsByBrandId(brandId);
    }
}
