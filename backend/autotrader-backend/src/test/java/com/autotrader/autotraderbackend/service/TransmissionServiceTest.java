package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.Transmission;
import com.autotrader.autotraderbackend.repository.TransmissionRepository;
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
class TransmissionServiceTest {

    @Mock
    private TransmissionRepository transmissionRepository;

    @InjectMocks
    private TransmissionService transmissionService;

    private Transmission testTransmission;

    @BeforeEach
    void setUp() {
        testTransmission = new Transmission();
        testTransmission.setId(1L);
        testTransmission.setName("automatic");
        testTransmission.setDisplayNameEn("Automatic");
        testTransmission.setDisplayNameAr("أوتوماتيك");
    }

    @Test
    void getAllTransmissions_ShouldReturnAllTransmissions() {
        // Arrange
        List<Transmission> expectedTransmissions = Arrays.asList(testTransmission);
        when(transmissionRepository.findAll()).thenReturn(expectedTransmissions);

        // Act
        List<Transmission> result = transmissionService.getAllTransmissions();

        // Assert
        assertEquals(expectedTransmissions.size(), result.size());
        assertEquals(expectedTransmissions.get(0).getName(), result.get(0).getName());
        verify(transmissionRepository, times(1)).findAll();
    }

    @Test
    void getTransmissionById_WithValidId_ShouldReturnTransmission() {
        // Arrange
        when(transmissionRepository.findById(1L)).thenReturn(Optional.of(testTransmission));

        // Act
        Transmission result = transmissionService.getTransmissionById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testTransmission.getId(), result.getId());
        assertEquals(testTransmission.getName(), result.getName());
        verify(transmissionRepository, times(1)).findById(1L);
    }

    @Test
    void getTransmissionById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(transmissionRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            transmissionService.getTransmissionById(99L);
        });
        assertEquals("Transmission", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(99L, exception.getFieldValue());
        verify(transmissionRepository, times(1)).findById(99L);
    }

    @Test
    void getTransmissionByName_WithValidName_ShouldReturnTransmission() {
        // Arrange
        when(transmissionRepository.findByName("automatic")).thenReturn(Optional.of(testTransmission));

        // Act
        Transmission result = transmissionService.getTransmissionByName("automatic");

        // Assert
        assertNotNull(result);
        assertEquals(testTransmission.getName(), result.getName());
        verify(transmissionRepository, times(1)).findByName("automatic");
    }

    @Test
    void getTransmissionByName_WithInvalidName_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(transmissionRepository.findByName("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            transmissionService.getTransmissionByName("invalid");
        });
        assertEquals("Transmission", exception.getResourceName());
        assertEquals("name", exception.getFieldName());
        assertEquals("invalid", exception.getFieldValue());
        verify(transmissionRepository, times(1)).findByName("invalid");
    }

    @Test
    void searchTransmissions_WithValidQuery_ShouldReturnMatchingTransmissions() {
        // Arrange
        String query = "auto";
        List<Transmission> expectedTransmissions = Arrays.asList(testTransmission);
        when(transmissionRepository.searchByName(query)).thenReturn(expectedTransmissions);

        // Act
        List<Transmission> result = transmissionService.searchTransmissions(query);

        // Assert
        assertEquals(expectedTransmissions.size(), result.size());
        assertEquals(expectedTransmissions.get(0).getName(), result.get(0).getName());
        verify(transmissionRepository, times(1)).searchByName(query);
    }

    @Test
    void searchTransmissions_WithEmptyQuery_ShouldReturnAllTransmissions() {
        // Arrange
        String query = "";
        List<Transmission> expectedTransmissions = Arrays.asList(testTransmission);
        when(transmissionRepository.findAll()).thenReturn(expectedTransmissions);

        // Act
        List<Transmission> result = transmissionService.searchTransmissions(query);

        // Assert
        assertEquals(expectedTransmissions.size(), result.size());
        verify(transmissionRepository, times(1)).findAll();
        verify(transmissionRepository, never()).searchByName(anyString());
    }

    @Test
    void createTransmission_ShouldSaveTransmission() {
        // Arrange
        when(transmissionRepository.save(any(Transmission.class))).thenReturn(testTransmission);

        // Act
        Transmission result = transmissionService.createTransmission(testTransmission);

        // Assert
        assertNotNull(result);
        assertEquals(testTransmission.getName(), result.getName());
        verify(transmissionRepository, times(1)).save(testTransmission);
    }

    @Test
    void updateTransmission_WithValidId_ShouldUpdateTransmission() {
        // Arrange
        Transmission updatedTransmission = new Transmission();
        updatedTransmission.setName("manual");
        updatedTransmission.setDisplayNameEn("Manual");
        updatedTransmission.setDisplayNameAr("يدوي");
        
        when(transmissionRepository.findById(1L)).thenReturn(Optional.of(testTransmission));
        when(transmissionRepository.save(any(Transmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Transmission result = transmissionService.updateTransmission(1L, updatedTransmission);

        // Assert
        assertNotNull(result);
        assertEquals(updatedTransmission.getName(), result.getName());
        assertEquals(updatedTransmission.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedTransmission.getDisplayNameAr(), result.getDisplayNameAr());
        
        verify(transmissionRepository, times(1)).findById(1L);
        verify(transmissionRepository, times(1)).save(any(Transmission.class));
    }

    @Test
    void deleteTransmission_ShouldDeleteTransmission() {
        // Arrange
        when(transmissionRepository.findById(1L)).thenReturn(Optional.of(testTransmission));
        doNothing().when(transmissionRepository).delete(testTransmission);
        
        // Act
        transmissionService.deleteTransmission(1L);
        
        // Assert
        verify(transmissionRepository, times(1)).findById(1L);
        verify(transmissionRepository, times(1)).delete(testTransmission);
    }
}
