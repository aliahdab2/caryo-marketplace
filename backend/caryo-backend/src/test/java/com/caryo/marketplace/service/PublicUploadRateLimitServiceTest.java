package com.caryo.marketplace.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PublicUploadRateLimitServiceTest {

    private PublicUploadRateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new PublicUploadRateLimitService();
    }

    @Test
    void shouldAllowFirstUpload() {
        assertTrue(rateLimitService.canUpload("192.168.1.1"));
        assertEquals(10, rateLimitService.getRemainingUploads("192.168.1.1"));
    }

    @Test
    void shouldTrackUploads() {
        String ip = "192.168.1.2";
        
        // Initially 10 remaining
        assertEquals(10, rateLimitService.getRemainingUploads(ip));
        
        // Record an upload
        rateLimitService.recordUpload(ip);
        assertEquals(9, rateLimitService.getRemainingUploads(ip));
        
        // Record another
        rateLimitService.recordUpload(ip);
        assertEquals(8, rateLimitService.getRemainingUploads(ip));
    }

    @Test
    void shouldBlockAfterLimitReached() {
        String ip = "192.168.1.3";
        
        // Record 10 uploads (the limit)
        for (int i = 0; i < 10; i++) {
            assertTrue(rateLimitService.canUpload(ip), "Should allow upload " + (i + 1));
            rateLimitService.recordUpload(ip);
        }
        
        // 11th should be blocked
        assertFalse(rateLimitService.canUpload(ip));
        assertEquals(0, rateLimitService.getRemainingUploads(ip));
    }

    @Test
    void shouldTrackDifferentIpsSeparately() {
        String ip1 = "192.168.1.10";
        String ip2 = "192.168.1.20";
        
        // Record uploads for ip1
        for (int i = 0; i < 5; i++) {
            rateLimitService.recordUpload(ip1);
        }
        
        // ip1 has 5 remaining, ip2 has 10
        assertEquals(5, rateLimitService.getRemainingUploads(ip1));
        assertEquals(10, rateLimitService.getRemainingUploads(ip2));
        
        // Both should still be allowed
        assertTrue(rateLimitService.canUpload(ip1));
        assertTrue(rateLimitService.canUpload(ip2));
    }

    @Test
    void shouldHandleNullIp() {
        assertFalse(rateLimitService.canUpload(null));
        assertEquals(0, rateLimitService.getRemainingUploads(null));
        
        // Should not throw
        rateLimitService.recordUpload(null);
    }

    @Test
    void shouldHandleBlankIp() {
        assertFalse(rateLimitService.canUpload(""));
        assertFalse(rateLimitService.canUpload("   "));
        assertEquals(0, rateLimitService.getRemainingUploads(""));
    }

    @Test
    void shouldClearAllLimits() {
        String ip = "192.168.1.50";
        
        // Record some uploads
        for (int i = 0; i < 10; i++) {
            rateLimitService.recordUpload(ip);
        }
        assertFalse(rateLimitService.canUpload(ip));
        
        // Clear all
        rateLimitService.clearAll();
        
        // Should be allowed again
        assertTrue(rateLimitService.canUpload(ip));
        assertEquals(10, rateLimitService.getRemainingUploads(ip));
    }

    @Test
    void shouldHandleIpv6Addresses() {
        String ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
        
        assertTrue(rateLimitService.canUpload(ipv6));
        rateLimitService.recordUpload(ipv6);
        assertEquals(9, rateLimitService.getRemainingUploads(ipv6));
    }

    @Test
    void shouldHandleLocalhostIp() {
        assertTrue(rateLimitService.canUpload("127.0.0.1"));
        assertTrue(rateLimitService.canUpload("::1"));
    }
}
