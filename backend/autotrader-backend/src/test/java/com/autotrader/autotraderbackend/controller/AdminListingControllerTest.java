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

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminListingControllerTest {

    @Mock
    private CarListingService carListingService;

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
        when(carListingService.approveListing(validListingId)).thenReturn(mockResponse);

        ResponseEntity<?> response = adminListingController.approveListingAdmin(validListingId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof CarListingResponse);
        CarListingResponse responseBody = (CarListingResponse) response.getBody();
        assertEquals(validListingId, responseBody.getId());
        assertTrue(responseBody.getApproved());
        verify(carListingService).approveListing(validListingId);
    }

    @Test
    void approveListingAdmin_NotFound() {
        when(carListingService.approveListing(validListingId))
            .thenThrow(new ResourceNotFoundException("Car Listing", "id", validListingId.toString()));

        ResponseEntity<?> response = adminListingController.approveListingAdmin(validListingId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertTrue(body.containsKey("message"));
        verify(carListingService).approveListing(validListingId);
    }

    @Test
    void approveListingAdmin_Conflict() {
        when(carListingService.approveListing(validListingId))
            .thenThrow(new IllegalStateException("Listing already approved"));

        ResponseEntity<?> response = adminListingController.approveListingAdmin(validListingId);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertTrue(body.containsKey("message"));
        verify(carListingService).approveListing(validListingId);
    }
}
