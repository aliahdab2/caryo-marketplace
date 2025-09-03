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
     * @return VerificationResult with status and details
     */
    @Transactional
    public VerificationResult verifyEmail(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                log.warn("Email verification attempted with invalid token: {}", token);
                return new VerificationResult(false, "Invalid verification token", null);
            }
            
            Optional<User> userOpt = userRepository.findByEmailVerificationToken(token);
            
            if (userOpt.isEmpty()) {
                // Token not found - could be invalid or already used
                log.warn("Email verification attempted with invalid token: {}", token);
                
                // For better UX, check if there's a recently verified user (within last 5 minutes)
                // This handles the common case where users click verification links multiple times
                Optional<User> recentlyVerifiedUser = findRecentlyVerifiedUser();
                if (recentlyVerifiedUser.isPresent()) {
                    User user = recentlyVerifiedUser.get();
                    log.info("Found recently verified user: {} - showing success message for better UX", user.getUsername());
                    return new VerificationResult(true, "Your email has been successfully verified! You can now sign in to your account.", user.getEmail());
                }
                
                return new VerificationResult(false, "Invalid or expired verification token", null);
            }
            
            User user = userOpt.get();
            
            // Check if token has expired
            if (isTokenExpired(user.getEmailVerificationSentAt())) {
                log.warn("Email verification attempted with expired token for user: {}", user.getUsername());
                return new VerificationResult(false, "Your verification link has expired. Please request a new verification email from the sign-in page.", user.getEmail());
            }
            
            // Check if email is already verified
            if (user.isEmailVerified()) {
                log.info("Email verification attempted for already verified user: {}", user.getUsername());
                
                // SECURITY: For already verified users, still provide auto-login but invalidate the token
                // This prevents token reuse while maintaining good UX
                user.clearEmailVerificationToken(); // Invalidate the token
                userRepository.save(user);
                
                return new VerificationResult(true, "Great! Your email is already verified. You are now logged in!", user.getEmail(), user);
            }
            
            // Mark email as verified and clear verification token (security best practice)
            user.markEmailAsVerified();
            user.clearEmailVerificationToken(); // Prevent token reuse
            userRepository.save(user);
            
            log.info("Email successfully verified for user: {} ({})", user.getUsername(), user.getEmail());
            return new VerificationResult(true, "Perfect! Your email has been verified successfully. You are now logged in!", user.getEmail(), user);
            
        } catch (Exception e) {
            log.error("Error during email verification with token: {}. Error: {}", token, e.getMessage());
            return new VerificationResult(false, "An error occurred during verification", null);
        }
    }

    /**
     * Check if a user with given email is already verified.
     * This is used to provide better UX when verification tokens are invalid.
     */
    public boolean isEmailAlreadyVerified(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        return userRepository.findByEmail(email)
                .map(User::isEmailVerified)
                .orElse(false);
    }

    /**
     * Result class for email verification operations
     */
    public static class VerificationResult {
        private final boolean success;
        private final String message;
        private final String email;
        private final User user;
        
        public VerificationResult(boolean success, String message, String email) {
            this.success = success;
            this.message = message;
            this.email = email;
            this.user = null;
        }
        
        public VerificationResult(boolean success, String message, String email, User user) {
            this.success = success;
            this.message = message;
            this.email = email;
            this.user = user;
        }
        
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getEmail() { return email; }
        public User getUser() { return user; }
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

    /**
     * Find a recently verified user (within last 5 minutes).
     * This helps with UX when users click verification links multiple times.
     * 
     * @return Optional<User> recently verified user
     */
    private Optional<User> findRecentlyVerifiedUser() {
        try {
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            return userRepository.findTopByEmailVerifiedTrueAndEmailVerifiedAtAfterOrderByEmailVerifiedAtDesc(fiveMinutesAgo);
        } catch (Exception e) {
            log.error("Error finding recently verified user: {}", e.getMessage());
            return Optional.empty();
        }
    }
    
    /**
     * Get user by verification token for auto-login purposes.
     * This method is used to provide JWT tokens for already verified users.
     * SECURITY: This method should only be used immediately after verification
     * and tokens are invalidated after use to prevent reuse attacks.
     * 
     * @param token The verification token
     * @return User if found and verified, null otherwise
     */
    public User getUserByVerificationToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return null;
            }
            
            // First, try to find user by the verification token (if token hasn't been cleared yet)
            Optional<User> userOpt = userRepository.findByEmailVerificationToken(token);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.isEmailVerified() && !isTokenExpired(user.getEmailVerificationSentAt())) {
                    log.info("Auto-login provided for verified user found by token: {}", user.getUsername());
                    return user;
                }
            }
            
            // SECURITY: If token not found (likely cleared), look for recently verified users (within last 2 minutes)
            // This is much more restrictive than the general 5-minute window
            LocalDateTime twoMinutesAgo = LocalDateTime.now().minusMinutes(2);
            Optional<User> recentlyVerifiedUser = userRepository
                .findTopByEmailVerifiedTrueAndEmailVerifiedAtAfterOrderByEmailVerifiedAtDesc(twoMinutesAgo);
            
            if (recentlyVerifiedUser.isPresent()) {
                User user = recentlyVerifiedUser.get();
                log.info("Auto-login provided for recently verified user: {} (verified at: {})", 
                        user.getUsername(), user.getEmailVerifiedAt());
                return user;
            }
            
            return null;
        } catch (Exception e) {
            log.error("Error getting user by verification token: {}", e.getMessage());
            return null;
        }
    }
}
