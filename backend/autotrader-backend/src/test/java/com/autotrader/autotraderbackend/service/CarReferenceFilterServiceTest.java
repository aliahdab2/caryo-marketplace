package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.CarTrim;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarReferenceFilterServiceTest {

    @Mock
    private CarBrandService carBrandService;
    
    @Mock
    private CarModelService carModelService;
    
    @Mock
    private CarTrimService carTrimService;

    @InjectMocks
    private CarReferenceFilterService carReferenceFilterService;

    private CarBrand testBrand1;
    private CarBrand testBrand2;
    private CarModel testModel1;
    private CarModel testModel2;
    private CarTrim testTrim1;
    private CarTrim testTrim2;

    @BeforeEach
    void setUp() {
        // Set up test brands
        testBrand1 = new CarBrand();
        testBrand1.setId(1L);
        testBrand1.setName("Toyota");
        testBrand1.setSlug("toyota");
        testBrand1.setDisplayNameEn("Toyota");
        testBrand1.setDisplayNameAr("تويوتا");
        testBrand1.setIsActive(true);
        testBrand1.setModels(new ArrayList<>());

        testBrand2 = new CarBrand();
        testBrand2.setId(2L);
        testBrand2.setName("Honda");
        testBrand2.setSlug("honda");
        testBrand2.setDisplayNameEn("Honda");
        testBrand2.setDisplayNameAr("هوندا");
        testBrand2.setIsActive(true);
        testBrand2.setModels(new ArrayList<>());

        // Set up test models
        testModel1 = new CarModel();
        testModel1.setId(1L);
        testModel1.setBrand(testBrand1);
        testModel1.setName("Camry");
        testModel1.setSlug("camry");
        testModel1.setDisplayNameEn("Camry");
        testModel1.setDisplayNameAr("كامري");
        testModel1.setIsActive(true);
        testModel1.setTrims(new ArrayList<>());

        testModel2 = new CarModel();
        testModel2.setId(2L);
        testModel2.setBrand(testBrand2);
        testModel2.setName("Accord");
        testModel2.setSlug("accord");
        testModel2.setDisplayNameEn("Accord");
        testModel2.setDisplayNameAr("أكورد");
        testModel2.setIsActive(true);
        testModel2.setTrims(new ArrayList<>());

        // Set up test trims
        testTrim1 = new CarTrim();
        testTrim1.setId(1L);
        testTrim1.setModel(testModel1);
        testTrim1.setName("LE");
        testTrim1.setDisplayNameEn("LE");
        testTrim1.setDisplayNameAr("إل إي");
        testTrim1.setIsActive(true);

        testTrim2 = new CarTrim();
        testTrim2.setId(2L);
        testTrim2.setModel(testModel2);
        testTrim2.setName("EX");
        testTrim2.setDisplayNameEn("EX");
        testTrim2.setDisplayNameAr("إي إكس");
        testTrim2.setIsActive(true);
        
        // Link models to brands
        testBrand1.getModels().add(testModel1);
        testBrand2.getModels().add(testModel2);
        
        // Link trims to models
        testModel1.getTrims().add(testTrim1);
        testModel2.getTrims().add(testTrim2);
    }

    @Test
    void getActiveCarHierarchy_ShouldReturnCompleteHierarchyOfActiveEntities() {
        // Arrange
        List<CarBrand> activeBrands = Arrays.asList(testBrand1, testBrand2);
        List<CarModel> activeModelsForBrand1 = Collections.singletonList(testModel1);
        List<CarModel> activeModelsForBrand2 = Collections.singletonList(testModel2);
        List<CarTrim> activeTrimsForModel1 = Collections.singletonList(testTrim1);
        List<CarTrim> activeTrimsForModel2 = Collections.singletonList(testTrim2);
        
        when(carBrandService.getActiveBrands()).thenReturn(activeBrands);
        when(carModelService.getActiveModelsByBrandId(1L)).thenReturn(activeModelsForBrand1);
        when(carModelService.getActiveModelsByBrandId(2L)).thenReturn(activeModelsForBrand2);
        when(carTrimService.getActiveTrimsByModelId(1L)).thenReturn(activeTrimsForModel1);
        when(carTrimService.getActiveTrimsByModelId(2L)).thenReturn(activeTrimsForModel2);

        // Act
        List<CarBrand> result = carReferenceFilterService.getActiveCarHierarchy();

        // Assert
        assertEquals(2, result.size());
        
        // Check brand 1
        assertEquals(testBrand1.getName(), result.get(0).getName());
        assertEquals(1, result.get(0).getModels().size());
        
        // Check model of brand 1
        assertEquals(testModel1.getName(), result.get(0).getModels().get(0).getName());
        assertEquals(1, result.get(0).getModels().get(0).getTrims().size());
        
        // Check trim of model 1
        assertEquals(testTrim1.getName(), result.get(0).getModels().get(0).getTrims().get(0).getName());
        
        // Check brand 2
        assertEquals(testBrand2.getName(), result.get(1).getName());
        assertEquals(1, result.get(1).getModels().size());
        
        // Check model of brand 2
        assertEquals(testModel2.getName(), result.get(1).getModels().get(0).getName());
        assertEquals(1, result.get(1).getModels().get(0).getTrims().size());
        
        // Check trim of model 2
        assertEquals(testTrim2.getName(), result.get(1).getModels().get(0).getTrims().get(0).getName());
        
        // Verify calls
        verify(carBrandService, times(1)).getActiveBrands();
        verify(carModelService, times(1)).getActiveModelsByBrandId(1L);
        verify(carModelService, times(1)).getActiveModelsByBrandId(2L);
        verify(carTrimService, times(1)).getActiveTrimsByModelId(1L);
        verify(carTrimService, times(1)).getActiveTrimsByModelId(2L);
    }

    @Test
    void searchCarHierarchy_WithEmptyQuery_ShouldReturnActiveCarHierarchy() {
        // Arrange
        List<CarBrand> activeBrands = Arrays.asList(testBrand1, testBrand2);
        when(carBrandService.getActiveBrands()).thenReturn(activeBrands);
        when(carModelService.getActiveModelsByBrandId(anyLong())).thenReturn(Collections.emptyList());
        
        // Act
        List<CarBrand> result = carReferenceFilterService.searchCarHierarchy("");
        
        // Assert
        assertEquals(2, result.size());
        verify(carBrandService, times(1)).getActiveBrands();
        verify(carBrandService, never()).searchBrands(anyString());
        verify(carModelService, never()).searchModels(anyString());
        verify(carTrimService, never()).searchTrims(anyString());
    }

    @Test
    void searchCarHierarchy_WithBrandQuery_ShouldReturnMatchingBrandsHierarchy() {
        // Arrange
        String query = "toy";
        List<CarBrand> matchingBrands = Collections.singletonList(testBrand1);
        List<CarModel> matchingModels = Collections.emptyList();
        List<CarTrim> matchingTrims = Collections.emptyList();

        when(carBrandService.searchBrands(query)).thenReturn(matchingBrands);
        when(carModelService.searchModels(query)).thenReturn(matchingModels);
        when(carTrimService.searchTrims(query)).thenReturn(matchingTrims);

        // Act
        List<CarBrand> result = carReferenceFilterService.searchCarHierarchy(query);

        // Assert
        assertEquals(1, result.size());
        assertEquals(testBrand1.getId(), result.get(0).getId());
        assertEquals(testBrand1.getName(), result.get(0).getName());
        assertEquals(Collections.emptyList(), result.get(0).getModels());
        
        verify(carBrandService, times(1)).searchBrands(query);
        verify(carModelService, times(1)).searchModels(query);
        verify(carTrimService, times(1)).searchTrims(query);
    }

    @Test
    void searchCarHierarchy_WithModelQuery_ShouldReturnParentBrandsAndMatchingModels() {
        // Arrange
        String query = "cam";
        List<CarBrand> matchingBrands = Collections.emptyList();
        List<CarModel> matchingModels = Collections.singletonList(testModel1);
        List<CarTrim> matchingTrims = Collections.emptyList();
        
        when(carBrandService.searchBrands(query)).thenReturn(matchingBrands);
        when(carModelService.searchModels(query)).thenReturn(matchingModels);
        when(carTrimService.searchTrims(query)).thenReturn(matchingTrims);
        
        // Act
        List<CarBrand> result = carReferenceFilterService.searchCarHierarchy(query);
        
        // Assert
        assertEquals(1, result.size());
        assertEquals(testBrand1.getId(), result.get(0).getId());
        assertEquals(1, result.get(0).getModels().size());
        assertEquals(testModel1.getId(), result.get(0).getModels().get(0).getId());
        assertEquals(testModel1.getName(), result.get(0).getModels().get(0).getName());
        assertEquals(Collections.emptyList(), result.get(0).getModels().get(0).getTrims());
        
        verify(carBrandService, times(1)).searchBrands(query);
        verify(carModelService, times(1)).searchModels(query);
        verify(carTrimService, times(1)).searchTrims(query);
    }

    @Test
    void searchCarHierarchy_WithTrimQuery_ShouldReturnFullBrandsAndModelsHierarchy() {
        // Arrange
        String query = "le";
        List<CarBrand> matchingBrands = Collections.emptyList();
        List<CarModel> matchingModels = Collections.emptyList();
        List<CarTrim> matchingTrims = Collections.singletonList(testTrim1);
        
        when(carBrandService.searchBrands(query)).thenReturn(matchingBrands);
        when(carModelService.searchModels(query)).thenReturn(matchingModels);
        when(carTrimService.searchTrims(query)).thenReturn(matchingTrims);
        
        // Act
        List<CarBrand> result = carReferenceFilterService.searchCarHierarchy(query);
        
        // Assert
        assertEquals(1, result.size());
        assertEquals(testBrand1.getId(), result.get(0).getId());
        
        assertEquals(1, result.get(0).getModels().size());
        assertEquals(testModel1.getId(), result.get(0).getModels().get(0).getId());
        
        assertEquals(1, result.get(0).getModels().get(0).getTrims().size());
        assertEquals(testTrim1.getId(), result.get(0).getModels().get(0).getTrims().get(0).getId());
        assertEquals(testTrim1.getName(), result.get(0).getModels().get(0).getTrims().get(0).getName());
        
        verify(carBrandService, times(1)).searchBrands(query);
        verify(carModelService, times(1)).searchModels(query);
        verify(carTrimService, times(1)).searchTrims(query);
    }
}
