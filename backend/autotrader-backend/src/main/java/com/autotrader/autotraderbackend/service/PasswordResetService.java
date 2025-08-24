package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.PasswordResetToken;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.PasswordResetTokenRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.util.PasswordValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Transactional
public class PasswordResetService {
    
    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_EXPIRY_HOURS = 1; // Reduced to 1 hour for security
    private static final int TOKEN_LENGTH = 32; // 32 bytes = 256 bits
    private static final int MAX_ATTEMPTS_PER_EMAIL = 3; // Max attempts per email per hour
    private static final int MAX_ATTEMPTS_PER_IP = 10; // Max attempts per IP per hour
    
    // Rate limiting maps (in production, use Redis or database)
    private final ConcurrentHashMap<String, AttemptTracker> emailAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AttemptTracker> ipAttempts = new ConcurrentHashMap<>();
    
    @Autowired
    private PasswordResetTokenRepository tokenRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PasswordValidator passwordValidator;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    /**
     * Helper class to track rate limiting attempts
     */
    private static class AttemptTracker {
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile LocalDateTime resetTime = LocalDateTime.now().plusHours(1);
        
        public boolean canAttempt(int maxAttempts) {
            LocalDateTime now = LocalDateTime.now();
            if (now.isAfter(resetTime)) {
                count.set(0);
                resetTime = now.plusHours(1);
            }
            return count.incrementAndGet() <= maxAttempts;
        }
        
        public int getAttemptCount() {
            return count.get();
        }
    }

    /**
     * Initiates password reset process by creating a token and sending email
     * Includes rate limiting and security measures
     */
    public PasswordResetResult initiatePasswordReset(String email, String clientIp) {
        try {
            // Input validation
            if (email == null || email.trim().isEmpty()) {
                logger.warn("Password reset attempted with empty email from IP: {}", clientIp);
                return PasswordResetResult.error("Invalid email address");
            }
            
            String normalizedEmail = email.trim().toLowerCase();
            
            // Rate limiting checks
            if (!canAttemptForEmail(normalizedEmail)) {
                logger.warn("Rate limit exceeded for email: {} from IP: {}", normalizedEmail, clientIp);
                return PasswordResetResult.rateLimited("Too many password reset attempts. Please try again later.");
            }
            
            if (!canAttemptForIp(clientIp)) {
                logger.warn("Rate limit exceeded for IP: {}", clientIp);
                return PasswordResetResult.rateLimited("Too many password reset attempts from this location. Please try again later.");
            }
            
            Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
            
            if (userOpt.isEmpty()) {
                // For security, we don't reveal if email exists or not
                logger.info("Password reset requested for non-existent email: {} from IP: {}", normalizedEmail, clientIp);
                // Still return success to not reveal email existence
                return PasswordResetResult.success("If the email exists, a password reset link has been sent.");
            }
            
            User user = userOpt.get();
            
            // Check if user has too many recent tokens
            Optional<PasswordResetToken> recentToken = tokenRepository.findValidTokenByUser(user, LocalDateTime.now());
            if (recentToken.isPresent()) {
                logger.info("User {} already has a valid token, not creating new one", user.getUsername());
                return PasswordResetResult.success("If the email exists, a password reset link has been sent.");
            }
            
            // Invalidate any existing tokens for this user
            tokenRepository.invalidateAllUserTokens(user);
            
            // Generate secure token
            String token = generateSecureToken();
            LocalDateTime expiryDate = LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS);
            
            // Create and save token
            PasswordResetToken resetToken = new PasswordResetToken(token, user, expiryDate);
            tokenRepository.save(resetToken);
            
            // Send email with reset link (do not fail the flow if email sending fails)
            String resetUrl = frontendUrl + "/auth/reset-password?token=" + token;
            try {
                String userLanguage = detectUserLanguage(user, clientIp);
                emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetUrl, userLanguage);
                logger.info("Password reset email sent to user: {} from IP: {} in language: {}", 
                    user.getUsername(), clientIp, userLanguage);
            } catch (Exception emailError) {
                logger.error("Password reset token created but email sending failed for user {}: {}", 
                    user.getUsername(), emailError.getMessage());
                // Continue without failing - token is still valid
            }
            
