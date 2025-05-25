package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.response.GovernorateResponse;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GovernorateServiceTest {

    @Mock
    private GovernorateRepository governorateRepository;

    @InjectMocks
    private GovernorateService governorateService;

    private Governorate governorate1;
    private Governorate governorate2;
    private GovernorateResponse governorateResponse1;

    @BeforeEach
    void setUp() {
        Long id1 = 1L;
        governorate1 = new Governorate();
        governorate1.setId(id1);
        governorate1.setDisplayNameEn("Test Governorate 1");
        governorate1.setDisplayNameAr("Test Governorate AR 1");
        governorate1.setSlug("test-governorate-1");
        governorate1.setCountryCode("SY");
        governorate1.setRegion("Region1");
        governorate1.setLatitude(33.5138);
        governorate1.setLongitude(36.2765);
        governorate1.setIsActive(true);

        governorateResponse1 = GovernorateResponse.builder()
                .id(id1)
                .displayNameEn("Test Governorate 1")
                .displayNameAr("Test Governorate AR 1")
                .slug("test-governorate-1")
                .countryCode("SY")
                .region("Region1")
                .latitude(33.5138)
                .longitude(36.2765)
                .build();
        
        Long id2 = 2L;
        governorate2 = new Governorate();
        governorate2.setId(id2);
        governorate2.setDisplayNameEn("Test Governorate 2");
        governorate2.setDisplayNameAr("Test Governorate AR 2");
        governorate2.setSlug("test-governorate-2");
        governorate2.setCountryCode("SY");
        governorate2.setIsActive(false); // This one is not active
    }

    @Test
    void getAllActiveGovernorates_shouldReturnActiveGovernorates() {
        when(governorateRepository.findByIsActiveTrue()).thenReturn(List.of(governorate1));

        List<GovernorateResponse> result = governorateService.getAllActiveGovernorates();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("test-governorate-1", result.get(0).getSlug());
        verify(governorateRepository, times(1)).findByIsActiveTrue();
    }

    @Test
    void getAllActiveGovernorates_shouldReturnEmptyListWhenNoneActive() {
        when(governorateRepository.findByIsActiveTrue()).thenReturn(Collections.emptyList());

        List<GovernorateResponse> result = governorateService.getAllActiveGovernorates();

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(governorateRepository, times(1)).findByIsActiveTrue();
    }

    @Test
    void getGovernoratesByCountry_shouldReturnGovernoratesForCountryCode() {
        when(governorateRepository.findByCountryCodeOrderByDisplayNameEnAsc("SY")).thenReturn(List.of(governorate1, governorate2));

        List<GovernorateResponse> result = governorateService.getGovernoratesByCountry("SY");

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("test-governorate-1", result.get(0).getSlug());
        assertEquals("test-governorate-2", result.get(1).getSlug());
        verify(governorateRepository, times(1)).findByCountryCodeOrderByDisplayNameEnAsc("SY");
    }

    @Test
    void getGovernoratesByCountry_shouldReturnEmptyListForUnknownCountryCode() {
        when(governorateRepository.findByCountryCodeOrderByDisplayNameEnAsc("XX")).thenReturn(Collections.emptyList());

        List<GovernorateResponse> result = governorateService.getGovernoratesByCountry("XX");

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(governorateRepository, times(1)).findByCountryCodeOrderByDisplayNameEnAsc("XX");
    }
    
    @Test
    void getGovernorateBySlug_shouldReturnGovernorateResponseWhenFound() {
        when(governorateRepository.findBySlug("test-governorate-1")).thenReturn(Optional.of(governorate1));

        GovernorateResponse result = governorateService.getGovernorateBySlug("test-governorate-1");

        assertNotNull(result);
        assertEquals("test-governorate-1", result.getSlug());
        assertEquals("Test Governorate 1", result.getDisplayNameEn());
        verify(governorateRepository, times(1)).findBySlug("test-governorate-1");
    }

    @Test
    void getGovernorateBySlug_shouldReturnNullWhenNotFound() {
        when(governorateRepository.findBySlug("unknown-slug")).thenReturn(Optional.empty());

        GovernorateResponse result = governorateService.getGovernorateBySlug("unknown-slug");

        assertNull(result);
        verify(governorateRepository, times(1)).findBySlug("unknown-slug");
    }

    @Test
    void findGovernorateBySlug_shouldReturnGovernorateEntityWhenFound() {
        when(governorateRepository.findBySlug("test-governorate-1")).thenReturn(Optional.of(governorate1));

        Governorate result = governorateService.findGovernorateBySlug("test-governorate-1");

        assertNotNull(result);
        assertEquals("test-governorate-1", result.getSlug());
        assertEquals(governorate1.getId(), result.getId());
        verify(governorateRepository, times(1)).findBySlug("test-governorate-1");
    }

    @Test
    void findGovernorateBySlug_shouldReturnNullWhenNotFound() {
        when(governorateRepository.findBySlug("unknown-slug")).thenReturn(Optional.empty());

        Governorate result = governorateService.findGovernorateBySlug("unknown-slug");

        assertNull(result);
        verify(governorateRepository, times(1)).findBySlug("unknown-slug");
    }
}
