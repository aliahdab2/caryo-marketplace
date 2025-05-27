package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.LocationRequest;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.LocationService;
import com.autotrader.autotraderbackend.util.TestDataGenerator;
import com.autotrader.autotraderbackend.util.TestGeographyUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = LocationController.class, 
    includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, 
        classes = com.autotrader.autotraderbackend.exception.GlobalExceptionHandler.class))
@Import(com.autotrader.autotraderbackend.config.TestSecurityConfig.class)
class LocationControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LocationService locationService;
    
    // We need JwtUtils and UserDetailsServiceImpl for security context, even if not directly used in LocationController
    // If WebMvcTest loads security configuration, these might be needed.
    @MockBean private com.autotrader.autotraderbackend.security.jwt.JwtUtils jwtUtils;
    @MockBean private com.autotrader.autotraderbackend.security.services.UserDetailsServiceImpl userDetailsService;


    @Autowired
    private ObjectMapper objectMapper;

    private LocationResponse locationResponse1;
    private LocationResponse locationResponse2;
    private LocationRequest locationRequest;

    @BeforeEach
    void setUp() {
        // Create test location responses with the new constructor signature
        locationResponse1 = new LocationResponse();
        locationResponse1.setId(1L);
        locationResponse1.setDisplayNameEn("City A");
        locationResponse1.setDisplayNameAr("المدينة أ");
        locationResponse1.setSlug("city-a");
        locationResponse1.setCountryCode("SY");
        locationResponse1.setGovernorateId(1L);
        locationResponse1.setGovernorateNameEn("Governorate A");
        locationResponse1.setGovernorateNameAr("المحافظة أ");
        locationResponse1.setRegion("Region A");
        locationResponse1.setLatitude(10.0);
        locationResponse1.setLongitude(20.0);
        locationResponse1.setActive(true);
        
        locationResponse2 = new LocationResponse();
        locationResponse2.setId(2L);
        locationResponse2.setDisplayNameEn("City B");
        locationResponse2.setDisplayNameAr("المدينة ب");
        locationResponse2.setSlug("city-b");
        locationResponse2.setCountryCode("JO");
        locationResponse2.setGovernorateId(2L);
        locationResponse2.setGovernorateNameEn("Governorate B");
        locationResponse2.setGovernorateNameAr("المحافظة ب");
        locationResponse2.setRegion("Region B");
        locationResponse2.setLatitude(30.0);
        locationResponse2.setLongitude(40.0);
        locationResponse2.setActive(true);

        locationRequest = new LocationRequest();
        locationRequest.setNameEn("New City");
        locationRequest.setNameAr("مدينة جديدة");
        locationRequest.setGovernorateId(1L); // Updated to use governorateId instead of countryCode
        locationRequest.setRegion("New Region");
        locationRequest.setLatitude(50.0);
        locationRequest.setLongitude(60.0);
        locationRequest.setActive(true);
    }

    @Test
    @WithMockUser // Adding WithMockUser annotation to simulate an authenticated user
    void getAllLocations_shouldReturnListOfLocations() throws Exception {
        given(locationService.getAllActiveLocations()).willReturn(List.of(locationResponse1, locationResponse2));

        mockMvc.perform(get("/api/locations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].displayNameEn", is("City A")))
                .andExpect(jsonPath("$[1].displayNameEn", is("City B")));
    }

    @Test
    @WithMockUser // Add authentication for this test
    void getLocationsByCountry_shouldReturnLocationsForCountry() throws Exception {
        given(locationService.getLocationsByCountry("SY")).willReturn(List.of(locationResponse1));

        mockMvc.perform(get("/api/locations/country/SY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].countryCode", is("SY")));
    }

    @Test
    @WithMockUser
    void getLocationById_shouldReturnLocation_whenFound() throws Exception {
        given(locationService.getLocationById(1L)).willReturn(locationResponse1);

        mockMvc.perform(get("/api/locations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.displayNameEn", is("City A")));
    }

    @Test
    @WithMockUser
    void getLocationById_shouldReturnNotFound_whenLocationDoesNotExist() throws Exception {
        given(locationService.getLocationById(1L)).willThrow(new ResourceNotFoundException("Location", "id", 1L));

        mockMvc.perform(get("/api/locations/1"))
                .andExpect(status().isNotFound());
    }
    
    @Test
    @WithMockUser
    void getLocationBySlug_shouldReturnLocation_whenFound() throws Exception {
        given(locationService.getLocationBySlug("city-a")).willReturn(locationResponse1);

        mockMvc.perform(get("/api/locations/slug/city-a"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("city-a")))
                .andExpect(jsonPath("$.displayNameEn", is("City A")));
    }

    @Test
    @WithMockUser
    void getLocationBySlug_shouldReturnNotFound_whenLocationDoesNotExist() throws Exception {
        given(locationService.getLocationBySlug("non-existent-slug")).willThrow(new ResourceNotFoundException("Location", "slug", "non-existent-slug"));

        mockMvc.perform(get("/api/locations/slug/non-existent-slug"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void searchLocations_shouldReturnPagedResponse() throws Exception {
        Pageable pageable = PageRequest.of(0, 1);
        List<LocationResponse> content = List.of(locationResponse1);
        Page<LocationResponse> page = new PageImpl<>(content, pageable, 1);

        given(locationService.searchLocations(anyString(), any(Pageable.class))).willReturn(page);

        mockMvc.perform(get("/api/locations/search").param("q", "City").param("page", "0").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].displayNameEn", is("City A")))
                .andExpect(jsonPath("$.page", is(0)))
                .andExpect(jsonPath("$.size", is(1)))
                .andExpect(jsonPath("$.totalElements", is(1)));
    }
    
    // Admin-only endpoints

    @Test
    @WithMockUser(roles = "ADMIN")
    void createLocation_asAdmin_shouldCreateLocation() throws Exception {
        given(locationService.createLocation(any(LocationRequest.class))).willReturn(locationResponse1);

        mockMvc.perform(post("/api/locations")
                        .with(csrf()) // Add CSRF token
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(locationRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayNameEn", is("City A")));
    }
    
    @Test
    @WithMockUser(roles = "USER") // Test with non-admin user
    void createLocation_asUser_shouldReturnForbidden() throws Exception {
        mockMvc.perform(post("/api/locations")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(locationRequest)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void createLocation_asAdmin_withInvalidData_shouldReturnBadRequest() throws Exception {
        LocationRequest invalidRequest = new LocationRequest(); // Missing required fields
        // No need to mock service as validation should fail before service call

        mockMvc.perform(post("/api/locations")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest()); // Assuming @Valid is used and fails
    }


    @Test
    @WithMockUser(roles = "ADMIN")
    void updateLocation_asAdmin_shouldUpdateLocation() throws Exception {
        given(locationService.updateLocation(anyLong(), any(LocationRequest.class))).willReturn(locationResponse1);

        mockMvc.perform(put("/api/locations/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(locationRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayNameEn", is("City A")));
    }
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void updateLocation_asAdmin_whenNotFound_shouldReturnNotFound() throws Exception {
        given(locationService.updateLocation(anyLong(), any(LocationRequest.class)))
            .willThrow(new ResourceNotFoundException("Location", "id", 1L));

        mockMvc.perform(put("/api/locations/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(locationRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteLocation_asAdmin_shouldDeleteLocation() throws Exception {
        doNothing().when(locationService).deleteLocation(1L);

        mockMvc.perform(delete("/api/locations/1").with(csrf()))
                .andExpect(status().isNoContent());
    }
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteLocation_asAdmin_whenNotFound_shouldReturnNotFound() throws Exception {
        doThrow(new ResourceNotFoundException("Location", "id", 1L)).when(locationService).deleteLocation(1L);

        mockMvc.perform(delete("/api/locations/1").with(csrf()))
                .andExpect(status().isNotFound());
    }


    @Test
    @WithMockUser(roles = "ADMIN")
    void updateLocationStatus_asAdmin_shouldUpdateStatus() throws Exception {
        // Create updated location response with status=false
        LocationResponse updatedLocationResponse = new LocationResponse();
        updatedLocationResponse.setId(1L);
        updatedLocationResponse.setDisplayNameEn("City A");
        updatedLocationResponse.setDisplayNameAr("المدينة أ");
        updatedLocationResponse.setSlug("city-a");
        updatedLocationResponse.setCountryCode("SY");
        updatedLocationResponse.setGovernorateId(1L);
        updatedLocationResponse.setGovernorateNameEn("Governorate A");
        updatedLocationResponse.setGovernorateNameAr("المحافظة أ");
        updatedLocationResponse.setRegion("Region A");
        updatedLocationResponse.setLatitude(10.0);
        updatedLocationResponse.setLongitude(20.0);
        updatedLocationResponse.setActive(false); // Status changed to false
        
        given(locationService.setLocationActive(1L, false)).willReturn(updatedLocationResponse);

        Map<String, Boolean> statusUpdate = Map.of("active", false);

        mockMvc.perform(patch("/api/locations/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));
    }
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void updateLocationStatus_asAdmin_whenLocationNotFound_shouldReturnNotFound() throws Exception {
        given(locationService.setLocationActive(1L, false))
            .willThrow(new ResourceNotFoundException("Location", "id", 1L));
        
        Map<String, Boolean> statusUpdate = Map.of("active", false);

        mockMvc.perform(patch("/api/locations/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateLocationStatus_asAdmin_withInvalidPayload_shouldReturnBadRequest() throws Exception {
        Map<String, Boolean> invalidPayload = Map.of("some_other_key", false); // Changed payload

        mockMvc.perform(patch("/api/locations/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPayload)))
                .andExpect(status().isBadRequest());
    }
}
