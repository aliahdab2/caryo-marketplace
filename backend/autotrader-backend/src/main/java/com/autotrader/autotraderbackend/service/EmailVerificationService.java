package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

/**
 * Service for handling email verification functionality.
 * Provides secure token generation, verification email sending, and token validation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.email-verification.token-expiry-hours:24}")
    private int tokenExpiryHours;

    @Value("${app.email-verification.max-attempts:3}")
    private int maxVerificationAttempts;

    /**
     * Generate and send email verification token to user.
     * 
     * @param user The user to send verification email to
     * @return true if email was sent successfully, false otherwise
     */
    @Transactional
    public boolean sendVerificationEmail(User user) {
        if (user == null) {
            log.error("Cannot send verification email: user is null");
            return false;
        }
        
        try {
            // Generate secure verification token
            String token = generateVerificationToken();
            
            // Update user with verification token and timestamp
            user.setEmailVerificationToken(token);
            user.setEmailVerificationSentAt(LocalDateTime.now());
            userRepository.save(user);
            
            // Send verification email
            emailService.sendEmailVerificationEmail(user, token);
            
            log.info("Email verification sent to user: {} ({})", user.getUsername(), user.getEmail());
            return true;
            
        } catch (Exception e) {
            log.error("Failed to send verification email to user: {} ({}). Error: {}", 
                     user.getUsername(), user.getEmail(), e.getMessage());
            return false;
        }
    }

    /**
     * Verify email using the provided token.
     * 
     * @param token The verification token
     * @return true if verification successful, false otherwise
     */
    @Transactional
    public boolean verifyEmail(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                log.warn("Email verification attempted with invalid token: {}", token);
                return false;
            }
            
            Optional<User> userOpt = userRepository.findByEmailVerificationToken(token);
            
            if (userOpt.isEmpty()) {
                log.warn("Email verification attempted with invalid token: {}", token);
                return false;
            }
            
            User user = userOpt.get();
            
            // Check if token has expired
            if (isTokenExpired(user.getEmailVerificationSentAt())) {
                log.warn("Email verification attempted with expired token for user: {}", user.getUsername());
                return false;
            }
            
            // Check if email is already verified
            if (user.isEmailVerified()) {
                log.info("Email verification attempted for already verified user: {}", user.getUsername());
                return true; // Return true since email is already verified
            }
            
            // Mark email as verified
            user.markEmailAsVerified();
            userRepository.save(user);
            
            log.info("Email successfully verified for user: {} ({})", user.getUsername(), user.getEmail());
            return true;
            
        } catch (Exception e) {
            log.error("Error during email verification with token: {}. Error: {}", token, e.getMessage());
            return false;
        }
    }

    /**
     * Resend verification email to user.
     * 
     * @param email The user's email address
     * @return true if email was resent successfully, false otherwise
     */
    @Transactional
    public boolean resendVerificationEmail(String email) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                log.warn("Resend verification attempted for non-existent email: {}", email);
                return false;
            }
            
            User user = userOpt.get();
            
            // Check if email is already verified
            if (user.isEmailVerified()) {
                log.info("Resend verification attempted for already verified user: {}", user.getUsername());
                return false;
            }
            
            // Check rate limiting (prevent spam)
            if (user.getEmailVerificationSentAt() != null && 
                user.getEmailVerificationSentAt().isAfter(LocalDateTime.now().minusMinutes(5))) {
                log.warn("Resend verification rate limited for user: {}", user.getUsername());
                return false;
            }
            
            return sendVerificationEmail(user);
            
        } catch (Exception e) {
            log.error("Error resending verification email to: {}. Error: {}", email, e.getMessage());
            return false;
        }
    }

    /**
     * Check if user's email is verified.
     * 
     * @param userId The user ID
     * @return true if email is verified, false otherwise
     */
    public boolean isEmailVerified(Long userId) {
        return userRepository.findById(userId)
                .map(User::isEmailVerified)
                .orElse(false);
    }

    /**
     * Generate a secure verification token.
     * 
     * @return Base64 encoded secure random token
     */
    private String generateVerificationToken() {
        byte[] tokenBytes = new byte[32]; // 256-bit token
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    /**
     * Check if verification token has expired.
     * 
     * @param sentAt The timestamp when token was sent
     * @return true if token has expired, false otherwise
     */
    private boolean isTokenExpired(LocalDateTime sentAt) {
        if (sentAt == null) {
            return true;
        }
        return sentAt.isBefore(LocalDateTime.now().minusHours(tokenExpiryHours));
    }
}
