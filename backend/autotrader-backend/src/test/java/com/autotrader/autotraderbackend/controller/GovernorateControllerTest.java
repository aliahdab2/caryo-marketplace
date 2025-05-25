package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.response.GovernorateResponse;
import com.autotrader.autotraderbackend.service.GovernorateService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = GovernorateController.class,
    includeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = com.autotrader.autotraderbackend.exception.GlobalExceptionHandler.class
    )
)
@Import(com.autotrader.autotraderbackend.config.TestSecurityConfig.class)
class GovernorateControllerTest {

    private static final String BASE_URL = "/api/governorates";
    private static final String COUNTRY_CODE_SY = "SY";
    private static final String DAMASCUS_SLUG = "damascus";
    private static final String ALEPPO_SLUG = "aleppo";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GovernorateService governorateService;

    @MockBean
    private com.autotrader.autotraderbackend.security.jwt.JwtUtils jwtUtils;
    
    @MockBean
    private com.autotrader.autotraderbackend.security.services.UserDetailsServiceImpl userDetailsService;



    private GovernorateResponse damascusGovernorate;
    private GovernorateResponse aleppoGovernorate;
    private List<GovernorateResponse> syrianGovernorates;

    @BeforeEach
    void setUp() {
        // Initialize Damascus governorate
        damascusGovernorate = GovernorateResponse.builder()
                .id(1L)
                .displayNameEn("Damascus")
                .displayNameAr("دمشق")
                .slug(DAMASCUS_SLUG)
                .countryCode(COUNTRY_CODE_SY)
                .region("Damascus Region")
                .latitude(33.5138)
                .longitude(36.2765)
                .build();

        // Initialize Aleppo governorate
        aleppoGovernorate = GovernorateResponse.builder()
                .id(2L)
                .displayNameEn("Aleppo")
                .displayNameAr("حلب")
                .slug(ALEPPO_SLUG)
                .countryCode(COUNTRY_CODE_SY)
                .region("Northern Syria")
                .latitude(36.2021)
                .longitude(37.1343)
                .build();

        // Validate test data
        validateTestData();

        // Initialize the list of Syrian governorates
        syrianGovernorates = List.of(damascusGovernorate, aleppoGovernorate);
    }

    private void validateTestData() {
        assertNotNull(damascusGovernorate, "Damascus governorate must not be null");
        assertNotNull(aleppoGovernorate, "Aleppo governorate must not be null");
        
        Objects.requireNonNull(damascusGovernorate.getId(), "Damascus governorate ID must not be null");
        Objects.requireNonNull(aleppoGovernorate.getId(), "Aleppo governorate ID must not be null");
        
        // Validate that required strings are not empty
        validateGovernorateStrings(damascusGovernorate);
        validateGovernorateStrings(aleppoGovernorate);
    }

    private void validateGovernorateStrings(GovernorateResponse governorate) {
        if (!StringUtils.hasText(governorate.getDisplayNameEn())) {
            throw new IllegalStateException("Display name (EN) must not be empty");
        }
        if (!StringUtils.hasText(governorate.getDisplayNameAr())) {
            throw new IllegalStateException("Display name (AR) must not be empty");
        }
        if (!StringUtils.hasText(governorate.getSlug())) {
            throw new IllegalStateException("Slug must not be empty");
        }
        if (!StringUtils.hasText(governorate.getCountryCode())) {
            throw new IllegalStateException("Country code must not be empty");
        }
        if (!StringUtils.hasText(governorate.getRegion())) {
            throw new IllegalStateException("Region must not be empty");
        }
    }

    @Test
    @WithMockUser
    void getAllGovernorates_shouldReturnListOfGovernorates() throws Exception {
        given(governorateService.getAllActiveGovernorates())
            .willReturn(syrianGovernorates);

        mockMvc.perform(get(BASE_URL))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].slug", is(DAMASCUS_SLUG)))
                .andExpect(jsonPath("$[1].slug", is(ALEPPO_SLUG)));
    }

    @Test
    @WithMockUser
    void getAllGovernorates_shouldReturnEmptyList() throws Exception {
        given(governorateService.getAllActiveGovernorates())
            .willReturn(Collections.emptyList());

        mockMvc.perform(get(BASE_URL))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @ParameterizedTest
    @WithMockUser
    @ValueSource(strings = {"SY", "JO", "AE"})
    void getGovernoratesByCountry_shouldHandleValidCountryCodes(String countryCode) throws Exception {
        List<GovernorateResponse> governorates = COUNTRY_CODE_SY.equals(countryCode) 
            ? syrianGovernorates 
            : Collections.emptyList();
            
        given(governorateService.getGovernoratesByCountry(countryCode))
            .willReturn(governorates);

        mockMvc.perform(get(BASE_URL + "/country/" + countryCode))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(governorates.size())));

        if (COUNTRY_CODE_SY.equals(countryCode)) {
            mockMvc.perform(get(BASE_URL + "/country/" + countryCode))
                    .andExpect(jsonPath("$[0].countryCode", is(countryCode)))
                    .andExpect(jsonPath("$[0].slug", is(DAMASCUS_SLUG)));
        }
    }

    @ParameterizedTest
    @WithMockUser
    @ValueSource(strings = {" ", "XXX", "A"})
    void getGovernoratesByCountry_shouldHandleInvalidCountryCodes(String countryCode) throws Exception {
        given(governorateService.getGovernoratesByCountry(anyString()))
            .willReturn(Collections.emptyList());

        mockMvc.perform(get(BASE_URL + "/country/" + countryCode))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }
    
    @Test
    @WithMockUser
    void getGovernoratesByEmptyCountryCode_shouldReturn200WithEmptyList() throws Exception {
        given(governorateService.getGovernoratesByCountry(""))
            .willReturn(Collections.emptyList());
            
        mockMvc.perform(get(BASE_URL + "/country/{countryCode}", ""))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @WithMockUser
    void getGovernorateBySlug_shouldReturnGovernorateWhenFound() throws Exception {
        given(governorateService.getGovernorateBySlug(DAMASCUS_SLUG))
            .willReturn(damascusGovernorate);

        mockMvc.perform(get(BASE_URL + "/" + DAMASCUS_SLUG))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.slug", is(DAMASCUS_SLUG)))
                .andExpect(jsonPath("$.displayNameEn", is("Damascus")))
                .andExpect(jsonPath("$.countryCode", is(COUNTRY_CODE_SY)));
    }

    @ParameterizedTest
    @WithMockUser
    @ValueSource(strings = {" ", "unknown-slug", "invalid-governorate"})
    void getGovernorateBySlug_shouldHandleInvalidSlugs(String slug) throws Exception {
        given(governorateService.getGovernorateBySlug(anyString()))
            .willReturn(null);

        mockMvc.perform(get(BASE_URL + "/" + slug))
                .andDo(print())
                .andExpect(status().isNotFound());
    }
    
    @Test
    @WithMockUser
    void getGovernorateByEmptySlug_shouldReturn404() throws Exception {
        given(governorateService.getGovernorateBySlug(""))
            .willReturn(null);
            
        mockMvc.perform(get(BASE_URL + "/{slug}", ""))
                .andDo(print())
                .andExpect(status().isNotFound());
    }
}
