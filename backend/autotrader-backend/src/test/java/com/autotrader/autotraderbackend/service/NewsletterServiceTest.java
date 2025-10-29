package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.NewsletterSubscription;
import com.autotrader.autotraderbackend.payload.request.NewsletterSubscriptionRequest;
import com.autotrader.autotraderbackend.payload.NewsletterSubscriptionResponse;
import com.autotrader.autotraderbackend.repository.NewsletterSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NewsletterService.
 */
@ExtendWith(MockitoExtension.class)
class NewsletterServiceTest {

    @Mock
    private NewsletterSubscriptionRepository subscriptionRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NewsletterService newsletterService;

    private NewsletterSubscription testSubscription;
    private NewsletterSubscriptionRequest testRequest;

    @BeforeEach
    void setUp() {
        testSubscription = new NewsletterSubscription();
        testSubscription.setId(1L);
        testSubscription.setEmail("test@example.com");
        testSubscription.setPreferredLanguage("en");
        testSubscription.setSubscriptionSource("homepage");
        testSubscription.setActive(true);
        testSubscription.setConfirmationToken(UUID.randomUUID().toString());
        testSubscription.setUnsubscribeToken(UUID.randomUUID().toString());
        testSubscription.setCreatedAt(LocalDateTime.now());

        testRequest = new NewsletterSubscriptionRequest();
        testRequest.setEmail("test@example.com");
        testRequest.setPreferredLanguage("en");
        testRequest.setSource("homepage");
    }

