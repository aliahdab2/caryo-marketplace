package com.autotrader.autotraderbackend.health;

import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AutotraderHealthIndicatorTest {

    private final AutotraderHealthIndicator healthIndicator = new AutotraderHealthIndicator();

    @Test
    void health_whenServiceIsUp_returnsUpStatus() {
        // Act
        Health health = healthIndicator.health();
        
        // Assert
        assertEquals(Status.UP, health.getStatus());
        assertNotNull(health.getDetails().get("serviceStatus"));
        assertEquals("available", health.getDetails().get("serviceStatus"));
        assertNotNull(health.getDetails().get("description"));
    }
}