            logger.info("Password reset token created for user: {} from IP: {}", user.getUsername(), clientIp);
            return PasswordResetResult.success("If the email exists, a password reset link has been sent.");
            
        } catch (Exception e) {
            logger.error("Error initiating password reset for email: {} from IP: {}", email, clientIp, e);
            return PasswordResetResult.error("An error occurred while processing your request. Please try again later.");
        }
    }

    /**
     * Validates a password reset token
     */
    public boolean validateResetToken(String token) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByTokenAndUsedFalse(token);
        
        if (tokenOpt.isEmpty()) {
            return false;
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        return resetToken.isValid();
    }

    /**
     * Resets password using valid token with enhanced validation
     */
    public PasswordResetResult resetPassword(String token, String newPassword, String clientIp) {
        try {
            // Input validation
            if (token == null || token.trim().isEmpty()) {
                logger.warn("Password reset attempted with empty token from IP: {}", clientIp);
                return PasswordResetResult.error("Invalid token");
            }
            
            if (newPassword == null || newPassword.trim().isEmpty()) {
                logger.warn("Password reset attempted with empty password from IP: {}", clientIp);
                return PasswordResetResult.error("Password cannot be empty");
            }
            
            // Validate password strength
            PasswordValidator.PasswordValidationResult validationResult = passwordValidator.validatePassword(newPassword);
            if (!validationResult.isValid()) {
                logger.warn("Password reset attempted with weak password from IP: {}", clientIp);
                return PasswordResetResult.error("Password does not meet security requirements: " + validationResult.getErrorMessage());
            }
            
            Optional<PasswordResetToken> tokenOpt = tokenRepository.findByTokenAndUsedFalse(token.trim());
            
            if (tokenOpt.isEmpty()) {
                logger.warn("Invalid or used password reset token from IP: {}", clientIp);
                return PasswordResetResult.error("Invalid or expired reset token");
            }
            
            PasswordResetToken resetToken = tokenOpt.get();
            
            if (!resetToken.isValid()) {
                logger.warn("Expired password reset token from IP: {}", clientIp);
                return PasswordResetResult.error("Invalid or expired reset token");
            }
            
            User user = resetToken.getUser();
            
            // Check if new password is same as current password
            if (passwordEncoder.matches(newPassword, user.getPassword())) {
                logger.warn("User {} attempted to reset password to same password from IP: {}", user.getUsername(), clientIp);
                return PasswordResetResult.error("New password must be different from your current password");
            }
            
            // Update password
            String encodedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(encodedPassword);
            userRepository.save(user);
            
            // Mark token as used
            resetToken.setUsed(true);
            tokenRepository.save(resetToken);
            
            // Invalidate all other tokens for this user
            tokenRepository.invalidateAllUserTokens(user);
            
            // Send confirmation email (don't fail if email fails)
            try {
                String userLanguage = detectUserLanguage(user, clientIp);
                emailService.sendPasswordResetConfirmationEmail(user.getEmail(), user.getUsername(), userLanguage);
                logger.info("Password reset confirmation email sent to user: {} from IP: {} in language: {}", 
                    user.getUsername(), clientIp, userLanguage);
            } catch (Exception emailError) {
                logger.error("Failed to send password reset confirmation email to user {}: {}", 
                    user.getUsername(), emailError.getMessage());
                // Continue without failing - password was successfully reset
            }
            
            logger.info("Password successfully reset for user: {} from IP: {}", user.getUsername(), clientIp);
            return PasswordResetResult.success("Password has been reset successfully!");
            
        } catch (Exception e) {
            logger.error("Error resetting password from IP: {}", clientIp, e);
            return PasswordResetResult.error("An error occurred while resetting your password. Please try again later.");
        }
    }

    /**
     * Cleanup expired and used tokens (should be called periodically)
     */
    public void cleanupExpiredTokens() {
        try {
            tokenRepository.deleteExpiredAndUsedTokens(LocalDateTime.now());
            logger.info("Cleaned up expired and used password reset tokens");
        } catch (Exception e) {
            logger.error("Error cleaning up expired tokens", e);
        }
    }

    /**
     * Generates a cryptographically secure random token
     */
    private String generateSecureToken() {
        SecureRandom secureRandom = new SecureRandom();
        byte[] tokenBytes = new byte[TOKEN_LENGTH];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }
    
    /**
     * Check if email can attempt password reset (rate limiting)
     */
    private boolean canAttemptForEmail(String email) {
        return emailAttempts.computeIfAbsent(email, k -> new AttemptTracker())
                          .canAttempt(MAX_ATTEMPTS_PER_EMAIL);
    }
    
    /**
     * Detect user's preferred language based on various factors
     */
    private String detectUserLanguage(User user, String clientIp) {
        // TODO: In the future, we could:
        // 1. Add a language field to the User entity
        // 2. Check user's browser Accept-Language header
        // 3. Use IP geolocation to detect country/region
        // 4. Check user's listing history for language patterns
        
        // For now, use a simple heuristic:
        // - Check if user's email domain suggests Arabic region
        // - Default to English for international domains
        
        if (user.getEmail() != null) {
            String emailDomain = user.getEmail().toLowerCase();
            
            // Arabic regions/domains that might indicate Arabic preference
            if (emailDomain.contains(".sy") || emailDomain.contains(".sa") || 
                emailDomain.contains(".ae") || emailDomain.contains(".jo") ||
                emailDomain.contains(".lb") || emailDomain.contains(".eg") ||
                emailDomain.contains(".iq") || emailDomain.contains(".kw") ||
                emailDomain.contains(".qa") || emailDomain.contains(".bh") ||
                emailDomain.contains(".om") || emailDomain.contains(".ye") ||
                emailDomain.contains(".ps") || emailDomain.contains(".ma") ||
                emailDomain.contains(".tn") || emailDomain.contains(".dz") ||
                emailDomain.contains(".ly") || emailDomain.contains(".sd") ||
                emailDomain.contains(".so") || emailDomain.contains(".dj") ||
                emailDomain.contains(".km") || emailDomain.contains(".mr")) {
                return "ar";
            }
        }
        
        // Check IP address for regional hints (very basic)
        if (clientIp != null && !clientIp.equals("127.0.0.1") && !clientIp.equals("0:0:0:0:0:0:0:1")) {
            // TODO: Implement proper IP geolocation
            // For now, assume local/regional IPs might prefer Arabic
            if (clientIp.startsWith("192.168.") || clientIp.startsWith("10.") || 
                clientIp.startsWith("172.")) {
                // Private IP ranges - could be local users, default to Arabic for Middle East deployment
                return "ar";
            }
        }
        
        // Default to English for international users
        return "en";
    }
    
    /**
     * Check if IP can attempt password reset (rate limiting)
     */
    private boolean canAttemptForIp(String ip) {
        return ipAttempts.computeIfAbsent(ip, k -> new AttemptTracker())
                        .canAttempt(MAX_ATTEMPTS_PER_IP);
    }
    
    /**
     * Get current attempt count for email (for monitoring)
     */
    public int getEmailAttemptCount(String email) {
        AttemptTracker tracker = emailAttempts.get(email);
        return tracker != null ? tracker.getAttemptCount() : 0;
    }
    
    /**
     * Get current attempt count for IP (for monitoring)
     */
    public int getIpAttemptCount(String ip) {
        AttemptTracker tracker = ipAttempts.get(ip);
        return tracker != null ? tracker.getAttemptCount() : 0;
    }
    
    /**
     * Result class for password reset operations
     */
    public static class PasswordResetResult {
        private final boolean success;
        private final String message;
        private final ResultType type;
        
        private PasswordResetResult(boolean success, String message, ResultType type) {
            this.success = success;
            this.message = message;
            this.type = type;
        }
        
        public static PasswordResetResult success(String message) {
            return new PasswordResetResult(true, message, ResultType.SUCCESS);
        }
        
        public static PasswordResetResult error(String message) {
            return new PasswordResetResult(false, message, ResultType.ERROR);
        }
        
        public static PasswordResetResult rateLimited(String message) {
            return new PasswordResetResult(false, message, ResultType.RATE_LIMITED);
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public String getMessage() {
            return message;
        }
        
        public ResultType getType() {
            return type;
        }
        
        public boolean isRateLimited() {
            return type == ResultType.RATE_LIMITED;
        }
        
        public enum ResultType {
            SUCCESS, ERROR, RATE_LIMITED
        }
    }
    
    /**
     * Clear rate limiting cache - useful for testing
     */
    public void clearRateLimitCache() {
        emailAttempts.clear();
        ipAttempts.clear();
        logger.debug("Rate limiting cache cleared");
    }
}
