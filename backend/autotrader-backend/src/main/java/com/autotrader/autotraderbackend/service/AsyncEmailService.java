package com.autotrader.autotraderbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Asynchronous wrapper for EmailService to prevent blocking request threads.
 * Uses Spring's @Async for non-blocking email operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncEmailService {

    private final EmailService emailService;

    /**
     * Send templated email asynchronously.
     */
    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendTemplatedEmailAsync(String to, String subject,
                                                          String templateName, Map<String, Object> variables,
                                                          String language) {
        try {
            emailService.sendTemplatedEmail(to, subject, templateName, variables, language);
            log.debug("Async templated email sent successfully to: {}", to);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Failed to send async templated email to: {}", to, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Send simple email asynchronously.
     */
    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendSimpleEmailAsync(String to, String subject, String text) {
        try {
            emailService.sendSimpleEmail(to, subject, text);
            log.debug("Async simple email sent successfully to: {}", to);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Failed to send async simple email to: {}", to, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Send contact form emails asynchronously (both notification and confirmation).
     */
    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendContactFormEmailsAsync(String name, String email,
                                                             String message, String language) {
        try {
            // Send both emails in parallel
            CompletableFuture<Void> notificationFuture = CompletableFuture.runAsync(() ->
                emailService.sendContactFormEmail(name, email, message, language));

            CompletableFuture<Void> confirmationFuture = CompletableFuture.runAsync(() ->
                emailService.sendContactFormConfirmation(name, email, language));

            // Wait for both to complete
            CompletableFuture.allOf(notificationFuture, confirmationFuture).join();

            log.debug("Async contact form emails sent successfully for: {}", email);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Failed to send async contact form emails for: {}", email, e);
            return CompletableFuture.failedFuture(e);
        }
    }
}