    @Test
    @DisplayName("Should create new subscription when email doesn't exist")
    void subscribe_NewEmail_ShouldCreateSubscription() {
        // Arrange
        when(subscriptionRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(testSubscription);
        doNothing().when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Act
        NewsletterSubscriptionResponse result = newsletterService.subscribe(testRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("test@example.com", result.getEmail());
        assertFalse(result.isAlreadySubscribed());
        assertTrue(result.isRequiresConfirmation());
        verify(subscriptionRepository).findByEmail("test@example.com");
        verify(subscriptionRepository).save(any(NewsletterSubscription.class));
        verify(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Should handle already active subscription")
    void subscribe_AlreadyActiveSubscription_ShouldReturnAlreadyExists() {
        // Arrange
        testSubscription.setConfirmedAt(LocalDateTime.now());
        when(subscriptionRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testSubscription));

        // Act
        NewsletterSubscriptionResponse result = newsletterService.subscribe(testRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertTrue(result.isAlreadySubscribed());
        verify(subscriptionRepository).findByEmail("test@example.com");
        verify(subscriptionRepository, never()).save(any());
        verify(emailService, never()).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Should reactivate unconfirmed subscription")
    void subscribe_UnconfirmedSubscription_ShouldReactivate() {
        // Arrange
        testSubscription.setConfirmedAt(null);
        when(subscriptionRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(testSubscription);
        doNothing().when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Act
        NewsletterSubscriptionResponse result = newsletterService.subscribe(testRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertFalse(result.isAlreadySubscribed());
        assertTrue(result.isRequiresConfirmation());
        verify(subscriptionRepository).save(testSubscription);
        verify(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Should reactivate unsubscribed subscription")
    void subscribe_UnsubscribedSubscription_ShouldReactivate() {
        // Arrange
        testSubscription.setConfirmedAt(LocalDateTime.now().minusDays(1));
        testSubscription.setUnsubscribedAt(LocalDateTime.now().minusHours(1));
        testSubscription.setActive(false);

        when(subscriptionRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(testSubscription);
        doNothing().when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Act
        NewsletterSubscriptionResponse result = newsletterService.subscribe(testRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertFalse(result.isAlreadySubscribed());
        assertTrue(result.isRequiresConfirmation());
        verify(subscriptionRepository).save(testSubscription);
        verify(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Verify subscription was reactivated
        assertTrue(testSubscription.getActive());
        assertNull(testSubscription.getUnsubscribedAt());
        assertNotNull(testSubscription.getConfirmationToken());
        assertNotNull(testSubscription.getUnsubscribeToken());
    }

    @Test
    @DisplayName("Should confirm subscription successfully with valid token")
    void confirmSubscription_ValidToken_ShouldConfirmAndClearToken() {
        // Arrange
        String confirmationToken = testSubscription.getConfirmationToken();
        testSubscription.setConfirmedAt(null);
        when(subscriptionRepository.findByConfirmationToken(confirmationToken))
            .thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(testSubscription);
        doNothing().when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Act
        boolean result = newsletterService.confirmSubscription(confirmationToken);

        // Assert
        assertTrue(result);
        verify(subscriptionRepository).findByConfirmationToken(confirmationToken);
        verify(subscriptionRepository).save(testSubscription);
        verify(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Verify subscription was confirmed
        assertNotNull(testSubscription.getConfirmedAt());
        assertNull(testSubscription.getConfirmationToken());
    }

    @Test
    @DisplayName("Should return false for invalid confirmation token")
    void confirmSubscription_InvalidToken_ShouldReturnFalse() {
        // Arrange
        String invalidToken = UUID.randomUUID().toString();
        when(subscriptionRepository.findByConfirmationToken(invalidToken)).thenReturn(Optional.empty());

        // Act
        boolean result = newsletterService.confirmSubscription(invalidToken);

        // Assert
        assertFalse(result);
        verify(subscriptionRepository).findByConfirmationToken(invalidToken);
        verify(subscriptionRepository, never()).save(any());
        verify(emailService, never()).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Should handle already confirmed subscription")
    void confirmSubscription_AlreadyConfirmed_ShouldReturnTrue() {
        // Arrange
        testSubscription.setConfirmedAt(LocalDateTime.now().minusHours(1));
        when(subscriptionRepository.findByConfirmationToken(testSubscription.getConfirmationToken()))
            .thenReturn(Optional.of(testSubscription));

        // Act
        boolean result = newsletterService.confirmSubscription(testSubscription.getConfirmationToken());

        // Assert
        assertTrue(result);
        verify(subscriptionRepository).findByConfirmationToken(testSubscription.getConfirmationToken());
        verify(subscriptionRepository, never()).save(any());
        verify(emailService, never()).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Should unsubscribe successfully with valid token")
    void unsubscribe_ValidToken_ShouldUnsubscribe() {
        // Arrange
        testSubscription.setConfirmedAt(LocalDateTime.now().minusDays(1));
        when(subscriptionRepository.findByUnsubscribeToken(testSubscription.getUnsubscribeToken()))
            .thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(testSubscription);

        // Act
        boolean result = newsletterService.unsubscribe(testSubscription.getUnsubscribeToken());

        // Assert
        assertTrue(result);
        verify(subscriptionRepository).findByUnsubscribeToken(testSubscription.getUnsubscribeToken());
        verify(subscriptionRepository).save(testSubscription);

        // Verify subscription was unsubscribed
        assertFalse(testSubscription.getActive());
        assertNotNull(testSubscription.getUnsubscribedAt());
    }

    @Test
    @DisplayName("Should return false for invalid unsubscribe token")
    void unsubscribe_InvalidToken_ShouldReturnFalse() {
        // Arrange
        String invalidToken = UUID.randomUUID().toString();
        when(subscriptionRepository.findByUnsubscribeToken(invalidToken)).thenReturn(Optional.empty());

        // Act
        boolean result = newsletterService.unsubscribe(invalidToken);

        // Assert
        assertFalse(result);
        verify(subscriptionRepository).findByUnsubscribeToken(invalidToken);
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should return correct active subscription count")
    void getActiveSubscriptionCount_ShouldReturnCorrectCount() {
        // Arrange
        long expectedCount = 42L;
        when(subscriptionRepository.countActiveSubscriptions()).thenReturn(expectedCount);

        // Act
        long result = newsletterService.getActiveSubscriptionCount();

        // Assert
        assertEquals(expectedCount, result);
        verify(subscriptionRepository).countActiveSubscriptions();
    }

    @Test
    @DisplayName("Should handle service exceptions gracefully during subscription")
    void subscribe_ServiceException_ShouldReturnErrorResponse() {
        // Arrange
        when(subscriptionRepository.findByEmail("test@example.com")).thenThrow(new RuntimeException("Database error"));

        // Act
        NewsletterSubscriptionResponse result = newsletterService.subscribe(testRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertNotNull(result.getMessage());
        assertTrue(result.getMessage().contains("Failed to subscribe"));
        verify(subscriptionRepository).findByEmail("test@example.com");
    }

    @Test
    @DisplayName("Should handle email service exceptions gracefully during subscription")
    void subscribe_EmailServiceException_ShouldStillSaveSubscription() {
        // Arrange
        when(subscriptionRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(testSubscription);
        doThrow(new RuntimeException("Email service error"))
            .when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Act
        NewsletterSubscriptionResponse result = newsletterService.subscribe(testRequest);

        // Assert
        assertTrue(result.isSuccess());
        verify(subscriptionRepository).save(any(NewsletterSubscription.class));
    }

    @Test
    @DisplayName("Should handle email service exceptions gracefully during confirmation")
    void confirmSubscription_EmailServiceException_ShouldStillConfirm() {
        // Arrange
        testSubscription.setConfirmedAt(null);
        when(subscriptionRepository.findByConfirmationToken(testSubscription.getConfirmationToken()))
            .thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(testSubscription);
        doThrow(new RuntimeException("Email service error"))
            .when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Act
        boolean result = newsletterService.confirmSubscription(testSubscription.getConfirmationToken());

        // Assert
        assertTrue(result);
        verify(subscriptionRepository).save(testSubscription);
        assertNotNull(testSubscription.getConfirmedAt());
        assertNull(testSubscription.getConfirmationToken());
    }

    @Test
    @DisplayName("Should trim and lowercase email during subscription")
    void subscribe_WithEmailVariations_ShouldNormalizeEmail() {
        // Arrange
        NewsletterSubscriptionRequest requestWithSpaces = new NewsletterSubscriptionRequest();
        requestWithSpaces.setEmail("  TEST@EXAMPLE.COM  ");
        requestWithSpaces.setPreferredLanguage("en");
        requestWithSpaces.setSource("homepage");

        when(subscriptionRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(testSubscription);
        doNothing().when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());

        // Act
        NewsletterSubscriptionResponse result = newsletterService.subscribe(requestWithSpaces);

        // Assert
        assertTrue(result.isSuccess());
        verify(subscriptionRepository).findByEmail("test@example.com");
        verify(subscriptionRepository).save(argThat(subscription ->
            subscription.getEmail().equals("test@example.com")));
    }
}
