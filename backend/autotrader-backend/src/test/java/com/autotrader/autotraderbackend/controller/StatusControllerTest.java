package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.security.jwt.AuthTokenFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = StatusController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = AuthTokenFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
class StatusControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void serviceStatus_returnsServiceUpMessage() throws Exception {
        mockMvc.perform(get("/service-status"))
                .andExpect(status().isOk())
                .andExpect(content().string("Service is up!"));
    }

    @Test
    void apiStatus_returnsApiWorkingMessage() throws Exception {
        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(content().string("API is working!"));
    }
}
