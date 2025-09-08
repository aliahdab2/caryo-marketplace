package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.service.AsyncTransactionService;
import com.autotrader.autotraderbackend.service.EmailService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Listener for listing archived events.
 * Handles notification and other business logic when a listing is archived.
 *
 * Features:
 * - Asynchronous processing to avoid blocking main threads
 * - Transactional email notifications for admin actions
 * - Comprehensive logging for audit trails
 * - Error handling with graceful degradation
 * - Configurable behavior via application properties
 *
 * @author AutoTrader Team
 * @version 1.1
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ListingArchivedListener {

    // Constants for configuration property keys
    private static final String CONFIG_ADMIN_NOTIFICATIONS_ENABLED = "app.notifications.listing-archived.admin.enabled";
    private static final String CONFIG_MAX_RETRIES = "app.notifications.listing-archived.max-retries";
    private static final String CONFIG_DETAILED_LOGGING = "app.notifications.listing-archived.detailed-logging";
    private static final String CONFIG_EMAIL_TIMEOUT = "app.notifications.listing-archived.email-timeout-seconds";
    private static final String CONFIG_EMAIL_NOTIFICATIONS_ENABLED = "app.notifications.email.enabled";

    // Default values
    private static final int DEFAULT_MAX_RETRIES = 3;
    private static final int DEFAULT_EMAIL_TIMEOUT_SECONDS = 30;
    private static final boolean DEFAULT_ADMIN_NOTIFICATIONS_ENABLED = true;
    private static final boolean DEFAULT_DETAILED_LOGGING_ENABLED = true;
    private static final boolean DEFAULT_EMAIL_NOTIFICATIONS_ENABLED = true;

    // Logging constants
    private static final String LOG_PROCESSING_START = "Processing listing archived event - Listing ID: {}, Action: {}";
    private static final String LOG_PROCESSING_SUCCESS = "Successfully processed listing archived event - Listing ID: {}";
    private static final String LOG_PROCESSING_ERROR = "Critical error processing listing archived event - Listing ID: {}, Error: {}";
    private static final String LOG_ADMIN_ARCHIVAL = "ADMIN ARCHIVAL - Listing ID: {}, Title: '{}', Seller: {}, Timestamp: {}";
    private static final String LOG_SELLER_ARCHIVAL = "SELLER ARCHIVAL - Listing ID: {}, Title: '{}', Seller: {}, Timestamp: {}";

    private final AsyncTransactionService txService;
    private final EmailService emailService;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Configuration flag to enable/disable admin notification emails.
     * Can be overridden via application properties.
     */
    @Value("${" + CONFIG_ADMIN_NOTIFICATIONS_ENABLED + ":" + DEFAULT_ADMIN_NOTIFICATIONS_ENABLED + "}")
    private boolean adminNotificationEnabled;

    /**
     * Maximum retry attempts for email notifications.
     */
    @Value("${" + CONFIG_MAX_RETRIES + ":" + DEFAULT_MAX_RETRIES + "}")
    private int maxRetryAttempts;

    /**
     * Enable/disable detailed logging for archival events.
     */
    @Value("${" + CONFIG_DETAILED_LOGGING + ":" + DEFAULT_DETAILED_LOGGING_ENABLED + "}")
    private boolean detailedLoggingEnabled;

    /**
     * Timeout for email sending operations in seconds.
     */
    @Value("${" + CONFIG_EMAIL_TIMEOUT + ":" + DEFAULT_EMAIL_TIMEOUT_SECONDS + "}")
    private int emailTimeoutSeconds;

    /**
     * Enable/disable all email notifications.
     */
    @Value("${" + CONFIG_EMAIL_NOTIFICATIONS_ENABLED + ":" + DEFAULT_EMAIL_NOTIFICATIONS_ENABLED + "}")
    private boolean emailNotificationsEnabled;
    
    /**
     * Handle the listing archived event.
     * This method processes listing archival events asynchronously and handles notifications.
     *
     * Key behaviors:
     * - Logs comprehensive audit information for both admin and seller actions
     * - Sends email notifications for admin actions (if enabled)
     * - Handles errors gracefully without affecting the main archival process
     * - Uses transactional processing for data consistency
     *
     * @param event The listing archived event containing all necessary information
     * @throws IllegalArgumentException if event is null
     */
    @EventListener
    @Async
    public void handleListingArchived(@NonNull ListingArchivedEvent event) {
        Objects.requireNonNull(event, "ListingArchivedEvent cannot be null");

        final LocalDateTime processingStart = LocalDateTime.now();
        final CarListing listing = event.getListing();
        final boolean isAdminAction = event.isAdminAction();

        if (detailedLoggingEnabled) {
            log.info(LOG_PROCESSING_START + ", Timestamp: {}, Source: {}",
                    listing.getId(), isAdminAction ? "ADMIN" : "SELLER", processingStart, event.getArchivalSource());
        } else {
            log.info(LOG_PROCESSING_START,
                    listing.getId(), isAdminAction ? "ADMIN" : "SELLER");
        }

        try {
            txService.executeInTransaction(() -> {
                processListingArchival(event, listing, isAdminAction);
            });

            long processingDuration = System.currentTimeMillis() - processingStart.toInstant(java.time.ZoneOffset.UTC).toEpochMilli();
            if (detailedLoggingEnabled) {
                log.info(LOG_PROCESSING_SUCCESS + ", Duration: {}ms, Source: {}",
                        listing.getId(), processingDuration, event.getArchivalSource());
            } else {
                log.info(LOG_PROCESSING_SUCCESS, listing.getId());
            }

        } catch (Exception e) {
            if (detailedLoggingEnabled) {
                log.error(LOG_PROCESSING_ERROR + ", Source: {}",
                        listing.getId(), e.getMessage(), event.getArchivalSource(), e);
            } else {
                log.error(LOG_PROCESSING_ERROR, listing.getId(), e.getMessage(), e);
            }
            // Don't rethrow - we don't want to break the main archival process
        }
    }

    /**
     * Process the actual listing archival logic within a transaction.
     *
     * @param event The original event
     * @param listing The car listing being archived
     * @param isAdminAction Whether this was an admin action
     */
    private void processListingArchival(ListingArchivedEvent event, CarListing listing, boolean isAdminAction) {
        // Extract seller information safely
        String sellerInfo = buildSellerInfo(event);

        // Log the archival action with comprehensive details
        logArchivalDetails(listing, isAdminAction, sellerInfo);

        // Handle admin-specific actions
        if (isAdminAction) {
            handleAdminArchival(event, listing);
        } else {
            handleSellerArchival(event, listing);
        }
    }

    /**
     * Build seller information string for logging purposes.
     */
    private String buildSellerInfo(ListingArchivedEvent event) {
        String username = StringUtils.hasText(event.getSellerUsername()) ? event.getSellerUsername() : "unknown";
        String userId = event.getSellerId() != null ? event.getSellerId().toString() : "unknown";

        return String.format("'%s' (ID: %s)", username, userId);
    }

    /**
     * Log comprehensive details about the archival action.
     */
    private void logArchivalDetails(CarListing listing, boolean isAdminAction, String sellerInfo) {
        if (isAdminAction) {
            log.info(LOG_ADMIN_ARCHIVAL,
                    listing.getId(), listing.getTitle(), sellerInfo, LocalDateTime.now());
            if (detailedLoggingEnabled) {
                log.debug("Admin archival details - Listing: {}, Seller: {}", listing, sellerInfo);
            }
        } else {
            log.info(LOG_SELLER_ARCHIVAL,
                    listing.getId(), listing.getTitle(), sellerInfo, LocalDateTime.now());
            if (detailedLoggingEnabled) {
                log.debug("Seller archival details - Listing: {}, Seller: {}", listing, sellerInfo);
            }
        }
    }

    /**
     * Handle admin-specific archival logic including email notifications.
     */
    private void handleAdminArchival(ListingArchivedEvent event, CarListing listing) {
        log.debug("Processing admin archival for listing ID: {}", listing.getId());

        // Send email notification if enabled
        if (emailNotificationsEnabled && adminNotificationEnabled && event.getSellerId() != null) {
            sendAdminNotificationEmail(event, listing);
        } else {
            if (!emailNotificationsEnabled) {
                log.debug("Email notifications are globally disabled, skipping email for listing ID: {}", listing.getId());
            } else if (!adminNotificationEnabled) {
                log.debug("Admin notification emails are disabled, skipping email for listing ID: {}", listing.getId());
            } else if (event.getSellerId() == null) {
                log.debug("No seller ID available for listing ID: {}, skipping email notification", listing.getId());
            }
        }

        // Additional admin-specific business logic can be added here
        // For example: audit logging, compliance checks, etc.
    }

    /**
     * Handle seller-specific archival logic.
     */
    private void handleSellerArchival(ListingArchivedEvent event, CarListing listing) {
        log.debug("Processing seller archival for listing ID: {}", listing.getId());

        // Seller actions typically don't require email notifications
        // Additional seller-specific logic can be added here
        // For example: updating seller statistics, sending confirmation, etc.
    }

    /**
     * Send email notification to seller about admin archival with retry logic.
     */
    private void sendAdminNotificationEmail(ListingArchivedEvent event, CarListing listing) {
        int attempts = 0;
        boolean emailSent = false;

        while (attempts < maxRetryAttempts && !emailSent) {
            attempts++;
            try {
                User seller = entityManager.find(User.class, event.getSellerId());

                if (seller == null) {
                    log.warn("Seller not found for ID: {}, skipping email notification", event.getSellerId());
                    return;
                }

                if (!StringUtils.hasText(seller.getEmail())) {
                    log.warn("Seller ID: {} has no email address, skipping notification", event.getSellerId());
                    return;
                }

                // Send the notification email
                emailService.sendListingArchivedByAdminEmail(seller, listing, null);

                log.info("Admin archival notification email sent successfully to: {} (attempt {})",
                        seller.getEmail(), attempts);
                emailSent = true;

            } catch (Exception e) {
                log.warn("Failed to send admin archival email to seller ID: {} (attempt {}/{}): {}",
                        event.getSellerId(), attempts, maxRetryAttempts, e.getMessage());

                if (attempts >= maxRetryAttempts) {
                    log.error("Exhausted all retry attempts ({}) for sending admin archival email to seller ID: {}",
                            maxRetryAttempts, event.getSellerId(), e);
                }
            }
        }
    }
}
