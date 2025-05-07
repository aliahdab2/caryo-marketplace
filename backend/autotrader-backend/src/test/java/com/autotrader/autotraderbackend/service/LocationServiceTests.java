package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.payload.request.LocationRequest;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.util.SlugUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationServiceTests {

    @Mock
    private LocationRepository locationRepository;

    @InjectMocks
    private LocationService locationService;

    private Location location1;
    private Location location2;
    private LocationRequest locationRequest;

    @BeforeEach
    void setUp() {
        location1 = new Location();
        location1.setId(1L);
        location1.setDisplayNameEn("City A");
        location1.setDisplayNameAr("المدينة أ");
        location1.setSlug("city-a");
        location1.setCountryCode("SY");
        location1.setIsActive(true);

        location2 = new Location();
        location2.setId(2L);
        location2.setDisplayNameEn("City B");
        location2.setDisplayNameAr("المدينة ب");
        location2.setSlug("city-b");
        location2.setCountryCode("SY");
        location2.setIsActive(false);

        locationRequest = new LocationRequest();
        locationRequest.setNameEn("New City");
        locationRequest.setNameAr("مدينة جديدة");
        locationRequest.setCountryCode("SY");
        locationRequest.setRegion("Region");
        locationRequest.setLatitude(10.0);
        locationRequest.setLongitude(20.0);
        locationRequest.setActive(true);
    }

    @Test
    void getAllActiveLocations_shouldReturnOnlyActiveLocations() {
        when(locationRepository.findAll()).thenReturn(List.of(location1, location2));

        List<LocationResponse> responses = locationService.getAllActiveLocations();

        assertEquals(1, responses.size());
        assertEquals("City A", responses.get(0).getDisplayNameEn());
        verify(locationRepository).findAll();
    }

    @Test
    void getLocationsByCountry_shouldReturnActiveLocationsForCountry() {
        when(locationRepository.findByCountryCodeAndIsActiveTrueOrIsActiveIsNull("SY")).thenReturn(List.of(location1));

        List<LocationResponse> responses = locationService.getLocationsByCountry("SY");

        assertEquals(1, responses.size());
        assertEquals("City A", responses.get(0).getDisplayNameEn());
        verify(locationRepository).findByCountryCodeAndIsActiveTrueOrIsActiveIsNull("SY");
    }

    @Test
    void getLocationById_shouldReturnLocation_whenFound() {
        when(locationRepository.findById(1L)).thenReturn(Optional.of(location1));

        LocationResponse response = locationService.getLocationById(1L);

        assertNotNull(response);
        assertEquals("City A", response.getDisplayNameEn());
        verify(locationRepository).findById(1L);
    }

    @Test
    void getLocationById_shouldThrowResourceNotFoundException_whenNotFound() {
        when(locationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> locationService.getLocationById(1L));
        verify(locationRepository).findById(1L);
    }

    @Test
    void getLocationBySlug_shouldReturnLocation_whenFound() {
        when(locationRepository.findBySlug("city-a")).thenReturn(Optional.of(location1));

        LocationResponse response = locationService.getLocationBySlug("city-a");

        assertNotNull(response);
        assertEquals("City A", response.getDisplayNameEn());
        verify(locationRepository).findBySlug("city-a");
    }

    @Test
    void getLocationBySlug_shouldThrowResourceNotFoundException_whenNotFound() {
        when(locationRepository.findBySlug("non-existent-slug")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> locationService.getLocationBySlug("non-existent-slug"));
        verify(locationRepository).findBySlug("non-existent-slug");
    }
    
    @Test
    void searchLocations_shouldReturnPagedLocations() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Location> locationPage = new PageImpl<>(List.of(location1), pageable, 1);
        when(locationRepository.searchByName("City", pageable)).thenReturn(locationPage);

        Page<LocationResponse> responses = locationService.searchLocations("City", pageable);

        assertEquals(1, responses.getContent().size());
        assertEquals("City A", responses.getContent().get(0).getDisplayNameEn());
        verify(locationRepository).searchByName("City", pageable);
    }

    @Test
    void createLocation_shouldCreateAndReturnLocation() {
        try (MockedStatic<SlugUtils> mockedSlugUtils = Mockito.mockStatic(SlugUtils.class)) {
            mockedSlugUtils.when(() -> SlugUtils.slugify("New City")).thenReturn("new-city");
            when(locationRepository.findBySlug("new-city")).thenReturn(Optional.empty()); // For unique slug check
            when(locationRepository.save(any(Location.class))).thenAnswer(invocation -> {
                Location savedLocation = invocation.getArgument(0);
                savedLocation.setId(3L); // Simulate save
                return savedLocation;
            });

            LocationResponse response = locationService.createLocation(locationRequest);

            assertNotNull(response);
            assertEquals("New City", response.getDisplayNameEn());
            assertEquals("new-city", response.getSlug());
            assertTrue(response.isActive());
            verify(locationRepository).save(any(Location.class));
        }
    }
    
    @Test
    void createLocation_shouldGenerateUniqueSlug() {
        try (MockedStatic<SlugUtils> mockedSlugUtils = Mockito.mockStatic(SlugUtils.class)) {
            mockedSlugUtils.when(() -> SlugUtils.slugify("New City")).thenReturn("new-city");
            
            Location existingLocationWithSlug = new Location();
            existingLocationWithSlug.setId(10L);
            existingLocationWithSlug.setSlug("new-city");

            when(locationRepository.findBySlug("new-city")).thenReturn(Optional.of(existingLocationWithSlug));
            when(locationRepository.findBySlug("new-city-1")).thenReturn(Optional.empty());
            when(locationRepository.save(any(Location.class))).thenAnswer(invocation -> {
                Location savedLocation = invocation.getArgument(0);
                savedLocation.setId(3L);
                return savedLocation;
            });

            LocationResponse response = locationService.createLocation(locationRequest);

            assertNotNull(response);
            assertEquals("new-city-1", response.getSlug());
            verify(locationRepository).save(any(Location.class));
        }
    }

    @Test
    void updateLocation_shouldUpdateLocation_whenFound() {
        try (MockedStatic<SlugUtils> mockedSlugUtils = Mockito.mockStatic(SlugUtils.class)) {
            when(locationRepository.findById(1L)).thenReturn(Optional.of(location1));
            
            locationRequest.setNameEn("Updated City A");
            mockedSlugUtils.when(() -> SlugUtils.slugify("Updated City A")).thenReturn("updated-city-a");
            when(locationRepository.findBySlug("updated-city-a")).thenReturn(Optional.empty()); // For unique slug check

            // Return the location instance that is passed to the save method
            when(locationRepository.save(any(Location.class))).thenAnswer(invocation -> invocation.getArgument(0));


            LocationResponse response = locationService.updateLocation(1L, locationRequest);

            assertNotNull(response);
            assertEquals("Updated City A", response.getDisplayNameEn());
            assertEquals("updated-city-a", response.getSlug());
            verify(locationRepository).save(location1);
        }
    }
    
    @Test
    void updateLocation_shouldNotUpdateSlug_whenEnglishNameNotChanged() {
        when(locationRepository.findById(1L)).thenReturn(Optional.of(location1));
        // locationRequest.setNameEn is "New City", location1.getDisplayNameEn is "City A"
        // To test this specific case, let's make them the same before the call
        locationRequest.setNameEn("City A"); // Same as current English name

        when(locationRepository.save(any(Location.class))).thenReturn(location1);

        LocationResponse response = locationService.updateLocation(1L, locationRequest);

        assertNotNull(response);
        assertEquals("City A", response.getDisplayNameEn()); // NameEn from request
        assertEquals("city-a", response.getSlug()); // Original slug, not changed
        verify(locationRepository).save(location1);
        // Verify SlugUtils.slugify was NOT called
        // This requires a bit more setup if SlugUtils is static, or a spy if it's a bean.
        // For now, we assert the slug remained the same.
    }


    @Test
    void updateLocation_shouldThrowResourceNotFoundException_whenNotFound() {
        when(locationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> locationService.updateLocation(1L, locationRequest));
        verify(locationRepository, never()).save(any(Location.class));
    }

    @Test
    void deleteLocation_shouldDeleteLocation_whenFound() {
        when(locationRepository.existsById(1L)).thenReturn(true);
        doNothing().when(locationRepository).deleteById(1L);

        assertDoesNotThrow(() -> locationService.deleteLocation(1L));

        verify(locationRepository).deleteById(1L);
    }

    @Test
    void deleteLocation_shouldThrowResourceNotFoundException_whenNotFound() {
        when(locationRepository.existsById(1L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> locationService.deleteLocation(1L));
        verify(locationRepository, never()).deleteById(1L);
    }

    @Test
    void setLocationActive_shouldUpdateStatus_whenFound() {
        when(locationRepository.findById(1L)).thenReturn(Optional.of(location1));
        when(locationRepository.save(any(Location.class))).thenReturn(location1);

        LocationResponse response = locationService.setLocationActive(1L, false);

        assertNotNull(response);
        assertFalse(response.isActive());
        verify(locationRepository).save(location1);
    }

    @Test
    void setLocationActive_shouldThrowResourceNotFoundException_whenNotFound() {
        when(locationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> locationService.setLocationActive(1L, true));
        verify(locationRepository, never()).save(any(Location.class));
    }
}
