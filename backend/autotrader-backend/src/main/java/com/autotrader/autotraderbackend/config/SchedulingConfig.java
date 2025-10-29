package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.service.PasswordResetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class SchedulingConfig {

    private static final Logger logger = LoggerFactory.getLogger(SchedulingConfig.class);

    @Autowired
    private PasswordResetService passwordResetService;

    /**
     * Cleanup expired password reset tokens every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour = 3,600,000 milliseconds
    public void cleanupExpiredTokens() {
        logger.info("Starting cleanup of expired password reset tokens");
        passwordResetService.cleanupExpiredTokens();
    }
}
