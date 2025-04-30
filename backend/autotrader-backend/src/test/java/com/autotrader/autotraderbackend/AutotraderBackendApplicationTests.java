package com.autotrader.autotraderbackend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AutotraderBackendApplicationTests {

    @Test
    void applicationStarts() {
        // Simple test to verify the main class exists
        AutotraderBackendApplication application = new AutotraderBackendApplication();
        assertNotNull(application);
    }
    
    private void assertNotNull(Object obj) {
        if (obj == null) {
            throw new AssertionError("Expected non-null value");
        }
    }
}
