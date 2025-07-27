package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.payload.response.CarReferenceDataResponse;
import com.autotrader.autotraderbackend.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Transactional
class ReferenceDataIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private CarConditionService carConditionService;

    @Autowired
    private DriveTypeService driveTypeService;

    @Autowired
    private BodyStyleService bodyStyleService;

    @Autowired
    private FuelTypeService fuelTypeService;

    @Autowired
    private TransmissionService transmissionService;

    @Autowired
    private SellerTypeService sellerTypeService;

    private MockMvc mockMvc;

    @Test
    void testGetAllReferenceData_ReturnsCorrectStructure() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        mockMvc.perform(get("/api/reference-data")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.carConditions").exists())
                .andExpect(jsonPath("$.driveTypes").exists())
                .andExpect(jsonPath("$.bodyStyles").exists())
                .andExpect(jsonPath("$.fuelTypes").exists())
                .andExpect(jsonPath("$.transmissions").exists())
                .andExpect(jsonPath("$.sellerTypes").exists());
    }

    @Test
    void testGetAllReferenceData_EachItemHasRequiredFields() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        mockMvc.perform(get("/api/reference-data")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carConditions[0].id").exists())
                .andExpect(jsonPath("$.carConditions[0].name").exists())
                .andExpect(jsonPath("$.carConditions[0].displayNameEn").exists())
                .andExpect(jsonPath("$.carConditions[0].displayNameAr").exists())
                .andExpect(jsonPath("$.carConditions[0].slug").exists())
                .andExpect(jsonPath("$.driveTypes[0].id").exists())
                .andExpect(jsonPath("$.driveTypes[0].name").exists())
                .andExpect(jsonPath("$.driveTypes[0].displayNameEn").exists())
                .andExpect(jsonPath("$.driveTypes[0].displayNameAr").exists())
                .andExpect(jsonPath("$.driveTypes[0].slug").exists())
                .andExpect(jsonPath("$.bodyStyles[0].id").exists())
                .andExpect(jsonPath("$.bodyStyles[0].name").exists())
                .andExpect(jsonPath("$.bodyStyles[0].displayNameEn").exists())
                .andExpect(jsonPath("$.bodyStyles[0].displayNameAr").exists())
                .andExpect(jsonPath("$.bodyStyles[0].slug").exists())
                .andExpect(jsonPath("$.fuelTypes[0].id").exists())
                .andExpect(jsonPath("$.fuelTypes[0].name").exists())
                .andExpect(jsonPath("$.fuelTypes[0].displayNameEn").exists())
                .andExpect(jsonPath("$.fuelTypes[0].displayNameAr").exists())
                .andExpect(jsonPath("$.fuelTypes[0].slug").exists())
                .andExpect(jsonPath("$.transmissions[0].id").exists())
                .andExpect(jsonPath("$.transmissions[0].name").exists())
                .andExpect(jsonPath("$.transmissions[0].displayNameEn").exists())
                .andExpect(jsonPath("$.transmissions[0].displayNameAr").exists())
                .andExpect(jsonPath("$.transmissions[0].slug").exists());
    }

    @Test
    void testGetAllReferenceData_SlugFieldsAreNotEmpty() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        mockMvc.perform(get("/api/reference-data")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carConditions[0].slug").isNotEmpty())
                .andExpect(jsonPath("$.driveTypes[0].slug").isNotEmpty())
                .andExpect(jsonPath("$.bodyStyles[0].slug").isNotEmpty())
                .andExpect(jsonPath("$.fuelTypes[0].slug").isNotEmpty())
                .andExpect(jsonPath("$.transmissions[0].slug").isNotEmpty());
    }

    @Test
    void testGetAllReferenceData_DataIsNotEmpty() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        mockMvc.perform(get("/api/reference-data")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carConditions").isArray())
                .andExpect(jsonPath("$.carConditions").isNotEmpty())
                .andExpect(jsonPath("$.driveTypes").isArray())
                .andExpect(jsonPath("$.driveTypes").isNotEmpty())
                .andExpect(jsonPath("$.bodyStyles").isArray())
                .andExpect(jsonPath("$.bodyStyles").isNotEmpty())
                .andExpect(jsonPath("$.fuelTypes").isArray())
                .andExpect(jsonPath("$.fuelTypes").isNotEmpty())
                .andExpect(jsonPath("$.transmissions").isArray())
                .andExpect(jsonPath("$.transmissions").isNotEmpty())
                .andExpect(jsonPath("$.sellerTypes").isArray())
                .andExpect(jsonPath("$.sellerTypes").isNotEmpty());
    }

    @Test
    void testIndividualReferenceDataEndpoints_ReturnCorrectStructure() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        // Test car conditions endpoint
        mockMvc.perform(get("/api/car-conditions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].displayNameEn").exists())
                .andExpect(jsonPath("$[0].displayNameAr").exists())
                .andExpect(jsonPath("$[0].slug").exists());

        // Test drive types endpoint
        mockMvc.perform(get("/api/drive-types")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].displayNameEn").exists())
                .andExpect(jsonPath("$[0].displayNameAr").exists())
                .andExpect(jsonPath("$[0].slug").exists());

        // Test body styles endpoint
        mockMvc.perform(get("/api/body-styles")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].displayNameEn").exists())
                .andExpect(jsonPath("$[0].displayNameAr").exists())
                .andExpect(jsonPath("$[0].slug").exists());

        // Test fuel types endpoint
        mockMvc.perform(get("/api/fuel-types")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].displayNameEn").exists())
                .andExpect(jsonPath("$[0].displayNameAr").exists())
                .andExpect(jsonPath("$[0].slug").exists());

        // Test transmissions endpoint
        mockMvc.perform(get("/api/transmissions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].displayNameEn").exists())
                .andExpect(jsonPath("$[0].displayNameAr").exists())
                .andExpect(jsonPath("$[0].slug").exists());
    }
} 