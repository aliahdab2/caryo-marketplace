package com.autotrader.autotraderbackend;

import com.autotrader.autotraderbackend.config.TestEmailConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestEmailConfig.class)
class AutotraderBackendApplicationTests {

    @Test
    void contextLoads() {
        // This test verifies that the Spring application context loads successfully
        // If the application context cannot be created, this test will fail
    }

    @Test
    void applicationClassExists() {
        // Verify the main application class can be instantiated
        AutotraderBackendApplication application = new AutotraderBackendApplication();
        assertNotNull(application);
    }
}
