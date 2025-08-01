package com.autotrader.autotraderbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;

import jakarta.mail.internet.MimeMessage;
import java.io.InputStream;

/**
 * Email configuration for CI environment.
 * Provides mock JavaMailSender that doesn't actually send emails.
 */
@Configuration
@Profile("ci")
public class CIEmailConfig {

    /**
     * Mock JavaMailSender for CI environment that logs instead of sending emails.
     */
    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        return new JavaMailSender() {
            @Override
            public MimeMessage createMimeMessage() {
                // Return a basic MimeMessage implementation for CI
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
                // Log instead of sending
                System.out.println("CI Mock Email: MimeMessage would be sent (CI mode)");
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
                // Log the email details
                System.out.println("CI Mock Email: " + simpleMessage.getSubject() + " to " + 
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
     * Mock MimeMessage implementation for CI.
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