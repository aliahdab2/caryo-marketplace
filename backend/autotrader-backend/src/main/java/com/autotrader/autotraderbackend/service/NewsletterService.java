package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.NewsletterSubscription;
import com.autotrader.autotraderbackend.payload.request.NewsletterSubscriptionRequest;
import com.autotrader.autotraderbackend.payload.NewsletterSubscriptionResponse;
import com.autotrader.autotraderbackend.repository.NewsletterSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing newsletter subscriptions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private final NewsletterSubscriptionRepository subscriptionRepository;
    private final EmailService emailService;

    /**
     * Subscribe to newsletter with email confirmation.
     */
    @Transactional
    public NewsletterSubscriptionResponse subscribe(NewsletterSubscriptionRequest request) {
        try {
            String email = request.getEmail().toLowerCase().trim();

            // Check if already subscribed
            Optional<NewsletterSubscription> existingSubscription = subscriptionRepository.findByEmail(email);

            if (existingSubscription.isPresent()) {
                NewsletterSubscription subscription = existingSubscription.get();

                if (subscription.isActiveSubscription()) {
                    log.info("Email {} is already subscribed to newsletter", email);
                    return NewsletterSubscriptionResponse.alreadyExists(
                        email,
                        "You're already subscribed to our newsletter!"
                    );
                }

                // If exists but not confirmed or unsubscribed, reactivate
                if (!subscription.isConfirmed() || subscription.isUnsubscribed()) {
                    subscription.setActive(true);
                    subscription.setUnsubscribedAt(null);
                    subscription.setConfirmationToken(UUID.randomUUID().toString());
                    subscription.setUnsubscribeToken(UUID.randomUUID().toString());
                    subscription.setPreferredLanguage(request.getPreferredLanguage());
                    subscription.setSubscriptionSource(request.getSource());

                    subscriptionRepository.save(subscription);
                    sendConfirmationEmail(subscription);

                    log.info("Reactivated newsletter subscription for email: {}", email);
                    return NewsletterSubscriptionResponse.success(
                        email,
                        "Please check your email to confirm your subscription!"
                    );
                }
            }

            // Create new subscription
            NewsletterSubscription subscription = new NewsletterSubscription();
            subscription.setEmail(email);
            subscription.setPreferredLanguage(request.getPreferredLanguage());
            subscription.setSubscriptionSource(request.getSource());
            subscription.setConfirmationToken(UUID.randomUUID().toString());
            subscription.setUnsubscribeToken(UUID.randomUUID().toString());
            subscription.setActive(true);

            subscription = subscriptionRepository.save(subscription);
            sendConfirmationEmail(subscription);

            log.info("Created new newsletter subscription for email: {}", email);
            return NewsletterSubscriptionResponse.success(
                email,
                "Please check your email to confirm your subscription!"
            );

        } catch (Exception e) {
            log.error("Error subscribing email to newsletter: {}", request.getEmail(), e);
            return NewsletterSubscriptionResponse.error(
                "Failed to subscribe to newsletter. Please try again later."
            );
        }
    }

    /**
     * Confirm newsletter subscription.
     */
    @Transactional
    public boolean confirmSubscription(String confirmationToken) {
        try {
            Optional<NewsletterSubscription> subscriptionOpt =
                subscriptionRepository.findByConfirmationToken(confirmationToken);

            if (subscriptionOpt.isEmpty()) {
                log.warn("Invalid confirmation token: {}", confirmationToken);
                return false;
            }

            NewsletterSubscription subscription = subscriptionOpt.get();

            if (subscription.isConfirmed()) {
                log.info("Subscription already confirmed for email: {}", subscription.getEmail());
                return true;
            }

            subscription.setConfirmedAt(LocalDateTime.now());
            subscription.setConfirmationToken(null); // Clear token after use
            subscriptionRepository.save(subscription);

            // Send welcome email
            sendWelcomeEmail(subscription);

            log.info("Confirmed newsletter subscription for email: {}", subscription.getEmail());
            return true;

        } catch (Exception e) {
            log.error("Error confirming newsletter subscription with token: {}", confirmationToken, e);
            return false;
        }
    }

    /**
     * Unsubscribe from newsletter.
     */
    @Transactional
    public boolean unsubscribe(String unsubscribeToken) {
        try {
            Optional<NewsletterSubscription> subscriptionOpt =
                subscriptionRepository.findByUnsubscribeToken(unsubscribeToken);

            if (subscriptionOpt.isEmpty()) {
                log.warn("Invalid unsubscribe token: {}", unsubscribeToken);
                return false;
            }

            NewsletterSubscription subscription = subscriptionOpt.get();
            subscription.setUnsubscribedAt(LocalDateTime.now());
            subscription.setActive(false);
            subscriptionRepository.save(subscription);

            log.info("Unsubscribed email from newsletter: {}", subscription.getEmail());
            return true;

        } catch (Exception e) {
            log.error("Error unsubscribing from newsletter with token: {}", unsubscribeToken, e);
            return false;
        }
    }

    /**
     * Get all active subscriptions.
     */
    public List<NewsletterSubscription> getActiveSubscriptions() {
        return subscriptionRepository.findAllActiveSubscriptions();
    }

    /**
     * Get active subscriptions by language.
     */
    public List<NewsletterSubscription> getActiveSubscriptionsByLanguage(String language) {
        return subscriptionRepository.findAllActiveSubscriptionsByLanguage(language);
    }

    /**
     * Get subscription count.
     */
    public long getActiveSubscriptionCount() {
        return subscriptionRepository.countActiveSubscriptions();
    }

    /**
     * Send confirmation email to subscriber.
     */
    private void sendConfirmationEmail(NewsletterSubscription subscription) {
        try {
            String confirmationUrl = buildConfirmationUrl(subscription.getConfirmationToken());
            String unsubscribeUrl = buildUnsubscribeUrl(subscription.getUnsubscribeToken());

            // Create template variables
            java.util.Map<String, Object> variables = new java.util.HashMap<>();
            variables.put("email", subscription.getEmail());
            variables.put("confirmationUrl", confirmationUrl);
            variables.put("unsubscribeUrl", unsubscribeUrl);

            String subject = subscription.getPreferredLanguage().equals("ar")
                ? "تأكيد الاشتراك في النشرة الإخبارية - كاريو"
                : "Confirm Your Newsletter Subscription - Caryo";

            emailService.sendTemplatedEmail(
                subscription.getEmail(),
                subject,
                "newsletter-confirmation",
                variables,
                subscription.getPreferredLanguage()
            );

            log.info("Sent confirmation email to: {}", subscription.getEmail());

        } catch (Exception e) {
            log.error("Failed to send confirmation email to: {}", subscription.getEmail(), e);
        }
    }

    /**
     * Send welcome email to confirmed subscriber.
     */
    private void sendWelcomeEmail(NewsletterSubscription subscription) {
        try {
            String unsubscribeUrl = buildUnsubscribeUrl(subscription.getUnsubscribeToken());

            java.util.Map<String, Object> variables = new java.util.HashMap<>();
            variables.put("email", subscription.getEmail());
            variables.put("unsubscribeUrl", unsubscribeUrl);

            String subject = subscription.getPreferredLanguage().equals("ar")
                ? "مرحباً بك في نشرة كاريو الإخبارية!"
                : "Welcome to Caryo Newsletter!";

            emailService.sendTemplatedEmail(
                subscription.getEmail(),
                subject,
                "newsletter-welcome",
                variables,
                subscription.getPreferredLanguage()
            );

            log.info("Sent welcome email to: {}", subscription.getEmail());

        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", subscription.getEmail(), e);
        }
    }

    @Value("${app.website.url}")
    private String websiteUrl;

    /**
     * Build confirmation URL.
     */
    private String buildConfirmationUrl(String token) {
        return websiteUrl + "/api/public/newsletter/confirm?token=" + token;
    }

    /**
     * Build unsubscribe URL.
     */
    private String buildUnsubscribeUrl(String token) {
        return websiteUrl + "/api/public/newsletter/unsubscribe?token=" + token;
    }

    /**
     * Cleanup old unconfirmed subscriptions (should be run as scheduled task).
     */
    @Transactional
    public void cleanupOldUnconfirmedSubscriptions() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7); // Remove after 7 days
            List<NewsletterSubscription> oldSubscriptions =
                subscriptionRepository.findUnconfirmedSubscriptionsOlderThan(cutoffDate);

            if (!oldSubscriptions.isEmpty()) {
                subscriptionRepository.deleteAll(oldSubscriptions);
                log.info("Cleaned up {} old unconfirmed newsletter subscriptions", oldSubscriptions.size());
            }

        } catch (Exception e) {
            log.error("Error cleaning up old unconfirmed subscriptions", e);
        }
    }
}
