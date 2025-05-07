package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class CarBrandServiceTest {

    @Mock
    private CarBrandRepository carBrandRepository;

    @InjectMocks
    private CarBrandService carBrandService;

    private CarBrand testBrand;

    @BeforeEach
    void setUp() {
        testBrand = new CarBrand();
        testBrand.setId(1L);
        testBrand.setName("Toyota");
        testBrand.setSlug("toyota");
        testBrand.setDisplayNameEn("Toyota");
        testBrand.setDisplayNameAr("تويوتا");
        testBrand.setIsActive(true);
    }

    @Test
    void getAllBrands_ShouldReturnAllBrands() {
        // Arrange
        List<CarBrand> expectedBrands = Arrays.asList(testBrand);
        when(carBrandRepository.findAll()).thenReturn(expectedBrands);

        // Act
        List<CarBrand> result = carBrandService.getAllBrands();

        // Assert
        assertEquals(expectedBrands.size(), result.size());
        assertEquals(expectedBrands.get(0).getName(), result.get(0).getName());
        verify(carBrandRepository, times(1)).findAll();
    }

    @Test
    void getActiveBrands_ShouldReturnOnlyActiveBrands() {
        // Arrange
        List<CarBrand> expectedBrands = Arrays.asList(testBrand);
        when(carBrandRepository.findByIsActiveTrue()).thenReturn(expectedBrands);

        // Act
        List<CarBrand> result = carBrandService.getActiveBrands();

        // Assert
        assertEquals(expectedBrands.size(), result.size());
        assertTrue(result.get(0).getIsActive());
        verify(carBrandRepository, times(1)).findByIsActiveTrue();
    }

    @Test
    void getBrandById_WithValidId_ShouldReturnBrand() {
        // Arrange
        when(carBrandRepository.findById(1L)).thenReturn(Optional.of(testBrand));

        // Act
        CarBrand result = carBrandService.getBrandById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testBrand.getId(), result.getId());
        assertEquals(testBrand.getName(), result.getName());
        verify(carBrandRepository, times(1)).findById(1L);
    }

    @Test
    void getBrandById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carBrandRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carBrandService.getBrandById(99L);
        });
        assertEquals("CarBrand", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(99L, exception.getFieldValue());
        verify(carBrandRepository, times(1)).findById(99L);
    }

    @Test
    void getBrandBySlug_WithValidSlug_ShouldReturnBrand() {
        // Arrange
        when(carBrandRepository.findBySlug("toyota")).thenReturn(Optional.of(testBrand));

        // Act
        CarBrand result = carBrandService.getBrandBySlug("toyota");

        // Assert
        assertNotNull(result);
        assertEquals(testBrand.getSlug(), result.getSlug());
        verify(carBrandRepository, times(1)).findBySlug("toyota");
    }

    @Test
    void getBrandBySlug_WithInvalidSlug_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carBrandRepository.findBySlug("invalid-slug")).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carBrandService.getBrandBySlug("invalid-slug");
        });
        assertEquals("CarBrand", exception.getResourceName());
        assertEquals("slug", exception.getFieldName());
        assertEquals("invalid-slug", exception.getFieldValue());
        verify(carBrandRepository, times(1)).findBySlug("invalid-slug");
    }

    @Test
    void searchBrands_WithValidQuery_ShouldReturnMatchingBrands() {
        // Arrange
        String query = "toy";
        List<CarBrand> expectedBrands = Arrays.asList(testBrand);
        when(carBrandRepository.searchByName(query)).thenReturn(expectedBrands);

        // Act
        List<CarBrand> result = carBrandService.searchBrands(query);

        // Assert
        assertEquals(expectedBrands.size(), result.size());
        assertEquals(expectedBrands.get(0).getName(), result.get(0).getName());
        verify(carBrandRepository, times(1)).searchByName(query);
    }

    @Test
    void searchBrands_WithEmptyQuery_ShouldReturnActiveBrands() {
        // Arrange
        String query = "";
        List<CarBrand> expectedBrands = Arrays.asList(testBrand);
        when(carBrandRepository.findByIsActiveTrue()).thenReturn(expectedBrands);

        // Act
        List<CarBrand> result = carBrandService.searchBrands(query);

        // Assert
        assertEquals(expectedBrands.size(), result.size());
        verify(carBrandRepository, times(1)).findByIsActiveTrue();
        verify(carBrandRepository, never()).searchByName(anyString());
    }

    @Test
    void createBrand_ShouldSaveBrand() {
        // Arrange
        when(carBrandRepository.save(any(CarBrand.class))).thenReturn(testBrand);

        // Act
        CarBrand result = carBrandService.createBrand(testBrand);

        // Assert
        assertNotNull(result);
        assertEquals(testBrand.getName(), result.getName());
        verify(carBrandRepository, times(1)).save(testBrand);
    }

    @Test
    void updateBrand_WithValidId_ShouldUpdateBrand() {
        // Arrange
        CarBrand updatedBrand = new CarBrand();
        updatedBrand.setName("Toyota Updated");
        updatedBrand.setDisplayNameEn("Toyota Updated");
        updatedBrand.setDisplayNameAr("تويوتا محدث");
        updatedBrand.setIsActive(false);
        
        when(carBrandRepository.findById(1L)).thenReturn(Optional.of(testBrand));
        when(carBrandRepository.save(any(CarBrand.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        CarBrand result = carBrandService.updateBrand(1L, updatedBrand);

        // Assert
        assertNotNull(result);
        assertEquals(updatedBrand.getName(), result.getName());
        assertEquals(updatedBrand.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedBrand.getDisplayNameAr(), result.getDisplayNameAr());
        assertEquals(updatedBrand.getIsActive(), result.getIsActive());
        // Verify slug is not updated
        assertEquals(testBrand.getSlug(), result.getSlug());
        
        verify(carBrandRepository, times(1)).findById(1L);
        verify(carBrandRepository, times(1)).save(any(CarBrand.class));
    }

    @Test
    void updateBrandActivation_ShouldChangeActivationStatus() {
        // Arrange
        when(carBrandRepository.findById(1L)).thenReturn(Optional.of(testBrand));
        when(carBrandRepository.save(any(CarBrand.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        CarBrand result = carBrandService.updateBrandActivation(1L, false);
        
        // Assert
        assertFalse(result.getIsActive());
        verify(carBrandRepository, times(1)).findById(1L);
        verify(carBrandRepository, times(1)).save(any(CarBrand.class));
    }

    @Test
    void deleteBrand_ShouldDeleteBrand() {
        // Arrange
        when(carBrandRepository.findById(1L)).thenReturn(Optional.of(testBrand));
        doNothing().when(carBrandRepository).delete(testBrand);
        
        // Act
        carBrandService.deleteBrand(1L);
        
        // Assert
        verify(carBrandRepository, times(1)).findById(1L);
        verify(carBrandRepository, times(1)).delete(testBrand);
    }
}
