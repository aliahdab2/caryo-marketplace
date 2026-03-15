package com.caryo.marketplace.config;

import com.caryo.marketplace.service.PasswordResetService;
import com.caryo.marketplace.service.storage.StorageObjectInfo;
import com.caryo.marketplace.service.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Configuration
@EnableScheduling
public class SchedulingConfig {

    private static final Logger logger = LoggerFactory.getLogger(SchedulingConfig.class);

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private StorageService storageService;

    @Value("${app.storage.temp-cleanup-max-age-hours:24}")
    private int tempCleanupMaxAgeHours;

    /**
     * Cleanup expired password reset tokens every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour = 3,600,000 milliseconds
    public void cleanupExpiredTokens() {
        logger.info("Starting cleanup of expired password reset tokens");
        passwordResetService.cleanupExpiredTokens();
    }

    /**
     * Cleanup temp upload files older than configured max age.
     * Runs every 6 hours. Files in temp/ that are older than 24 hours (default)
     * are considered abandoned and deleted.
     */
    @Scheduled(fixedRate = 21600000) // 6 hours = 21,600,000 milliseconds
    public void cleanupTempUploads() {
        logger.info("Starting cleanup of temp upload files older than {} hours", tempCleanupMaxAgeHours);

        try {
            List<StorageObjectInfo> tempFiles = storageService.listByPrefix("temp/");
            Instant cutoff = Instant.now().minus(Duration.ofHours(tempCleanupMaxAgeHours));
            int deletedCount = 0;

            for (StorageObjectInfo file : tempFiles) {
                if (file.lastModified().isBefore(cutoff)) {
                    try {
                        storageService.delete(file.key());
                        deletedCount++;
                    } catch (Exception e) {
                        logger.warn("Failed to delete temp file: {}. Error: {}", file.key(), e.getMessage());
                    }
                }
            }

            logger.info("Temp upload cleanup complete. Deleted {} of {} total temp files.", deletedCount, tempFiles.size());

        } catch (Exception e) {
            logger.error("Temp upload cleanup failed", e);
        }
    }
}
