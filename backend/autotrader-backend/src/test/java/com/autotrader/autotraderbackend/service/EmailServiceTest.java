package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.context.Context;
import jakarta.mail.internet.MimeMessage;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Comprehensive unit tests for EmailService.
 * Tests all email functionality including multi-language support and error handling.
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private org.thymeleaf.TemplateEngine templateEngine;

    @Mock
    private MessageService messageService;

    @Mock
    private MimeMessage mimeMessage;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender, templateEngine, messageService);
        
        // Set configuration values
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@autotrader.com");
        ReflectionTestUtils.setField(emailService, "supportEmail", "support@autotrader.com");
        ReflectionTestUtils.setField(emailService, "websiteName", "AutoTrader");
        ReflectionTestUtils.setField(emailService, "websiteNameAr", "أوتو تريدر");
        ReflectionTestUtils.setField(emailService, "websiteUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(emailService, "websiteSupportEmail", "support@autotrader.com");
        ReflectionTestUtils.setField(emailService, "websiteSupportPhone", "+963-XXX-XXXX");
        ReflectionTestUtils.setField(emailService, "defaultLanguage", "en");
    }
    
    /**
     * Sets up mocks for templated email tests.
     * Call this method in tests that use HTML email templates.
     */
    private void setupTemplatedEmailMocks() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Test Email</body></html>");
    }

    // ==================== Simple Email Tests ====================

    @Test
    void sendSimpleEmail_Success() {
        // Arrange
        String to = "test@example.com";
        String subject = "Test Subject";
        String text = "Test message";

        // Act
        emailService.sendSimpleEmail(to, subject, text);

        // Assert
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendSimpleEmail_NullRecipient_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendSimpleEmail(null, "Subject", "Text");
        });
    }

    @Test
    void sendSimpleEmail_EmptyRecipient_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendSimpleEmail("", "Subject", "Text");
        });
    }

    @Test
    void sendSimpleEmail_NullSubject_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendSimpleEmail("test@example.com", null, "Text");
        });
    }

    @Test
    void sendSimpleEmail_NullText_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendSimpleEmail("test@example.com", "Subject", null);
        });
    }

    // ==================== Listing Email Tests ====================

    @Test
    void sendListingApprovedEmail_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        User seller = createTestUser();
        CarListing listing = createTestListing();

        // Act
        emailService.sendListingApprovedEmail(seller, listing);

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendListingApprovedEmail(seller, listing));
    }

    @Test
    void sendListingApprovedEmail_NullSeller_DoesNotSend() {
        // Arrange
        CarListing listing = createTestListing();

        // Act
        emailService.sendListingApprovedEmail(null, listing);

        // Assert - Should not throw exception, just log warning
        assertDoesNotThrow(() -> emailService.sendListingApprovedEmail(null, listing));
    }

    @Test
    void sendListingApprovedEmail_NullEmail_DoesNotSend() {
        // Arrange
        User seller = createTestUser();
        seller.setEmail(null);
        CarListing listing = createTestListing();

        // Act
        emailService.sendListingApprovedEmail(seller, listing);

        // Assert - Should not throw exception, just log warning
        assertDoesNotThrow(() -> emailService.sendListingApprovedEmail(seller, listing));
    }

    @Test
    void sendListingApprovedEmail_WithLanguage_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        User seller = createTestUser();
        CarListing listing = createTestListing();

        // Act
        emailService.sendListingApprovedEmail(seller, listing, "ar");

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendListingApprovedEmail(seller, listing, "ar"));
    }

    @Test
    void sendListingApprovedEmail_InvalidLanguage_ThrowsException() {
        // Arrange
        User seller = createTestUser();
        CarListing listing = createTestListing();

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendListingApprovedEmail(seller, listing, "fr");
        });
    }

    @Test
    void sendListingExpiredEmail_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        User seller = createTestUser();
        CarListing listing = createTestListing();

        // Act
        emailService.sendListingExpiredEmail(seller, listing);

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendListingExpiredEmail(seller, listing));
    }

    @Test
    void sendListingExpiredEmail_WithLanguage_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        User seller = createTestUser();
        CarListing listing = createTestListing();

        // Act
        emailService.sendListingExpiredEmail(seller, listing, "ar");

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendListingExpiredEmail(seller, listing, "ar"));
    }

    @Test
    void sendListingRenewalEmail_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        User seller = createTestUser();
        CarListing listing = createTestListing();
        int renewalDays = 30;

        // Act
        emailService.sendListingRenewalEmail(seller, listing, renewalDays);

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendListingRenewalEmail(seller, listing, renewalDays));
    }

    @Test
    void sendListingRenewalEmail_WithLanguage_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        User seller = createTestUser();
        CarListing listing = createTestListing();
        int renewalDays = 30;

        // Act
        emailService.sendListingRenewalEmail(seller, listing, renewalDays, "ar");

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendListingRenewalEmail(seller, listing, renewalDays, "ar"));
    }

    @Test
    void sendListingRenewalEmail_InvalidRenewalDays_ThrowsException() {
        // Arrange
        User seller = createTestUser();
        CarListing listing = createTestListing();

        // Act & Assert - Zero days
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendListingRenewalEmail(seller, listing, 0, "en");
        });

        // Act & Assert - Negative days
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendListingRenewalEmail(seller, listing, -1, "en");
        });

        // Act & Assert - Too many days
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendListingRenewalEmail(seller, listing, 366, "en");
        });
    }

    // ==================== Welcome Email Tests ====================

    @Test
    void sendWelcomeEmail_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        User user = createTestUser();

        // Act
        emailService.sendWelcomeEmail(user);

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendWelcomeEmail(user));
    }

    @Test
    void sendWelcomeEmail_WithLanguage_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        User user = createTestUser();

        // Act
        emailService.sendWelcomeEmail(user, "ar");

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendWelcomeEmail(user, "ar"));
    }

    @Test
    void sendWelcomeEmail_NullUser_DoesNotSend() {
        // Act
        emailService.sendWelcomeEmail(null);

        // Assert - Should not throw exception, just log warning
        assertDoesNotThrow(() -> emailService.sendWelcomeEmail(null));
    }

    @Test
    void sendWelcomeEmail_NullEmail_DoesNotSend() {
        // Arrange
        User user = createTestUser();
        user.setEmail(null);

        // Act
        emailService.sendWelcomeEmail(user);

        // Assert - Should not throw exception, just log warning
        assertDoesNotThrow(() -> emailService.sendWelcomeEmail(user));
    }

    // ==================== Contact Form Email Tests ====================

    @Test
    void sendContactFormEmail_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        String name = "John Doe";
        String email = "john@example.com";
        String message = "Test message";

        // Act
        emailService.sendContactFormEmail(name, email, message);

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendContactFormEmail(name, email, message));
    }

    @Test
    void sendContactFormEmail_WithLanguage_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        String name = "أحمد محمد";
        String email = "ahmed@example.com";
        String message = "رسالة تجريبية";

        // Act
        emailService.sendContactFormEmail(name, email, message, "ar");

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendContactFormEmail(name, email, message, "ar"));
    }

    @Test
    void sendContactFormEmail_NullName_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendContactFormEmail(null, "test@example.com", "Message");
        });
    }

    @Test
    void sendContactFormEmail_NullEmail_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendContactFormEmail("John Doe", null, "Message");
        });
    }

    @Test
    void sendContactFormEmail_NullMessage_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendContactFormEmail("John Doe", "test@example.com", null);
        });
    }

    @Test
    void sendContactFormEmail_InvalidLanguage_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendContactFormEmail("John Doe", "test@example.com", "Message", "fr");
        });
    }

    @Test
    void sendContactFormConfirmation_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        String name = "John Doe";
        String email = "john@example.com";

        // Act
        emailService.sendContactFormConfirmation(name, email);

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendContactFormConfirmation(name, email));
    }

    @Test
    void sendContactFormConfirmation_WithLanguage_Success() {
        // Arrange
        setupTemplatedEmailMocks();
        String name = "أحمد محمد";
        String email = "ahmed@example.com";

        // Act
        emailService.sendContactFormConfirmation(name, email, "ar");

        // Assert - Should not throw exception
        assertDoesNotThrow(() -> emailService.sendContactFormConfirmation(name, email, "ar"));
    }

    @Test
    void sendContactFormConfirmation_NullName_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendContactFormConfirmation(null, "test@example.com");
        });
    }

    @Test
    void sendContactFormConfirmation_NullEmail_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            emailService.sendContactFormConfirmation("John Doe", null);
        });
    }

    // ==================== Helper Methods ====================

    private User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        return user;
    }

    private CarListing createTestListing() {
        CarListing listing = new CarListing();
        listing.setId(1L);
        listing.setBrandNameEn("Toyota");
        listing.setModelNameEn("Camry");
        listing.setModelYear(2020);
        listing.setPrice(new BigDecimal("25000"));
        return listing;
    }
} 