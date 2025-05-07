package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.SellerType;
import com.autotrader.autotraderbackend.repository.SellerTypeRepository;
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
class SellerTypeServiceTest {

    @Mock
    private SellerTypeRepository sellerTypeRepository;

    @InjectMocks
    private SellerTypeService sellerTypeService;

    private SellerType testSellerType;

    @BeforeEach
    void setUp() {
        testSellerType = new SellerType();
        testSellerType.setId(1L);
        testSellerType.setName("dealer");
        testSellerType.setDisplayNameEn("Dealer");
        testSellerType.setDisplayNameAr("تاجر");
    }

    @Test
    void getAllSellerTypes_ShouldReturnAllSellerTypes() {
        // Arrange
        List<SellerType> expectedSellerTypes = Arrays.asList(testSellerType);
        when(sellerTypeRepository.findAll()).thenReturn(expectedSellerTypes);

        // Act
        List<SellerType> result = sellerTypeService.getAllSellerTypes();

        // Assert
        assertEquals(expectedSellerTypes.size(), result.size());
        assertEquals(expectedSellerTypes.get(0).getName(), result.get(0).getName());
        verify(sellerTypeRepository, times(1)).findAll();
    }

    @Test
    void getSellerTypeById_WithValidId_ShouldReturnSellerType() {
        // Arrange
        when(sellerTypeRepository.findById(1L)).thenReturn(Optional.of(testSellerType));

        // Act
        SellerType result = sellerTypeService.getSellerTypeById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testSellerType.getId(), result.getId());
        assertEquals(testSellerType.getName(), result.getName());
        verify(sellerTypeRepository, times(1)).findById(1L);
    }

    @Test
    void getSellerTypeById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(sellerTypeRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            sellerTypeService.getSellerTypeById(99L);
        });
        assertEquals("SellerType", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(99L, exception.getFieldValue());
        verify(sellerTypeRepository, times(1)).findById(99L);
    }

    @Test
    void getSellerTypeByName_WithValidName_ShouldReturnSellerType() {
        // Arrange
        when(sellerTypeRepository.findByName("dealer")).thenReturn(Optional.of(testSellerType));

        // Act
        SellerType result = sellerTypeService.getSellerTypeByName("dealer");

        // Assert
        assertNotNull(result);
        assertEquals(testSellerType.getName(), result.getName());
        verify(sellerTypeRepository, times(1)).findByName("dealer");
    }

    @Test
    void getSellerTypeByName_WithInvalidName_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(sellerTypeRepository.findByName("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            sellerTypeService.getSellerTypeByName("invalid");
        });
        assertEquals("SellerType", exception.getResourceName());
        assertEquals("name", exception.getFieldName());
        assertEquals("invalid", exception.getFieldValue());
        verify(sellerTypeRepository, times(1)).findByName("invalid");
    }

    @Test
    void searchSellerTypes_WithValidQuery_ShouldReturnMatchingSellerTypes() {
        // Arrange
        String query = "deal";
        List<SellerType> expectedSellerTypes = Arrays.asList(testSellerType);
        when(sellerTypeRepository.searchByName(query)).thenReturn(expectedSellerTypes);

        // Act
        List<SellerType> result = sellerTypeService.searchSellerTypes(query);

        // Assert
        assertEquals(expectedSellerTypes.size(), result.size());
        assertEquals(expectedSellerTypes.get(0).getName(), result.get(0).getName());
        verify(sellerTypeRepository, times(1)).searchByName(query);
    }

    @Test
    void searchSellerTypes_WithEmptyQuery_ShouldReturnAllSellerTypes() {
        // Arrange
        String query = "";
        List<SellerType> expectedSellerTypes = Arrays.asList(testSellerType);
        when(sellerTypeRepository.findAll()).thenReturn(expectedSellerTypes);

        // Act
        List<SellerType> result = sellerTypeService.searchSellerTypes(query);

        // Assert
        assertEquals(expectedSellerTypes.size(), result.size());
        verify(sellerTypeRepository, times(1)).findAll();
        verify(sellerTypeRepository, never()).searchByName(anyString());
    }

    @Test
    void createSellerType_ShouldSaveSellerType() {
        // Arrange
        when(sellerTypeRepository.save(any(SellerType.class))).thenReturn(testSellerType);

        // Act
        SellerType result = sellerTypeService.createSellerType(testSellerType);

        // Assert
        assertNotNull(result);
        assertEquals(testSellerType.getName(), result.getName());
        verify(sellerTypeRepository, times(1)).save(testSellerType);
    }

    @Test
    void updateSellerType_WithValidId_ShouldUpdateSellerType() {
        // Arrange
        SellerType updatedSellerType = new SellerType();
        updatedSellerType.setName("private");
        updatedSellerType.setDisplayNameEn("Private");
        updatedSellerType.setDisplayNameAr("خاص");
        
        when(sellerTypeRepository.findById(1L)).thenReturn(Optional.of(testSellerType));
        when(sellerTypeRepository.save(any(SellerType.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        SellerType result = sellerTypeService.updateSellerType(1L, updatedSellerType);

        // Assert
        assertNotNull(result);
        assertEquals(updatedSellerType.getName(), result.getName());
        assertEquals(updatedSellerType.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedSellerType.getDisplayNameAr(), result.getDisplayNameAr());
        
        verify(sellerTypeRepository, times(1)).findById(1L);
        verify(sellerTypeRepository, times(1)).save(any(SellerType.class));
    }

    @Test
    void deleteSellerType_ShouldDeleteSellerType() {
        // Arrange
        when(sellerTypeRepository.findById(1L)).thenReturn(Optional.of(testSellerType));
        doNothing().when(sellerTypeRepository).delete(testSellerType);
        
        // Act
        sellerTypeService.deleteSellerType(1L);
        
        // Assert
        verify(sellerTypeRepository, times(1)).findById(1L);
        verify(sellerTypeRepository, times(1)).delete(testSellerType);
    }
}
