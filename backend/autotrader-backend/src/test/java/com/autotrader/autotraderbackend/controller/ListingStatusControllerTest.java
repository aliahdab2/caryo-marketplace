package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
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
    private CarListingStatusService carListingStatusService;

    @InjectMocks
    private ListingStatusController listingStatusController;

    private UserDetails mockUserDetails;
    private Long validListingId;
    private CarListingResponse mockResponse;

    @BeforeEach
    void setUp() {
        validListingId = 1L;
        mockUserDetails = mock(UserDetails.class);
        
        mockResponse = new CarListingResponse();
        mockResponse.setId(validListingId);
        mockResponse.setTitle("Test Car");
        mockResponse.setIsSold(false);
        mockResponse.setIsArchived(false);
    }

    // Regular User Endpoints Tests

    @Test
    void markListingAsSold_Success() {
        // Arrange
        CarListingResponse soldResponse = new CarListingResponse();
        soldResponse.setId(validListingId);
        soldResponse.setTitle("Test Car");
        soldResponse.setIsSold(true);
        
        when(mockUserDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.markListingAsSold(eq(validListingId), anyString()))
            .thenReturn(soldResponse);
        
        // Act
        ResponseEntity<?> response = listingStatusController.markListingAsSold(validListingId, mockUserDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        
        CarListingResponse returnedResponse = (CarListingResponse) response.getBody();
        assertNotNull(returnedResponse);
        assertEquals(validListingId, returnedResponse.getId());
        assertTrue(returnedResponse.getIsSold());
        
        verify(carListingStatusService).markListingAsSold(eq(validListingId), eq("testuser"));
    }

    @Test
    void markListingAsSoldAdmin_Success() {
        // Arrange
        CarListingResponse soldResponse = new CarListingResponse();
        soldResponse.setId(validListingId);
        soldResponse.setTitle("Test Car");
        soldResponse.setIsSold(true);
        
        when(carListingStatusService.markListingAsSoldByAdmin(eq(validListingId)))
            .thenReturn(soldResponse);
        
        // Act
        ResponseEntity<?> response = listingStatusController.markListingAsSoldAdmin(validListingId);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        
        CarListingResponse returnedResponse = (CarListingResponse) response.getBody();
        assertEquals(validListingId, returnedResponse.getId());
        assertTrue(returnedResponse.getIsSold());
        
        verify(carListingStatusService).markListingAsSoldByAdmin(eq(validListingId));
    }
    
    @Test
    void approveListingAdmin_Success() {
        // Arrange
        CarListingResponse approvedResponse = new CarListingResponse();
        approvedResponse.setId(validListingId);
        approvedResponse.setTitle("Test Car");
        approvedResponse.setApproved(true);
        
        when(carListingStatusService.approveListing(eq(validListingId)))
            .thenReturn(approvedResponse);
        
        // Act
        ResponseEntity<?> response = listingStatusController.approveListingAdmin(validListingId);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        
        CarListingResponse returnedResponse = (CarListingResponse) response.getBody();
        assertNotNull(returnedResponse);
        assertEquals(validListingId, returnedResponse.getId());
        assertTrue(returnedResponse.getApproved());
        
        verify(carListingStatusService).approveListing(eq(validListingId));
    }
    
    @Test
    void approveListingAdmin_NotFound() {
        // Arrange
        Long nonExistentId = 999L;
        when(carListingStatusService.approveListing(eq(nonExistentId)))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", nonExistentId.toString()));
        
        // Act
        ResponseEntity<?> response = listingStatusController.approveListingAdmin(nonExistentId);
        
        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, String> errorResponse = (Map<String, String>) response.getBody();
        assertNotNull(errorResponse);
        assertTrue(errorResponse.containsKey("message"));
        
        verify(carListingStatusService).approveListing(eq(nonExistentId));
    }
    
    @Test
    void archiveListingAdmin_Success() {
        // Arrange
        CarListingResponse archivedResponse = new CarListingResponse();
        archivedResponse.setId(validListingId);
        archivedResponse.setTitle("Test Car");
        archivedResponse.setIsArchived(true);
        
        when(carListingStatusService.archiveListingByAdmin(eq(validListingId)))
            .thenReturn(archivedResponse);
        
        // Act
        ResponseEntity<?> response = listingStatusController.archiveListingAdmin(validListingId);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        
        CarListingResponse returnedResponse = (CarListingResponse) response.getBody();
        assertNotNull(returnedResponse);
        assertEquals(validListingId, returnedResponse.getId());
        assertTrue(returnedResponse.getIsArchived());
        
        verify(carListingStatusService).archiveListingByAdmin(eq(validListingId));
    }
    
    @Test
    void unarchiveListingAdmin_Success() {
        // Arrange
        CarListingResponse unarchivedResponse = new CarListingResponse();
        unarchivedResponse.setId(validListingId);
        unarchivedResponse.setTitle("Test Car");
        unarchivedResponse.setIsArchived(false);
        
        when(carListingStatusService.unarchiveListingByAdmin(eq(validListingId)))
            .thenReturn(unarchivedResponse);
        
        // Act
        ResponseEntity<?> response = listingStatusController.unarchiveListingAdmin(validListingId);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        
        CarListingResponse returnedResponse = (CarListingResponse) response.getBody();
        assertNotNull(returnedResponse);
        assertEquals(validListingId, returnedResponse.getId());
        assertFalse(returnedResponse.getIsArchived());
        
        verify(carListingStatusService).unarchiveListingByAdmin(eq(validListingId));
    }
}
