package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;

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

import jakarta.validation.Valid;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Tag(name = "Authentication", description = "Endpoints for user login and registration")
@CrossOrigin(origins = "*", maxAge = 3600)
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
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
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
            
            // You could update the user with additional social provider info here if needed
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
}
