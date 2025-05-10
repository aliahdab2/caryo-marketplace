package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminListingStatusControllerTest {

    @Mock
    private CarListingService carListingService;

    @InjectMocks
    private CarListingController carListingController;

    private final Long validListingId = 1L;
    private CarListingResponse mockResponse;

    @BeforeEach
    void setUp() {
        mockResponse = new CarListingResponse();
        mockResponse.setId(validListingId);
    }

    // --- Tests for admin mark as sold ---
    
    @Test
    void markListingAsSoldAdmin_Success() {
        // Setup
        mockResponse.setIsSold(true);
        when(carListingService.markListingAsSoldByAdmin(validListingId)).thenReturn(mockResponse);
        
        // Execute
        ResponseEntity<?> response = carListingController.markListingAsSoldAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof CarListingResponse);
        CarListingResponse responseBody = (CarListingResponse) response.getBody();
        assertEquals(validListingId, responseBody.getId());
        assertTrue(responseBody.getIsSold());
        verify(carListingService).markListingAsSoldByAdmin(validListingId);
    }
    
    @Test
    void markListingAsSoldAdmin_NotFound() {
        // Setup
        when(carListingService.markListingAsSoldByAdmin(validListingId))
            .thenThrow(new ResourceNotFoundException("Car Listing", "id", validListingId.toString()));
        
        // Execute
        ResponseEntity<?> response = carListingController.markListingAsSoldAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertTrue(body.containsKey("message"));
        verify(carListingService).markListingAsSoldByAdmin(validListingId);
    }
    
    @Test
    void markListingAsSoldAdmin_Conflict() {
        // Setup
        when(carListingService.markListingAsSoldByAdmin(validListingId))
            .thenThrow(new IllegalStateException("Cannot mark an archived listing as sold"));
        
        // Execute
        ResponseEntity<?> response = carListingController.markListingAsSoldAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertTrue(body.containsKey("message"));
        verify(carListingService).markListingAsSoldByAdmin(validListingId);
    }
    
    // --- Tests for admin archive ---
    
    @Test
    void archiveListingAdmin_Success() {
        // Setup
        mockResponse.setIsArchived(true);
        when(carListingService.archiveListingByAdmin(validListingId)).thenReturn(mockResponse);
        
        // Execute
        ResponseEntity<?> response = carListingController.archiveListingAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof CarListingResponse);
        CarListingResponse responseBody = (CarListingResponse) response.getBody();
        assertEquals(validListingId, responseBody.getId());
        assertTrue(responseBody.getIsArchived());
        verify(carListingService).archiveListingByAdmin(validListingId);
    }
    
    @Test
    void archiveListingAdmin_NotFound() {
        // Setup
        when(carListingService.archiveListingByAdmin(validListingId))
            .thenThrow(new ResourceNotFoundException("Car Listing", "id", validListingId.toString()));
        
        // Execute
        ResponseEntity<?> response = carListingController.archiveListingAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        verify(carListingService).archiveListingByAdmin(validListingId);
    }
    
    @Test
    void archiveListingAdmin_Conflict() {
        // Setup
        when(carListingService.archiveListingByAdmin(validListingId))
            .thenThrow(new IllegalStateException("Listing is already archived"));
        
        // Execute
        ResponseEntity<?> response = carListingController.archiveListingAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        verify(carListingService).archiveListingByAdmin(validListingId);
    }
    
    // --- Tests for admin unarchive ---
    
    @Test
    void unarchiveListingAdmin_Success() {
        // Setup
        mockResponse.setIsArchived(false);
        when(carListingService.unarchiveListingByAdmin(validListingId)).thenReturn(mockResponse);
        
        // Execute
        ResponseEntity<?> response = carListingController.unarchiveListingAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof CarListingResponse);
        CarListingResponse responseBody = (CarListingResponse) response.getBody();
        assertEquals(validListingId, responseBody.getId());
        assertFalse(responseBody.getIsArchived());
        verify(carListingService).unarchiveListingByAdmin(validListingId);
    }
    
    @Test
    void unarchiveListingAdmin_NotFound() {
        // Setup
        when(carListingService.unarchiveListingByAdmin(validListingId))
            .thenThrow(new ResourceNotFoundException("Car Listing", "id", validListingId.toString()));
        
        // Execute
        ResponseEntity<?> response = carListingController.unarchiveListingAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        verify(carListingService).unarchiveListingByAdmin(validListingId);
    }
    
    @Test
    void unarchiveListingAdmin_Conflict() {
        // Setup
        when(carListingService.unarchiveListingByAdmin(validListingId))
            .thenThrow(new IllegalStateException("Listing is not archived"));
        
        // Execute
        ResponseEntity<?> response = carListingController.unarchiveListingAdmin(validListingId);
        
        // Verify
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        verify(carListingService).unarchiveListingByAdmin(validListingId);
    }
}
