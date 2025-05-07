package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.CarTrim;
import com.autotrader.autotraderbackend.repository.CarTrimRepository;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarTrimServiceTest {

    @Mock
    private CarTrimRepository carTrimRepository;
    
    @Mock
    private CarModelService carModelService;

    @InjectMocks
    private CarTrimService carTrimService;

    private CarBrand testBrand;
    private CarModel testModel;
    private CarTrim testTrim;

    @BeforeEach
    void setUp() {
        // Set up test brand
        testBrand = new CarBrand();
        testBrand.setId(1L);
        testBrand.setName("Toyota");
        testBrand.setSlug("toyota");
        testBrand.setDisplayNameEn("Toyota");
        testBrand.setDisplayNameAr("تويوتا");
        testBrand.setIsActive(true);

        // Set up test model
        testModel = new CarModel();
        testModel.setId(1L);
        testModel.setBrand(testBrand);
        testModel.setName("Camry");
        testModel.setSlug("camry");
        testModel.setDisplayNameEn("Camry");
        testModel.setDisplayNameAr("كامري");
        testModel.setIsActive(true);
        
        // Set up test trim
        testTrim = new CarTrim();
        testTrim.setId(1L);
        testTrim.setModel(testModel);
        testTrim.setName("LE");
        testTrim.setDisplayNameEn("LE");
        testTrim.setDisplayNameAr("إل إي");
        testTrim.setIsActive(true);
    }

    @Test
    void getAllTrims_ShouldReturnAllTrims() {
        // Arrange
        List<CarTrim> expectedTrims = Arrays.asList(testTrim);
        when(carTrimRepository.findAll()).thenReturn(expectedTrims);

        // Act
        List<CarTrim> result = carTrimService.getAllTrims();

        // Assert
        assertEquals(expectedTrims.size(), result.size());
        assertEquals(expectedTrims.get(0).getName(), result.get(0).getName());
        verify(carTrimRepository, times(1)).findAll();
    }

    @Test
    void getTrimsByModelId_WithValidModelId_ShouldReturnTrims() {
        // Arrange
        List<CarTrim> expectedTrims = Arrays.asList(testTrim);
        when(carModelService.getModelById(1L)).thenReturn(testModel);
        when(carTrimRepository.findByModel(testModel)).thenReturn(expectedTrims);

        // Act
        List<CarTrim> result = carTrimService.getTrimsByModelId(1L);

        // Assert
        assertEquals(expectedTrims.size(), result.size());
        assertEquals(expectedTrims.get(0).getName(), result.get(0).getName());
        assertEquals(expectedTrims.get(0).getModel().getId(), testModel.getId());
        verify(carModelService, times(1)).getModelById(1L);
        verify(carTrimRepository, times(1)).findByModel(testModel);
    }

    @Test
    void getActiveTrimsByModelId_WithValidModelId_ShouldReturnActiveTrims() {
        // Arrange
        List<CarTrim> expectedTrims = Arrays.asList(testTrim);
        when(carModelService.getModelById(1L)).thenReturn(testModel);
        when(carTrimRepository.findByModelAndIsActiveTrue(testModel)).thenReturn(expectedTrims);

        // Act
        List<CarTrim> result = carTrimService.getActiveTrimsByModelId(1L);

        // Assert
        assertEquals(expectedTrims.size(), result.size());
        assertTrue(result.get(0).getIsActive());
        verify(carModelService, times(1)).getModelById(1L);
        verify(carTrimRepository, times(1)).findByModelAndIsActiveTrue(testModel);
    }

    @Test
    void getTrimsByBrandAndModelSlug_WithValidSlugs_ShouldReturnTrims() {
        // Arrange
        List<CarTrim> expectedTrims = Arrays.asList(testTrim);
        when(carModelService.getModelBySlug("camry")).thenReturn(testModel);
        when(carTrimRepository.findByModel(testModel)).thenReturn(expectedTrims);

        // Act
        List<CarTrim> result = carTrimService.getTrimsByBrandAndModelSlug("toyota", "camry");

        // Assert
        assertEquals(expectedTrims.size(), result.size());
        assertEquals(expectedTrims.get(0).getName(), result.get(0).getName());
        verify(carModelService, times(1)).getModelBySlug("camry");
        verify(carTrimRepository, times(1)).findByModel(testModel);
    }

    @Test
    void getTrimsByBrandAndModelSlug_WithMismatchedBrand_ShouldThrowResourceNotFoundException() {
        // Arrange
        CarBrand differentBrand = new CarBrand();
        differentBrand.setId(2L);
        differentBrand.setSlug("honda");
        
        CarModel modelWithDifferentBrand = new CarModel();
        modelWithDifferentBrand.setId(1L);
        modelWithDifferentBrand.setBrand(differentBrand);
        modelWithDifferentBrand.setSlug("camry");
        
        when(carModelService.getModelBySlug("camry")).thenReturn(modelWithDifferentBrand);

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carTrimService.getTrimsByBrandAndModelSlug("toyota", "camry");
        });
        assertEquals("CarModel", exception.getResourceName());
        assertEquals("brandMatch", exception.getFieldName());
        
        verify(carModelService, times(1)).getModelBySlug("camry");
        verify(carTrimRepository, never()).findByModel(any());
    }

    @Test
    void getActiveTrimsByBrandAndModelSlug_WithValidSlugs_ShouldReturnActiveTrims() {
        // Arrange
        List<CarTrim> expectedTrims = Arrays.asList(testTrim);
        when(carModelService.getModelBySlug("camry")).thenReturn(testModel);
        when(carTrimRepository.findByModelAndIsActiveTrue(testModel)).thenReturn(expectedTrims);

        // Act
        List<CarTrim> result = carTrimService.getActiveTrimsByBrandAndModelSlug("toyota", "camry");

        // Assert
        assertEquals(expectedTrims.size(), result.size());
        assertTrue(result.get(0).getIsActive());
        verify(carModelService, times(1)).getModelBySlug("camry");
        verify(carTrimRepository, times(1)).findByModelAndIsActiveTrue(testModel);
    }

    @Test
    void getTrimById_WithValidId_ShouldReturnTrim() {
        // Arrange
        when(carTrimRepository.findById(1L)).thenReturn(Optional.of(testTrim));

        // Act
        CarTrim result = carTrimService.getTrimById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testTrim.getId(), result.getId());
        assertEquals(testTrim.getName(), result.getName());
        verify(carTrimRepository, times(1)).findById(1L);
    }

    @Test
    void getTrimById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carTrimRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carTrimService.getTrimById(99L);
        });
        assertEquals("CarTrim", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(99L, exception.getFieldValue());
        verify(carTrimRepository, times(1)).findById(99L);
    }

    @Test
    void searchTrims_WithValidQuery_ShouldReturnMatchingTrims() {
        // Arrange
        String query = "le";
        List<CarTrim> expectedTrims = Arrays.asList(testTrim);
        when(carTrimRepository.searchByName(query)).thenReturn(expectedTrims);

        // Act
        List<CarTrim> result = carTrimService.searchTrims(query);

        // Assert
        assertEquals(expectedTrims.size(), result.size());
        assertEquals(expectedTrims.get(0).getName(), result.get(0).getName());
        verify(carTrimRepository, times(1)).searchByName(query);
    }

    @Test
    void searchTrims_WithEmptyQuery_ShouldReturnAllTrims() {
        // Arrange
        String query = "";
        List<CarTrim> expectedTrims = Arrays.asList(testTrim);
        when(carTrimRepository.findAll()).thenReturn(expectedTrims);

        // Act
        List<CarTrim> result = carTrimService.searchTrims(query);

        // Assert
        assertEquals(expectedTrims.size(), result.size());
        verify(carTrimRepository, times(1)).findAll();
        verify(carTrimRepository, never()).searchByName(anyString());
    }

    @Test
    void searchTrimsByModel_WithValidQuery_ShouldReturnFilteredTrims() {
        // Arrange
        String query = "le";
        Long modelId = 1L;
        
        // Create a trim for a different model
        CarModel otherModel = new CarModel();
        otherModel.setId(2L);
        
        CarTrim trimForOtherModel = new CarTrim();
        trimForOtherModel.setId(2L);
        trimForOtherModel.setModel(otherModel);
        trimForOtherModel.setName("LE Plus");
        
        List<CarTrim> searchResults = Arrays.asList(testTrim, trimForOtherModel);
        
        when(carTrimRepository.searchByName(query)).thenReturn(searchResults);
        // We don't need this stub as the filter is done by stream filtering
        // when(carModelService.getModelById(modelId)).thenReturn(testModel);

        // Act
        List<CarTrim> result = carTrimService.searchTrimsByModel(modelId, query);

        // Assert
        assertEquals(1, result.size());
        assertEquals(testTrim.getId(), result.get(0).getId());
        verify(carTrimRepository, times(1)).searchByName(query);
    }

    @Test
    void searchTrimsByModel_WithEmptyQuery_ShouldReturnAllTrimsForModel() {
        // Arrange
        String query = "";
        Long modelId = 1L;
        List<CarTrim> expectedTrims = Arrays.asList(testTrim);
        
        when(carModelService.getModelById(modelId)).thenReturn(testModel);
        when(carTrimRepository.findByModel(testModel)).thenReturn(expectedTrims);

        // Act
        List<CarTrim> result = carTrimService.searchTrimsByModel(modelId, query);

        // Assert
        assertEquals(expectedTrims.size(), result.size());
        verify(carModelService, times(1)).getModelById(modelId);
        verify(carTrimRepository, times(1)).findByModel(testModel);
        verify(carTrimRepository, never()).searchByName(anyString());
    }

    @Test
    void createTrim_ShouldSaveTrim() {
        // Arrange
        when(carModelService.getModelById(testModel.getId())).thenReturn(testModel);
        when(carTrimRepository.save(any(CarTrim.class))).thenReturn(testTrim);

        // Act
        CarTrim result = carTrimService.createTrim(testTrim);

        // Assert
        assertNotNull(result);
        assertEquals(testTrim.getName(), result.getName());
        verify(carModelService, times(1)).getModelById(testModel.getId());
        verify(carTrimRepository, times(1)).save(testTrim);
    }

    @Test
    void updateTrim_WithValidId_ShouldUpdateTrim() {
        // Arrange
        CarTrim updatedTrim = new CarTrim();
        updatedTrim.setName("LE Updated");
        updatedTrim.setDisplayNameEn("LE Updated");
        updatedTrim.setDisplayNameAr("إل إي محدث");
        updatedTrim.setIsActive(false);
        updatedTrim.setModel(testModel);
        
        when(carTrimRepository.findById(1L)).thenReturn(Optional.of(testTrim));
        when(carTrimRepository.save(any(CarTrim.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        CarTrim result = carTrimService.updateTrim(1L, updatedTrim);

        // Assert
        assertNotNull(result);
        assertEquals(updatedTrim.getName(), result.getName());
        assertEquals(updatedTrim.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedTrim.getDisplayNameAr(), result.getDisplayNameAr());
        assertEquals(updatedTrim.getIsActive(), result.getIsActive());
        
        verify(carTrimRepository, times(1)).findById(1L);
        verify(carTrimRepository, times(1)).save(any(CarTrim.class));
    }

    @Test
    void updateTrim_WithChangedModel_ShouldUpdateTrimAndModel() {
        // Arrange
        CarModel newModel = new CarModel();
        newModel.setId(2L);
        newModel.setName("Corolla");
        
        CarTrim updatedTrim = new CarTrim();
        updatedTrim.setName("XLE");
        updatedTrim.setModel(newModel);
        
        when(carTrimRepository.findById(1L)).thenReturn(Optional.of(testTrim));
        when(carModelService.getModelById(2L)).thenReturn(newModel);
        when(carTrimRepository.save(any(CarTrim.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        CarTrim result = carTrimService.updateTrim(1L, updatedTrim);

        // Assert
        assertNotNull(result);
        assertEquals(updatedTrim.getName(), result.getName());
        assertEquals(newModel.getId(), result.getModel().getId());
        
        verify(carTrimRepository, times(1)).findById(1L);
        verify(carModelService, times(1)).getModelById(2L);
        verify(carTrimRepository, times(1)).save(any(CarTrim.class));
    }

    @Test
    void updateTrimActivation_ShouldChangeActivationStatus() {
        // Arrange
        when(carTrimRepository.findById(1L)).thenReturn(Optional.of(testTrim));
        when(carTrimRepository.save(any(CarTrim.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        CarTrim result = carTrimService.updateTrimActivation(1L, false);
        
        // Assert
        assertFalse(result.getIsActive());
        verify(carTrimRepository, times(1)).findById(1L);
        verify(carTrimRepository, times(1)).save(any(CarTrim.class));
    }

    @Test
    void deleteTrim_ShouldDeleteTrim() {
        // Arrange
        when(carTrimRepository.findById(1L)).thenReturn(Optional.of(testTrim));
        doNothing().when(carTrimRepository).delete(testTrim);
        
        // Act
        carTrimService.deleteTrim(1L);
        
        // Assert
        verify(carTrimRepository, times(1)).findById(1L);
        verify(carTrimRepository, times(1)).delete(testTrim);
    }
}
