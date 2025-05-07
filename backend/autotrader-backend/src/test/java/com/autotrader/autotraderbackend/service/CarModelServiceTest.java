package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
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
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarModelServiceTest {

    @Mock
    private CarModelRepository carModelRepository;
    
    @Mock
    private CarBrandService carBrandService;

    @InjectMocks
    private CarModelService carModelService;

    private CarBrand testBrand;
    private CarModel testModel;

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
    }

    @Test
    void getAllModels_ShouldReturnAllModels() {
        // Arrange
        List<CarModel> expectedModels = Arrays.asList(testModel);
        when(carModelRepository.findAll()).thenReturn(expectedModels);

        // Act
        List<CarModel> result = carModelService.getAllModels();

        // Assert
        assertEquals(expectedModels.size(), result.size());
        assertEquals(expectedModels.get(0).getName(), result.get(0).getName());
        verify(carModelRepository, times(1)).findAll();
    }

    @Test
    void getModelsByBrandId_WithValidBrandId_ShouldReturnModels() {
        // Arrange
        List<CarModel> expectedModels = Arrays.asList(testModel);
        when(carBrandService.getBrandById(1L)).thenReturn(testBrand);
        when(carModelRepository.findByBrand(testBrand)).thenReturn(expectedModels);

        // Act
        List<CarModel> result = carModelService.getModelsByBrandId(1L);

        // Assert
        assertEquals(expectedModels.size(), result.size());
        assertEquals(expectedModels.get(0).getName(), result.get(0).getName());
        assertEquals(expectedModels.get(0).getBrand().getId(), testBrand.getId());
        verify(carBrandService, times(1)).getBrandById(1L);
        verify(carModelRepository, times(1)).findByBrand(testBrand);
    }

    @Test
    void getActiveModelsByBrandId_WithValidBrandId_ShouldReturnActiveModels() {
        // Arrange
        List<CarModel> expectedModels = Arrays.asList(testModel);
        when(carBrandService.getBrandById(1L)).thenReturn(testBrand);
        when(carModelRepository.findByBrandAndIsActiveTrue(testBrand)).thenReturn(expectedModels);

        // Act
        List<CarModel> result = carModelService.getActiveModelsByBrandId(1L);

        // Assert
        assertEquals(expectedModels.size(), result.size());
        assertTrue(result.get(0).getIsActive());
        verify(carBrandService, times(1)).getBrandById(1L);
        verify(carModelRepository, times(1)).findByBrandAndIsActiveTrue(testBrand);
    }

    @Test
    void getModelsByBrandSlug_WithValidBrandSlug_ShouldReturnModels() {
        // Arrange
        List<CarModel> expectedModels = Arrays.asList(testModel);
        when(carBrandService.getBrandBySlug("toyota")).thenReturn(testBrand);
        when(carModelRepository.findByBrand(testBrand)).thenReturn(expectedModels);

        // Act
        List<CarModel> result = carModelService.getModelsByBrandSlug("toyota");

        // Assert
        assertEquals(expectedModels.size(), result.size());
        assertEquals(expectedModels.get(0).getName(), result.get(0).getName());
        verify(carBrandService, times(1)).getBrandBySlug("toyota");
        verify(carModelRepository, times(1)).findByBrand(testBrand);
    }

    @Test
    void getActiveModelsByBrandSlug_WithValidBrandSlug_ShouldReturnActiveModels() {
        // Arrange
        List<CarModel> expectedModels = Arrays.asList(testModel);
        when(carBrandService.getBrandBySlug("toyota")).thenReturn(testBrand);
        when(carModelRepository.findByBrandAndIsActiveTrue(testBrand)).thenReturn(expectedModels);

        // Act
        List<CarModel> result = carModelService.getActiveModelsByBrandSlug("toyota");

        // Assert
        assertEquals(expectedModels.size(), result.size());
        assertTrue(result.get(0).getIsActive());
        verify(carBrandService, times(1)).getBrandBySlug("toyota");
        verify(carModelRepository, times(1)).findByBrandAndIsActiveTrue(testBrand);
    }

    @Test
    void getModelById_WithValidId_ShouldReturnModel() {
        // Arrange
        when(carModelRepository.findById(1L)).thenReturn(Optional.of(testModel));

        // Act
        CarModel result = carModelService.getModelById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testModel.getId(), result.getId());
        assertEquals(testModel.getName(), result.getName());
        verify(carModelRepository, times(1)).findById(1L);
    }

    @Test
    void getModelById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carModelRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carModelService.getModelById(99L);
        });
        assertEquals("CarModel", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(99L, exception.getFieldValue());
        verify(carModelRepository, times(1)).findById(99L);
    }

    @Test
    void getModelBySlug_WithValidSlug_ShouldReturnModel() {
        // Arrange
        when(carModelRepository.findBySlug("camry")).thenReturn(Optional.of(testModel));

        // Act
        CarModel result = carModelService.getModelBySlug("camry");

        // Assert
        assertNotNull(result);
        assertEquals(testModel.getSlug(), result.getSlug());
        verify(carModelRepository, times(1)).findBySlug("camry");
    }

    @Test
    void getModelBySlug_WithInvalidSlug_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carModelRepository.findBySlug("invalid-slug")).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carModelService.getModelBySlug("invalid-slug");
        });
        assertEquals("CarModel", exception.getResourceName());
        assertEquals("slug", exception.getFieldName());
        assertEquals("invalid-slug", exception.getFieldValue());
        verify(carModelRepository, times(1)).findBySlug("invalid-slug");
    }

    @Test
    void searchModels_WithValidQuery_ShouldReturnMatchingModels() {
        // Arrange
        String query = "cam";
        List<CarModel> expectedModels = Arrays.asList(testModel);
        when(carModelRepository.searchByName(query)).thenReturn(expectedModels);

        // Act
        List<CarModel> result = carModelService.searchModels(query);

        // Assert
        assertEquals(expectedModels.size(), result.size());
        assertEquals(expectedModels.get(0).getName(), result.get(0).getName());
        verify(carModelRepository, times(1)).searchByName(query);
    }

    @Test
    void searchModels_WithEmptyQuery_ShouldReturnAllModels() {
        // Arrange
        String query = "";
        List<CarModel> expectedModels = Arrays.asList(testModel);
        when(carModelRepository.findAll()).thenReturn(expectedModels);

        // Act
        List<CarModel> result = carModelService.searchModels(query);

        // Assert
        assertEquals(expectedModels.size(), result.size());
        verify(carModelRepository, times(1)).findAll();
        verify(carModelRepository, never()).searchByName(anyString());
    }

    @Test
    void searchModelsByBrand_WithValidQuery_ShouldReturnFilteredModels() {
        // Arrange
        String query = "cam";
        Long brandId = 1L;
        
        // Create a model for a different brand
        CarBrand otherBrand = new CarBrand();
        otherBrand.setId(2L);
        
        CarModel modelForOtherBrand = new CarModel();
        modelForOtherBrand.setId(2L);
        modelForOtherBrand.setBrand(otherBrand);
        modelForOtherBrand.setName("Camera");
        
        List<CarModel> searchResults = Arrays.asList(testModel, modelForOtherBrand);
        
        when(carModelRepository.searchByName(query)).thenReturn(searchResults);
        // We don't need this stub as the filter is done by stream filtering
        // when(carBrandService.getBrandById(brandId)).thenReturn(testBrand);

        // Act
        List<CarModel> result = carModelService.searchModelsByBrand(brandId, query);

        // Assert
        assertEquals(1, result.size());
        assertEquals(testModel.getId(), result.get(0).getId());
        verify(carModelRepository, times(1)).searchByName(query);
    }

    @Test
    void searchModelsByBrand_WithEmptyQuery_ShouldReturnAllModelsForBrand() {
        // Arrange
        String query = "";
        Long brandId = 1L;
        List<CarModel> expectedModels = Arrays.asList(testModel);
        
        when(carBrandService.getBrandById(brandId)).thenReturn(testBrand);
        when(carModelRepository.findByBrand(testBrand)).thenReturn(expectedModels);

        // Act
        List<CarModel> result = carModelService.searchModelsByBrand(brandId, query);

        // Assert
        assertEquals(expectedModels.size(), result.size());
        verify(carBrandService, times(1)).getBrandById(brandId);
        verify(carModelRepository, times(1)).findByBrand(testBrand);
        verify(carModelRepository, never()).searchByName(anyString());
    }

    @Test
    void createModel_ShouldSaveModel() {
        // Arrange
        when(carBrandService.getBrandById(testBrand.getId())).thenReturn(testBrand);
        when(carModelRepository.save(any(CarModel.class))).thenReturn(testModel);

        // Act
        CarModel result = carModelService.createModel(testModel);

        // Assert
        assertNotNull(result);
        assertEquals(testModel.getName(), result.getName());
        verify(carBrandService, times(1)).getBrandById(testBrand.getId());
        verify(carModelRepository, times(1)).save(testModel);
    }

    @Test
    void updateModel_WithValidId_ShouldUpdateModel() {
        // Arrange
        CarModel updatedModel = new CarModel();
        updatedModel.setName("Camry Updated");
        updatedModel.setDisplayNameEn("Camry Updated");
        updatedModel.setDisplayNameAr("كامري محدث");
        updatedModel.setIsActive(false);
        updatedModel.setBrand(testBrand);
        
        when(carModelRepository.findById(1L)).thenReturn(Optional.of(testModel));
        when(carModelRepository.save(any(CarModel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        CarModel result = carModelService.updateModel(1L, updatedModel);

        // Assert
        assertNotNull(result);
        assertEquals(updatedModel.getName(), result.getName());
        assertEquals(updatedModel.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedModel.getDisplayNameAr(), result.getDisplayNameAr());
        assertEquals(updatedModel.getIsActive(), result.getIsActive());
        // Verify slug is not updated
        assertEquals(testModel.getSlug(), result.getSlug());
        
        verify(carModelRepository, times(1)).findById(1L);
        verify(carModelRepository, times(1)).save(any(CarModel.class));
    }

    @Test
    void updateModel_WithChangedBrand_ShouldUpdateModelAndBrand() {
        // Arrange
        CarBrand newBrand = new CarBrand();
        newBrand.setId(2L);
        newBrand.setName("Honda");
        
        CarModel updatedModel = new CarModel();
        updatedModel.setName("Civic");
        updatedModel.setBrand(newBrand);
        
        when(carModelRepository.findById(1L)).thenReturn(Optional.of(testModel));
        when(carBrandService.getBrandById(2L)).thenReturn(newBrand);
        when(carModelRepository.save(any(CarModel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        CarModel result = carModelService.updateModel(1L, updatedModel);

        // Assert
        assertNotNull(result);
        assertEquals(updatedModel.getName(), result.getName());
        assertEquals(newBrand.getId(), result.getBrand().getId());
        
        verify(carModelRepository, times(1)).findById(1L);
        verify(carBrandService, times(1)).getBrandById(2L);
        verify(carModelRepository, times(1)).save(any(CarModel.class));
    }

    @Test
    void updateModelActivation_ShouldChangeActivationStatus() {
        // Arrange
        when(carModelRepository.findById(1L)).thenReturn(Optional.of(testModel));
        when(carModelRepository.save(any(CarModel.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        CarModel result = carModelService.updateModelActivation(1L, false);
        
        // Assert
        assertFalse(result.getIsActive());
        verify(carModelRepository, times(1)).findById(1L);
        verify(carModelRepository, times(1)).save(any(CarModel.class));
    }

    @Test
    void deleteModel_ShouldDeleteModel() {
        // Arrange
        when(carModelRepository.findById(1L)).thenReturn(Optional.of(testModel));
        doNothing().when(carModelRepository).delete(testModel);
        
        // Act
        carModelService.deleteModel(1L);
        
        // Assert
        verify(carModelRepository, times(1)).findById(1L);
        verify(carModelRepository, times(1)).delete(testModel);
    }
}
