package com.autotrader.autotraderbackend.actuator;

import com.autotrader.autotraderbackend.service.storage.S3StorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ActuatorHealthIntegrationTest extends  IntegrationTestWithS3 {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser
    void actuatorHealthEndpoint_ReturnsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @WithMockUser
    void actuatorHealthDbEndpoint_ReturnsDbStatus() throws Exception {
        mockMvc.perform(get("/actuator/health/db"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @WithMockUser
    void actuatorHealthDiskSpaceEndpoint_ReturnsDiskStatus() throws Exception {
        mockMvc.perform(get("/actuator/health/diskSpace"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.details.total").exists())
                .andExpect(jsonPath("$.details.free").exists());
    }
}
