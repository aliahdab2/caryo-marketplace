package com.caryo.marketplace.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

/**
 * Service for tracking email metrics and performance.
 * Provides insights into email sending patterns and success rates.
 */
@Service
public class EmailMetricsService {

    private final MeterRegistry meterRegistry;

    public EmailMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    /**
     * Record templated email sent.
     */
    public void recordTemplatedEmail(String templateName, String language) {
        Counter.builder("email.sent.templated")
                .description("Number of templated emails sent")
                .tag("template", templateName)
                .tag("language", language)
                .register(meterRegistry)
                .increment();
    }

    /**
     * Record simple email sent.
     */
    public void recordSimpleEmail() {
        Counter.builder("email.sent.simple")
                .description("Number of simple emails sent")
                .register(meterRegistry)
                .increment();
    }

    /**
     * Record contact form email sent.
     */
    public void recordContactFormEmail(String language) {
        Counter.builder("email.sent.contact.form")
                .description("Number of contact form emails sent")
                .tag("language", language)
                .register(meterRegistry)
                .increment();
    }

    /**
     * Record welcome email sent.
     */
    public void recordWelcomeEmail(String language) {
        Counter.builder("email.sent.welcome")
                .description("Number of welcome emails sent")
                .tag("language", language)
                .register(meterRegistry)
                .increment();
    }

    /**
     * Record listing email sent.
     */
    public void recordListingEmail(String type, String language) {
        Counter.builder("email.sent.listing")
                .description("Number of listing-related emails sent")
                .tag("type", type)
                .tag("language", language)
                .register(meterRegistry)
                .increment();
    }

    /**
     * Record successful email send.
     */
    public void recordEmailSuccess(String emailType) {
        Counter.builder("email.result.success")
                .description("Number of successfully sent emails")
                .tag("type", emailType)
                .register(meterRegistry)
                .increment();
    }

    /**
     * Record failed email send.
     */
    public void recordEmailFailure(String emailType, String errorType) {
        Counter.builder("email.result.failure")
                .description("Number of failed email sends")
                .tag("type", emailType)
                .tag("error", errorType)
                .register(meterRegistry)
                .increment();
    }

    /**
     * Get timer for measuring email send duration.
     */
    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
    }

    /**
     * Stop timer and record duration.
     */
    public void stopTimer(Timer.Sample sample, String emailType) {
        sample.stop(Timer.builder("email.send.duration")
                .tag("type", emailType)
                .register(meterRegistry));
    }
}