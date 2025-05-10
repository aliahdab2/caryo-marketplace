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
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ListingStatusControllerTest {

    @Mock
    private CarListingService carListingService;

    @InjectMocks
    private CarListingController carListingController;

    private UserDetails mockUserDetails;
    private Long validListingId;
    private CarListingResponse mockResponse;

    @BeforeEach
    void setUp() {
        validListingId = 1L;
        mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");
        
        mockResponse = new CarListingResponse();
        mockResponse.setId(validListingId);
        mockResponse.setTitle("Test Car");
        mockResponse.setIsSold(false);
        mockResponse.setIsArchived(false);
    }

    @Test
    void markListingAsSold_Success() {
        // Arrange
        CarListingResponse soldResponse = new CarListingResponse();
        soldResponse.setId(validListingId);
        soldResponse.setTitle("Test Car");
        soldResponse.setIsSold(true);
        soldResponse.setIsArchived(false);
        
        when(carListingService.markListingAsSold(eq(validListingId), anyString()))
            .thenReturn(soldResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(validListingId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        
        CarListingResponse returnedResponse = (CarListingResponse) response.getBody();
        assertEquals(validListingId, returnedResponse.getId());
        assertTrue(returnedResponse.getIsSold());
        
        verify(carListingService).markListingAsSold(eq(validListingId), eq("testuser"));
    }
    
    @Test
    void markListingAsSold_NotFound() {
        // Arrange
        Long nonExistentId = 999L;
        when(carListingService.markListingAsSold(eq(nonExistentId), anyString()))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", nonExistentId));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(nonExistentId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, String> errorResponse = (Map<String, String>) response.getBody();
        assertTrue(errorResponse.containsKey("message"));
        
        verify(carListingService).markListingAsSold(eq(nonExistentId), eq("testuser"));
    }
    
    @Test
    void markListingAsSold_Forbidden() {
        // Arrange
        String errorMessage = "User does not have permission to modify this listing.";
        when(carListingService.markListingAsSold(eq(validListingId), anyString()))
            .thenThrow(new SecurityException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(validListingId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, String> errorResponse = (Map<String, String>) response.getBody();
        assertTrue(errorResponse.containsKey("message"));
        assertEquals(errorMessage, errorResponse.get("message"));
    }
    
    @Test
    void markListingAsSold_Conflict() {
        // Arrange
        String errorMessage = "Cannot mark an archived listing as sold. Please unarchive first.";
        when(carListingService.markListingAsSold(eq(validListingId), anyString()))
            .thenThrow(new IllegalStateException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(validListingId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, String> errorResponse = (Map<String, String>) response.getBody();
        assertTrue(errorResponse.containsKey("message"));
        assertEquals(errorMessage, errorResponse.get("message"));
    }
    
    @Test
    void archiveListing_Success() {
        // Arrange
        CarListingResponse archivedResponse = new CarListingResponse();
        archivedResponse.setId(validListingId);
        archivedResponse.setTitle("Test Car");
        archivedResponse.setIsSold(false);
        archivedResponse.setIsArchived(true);
        
        when(carListingService.archiveListing(eq(validListingId), anyString()))
            .thenReturn(archivedResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(validListingId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        
        CarListingResponse returnedResponse = (CarListingResponse) response.getBody();
        assertEquals(validListingId, returnedResponse.getId());
        assertTrue(returnedResponse.getIsArchived());
        
        verify(carListingService).archiveListing(eq(validListingId), eq("testuser"));
    }
    
    @Test
    void archiveListing_NotFound() {
        // Arrange
        Long nonExistentId = 999L;
        when(carListingService.archiveListing(eq(nonExistentId), anyString()))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", nonExistentId));
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(nonExistentId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, String> errorResponse = (Map<String, String>) response.getBody();
        assertTrue(errorResponse.containsKey("message"));
    }
    
    @Test
    void archiveListing_Forbidden() {
        // Arrange
        String errorMessage = "User does not have permission to modify this listing.";
        when(carListingService.archiveListing(eq(validListingId), anyString()))
            .thenThrow(new SecurityException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(validListingId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, String> errorResponse = (Map<String, String>) response.getBody();
        assertTrue(errorResponse.containsKey("message"));
        assertEquals(errorMessage, errorResponse.get("message"));
    }
    
    @Test
    void unarchiveListing_Success() {
        // Arrange
        CarListingResponse unarchivedResponse = new CarListingResponse();
        unarchivedResponse.setId(validListingId);
        unarchivedResponse.setTitle("Test Car");
        unarchivedResponse.setIsSold(false);
        unarchivedResponse.setIsArchived(false);
        
        when(carListingService.unarchiveListing(eq(validListingId), anyString()))
            .thenReturn(unarchivedResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.unarchiveListing(validListingId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        
        CarListingResponse returnedResponse = (CarListingResponse) response.getBody();
        assertEquals(validListingId, returnedResponse.getId());
        assertFalse(returnedResponse.getIsArchived());
        
        verify(carListingService).unarchiveListing(eq(validListingId), eq("testuser"));
    }
    
    @Test
    void unarchiveListing_Conflict() {
        // Arrange
        String errorMessage = "Listing with ID 1 is not currently archived.";
        when(carListingService.unarchiveListing(eq(validListingId), anyString()))
            .thenThrow(new IllegalStateException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.unarchiveListing(validListingId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, String> errorResponse = (Map<String, String>) response.getBody();
        assertTrue(errorResponse.containsKey("message"));
        assertEquals(errorMessage, errorResponse.get("message"));
    }
}
