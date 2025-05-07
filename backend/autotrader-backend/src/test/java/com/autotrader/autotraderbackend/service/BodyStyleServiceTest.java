package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.BodyStyle;
import com.autotrader.autotraderbackend.repository.BodyStyleRepository;
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
class BodyStyleServiceTest {

    @Mock
    private BodyStyleRepository bodyStyleRepository;

    @InjectMocks
    private BodyStyleService bodyStyleService;

    private BodyStyle testBodyStyle;

    @BeforeEach
    void setUp() {
        testBodyStyle = new BodyStyle();
        testBodyStyle.setId(1L);
        testBodyStyle.setName("suv");
        testBodyStyle.setDisplayNameEn("SUV");
        testBodyStyle.setDisplayNameAr("إس يو في");
    }

    @Test
    void getAllBodyStyles_ShouldReturnAllBodyStyles() {
        // Arrange
        List<BodyStyle> expectedBodyStyles = Arrays.asList(testBodyStyle);
        when(bodyStyleRepository.findAll()).thenReturn(expectedBodyStyles);

        // Act
        List<BodyStyle> result = bodyStyleService.getAllBodyStyles();

        // Assert
        assertEquals(expectedBodyStyles.size(), result.size());
        assertEquals(expectedBodyStyles.get(0).getName(), result.get(0).getName());
        verify(bodyStyleRepository, times(1)).findAll();
    }

    @Test
    void getBodyStyleById_WithValidId_ShouldReturnBodyStyle() {
        // Arrange
        when(bodyStyleRepository.findById(1L)).thenReturn(Optional.of(testBodyStyle));

        // Act
        BodyStyle result = bodyStyleService.getBodyStyleById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testBodyStyle.getId(), result.getId());
        assertEquals(testBodyStyle.getName(), result.getName());
        verify(bodyStyleRepository, times(1)).findById(1L);
    }

    @Test
    void getBodyStyleById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(bodyStyleRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            bodyStyleService.getBodyStyleById(99L);
        });
        assertEquals("BodyStyle", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(99L, exception.getFieldValue());
        verify(bodyStyleRepository, times(1)).findById(99L);
    }

    @Test
    void getBodyStyleByName_WithValidName_ShouldReturnBodyStyle() {
        // Arrange
        when(bodyStyleRepository.findByName("suv")).thenReturn(Optional.of(testBodyStyle));

        // Act
        BodyStyle result = bodyStyleService.getBodyStyleByName("suv");

        // Assert
        assertNotNull(result);
        assertEquals(testBodyStyle.getName(), result.getName());
        verify(bodyStyleRepository, times(1)).findByName("suv");
    }

    @Test
    void getBodyStyleByName_WithInvalidName_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(bodyStyleRepository.findByName("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            bodyStyleService.getBodyStyleByName("invalid");
        });
        assertEquals("BodyStyle", exception.getResourceName());
        assertEquals("name", exception.getFieldName());
        assertEquals("invalid", exception.getFieldValue());
        verify(bodyStyleRepository, times(1)).findByName("invalid");
    }

    @Test
    void searchBodyStyles_WithValidQuery_ShouldReturnMatchingBodyStyles() {
        // Arrange
        String query = "su";
        List<BodyStyle> expectedBodyStyles = Arrays.asList(testBodyStyle);
        when(bodyStyleRepository.searchByName(query)).thenReturn(expectedBodyStyles);

        // Act
        List<BodyStyle> result = bodyStyleService.searchBodyStyles(query);

        // Assert
        assertEquals(expectedBodyStyles.size(), result.size());
        assertEquals(expectedBodyStyles.get(0).getName(), result.get(0).getName());
        verify(bodyStyleRepository, times(1)).searchByName(query);
    }

    @Test
    void searchBodyStyles_WithEmptyQuery_ShouldReturnAllBodyStyles() {
        // Arrange
        String query = "";
        List<BodyStyle> expectedBodyStyles = Arrays.asList(testBodyStyle);
        when(bodyStyleRepository.findAll()).thenReturn(expectedBodyStyles);

        // Act
        List<BodyStyle> result = bodyStyleService.searchBodyStyles(query);

        // Assert
        assertEquals(expectedBodyStyles.size(), result.size());
        verify(bodyStyleRepository, times(1)).findAll();
        verify(bodyStyleRepository, never()).searchByName(anyString());
    }

    @Test
    void createBodyStyle_ShouldSaveBodyStyle() {
        // Arrange
        when(bodyStyleRepository.save(any(BodyStyle.class))).thenReturn(testBodyStyle);

        // Act
        BodyStyle result = bodyStyleService.createBodyStyle(testBodyStyle);

        // Assert
        assertNotNull(result);
        assertEquals(testBodyStyle.getName(), result.getName());
        verify(bodyStyleRepository, times(1)).save(testBodyStyle);
    }

    @Test
    void updateBodyStyle_WithValidId_ShouldUpdateBodyStyle() {
        // Arrange
        BodyStyle updatedBodyStyle = new BodyStyle();
        updatedBodyStyle.setName("sedan");
        updatedBodyStyle.setDisplayNameEn("Sedan");
        updatedBodyStyle.setDisplayNameAr("سيدان");
        
        when(bodyStyleRepository.findById(1L)).thenReturn(Optional.of(testBodyStyle));
        when(bodyStyleRepository.save(any(BodyStyle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        BodyStyle result = bodyStyleService.updateBodyStyle(1L, updatedBodyStyle);

        // Assert
        assertNotNull(result);
        assertEquals(updatedBodyStyle.getName(), result.getName());
        assertEquals(updatedBodyStyle.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedBodyStyle.getDisplayNameAr(), result.getDisplayNameAr());
        
        verify(bodyStyleRepository, times(1)).findById(1L);
        verify(bodyStyleRepository, times(1)).save(any(BodyStyle.class));
    }

    @Test
    void deleteBodyStyle_ShouldDeleteBodyStyle() {
        // Arrange
        when(bodyStyleRepository.findById(1L)).thenReturn(Optional.of(testBodyStyle));
        doNothing().when(bodyStyleRepository).delete(testBodyStyle);
        
        // Act
        bodyStyleService.deleteBodyStyle(1L);
        
        // Assert
        verify(bodyStyleRepository, times(1)).findById(1L);
        verify(bodyStyleRepository, times(1)).delete(testBodyStyle);
    }
}
