package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarCondition;
import com.autotrader.autotraderbackend.repository.CarConditionRepository;
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
class CarConditionServiceTest {

    @Mock
    private CarConditionRepository carConditionRepository;

    @InjectMocks
    private CarConditionService carConditionService;

    private CarCondition testCondition;

    @BeforeEach
    void setUp() {
        testCondition = new CarCondition();
        testCondition.setId(1L);
        testCondition.setName("new");
        testCondition.setDisplayNameEn("New");
        testCondition.setDisplayNameAr("جديد");
    }

    @Test
    void getAllConditions_ShouldReturnAllConditions() {
        // Arrange
        List<CarCondition> expectedConditions = Arrays.asList(testCondition);
        when(carConditionRepository.findAll()).thenReturn(expectedConditions);

        // Act
        List<CarCondition> result = carConditionService.getAllConditions();

        // Assert
        assertEquals(expectedConditions.size(), result.size());
        assertEquals(expectedConditions.get(0).getName(), result.get(0).getName());
        verify(carConditionRepository, times(1)).findAll();
    }

    @Test
    void getConditionById_WithValidId_ShouldReturnCondition() {
        // Arrange
        when(carConditionRepository.findById(1L)).thenReturn(Optional.of(testCondition));

        // Act
        CarCondition result = carConditionService.getConditionById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testCondition.getId(), result.getId());
        assertEquals(testCondition.getName(), result.getName());
        verify(carConditionRepository, times(1)).findById(1L);
    }

    @Test
    void getConditionById_WithInvalidId_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carConditionRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            carConditionService.getConditionById(99L);
        });
        verify(carConditionRepository, times(1)).findById(99L);
    }

    @Test
    void getConditionByName_WithValidName_ShouldReturnCondition() {
        // Arrange
        when(carConditionRepository.findByName("new")).thenReturn(Optional.of(testCondition));

        // Act
        CarCondition result = carConditionService.getConditionByName("new");

        // Assert
        assertNotNull(result);
        assertEquals(testCondition.getName(), result.getName());
        verify(carConditionRepository, times(1)).findByName("new");
    }

    @Test
    void getConditionByName_WithInvalidName_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carConditionRepository.findByName("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            carConditionService.getConditionByName("invalid");
        });
        verify(carConditionRepository, times(1)).findByName("invalid");
    }

    @Test
    void searchConditions_WithValidQuery_ShouldReturnMatchingConditions() {
        // Arrange
        String query = "new";
        List<CarCondition> expectedConditions = Arrays.asList(testCondition);
        when(carConditionRepository.searchByName(query)).thenReturn(expectedConditions);

        // Act
        List<CarCondition> result = carConditionService.searchConditions(query);

        // Assert
        assertEquals(expectedConditions.size(), result.size());
        assertEquals(expectedConditions.get(0).getName(), result.get(0).getName());
        verify(carConditionRepository, times(1)).searchByName(query);
    }

    @Test
    void searchConditions_WithEmptyQuery_ShouldReturnAllConditions() {
        // Arrange
        String query = "";
        List<CarCondition> expectedConditions = Arrays.asList(testCondition);
        when(carConditionRepository.findAll()).thenReturn(expectedConditions);

        // Act
        List<CarCondition> result = carConditionService.searchConditions(query);

        // Assert
        assertEquals(expectedConditions.size(), result.size());
        verify(carConditionRepository, times(1)).findAll();
        verify(carConditionRepository, never()).searchByName(anyString());
    }

    @Test
    void createCondition_ShouldSaveCondition() {
        // Arrange
        when(carConditionRepository.save(any(CarCondition.class))).thenReturn(testCondition);

        // Act
        CarCondition result = carConditionService.createCondition(testCondition);

        // Assert
        assertNotNull(result);
        assertEquals(testCondition.getName(), result.getName());
        verify(carConditionRepository, times(1)).save(testCondition);
    }

    @Test
    void updateCondition_WithValidId_ShouldUpdateCondition() {
        // Arrange
        CarCondition updatedCondition = new CarCondition();
        updatedCondition.setName("like_new");
        updatedCondition.setDisplayNameEn("Like New");
        updatedCondition.setDisplayNameAr("شبه جديد");
        
        when(carConditionRepository.findById(1L)).thenReturn(Optional.of(testCondition));
        when(carConditionRepository.save(any(CarCondition.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        CarCondition result = carConditionService.updateCondition(1L, updatedCondition);

        // Assert
        assertNotNull(result);
        assertEquals(updatedCondition.getName(), result.getName());
        assertEquals(updatedCondition.getDisplayNameEn(), result.getDisplayNameEn());
        assertEquals(updatedCondition.getDisplayNameAr(), result.getDisplayNameAr());
        
        verify(carConditionRepository, times(1)).findById(1L);
        verify(carConditionRepository, times(1)).save(any(CarCondition.class));
    }

    @Test
    void deleteCondition_ShouldDeleteCondition() {
        // Arrange
        when(carConditionRepository.findById(1L)).thenReturn(Optional.of(testCondition));
        doNothing().when(carConditionRepository).delete(testCondition);
        
        // Act
        carConditionService.deleteCondition(1L);
        
        // Assert
        verify(carConditionRepository, times(1)).findById(1L);
        verify(carConditionRepository, times(1)).delete(testCondition);
    }
}
