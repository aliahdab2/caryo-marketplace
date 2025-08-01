package com.autotrader.autotraderbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import jakarta.mail.internet.MimeMessage;
import java.io.InputStream;

/**
 * Test configuration for email services.
 * Provides mock JavaMailSender and basic TemplateEngine for testing.
 * Automatically activated when 'test' profile is active.
 */
@Configuration
@Profile("test")
public class TestEmailConfig {

    private static final Logger logger = LoggerFactory.getLogger(TestEmailConfig.class);

    /**
     * Mock JavaMailSender that doesn't actually send emails during tests.
     */
    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        return new JavaMailSender() {
            @Override
            public MimeMessage createMimeMessage() {
                // Return a basic MimeMessage implementation for testing
                try {
                    return new MockMimeMessage();
                } catch (Exception e) {
                    throw new RuntimeException("Failed to create mock MimeMessage", e);
                }
            }

            @Override
            public MimeMessage createMimeMessage(InputStream contentStream) {
                return createMimeMessage();
            }

            @Override
            public void send(MimeMessage mimeMessage) {
                // Do nothing - this is a mock implementation
                logger.info("Mock email send: MimeMessage (test mode)");
            }

            @Override
            public void send(MimeMessage... mimeMessages) {
                for (MimeMessage message : mimeMessages) {
                    send(message);
                }
            }

            @Override
            public void send(MimeMessagePreparator mimeMessagePreparator) {
                try {
                    MimeMessage message = createMimeMessage();
                    mimeMessagePreparator.prepare(message);
                    send(message);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to send mock email", e);
                }
            }

            @Override
            public void send(MimeMessagePreparator... mimeMessagePreparators) {
                for (MimeMessagePreparator preparator : mimeMessagePreparators) {
                    send(preparator);
                }
            }

            @Override
            public void send(SimpleMailMessage simpleMessage) {
                // Do nothing - this is a mock implementation
                logger.info("Mock email send: {} to {}", 
                    simpleMessage.getSubject(), 
                    (simpleMessage.getTo() != null && simpleMessage.getTo().length > 0 ? simpleMessage.getTo()[0] : "unknown"));
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) {
                for (SimpleMailMessage message : simpleMessages) {
                    send(message);
                }
            }
        };
    }

    /**
     * Template engine that can find actual email template files for testing.
     */
    @Bean
    @Primary
    public TemplateEngine templateEngine() {
        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        
        ClassLoaderTemplateResolver templateResolver = new ClassLoaderTemplateResolver();
        templateResolver.setPrefix("templates/emails/");
        templateResolver.setSuffix(".html");
        templateResolver.setTemplateMode(TemplateMode.HTML);
        templateResolver.setCharacterEncoding("UTF-8");
        templateResolver.setCacheable(false);
        
        templateEngine.setTemplateResolver(templateResolver);
        
        return templateEngine;
    }

    /**
     * Mock MimeMessage implementation for testing.
     */
    private static class MockMimeMessage extends MimeMessage {
        public MockMimeMessage() {
            super((jakarta.mail.Session) null);
        }

        @Override
        public void saveChanges() {
            // Do nothing in mock
        }

        @Override
        public void setContent(Object content, String type) {
            // Do nothing in mock
        }

        @Override
        public void setText(String text) {
            // Do nothing in mock
        }

        @Override
        public void setSubject(String subject) {
            // Do nothing in mock
        }

        @Override
        public void setFrom(String address) {
            // Do nothing in mock
        }

        @Override
        public void setRecipients(jakarta.mail.Message.RecipientType type, String addresses) {
            // Do nothing in mock
        }
    }
}