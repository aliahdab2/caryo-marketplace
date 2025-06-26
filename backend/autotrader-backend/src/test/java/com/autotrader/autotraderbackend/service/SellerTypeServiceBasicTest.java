package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.SellerType;
import com.autotrader.autotraderbackend.payload.request.SellerTypeRequest;
import com.autotrader.autotraderbackend.payload.response.SellerTypeResponse;
import com.autotrader.autotraderbackend.repository.SellerTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SellerTypeServiceBasicTest {

    @Mock
    private SellerTypeRepository sellerTypeRepository;

    @InjectMocks
    private SellerTypeService sellerTypeService;

    private SellerType testSellerType;

    @BeforeEach
    void setUp() {
        testSellerType = SellerType.builder()
                .id(1L)
                .name("DEALER")
                .displayNameEn("Dealer")
                .displayNameAr("تاجر")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getAllSellerTypes_ShouldReturnAllSellerTypes() {
        // Arrange
        List<SellerType> expectedSellerTypes = Arrays.asList(testSellerType);
        when(sellerTypeRepository.findAllOrderByDisplayNameEn()).thenReturn(expectedSellerTypes);

        // Act
        List<SellerTypeResponse> result = sellerTypeService.getAllSellerTypes();

        // Assert
        assertEquals(1, result.size());
        assertEquals("DEALER", result.get(0).getName());
        assertEquals("Dealer", result.get(0).getDisplayNameEn());
        assertEquals("تاجر", result.get(0).getDisplayNameAr());
        verify(sellerTypeRepository, times(1)).findAllOrderByDisplayNameEn();
    }

    @Test
    void createSellerType_ShouldCreateNewSellerType() {
        // Arrange
        SellerTypeRequest request = SellerTypeRequest.builder()
                .name("PRIVATE")
                .displayNameEn("Private Seller")
                .displayNameAr("بائع خاص")
                .build();

        when(sellerTypeRepository.existsByNameIgnoreCase(anyString())).thenReturn(false);
        when(sellerTypeRepository.save(any(SellerType.class))).thenReturn(testSellerType);

        // Act
        SellerTypeResponse result = sellerTypeService.createSellerType(request);

        // Assert
        assertNotNull(result);
        assertEquals("DEALER", result.getName());
        verify(sellerTypeRepository, times(1)).save(any(SellerType.class));
    }

    @Test
    void existsById_ShouldReturnCorrectResult() {
        // Arrange
        when(sellerTypeRepository.existsById(1L)).thenReturn(true);

        // Act
        boolean result = sellerTypeService.existsById(1L);

        // Assert
        assertTrue(result);
        verify(sellerTypeRepository, times(1)).existsById(1L);
    }
}
