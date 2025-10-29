package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarDataExcelServiceTest {

    @Mock
    private CarBrandService carBrandService;

    @Mock
    private CarModelService carModelService;

    @InjectMocks
    private CarDataExcelService carDataExcelService;

    private List<CarBrand> mockBrands;
    private List<CarModel> mockModels;

    @BeforeEach
    void setUp() {
        // Create mock brands
        CarBrand brand1 = new CarBrand();
        brand1.setId(1L);
        brand1.setName("Toyota");
        brand1.setDisplayNameEn("Toyota");
        brand1.setDisplayNameAr("تويوتا");
        brand1.setSlug("toyota");
        brand1.setIsActive(true);

        CarBrand brand2 = new CarBrand();
        brand2.setId(2L);
        brand2.setName("Honda");
        brand2.setDisplayNameEn("Honda");
        brand2.setDisplayNameAr("هوندا");
        brand2.setSlug("honda");
        brand2.setIsActive(true);

        mockBrands = Arrays.asList(brand1, brand2);

        // Create mock models
        CarModel model1 = new CarModel();
        model1.setId(1L);
        model1.setName("Camry");
        model1.setDisplayNameEn("Camry");
        model1.setDisplayNameAr("كامري");
        model1.setSlug("toyota-camry");
        model1.setBrand(brand1);
        model1.setIsActive(true);

        CarModel model2 = new CarModel();
        model2.setId(2L);
        model2.setName("Civic");
        model2.setDisplayNameEn("Civic");
        model2.setDisplayNameAr("سيفيك");
        model2.setSlug("honda-civic");
        model2.setBrand(brand2);
        model2.setIsActive(true);

        mockModels = Arrays.asList(model1, model2);
    }

    @Test
    void testExportCarDataToExcel() throws IOException {
        // Arrange
        when(carBrandService.getAllBrands()).thenReturn(mockBrands);
        when(carModelService.getAllModels()).thenReturn(mockModels);

        // Act
        byte[] excelData = carDataExcelService.exportCarDataToExcel();

        // Assert
        assertNotNull(excelData);
        assertTrue(excelData.length > 0);

        // Verify service calls
        verify(carBrandService).getAllBrands();
        verify(carModelService).getAllModels();
    }

    @Test
    void testExportCarDataToExcel_EmptyData() throws IOException {
        // Arrange
        when(carBrandService.getAllBrands()).thenReturn(Arrays.asList());
        when(carModelService.getAllModels()).thenReturn(Arrays.asList());

        // Act
        byte[] excelData = carDataExcelService.exportCarDataToExcel();

        // Assert
        assertNotNull(excelData);
        assertTrue(excelData.length > 0); // Should still generate Excel with headers

        // Verify service calls
        verify(carBrandService).getAllBrands();
        verify(carModelService).getAllModels();
    }

    @Test
    void testExportCarDataToExcel_ServiceException() {
        // Arrange
        when(carBrandService.getAllBrands()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(IOException.class, () -> {
            carDataExcelService.exportCarDataToExcel();
        });

        // Verify service call
        verify(carBrandService).getAllBrands();
    }
}
