package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.service.PasswordResetService;
import com.autotrader.autotraderbackend.service.storage.StorageObjectInfo;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchedulingConfigTest {

    @Mock
    private PasswordResetService passwordResetService;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private SchedulingConfig schedulingConfig;

    @BeforeEach
    void setUp() {
        // Set the default max age to 24 hours
        ReflectionTestUtils.setField(schedulingConfig, "tempCleanupMaxAgeHours", 24);
    }

    @Test
    void cleanupTempUploads_shouldDeleteFilesOlderThan24Hours() {
        // Arrange
        Instant now = Instant.now();
        Instant oldTime = now.minus(25, ChronoUnit.HOURS); // 25 hours ago (older than cutoff)
        Instant recentTime = now.minus(1, ChronoUnit.HOURS); // 1 hour ago (newer than cutoff)

        StorageObjectInfo oldFile = new StorageObjectInfo("temp/old-file.jpg", oldTime, 1000L);
        StorageObjectInfo recentFile = new StorageObjectInfo("temp/recent-file.jpg", recentTime, 2000L);

        when(storageService.listByPrefix("temp/")).thenReturn(List.of(oldFile, recentFile));
        when(storageService.delete("temp/old-file.jpg")).thenReturn(true);

        // Act
        schedulingConfig.cleanupTempUploads();

        // Assert
        verify(storageService).listByPrefix("temp/");
        verify(storageService).delete("temp/old-file.jpg");
        verify(storageService, never()).delete("temp/recent-file.jpg");
    }

    @Test
    void cleanupTempUploads_shouldNotDeleteFilesNewerThan24Hours() {
        // Arrange
        Instant now = Instant.now();
        Instant recentTime = now.minus(12, ChronoUnit.HOURS); // 12 hours ago

        StorageObjectInfo recentFile = new StorageObjectInfo("temp/recent-file.jpg", recentTime, 1000L);

        when(storageService.listByPrefix("temp/")).thenReturn(List.of(recentFile));

        // Act
        schedulingConfig.cleanupTempUploads();

        // Assert
        verify(storageService).listByPrefix("temp/");
        verify(storageService, never()).delete(anyString());
    }

    @Test
    void cleanupTempUploads_shouldHandleEmptyTempFolder() {
        // Arrange
        when(storageService.listByPrefix("temp/")).thenReturn(Collections.emptyList());

        // Act
        schedulingConfig.cleanupTempUploads();

        // Assert
        verify(storageService).listByPrefix("temp/");
        verify(storageService, never()).delete(anyString());
    }

    @Test
    void cleanupTempUploads_shouldContinueOnDeleteFailure() {
        // Arrange
        Instant oldTime = Instant.now().minus(25, ChronoUnit.HOURS);

        StorageObjectInfo file1 = new StorageObjectInfo("temp/file1.jpg", oldTime, 1000L);
        StorageObjectInfo file2 = new StorageObjectInfo("temp/file2.jpg", oldTime, 2000L);
        StorageObjectInfo file3 = new StorageObjectInfo("temp/file3.jpg", oldTime, 3000L);

        when(storageService.listByPrefix("temp/")).thenReturn(List.of(file1, file2, file3));
        when(storageService.delete("temp/file1.jpg")).thenReturn(true);
        when(storageService.delete("temp/file2.jpg")).thenThrow(new RuntimeException("Delete failed"));
        when(storageService.delete("temp/file3.jpg")).thenReturn(true);

        // Act
        schedulingConfig.cleanupTempUploads();

        // Assert - should attempt to delete all files despite failure on file2
        verify(storageService).delete("temp/file1.jpg");
        verify(storageService).delete("temp/file2.jpg");
        verify(storageService).delete("temp/file3.jpg");
    }

    @Test
    void cleanupTempUploads_shouldHandleListByPrefixFailure() {
        // Arrange
        when(storageService.listByPrefix("temp/")).thenThrow(new RuntimeException("Storage unavailable"));

        // Act - should not throw, just log error
        schedulingConfig.cleanupTempUploads();

        // Assert
        verify(storageService).listByPrefix("temp/");
        verify(storageService, never()).delete(anyString());
    }

    @Test
    void cleanupTempUploads_shouldRespectConfigurableMaxAge() {
        // Arrange - set max age to 1 hour
        ReflectionTestUtils.setField(schedulingConfig, "tempCleanupMaxAgeHours", 1);

        Instant now = Instant.now();
        Instant twoHoursAgo = now.minus(2, ChronoUnit.HOURS);
        Instant thirtyMinutesAgo = now.minus(30, ChronoUnit.MINUTES);

        StorageObjectInfo oldFile = new StorageObjectInfo("temp/old.jpg", twoHoursAgo, 1000L);
        StorageObjectInfo newFile = new StorageObjectInfo("temp/new.jpg", thirtyMinutesAgo, 1000L);

        when(storageService.listByPrefix("temp/")).thenReturn(List.of(oldFile, newFile));
        when(storageService.delete("temp/old.jpg")).thenReturn(true);

        // Act
        schedulingConfig.cleanupTempUploads();

        // Assert
        verify(storageService).delete("temp/old.jpg");
        verify(storageService, never()).delete("temp/new.jpg");
    }

    @Test
    void cleanupTempUploads_shouldDeleteMultipleOldFiles() {
        // Arrange
        Instant oldTime = Instant.now().minus(48, ChronoUnit.HOURS);

        StorageObjectInfo file1 = new StorageObjectInfo("temp/abandoned1.jpg", oldTime, 1000L);
        StorageObjectInfo file2 = new StorageObjectInfo("temp/abandoned2.jpg", oldTime, 2000L);

        when(storageService.listByPrefix("temp/")).thenReturn(List.of(file1, file2));
        when(storageService.delete(anyString())).thenReturn(true);

        // Act
        schedulingConfig.cleanupTempUploads();

        // Assert
        verify(storageService).delete("temp/abandoned1.jpg");
        verify(storageService).delete("temp/abandoned2.jpg");
    }

    @Test
    void cleanupExpiredTokens_shouldCallPasswordResetService() {
        // Act
        schedulingConfig.cleanupExpiredTokens();

        // Assert
        verify(passwordResetService).cleanupExpiredTokens();
    }
}
