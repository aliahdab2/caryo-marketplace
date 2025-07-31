package com.autotrader.autotraderbackend.config;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Test configuration that provides a mock JavaMailSender for integration tests.
 * This prevents test failures when the email service is initialized but no real
 * mail server is available in the test environment.
 */
@TestConfiguration
public class TestEmailConfiguration {

    /**
     * Provides a mock JavaMailSender for tests.
     * The @Primary annotation ensures this bean takes precedence over any other
     * JavaMailSender configuration that might be present.
     *
     * @return A mock JavaMailSender instance
     */
    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        return Mockito.mock(JavaMailSender.class);
    }
}