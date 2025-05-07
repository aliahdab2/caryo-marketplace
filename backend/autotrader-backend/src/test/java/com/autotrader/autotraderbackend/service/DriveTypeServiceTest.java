package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.DriveType;
import com.autotrader.autotraderbackend.repository.DriveTypeRepository;
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
class DriveTypeServiceTest {

    @Mock
    private DriveTypeRepository driveTypeRepository;

    @InjectMocks
    private DriveTypeService driveTypeService;

    private DriveType testDriveType;

    @BeforeEach
    void setUp() {
        testDriveType = new DriveType();
        testDriveType.setId(1L);
        testDriveType.setName("awd");
        testDriveType.setDisplayNameEn("All-Wheel Drive");
        testDriveType.setDisplayNameAr("دفع رباعي");
    }

    @Test
    void getAllDriveTypes_ShouldReturnAllDriveTypes() {
        // Arrange
        List<DriveType> expectedDriveTypes = Arrays.asList(testDriveType);
        when(driveTypeRepository.findAll()).thenReturn(expectedDriveTypes);

        // Act
        List<DriveType> result = driveTypeService.getAllDriveTypes();

        // Assert
        assertEquals(expectedDriveTypes.size(), result.size());
        assertEquals(expectedDriveTypes.get(0).getName(), result.get(0).getName());
        verify(driveTypeRepository, times(1)).findAll();
    }

    @Test
    void getDriveTypeById_WithValidId_ShouldReturnDriveType() {
        // Arrange
        when(driveTypeRepository.findById(1L)).thenReturn(Optional.of(testDriveType));

        // Act
        DriveType result = driveTypeService.getDriveTypeById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testDriveType.getId(), result.getId());
        assertEquals(testDriveType.getName(), result.getName());
        verify(driveTypeRepository, times(1)).findById(1L);
    }

    @Test
    void getDriveTypeById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(driveTypeRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            driveTypeService.getDriveTypeById(99L);
        });
        verify(driveTypeRepository, times(1)).findById(99L);
    }

    @Test
    void getDriveTypeByName_WithValidName_ShouldReturnDriveType() {
        // Arrange
        when(driveTypeRepository.findByName("awd")).thenReturn(Optional.of(testDriveType));

        // Act
        DriveType result = driveTypeService.getDriveTypeByName("awd");

        // Assert
        assertNotNull(result);
        assertEquals(testDriveType.getName(), result.getName());
        verify(driveTypeRepository, times(1)).findByName("awd");
    }

    @Test
    void getDriveTypeByName_WithInvalidName_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(driveTypeRepository.findByName("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            driveTypeService.getDriveTypeByName("invalid");
        });
        verify(driveTypeRepository, times(1)).findByName("invalid");
    }

    @Test
    void searchDriveTypes_WithValidQuery_ShouldReturnMatchingDriveTypes() {
        // Arrange
        String query = "all";
        List<DriveType> expectedDriveTypes = Arrays.asList(testDriveType);
        when(driveTypeRepository.searchByName(query)).thenReturn(expectedDriveTypes);

        // Act
        List<DriveType> result = driveTypeService.searchDriveTypes(query);

        // Assert
        assertEquals(expectedDriveTypes.size(), result.size());
        assertEquals(expectedDriveTypes.get(0).getName(), result.get(0).getName());
        verify(driveTypeRepository, times(1)).searchByName(query);
    }

    @Test
    void searchDriveTypes_WithEmptyQuery_ShouldReturnAllDriveTypes() {
        // Arrange
        String query = "";
        List<DriveType> expectedDriveTypes = Arrays.asList(testDriveType);
        when(driveTypeRepository.findAll()).thenReturn(expectedDriveTypes);

        // Act
        List<DriveType> result = driveTypeService.searchDriveTypes(query);

        // Assert
        assertEquals(expectedDriveTypes.size(), result.size());
        verify(driveTypeRepository, times(1)).findAll();
        verify(driveTypeRepository, never()).searchByName(anyString());
    }

    @Test
    void createDriveType_ShouldSaveDriveType() {
        // Arrange
        when(driveTypeRepository.save(any(DriveType.class))).thenReturn(testDriveType);

        // Act
        DriveType result = driveTypeService.createDriveType(testDriveType);

        // Assert
        assertNotNull(result);
        assertEquals(testDriveType.getName(), result.getName());
        verify(driveTypeRepository, times(1)).save(testDriveType);
    }

    @Test
    void updateDriveType_WithValidId_ShouldUpdateDriveType() {
        // Arrange
        DriveType updatedDriveType = new DriveType();
        updatedDriveType.setName("4wd");
        updatedDriveType.setDisplayNameEn("Four-Wheel Drive");
        updatedDriveType.setDisplayNameAr("دفع رباعي");
        
        when(driveTypeRepository.findById(1L)).thenReturn(Optional.of(testDriveType));
        when(driveTypeRepository.save(any(DriveType.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        DriveType result = driveTypeService.updateDriveType(1L, updatedDriveType);

        // Assert
        assertNotNull(result);
        assertEquals(updatedDriveType.getName(), result.getName());
        assertEquals(updatedDriveType.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedDriveType.getDisplayNameAr(), result.getDisplayNameAr());
        
        verify(driveTypeRepository, times(1)).findById(1L);
        verify(driveTypeRepository, times(1)).save(any(DriveType.class));
    }

    @Test
    void deleteDriveType_ShouldDeleteDriveType() {
        // Arrange
        when(driveTypeRepository.findById(1L)).thenReturn(Optional.of(testDriveType));
        doNothing().when(driveTypeRepository).delete(testDriveType);
        
        // Act
        driveTypeService.deleteDriveType(1L);
        
        // Assert
        verify(driveTypeRepository, times(1)).findById(1L);
        verify(driveTypeRepository, times(1)).delete(testDriveType);
    }
}
