package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.request.ChangePasswordRequest;
import com.autotrader.autotraderbackend.payload.request.ForgotPasswordRequest;
import com.autotrader.autotraderbackend.payload.request.ResetPasswordRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.autotrader.autotraderbackend.service.PasswordResetService;
import com.autotrader.autotraderbackend.service.EmailVerificationService;
import com.autotrader.autotraderbackend.service.SellerTypeService;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
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
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;

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

    @Operation(
        summary = "Login",
        description = "Authenticate user and return JWT token."
    )
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
                    
            return ResponseEntity.ok(new JwtResponse(jwt, 
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
                    
            return ResponseEntity.ok(new JwtResponse(jwt, 
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
        description = "Creates a new user account. Returns a success message on successful signup."
    )
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!")); // Added "Error: " prefix
        }

        // Create new user's account
        User user = new User(signUpRequest.getUsername(), 
                             signUpRequest.getEmail(),
                             encoder.encode(signUpRequest.getPassword()));

        Set<String> strRoles = signUpRequest.getRole();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            // Get or create ROLE_USER
            Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    Role newRole = new Role("ROLE_USER");
                    return roleRepository.save(newRole);
                });
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                case "admin":
                    // Get or create ROLE_ADMIN
                    Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                        .orElseGet(() -> {
                            Role newRole = new Role("ROLE_ADMIN");
                            return roleRepository.save(newRole);
                        });
                    roles.add(adminRole);
                    break;
                default:
                    // Get or create ROLE_USER
                    Role userRole = roleRepository.findByName("ROLE_USER")
                        .orElseGet(() -> {
                            Role newRole = new Role("ROLE_USER");
                            return roleRepository.save(newRole);
                        });
                    roles.add(userRole);
                }
            });
        }

        user.setRoles(roles);
        
        // Set seller type if provided
        if (signUpRequest.getSellerTypeId() != null) {
            try {
                user.setSellerType(sellerTypeService.getSellerTypeEntityById(signUpRequest.getSellerTypeId()));
            } catch (Exception e) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Invalid seller type selected!"));
            }
        }
        
        userRepository.save(user);

        // Send email verification instead of welcome email
        try {
            emailVerificationService.sendVerificationEmail(user);
        } catch (Exception e) {
            // Log the error but don't fail the registration
            System.err.println("Failed to send verification email to " + user.getEmail() + ": " + e.getMessage());
        }

        // Return success message with instruction to verify email
        return ResponseEntity.ok(new MessageResponse("Registration successful! Please check your email to verify your account before signing in."));
    }

    @Operation(
        summary = "Social Login",
        description = "Authenticate or register a user with social login (Google, etc.)"
    )
    @PostMapping("/social-login")
    public ResponseEntity<?> socialLogin(@Valid @RequestBody com.autotrader.autotraderbackend.model.dto.SocialLoginRequest request) {
        // Check if user exists by email
        User user;
        
        if (userRepository.existsByEmail(request.getEmail())) {
            // User exists, use existing account
            user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
            
            // Ensure existing OAuth users have at least the default role
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                Set<Role> roles = new HashSet<>();
                Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseGet(() -> {
                        Role newRole = new Role("ROLE_USER");
                        return roleRepository.save(newRole);
                    });
                roles.add(userRole);
                user.setRoles(roles);
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
            Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    Role newRole = new Role("ROLE_USER");
                    return roleRepository.save(newRole);
                });
            roles.add(userRole);
            user.setRoles(roles);
            
            // Set default seller type to "private" for social login users
            try {
                user.setSellerType(sellerTypeService.getSellerTypeEntityById(1L)); // Assuming private has ID 1
            } catch (Exception e) {
                // If private seller type not found, try to find by name
                try {
                    var privateSellerType = sellerTypeService.getSellerTypeByName("private");
                    user.setSellerType(sellerTypeService.getSellerTypeEntityById(privateSellerType.getId()));
                } catch (Exception ex) {
                    // Log error but don't fail the registration
                    System.err.println("Failed to set default seller type for social login user: " + ex.getMessage());
                }
            }
            
            userRepository.save(user);
        }
        
        // Generate token
        String jwt = jwtUtils.generateJwtTokenForUser(user);
        
        // Return response with token and user details
        List<String> roles = user.getRoles().stream()
            .map(role -> role.getName())
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(new JwtResponse(
            jwt, 
            user.getId(), 
            user.getUsername(), 
            user.getEmail(), 
            roles
        ));
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

        // Update the password
        user.setPassword(encoder.encode(changePasswordRequest.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Password changed successfully!"));
    }

    @Operation(
        summary = "Forgot Password",
        description = "Initiates password reset process by sending reset link to user's email"
    )
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
