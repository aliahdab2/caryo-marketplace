package com.autotrader.autotraderbackend.health;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Custom health indicator that provides additional information about the application.
 * This can be extended to check critical services and dependencies.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AutotraderHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        try {
            // You can add actual service checks here
            // For example, check database connectivity, S3 connection, etc.
            
            return Health.up()
                .withDetail("serviceStatus", "available")
                .withDetail("description", "Autotrader backend service is running properly")
                .build();
        } catch (Exception e) {
            log.error("Health check failed", e);
            return Health.down()
                .withDetail("error", e.getMessage())
                .withDetail("exception", e.getClass().getName())
                .build();
        }
    }
}
