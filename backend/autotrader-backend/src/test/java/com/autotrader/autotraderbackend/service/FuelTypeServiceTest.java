package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.FuelType;
import com.autotrader.autotraderbackend.repository.FuelTypeRepository;
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
class FuelTypeServiceTest {

    @Mock
    private FuelTypeRepository fuelTypeRepository;

    @InjectMocks
    private FuelTypeService fuelTypeService;

    private FuelType testFuelType;

    @BeforeEach
    void setUp() {
        testFuelType = new FuelType();
        testFuelType.setId(1L);
        testFuelType.setName("petrol");
        testFuelType.setDisplayNameEn("Petrol");
        testFuelType.setDisplayNameAr("بنزين");
    }

    @Test
    void getAllFuelTypes_ShouldReturnAllFuelTypes() {
        // Arrange
        List<FuelType> expectedFuelTypes = Arrays.asList(testFuelType);
        when(fuelTypeRepository.findAll()).thenReturn(expectedFuelTypes);

        // Act
        List<FuelType> result = fuelTypeService.getAllFuelTypes();

        // Assert
        assertEquals(expectedFuelTypes.size(), result.size());
        assertEquals(expectedFuelTypes.get(0).getName(), result.get(0).getName());
        verify(fuelTypeRepository, times(1)).findAll();
    }

    @Test
    void getFuelTypeById_WithValidId_ShouldReturnFuelType() {
        // Arrange
        when(fuelTypeRepository.findById(1L)).thenReturn(Optional.of(testFuelType));

        // Act
        FuelType result = fuelTypeService.getFuelTypeById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testFuelType.getId(), result.getId());
        assertEquals(testFuelType.getName(), result.getName());
        verify(fuelTypeRepository, times(1)).findById(1L);
    }

    @Test
    void getFuelTypeById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(fuelTypeRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            fuelTypeService.getFuelTypeById(99L);
        });
        assertEquals("FuelType", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(99L, exception.getFieldValue());
        verify(fuelTypeRepository, times(1)).findById(99L);
    }

    @Test
    void getFuelTypeByName_WithValidName_ShouldReturnFuelType() {
        // Arrange
        when(fuelTypeRepository.findByName("petrol")).thenReturn(Optional.of(testFuelType));

        // Act
        FuelType result = fuelTypeService.getFuelTypeByName("petrol");

        // Assert
        assertNotNull(result);
        assertEquals(testFuelType.getName(), result.getName());
        verify(fuelTypeRepository, times(1)).findByName("petrol");
    }

    @Test
    void getFuelTypeByName_WithInvalidName_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(fuelTypeRepository.findByName("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            fuelTypeService.getFuelTypeByName("invalid");
        });
        assertEquals("FuelType", exception.getResourceName());
        assertEquals("name", exception.getFieldName());
        assertEquals("invalid", exception.getFieldValue());
        verify(fuelTypeRepository, times(1)).findByName("invalid");
    }

    @Test
    void searchFuelTypes_WithValidQuery_ShouldReturnMatchingFuelTypes() {
        // Arrange
        String query = "pet";
        List<FuelType> expectedFuelTypes = Arrays.asList(testFuelType);
        when(fuelTypeRepository.searchByName(query)).thenReturn(expectedFuelTypes);

        // Act
        List<FuelType> result = fuelTypeService.searchFuelTypes(query);

        // Assert
        assertEquals(expectedFuelTypes.size(), result.size());
        assertEquals(expectedFuelTypes.get(0).getName(), result.get(0).getName());
        verify(fuelTypeRepository, times(1)).searchByName(query);
    }

    @Test
    void searchFuelTypes_WithEmptyQuery_ShouldReturnAllFuelTypes() {
        // Arrange
        String query = "";
        List<FuelType> expectedFuelTypes = Arrays.asList(testFuelType);
        when(fuelTypeRepository.findAll()).thenReturn(expectedFuelTypes);

        // Act
        List<FuelType> result = fuelTypeService.searchFuelTypes(query);

        // Assert
        assertEquals(expectedFuelTypes.size(), result.size());
        verify(fuelTypeRepository, times(1)).findAll();
        verify(fuelTypeRepository, never()).searchByName(anyString());
    }

    @Test
    void createFuelType_ShouldSaveFuelType() {
        // Arrange
        when(fuelTypeRepository.save(any(FuelType.class))).thenReturn(testFuelType);

        // Act
        FuelType result = fuelTypeService.createFuelType(testFuelType);

        // Assert
        assertNotNull(result);
        assertEquals(testFuelType.getName(), result.getName());
        verify(fuelTypeRepository, times(1)).save(testFuelType);
    }

    @Test
    void updateFuelType_WithValidId_ShouldUpdateFuelType() {
        // Arrange
        FuelType updatedFuelType = new FuelType();
        updatedFuelType.setName("diesel");
        updatedFuelType.setDisplayNameEn("Diesel");
        updatedFuelType.setDisplayNameAr("ديزل");
        
        when(fuelTypeRepository.findById(1L)).thenReturn(Optional.of(testFuelType));
        when(fuelTypeRepository.save(any(FuelType.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        FuelType result = fuelTypeService.updateFuelType(1L, updatedFuelType);

        // Assert
        assertNotNull(result);
        assertEquals(updatedFuelType.getName(), result.getName());
        assertEquals(updatedFuelType.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedFuelType.getDisplayNameAr(), result.getDisplayNameAr());
        
        verify(fuelTypeRepository, times(1)).findById(1L);
        verify(fuelTypeRepository, times(1)).save(any(FuelType.class));
    }

    @Test
    void deleteFuelType_ShouldDeleteFuelType() {
        // Arrange
        when(fuelTypeRepository.findById(1L)).thenReturn(Optional.of(testFuelType));
        doNothing().when(fuelTypeRepository).delete(testFuelType);
        
        // Act
        fuelTypeService.deleteFuelType(1L);
        
        // Assert
        verify(fuelTypeRepository, times(1)).findById(1L);
        verify(fuelTypeRepository, times(1)).delete(testFuelType);
    }
}
