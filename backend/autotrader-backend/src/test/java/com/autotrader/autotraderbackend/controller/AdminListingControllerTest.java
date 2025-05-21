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

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminListingControllerTest {

    @Mock
    private CarListingStatusService carListingStatusService;

    @InjectMocks
    private AdminListingController adminListingController;

    private final Long validListingId = 1L;
    private CarListingResponse mockResponse;

    @BeforeEach
    void setUp() {
        mockResponse = new CarListingResponse();
        mockResponse.setId(validListingId);
    }

    @Test
    void approveListingAdmin_Success() {
        mockResponse.setApproved(true);
        when(carListingStatusService.approveListing(validListingId)).thenReturn(mockResponse);

        ResponseEntity<?> response = adminListingController.approveListingAdmin(validListingId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        CarListingResponse responseBody = (CarListingResponse) response.getBody();
        assertNotNull(responseBody);
        assertEquals(validListingId, responseBody.getId());
        assertTrue(responseBody.getApproved());
        verify(carListingStatusService).approveListing(validListingId);
    }

    @Test
    void approveListingAdmin_NotFound() {
        when(carListingStatusService.approveListing(validListingId))
            .thenThrow(new ResourceNotFoundException("Car Listing", "id", validListingId.toString()));

        ResponseEntity<?> response = adminListingController.approveListingAdmin(validListingId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("message"));
        verify(carListingStatusService).approveListing(validListingId);
    }

    @Test
    void approveListingAdmin_Conflict() {
        when(carListingStatusService.approveListing(validListingId))
            .thenThrow(new IllegalStateException("Listing already approved"));

        ResponseEntity<?> response = adminListingController.approveListingAdmin(validListingId);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("message"));
        verify(carListingStatusService).approveListing(validListingId);
    }

    @Test
    void markListingAsSoldAdmin_Success() {
        mockResponse.setIsSold(true);
        when(carListingStatusService.markListingAsSoldByAdmin(validListingId)).thenReturn(mockResponse);

        ResponseEntity<?> response = adminListingController.markListingAsSoldAdmin(validListingId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        CarListingResponse responseBody = (CarListingResponse) response.getBody();
        assertNotNull(responseBody);
        assertEquals(validListingId, responseBody.getId());
        assertTrue(responseBody.getIsSold());
        verify(carListingStatusService).markListingAsSoldByAdmin(validListingId);
    }

    @Test
    void markListingAsSoldAdmin_NotFound() {
        when(carListingStatusService.markListingAsSoldByAdmin(validListingId))
            .thenThrow(new ResourceNotFoundException("Car Listing", "id", validListingId.toString()));

        ResponseEntity<?> response = adminListingController.markListingAsSoldAdmin(validListingId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("message"));
        verify(carListingStatusService).markListingAsSoldByAdmin(validListingId);
    }

    @Test
    void markListingAsSoldAdmin_Conflict() {
        when(carListingStatusService.markListingAsSoldByAdmin(validListingId))
            .thenThrow(new IllegalStateException("Listing is archived or already sold"));

        ResponseEntity<?> response = adminListingController.markListingAsSoldAdmin(validListingId);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("message"));
        verify(carListingStatusService).markListingAsSoldByAdmin(validListingId);
    }

    @Test
    void archiveListingAdmin_Success() {
        mockResponse.setIsArchived(true);
        when(carListingStatusService.archiveListingByAdmin(validListingId)).thenReturn(mockResponse);

        ResponseEntity<?> response = adminListingController.archiveListingAdmin(validListingId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        CarListingResponse responseBody = (CarListingResponse) response.getBody();
        assertNotNull(responseBody);
        assertEquals(validListingId, responseBody.getId());
        assertTrue(responseBody.getIsArchived());
        verify(carListingStatusService).archiveListingByAdmin(validListingId);
    }

    @Test
    void archiveListingAdmin_NotFound() {
        when(carListingStatusService.archiveListingByAdmin(validListingId))
            .thenThrow(new ResourceNotFoundException("Car Listing", "id", validListingId.toString()));

        ResponseEntity<?> response = adminListingController.archiveListingAdmin(validListingId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("message"));
        verify(carListingStatusService).archiveListingByAdmin(validListingId);
    }

    @Test
    void archiveListingAdmin_Conflict() {
        when(carListingStatusService.archiveListingByAdmin(validListingId))
            .thenThrow(new IllegalStateException("Listing already archived"));

        ResponseEntity<?> response = adminListingController.archiveListingAdmin(validListingId);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("message"));
        verify(carListingStatusService).archiveListingByAdmin(validListingId);
    }

    @Test
    void unarchiveListingAdmin_Success() {
        mockResponse.setIsArchived(false);
        when(carListingStatusService.unarchiveListingByAdmin(validListingId)).thenReturn(mockResponse);

        ResponseEntity<?> response = adminListingController.unarchiveListingAdmin(validListingId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof CarListingResponse);
        CarListingResponse responseBody = (CarListingResponse) response.getBody();
        assertNotNull(responseBody);
        assertEquals(validListingId, responseBody.getId());
        assertFalse(responseBody.getIsArchived());
        verify(carListingStatusService).unarchiveListingByAdmin(validListingId);
    }

    @Test
    void unarchiveListingAdmin_NotFound() {
        when(carListingStatusService.unarchiveListingByAdmin(validListingId))
            .thenThrow(new ResourceNotFoundException("Car Listing", "id", validListingId.toString()));

        ResponseEntity<?> response = adminListingController.unarchiveListingAdmin(validListingId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("message"));
        verify(carListingStatusService).unarchiveListingByAdmin(validListingId);
    }

    @Test
    void unarchiveListingAdmin_Conflict() {
        when(carListingStatusService.unarchiveListingByAdmin(validListingId))
            .thenThrow(new IllegalStateException("Listing is not archived"));

        ResponseEntity<?> response = adminListingController.unarchiveListingAdmin(validListingId);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("message"));
        verify(carListingStatusService).unarchiveListingByAdmin(validListingId);
    }
}
