package com.autotrader.autotraderbackend.service.email;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmailRateLimitServiceTest {

    private EmailRateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new EmailRateLimitService();
    }

    @Test
    void shouldAllowEmailWhenUnderLimit() {
        String userEmail = "test@example.com";

        boolean isRateLimited = rateLimitService.isRateLimited(userEmail);

        assertThat(isRateLimited).isFalse();
    }

    @Test
    void shouldBlockAfterExceedingMinuteLimit() {
        String userEmail = "test@example.com";

        // Send 5 emails (the limit)
        for (int i = 0; i < 5; i++) {
            assertThat(rateLimitService.isRateLimited(userEmail)).isFalse();
        }

        // The 6th should be rate limited
        assertThat(rateLimitService.isRateLimited(userEmail)).isTrue();
    }

    @Test
    void shouldTrackDifferentUsersIndependently() {
        String user1 = "user1@example.com";
        String user2 = "user2@example.com";

        // Send 5 emails for user1
        for (int i = 0; i < 5; i++) {
            rateLimitService.isRateLimited(user1);
        }

        // User2 should not be rate limited
        assertThat(rateLimitService.isRateLimited(user2)).isFalse();
    }

    @Test
    void shouldAllowGlobalEmailsWhenUnderLimit() {
        boolean isGlobalRateLimited = rateLimitService.isGlobalRateLimited();

        assertThat(isGlobalRateLimited).isFalse();
    }

    @Test
    void shouldBlockGlobalEmailsAfterExceedingLimit() {
        // Send 50 emails (the global limit is 5 * 10 = 50)
        for (int i = 0; i < 50; i++) {
            assertThat(rateLimitService.isGlobalRateLimited()).isFalse();
        }

        // The 51st should be rate limited
        assertThat(rateLimitService.isGlobalRateLimited()).isTrue();
    }

    @Test
    void shouldReturnCorrectRemainingEmails() {
        String userEmail = "test@example.com";

        assertThat(rateLimitService.getRemainingEmails(userEmail)).isEqualTo(5);

        // Send 2 emails
        rateLimitService.isRateLimited(userEmail);
        rateLimitService.isRateLimited(userEmail);

        assertThat(rateLimitService.getRemainingEmails(userEmail)).isEqualTo(3);
    }

    @Test
    void shouldResetUserRateLimit() {
        String userEmail = "test@example.com";

        // Exhaust the limit
        for (int i = 0; i < 5; i++) {
            rateLimitService.isRateLimited(userEmail);
        }
        assertThat(rateLimitService.isRateLimited(userEmail)).isTrue();

        // Reset
        rateLimitService.resetUserRateLimit(userEmail);

        // Should be able to send again
        assertThat(rateLimitService.isRateLimited(userEmail)).isFalse();
    }

    @Test
    void shouldResetAllRateLimits() {
        String user1 = "user1@example.com";
        String user2 = "user2@example.com";

        // Exhaust limits for both users
        for (int i = 0; i < 5; i++) {
            rateLimitService.isRateLimited(user1);
            rateLimitService.isRateLimited(user2);
        }

        // Reset all
        rateLimitService.resetAllRateLimits();

        // Both should be able to send again
        assertThat(rateLimitService.isRateLimited(user1)).isFalse();
        assertThat(rateLimitService.isRateLimited(user2)).isFalse();
    }

    @Test
    void shouldCheckBothUserAndGlobalLimits() {
        String userEmail = "test@example.com";

        // When no limits are exceeded
        assertThat(rateLimitService.isAnyRateLimitExceeded(userEmail)).isFalse();

        // After exhausting user limit
        for (int i = 0; i < 5; i++) {
            rateLimitService.isRateLimited(userEmail);
        }

        assertThat(rateLimitService.isAnyRateLimitExceeded(userEmail)).isTrue();
    }
}
