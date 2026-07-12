package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.Role;
import com.caryo.marketplace.model.SellerType;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.exception.jwt.CustomJwtException;
import com.caryo.marketplace.payload.request.LoginRequest;
import com.caryo.marketplace.payload.request.SignupRequest;
import com.caryo.marketplace.payload.request.ChangePasswordRequest;
import com.caryo.marketplace.payload.request.ForgotPasswordRequest;
import com.caryo.marketplace.payload.request.ResetPasswordRequest;
import com.caryo.marketplace.payload.request.TokenRefreshRequest;
import com.caryo.marketplace.payload.response.JwtResponse;
import com.caryo.marketplace.payload.response.MessageResponse;
import com.caryo.marketplace.repository.SellerTypeRepository;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.security.jwt.JwtUtils;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.service.DealerService;
import com.caryo.marketplace.service.PasswordResetService;
import com.caryo.marketplace.service.EmailVerificationService;
import com.caryo.marketplace.service.RoleService;
import com.caryo.marketplace.service.SellerTypeService;
import com.caryo.marketplace.payload.response.SellerTypeResponse;
import com.caryo.marketplace.service.EmailService;
import com.caryo.marketplace.security.ratelimit.RateLimit;
import com.caryo.marketplace.security.ratelimit.RateLimitKeyType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Tag(name = "Authentication", description = "Endpoints for user login and registration")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleService roleService;

    @Autowired
    private SellerTypeRepository sellerTypeRepository;

    @Autowired
    private DealerService dealerService;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private SellerTypeService sellerTypeService;

    @Autowired
    private EmailService emailService;

    @Operation(
        summary = "Login",
        description = "Authenticate user and return JWT token."
    )
    @RateLimit(maxRequests = 5, windowSeconds = 60, keyType = RateLimitKeyType.IP,
        message = "Too many login attempts. Please try again in a minute.")
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        // Handle both standard UserDetails and our custom UserDetailsImpl
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) principal;
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            String refreshToken = jwtUtils.generateRefreshToken(
                    userDetails.getUsername(), userDetails.getTokenVersion());

            return ResponseEntity.ok(new JwtResponse(jwt,
                                                    refreshToken,
                                                    userDetails.getId(),
                                                    userDetails.getUsername(),
                                                    userDetails.getEmail(),
                                                    roles));
        } else if (principal instanceof org.springframework.security.core.userdetails.User) {
            org.springframework.security.core.userdetails.User springUser =
                    (org.springframework.security.core.userdetails.User) principal;

            // For tests where we use the standard User, fetch our User entity to get ID and email
            User user = userRepository.findByUsername(springUser.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found in repository"));

            List<String> roles = springUser.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            String refreshToken = jwtUtils.generateRefreshToken(user.getUsername(),
                    user.getTokenVersion() != null ? user.getTokenVersion() : 0);

            return ResponseEntity.ok(new JwtResponse(jwt,
                                                    refreshToken,
                                                    user.getId(),
                                                    user.getUsername(),
                                                    user.getEmail(),
                                                    roles));
        } else {
            throw new RuntimeException("Unknown principal type: " + principal.getClass());
        }
    }

    @Operation(
        summary = "Register a new user",
        description = "Creates a new user account with support for private sellers and dealers."
    )
    @RateLimit(maxRequests = 3, windowSeconds = 3600, keyType = RateLimitKeyType.IP,
        message = "Too many registration attempts. Please try again later.")
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        // Basic validation
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Validate passwords match
        if (!signUpRequest.getPassword().equals(signUpRequest.getConfirmPassword())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Passwords do not match!"));
        }

        // Get seller type
        SellerType sellerType = sellerTypeRepository.findById(signUpRequest.getSellerTypeId().longValue())
                .orElseThrow(() -> new RuntimeException("Error: Invalid seller type"));

        // Validate dealer-specific data if it's a dealer signup
        if (signUpRequest.isDealer()) {
            if (signUpRequest.getBusinessName() == null || signUpRequest.getBusinessName().trim().isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Business name is required for dealers"));
            }
            try {
                dealerService.validateDealerData(signUpRequest);
            } catch (IllegalArgumentException e) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: " + e.getMessage()));
            }
        }

        // Create new user's account
        User user = new User(signUpRequest.getUsername(),
                             signUpRequest.getEmail(),
                             encoder.encode(signUpRequest.getPassword()));

        // Set seller type
        user.setSellerType(sellerType);

        // Handle roles
        Set<String> strRoles = signUpRequest.getRole();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            roles.add(roleService.getOrCreateRole("ROLE_USER"));
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                case "admin":
                    roles.add(roleService.getOrCreateRole("ROLE_ADMIN"));
                    break;
                default:
                    roles.add(roleService.getOrCreateRole("ROLE_USER"));
                }
            });
        }

        user.setRoles(roles);

        // Save user first
        User savedUser = userRepository.save(user);

        // Create dealer profile if it's a dealer signup
        if (signUpRequest.isDealer()) {
            try {
                dealerService.createDealer(savedUser, signUpRequest);
            } catch (Exception e) {
                // If dealer creation fails, delete the user to maintain consistency
                userRepository.delete(savedUser);
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Failed to create dealer profile. " + e.getMessage()));
            }
        }

        // Send email verification
        try {
            emailVerificationService.sendVerificationEmail(savedUser);
        } catch (Exception e) {
            // Log the error but don't fail the registration
            log.error("Failed to send verification email to {}: {}", savedUser.getEmail(), e.getMessage());
        }

        // Return success message
        String successMessage = signUpRequest.isDealer()
            ? "Dealer registration successful! Please check your email to verify your account before signing in."
            : "Registration successful! Please check your email to verify your account before signing in.";

        return ResponseEntity.ok(new MessageResponse(successMessage));
    }

    @Operation(
        summary = "Social Login",
        description = "Authenticate or register a user with social login (Google, etc.)"
    )
    @PostMapping("/social-login")
    public ResponseEntity<?> socialLogin(@Valid @RequestBody com.caryo.marketplace.model.dto.SocialLoginRequest request) {
        // Check if user exists by email
        User user;

        if (userRepository.existsByEmail(request.getEmail())) {
            // User exists, use existing account
            user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

            boolean needsSave = false;

            // Ensure existing OAuth users have at least the default role
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                Set<Role> roles = new HashSet<>();
                roles.add(roleService.getOrCreateRole("ROLE_USER"));
                user.setRoles(roles);
                needsSave = true;
            }

            // For existing OAuth users, ensure they're fully verified since Google has verified their email
            if (!user.isEmailVerified() ||
                user.getAccountStatus() == com.caryo.marketplace.model.AccountStatus.PENDING_VERIFICATION ||
                user.getAccountStatus() == com.caryo.marketplace.model.AccountStatus.PENDING_APPROVAL) {

                // Log OAuth verification for security audit trail
                log.info("OAuth verification: Existing user {} email verified via {} OAuth provider (ID: {})",
                        user.getUsername(),
                        request.getProvider() != null ? request.getProvider() : "Google",
                        request.getProviderAccountId());

                // Mark as OAuth-verified with provider ID for complete audit trail
                user.markEmailVerifiedByOAuth(
                    request.getProvider() != null ? request.getProvider() : "google",
                    request.getProviderAccountId()
                );
                needsSave = true;
            }

            // Save only if something changed
            if (needsSave) {
                userRepository.save(user);
            }
        } else {
            // Create new user with info from social provider
            // Generate a username from the email or name
            String username = request.getEmail().split("@")[0];

            // Ensure username is unique
            int counter = 1;
            String baseUsername = username;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + counter++;
            }

            // Create the user without a password (social login users don't need one)
            user = new User();
            user.setUsername(username);
            user.setEmail(request.getEmail());
            user.setPassword(encoder.encode(java.util.UUID.randomUUID().toString())); // Random password

            // Add default role
            Set<Role> roles = new HashSet<>();
            roles.add(roleService.getOrCreateRole("ROLE_USER"));
            user.setRoles(roles);

            // Set default seller type to "private" for social login users
            try {
                user.setSellerType(sellerTypeService.getSellerTypeEntityById(1L)); // Assuming private has ID 1
            } catch (Exception e) {
                // If private seller type not found, try to find by name
                try {
                    SellerTypeResponse privateSellerType = sellerTypeService.getSellerTypeByName("private");
                    user.setSellerType(sellerTypeService.getSellerTypeEntityById(privateSellerType.getId()));
                } catch (Exception ex) {
                    // Log error but don't fail the registration
                    log.error("Failed to set default seller type for social login user: {}", ex.getMessage());
                }
            }

            // For OAuth users, mark as verified but log the OAuth verification for audit purposes
            // New OAuth users are always verified since Google has verified their email
            log.info("OAuth verification: User {} email verified via {} OAuth provider (ID: {})",
                    user.getUsername(),
                    request.getProvider() != null ? request.getProvider() : "Google",
                    request.getProviderAccountId());

            // Mark as OAuth-verified with provider ID for complete audit trail
            user.markEmailVerifiedByOAuth(
                request.getProvider() != null ? request.getProvider() : "google",
                request.getProviderAccountId()
            );

            // Save the new user once
            User savedUser = userRepository.save(user);

            // Send welcome email to new Google users
            try {
                emailService.sendWelcomeEmail(savedUser);
                log.info("Welcome email sent to new Google user: {}", savedUser.getEmail());
            } catch (Exception e) {
                // Log the error but don't fail the registration
                log.error("Failed to send welcome email to new Google user {}: {}", savedUser.getEmail(), e.getMessage());
            }
        }

        // Generate tokens
        String jwt = jwtUtils.generateJwtTokenForUser(user);
        String refreshToken = jwtUtils.generateRefreshToken(user.getUsername(),
                user.getTokenVersion() != null ? user.getTokenVersion() : 0);

        // Return response with token and user details
        List<String> roles = user.getRoles().stream()
            .map(role -> role.getName())
            .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(
            jwt,
            refreshToken,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            roles
        ));
    }

    @Operation(
        summary = "Refresh access token",
        description = "Exchange a valid refresh token for a new access/refresh token pair. "
            + "Refresh tokens are invalidated by logout (token version bump)."
    )
    @RateLimit(maxRequests = 30, windowSeconds = 60, keyType = RateLimitKeyType.IP,
        message = "Too many token refresh attempts. Please try again later.")
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        try {
            jwtUtils.validateJwtToken(refreshToken);
        } catch (CustomJwtException e) {
            log.warn("Refresh rejected: {}", e.getMessage());
            return unauthorizedRefresh();
        }

        if (!jwtUtils.isRefreshToken(refreshToken)) {
            log.warn("Refresh rejected: presented token is not a refresh token");
            return unauthorizedRefresh();
        }

        String username = jwtUtils.getUserNameFromJwtToken(refreshToken);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            log.warn("Refresh rejected: user '{}' not found", username);
            return unauthorizedRefresh();
        }

        int tokenVersion = jwtUtils.getTokenVersionFromJwtToken(refreshToken);
        int currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        if (tokenVersion != currentVersion) {
            log.warn("Refresh rejected for user '{}': revoked token (token v{}, current v{})",
                    username, tokenVersion, currentVersion);
            return unauthorizedRefresh();
        }

        String newAccessToken = jwtUtils.generateJwtTokenForUser(user);
        String newRefreshToken = jwtUtils.generateRefreshToken(user.getUsername(), currentVersion);

        List<String> roles = user.getRoles().stream()
            .map(role -> role.getName())
            .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(
            newAccessToken,
            newRefreshToken,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            roles
        ));
    }

    // Deliberately uniform response so callers can't probe which check failed
    private ResponseEntity<MessageResponse> unauthorizedRefresh() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new MessageResponse("Error: Invalid or expired refresh token."));
    }



    @Operation(
        summary = "Logout",
        description = "Invalidate all active JWT tokens for the current user"
    )
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: User not authenticated!"));
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: User not found!"));
        }

        user.incrementTokenVersion();
        userRepository.save(user);

        SecurityContextHolder.clearContext();

        return ResponseEntity.ok(new MessageResponse("Logged out successfully. All tokens invalidated."));
    }

    @Operation(
        summary = "Change Password",
        description = "Change the current user's password"
    )
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest changePasswordRequest) {
        // Get the current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: User not authenticated!"));
        }

        String username = authentication.getName();

        // Find the user in the database
        User user = userRepository.findByUsername(username)
            .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: User not found!"));
        }

        // Verify the current password
        if (!encoder.matches(changePasswordRequest.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Current password is incorrect!"));
        }

        // Update the password and invalidate all existing tokens
        user.setPassword(encoder.encode(changePasswordRequest.getNewPassword()));
        user.incrementTokenVersion();
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Password changed successfully. Please sign in again."));
    }

    @Operation(
        summary = "Forgot Password",
        description = "Initiates password reset process by sending reset link to user's email"
    )
    @RateLimit(maxRequests = 3, windowSeconds = 3600, keyType = RateLimitKeyType.IP,
        message = "Too many password reset requests. Please try again later.")
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest,
            HttpServletRequest request) {

        String clientIp = getClientIpAddress(request);
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(
            forgotPasswordRequest.getEmail(), clientIp);

        if (result.isRateLimited()) {
            return ResponseEntity.status(429) // Too Many Requests
                .body(new MessageResponse(result.getMessage()));
        }

        // Always return 200 OK for success/error to avoid user enumeration
        return ResponseEntity.ok(new MessageResponse(result.getMessage()));
    }

    @Operation(
        summary = "Validate Reset Token",
        description = "Validates if a password reset token is valid and not expired"
    )
    @GetMapping("/reset-password/validate")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        boolean isValid = passwordResetService.validateResetToken(token);

        if (isValid) {
            return ResponseEntity.ok(new MessageResponse("Token is valid"));
        } else {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Invalid or expired reset token"));
        }
    }

    @Operation(
        summary = "Reset Password",
        description = "Resets user password using valid reset token"
    )
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest resetPasswordRequest,
            HttpServletRequest request) {

        String clientIp = getClientIpAddress(request);
        PasswordResetService.PasswordResetResult result = passwordResetService.resetPassword(
            resetPasswordRequest.getToken(),
            resetPasswordRequest.getNewPassword(),
            clientIp
        );

        if (result.isRateLimited()) {
            return ResponseEntity.status(429) // Too Many Requests
                .body(new MessageResponse(result.getMessage()));
        }

        if (result.isSuccess()) {
            return ResponseEntity.ok(new MessageResponse(result.getMessage()));
        } else {
            return ResponseEntity.badRequest()
                .body(new MessageResponse(result.getMessage()));
        }
    }

    /**
     * Helper method to extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
