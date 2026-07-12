package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.Role;
import com.caryo.marketplace.model.SellerType;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.request.LoginRequest;
import com.caryo.marketplace.payload.request.SignupRequest;
import com.caryo.marketplace.payload.response.JwtResponse;
import com.caryo.marketplace.payload.response.MessageResponse;
import com.caryo.marketplace.repository.SellerTypeRepository;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.security.jwt.JwtUtils;
import com.caryo.marketplace.service.DealerService;
import com.caryo.marketplace.service.EmailVerificationService;
import com.caryo.marketplace.service.RoleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleService roleService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private EmailVerificationService emailVerificationService;

    @Mock
    private SellerTypeRepository sellerTypeRepository;

    @Mock
    private DealerService dealerService;

    @InjectMocks
    private AuthController authController;

    private LoginRequest loginRequest;
    private SignupRequest signupRequest;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        // Setup login request
        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password");

        // Setup signup request
        signupRequest = new SignupRequest();
        signupRequest.setUsername("newuser");
        signupRequest.setEmail("newuser@example.com");
        signupRequest.setPassword("password");
        signupRequest.setConfirmPassword("password");
        signupRequest.setSellerTypeId(1); // 1 = private seller
        // Note: The role is intentionally left null here to test the default role assignment

        // Setup seller type repository mock
        SellerType privateSellerType = new SellerType();
        privateSellerType.setId(1L);
        privateSellerType.setName("PRIVATE");
        lenient().when(sellerTypeRepository.findById(1L)).thenReturn(Optional.of(privateSellerType));

        // Setup dealer service mock (should not be called for private sellers)
        lenient().doNothing().when(dealerService).validateDealerData(any(SignupRequest.class));

        // Setup mocked authentication
        authentication = mock(Authentication.class);
        Collection<SimpleGrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_USER"));

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("testuser")
                .password("password")
                .authorities(authorities)
                .build();

        lenient().when(authentication.getPrincipal()).thenReturn(userDetails);
    }

    @Test
    void authenticateUser_WithValidCredentials_ShouldReturnJwtResponse() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("test-jwt-token");

        // Mock the user repository response
        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");
        mockUser.setEmail("test@example.com");
        when(userRepository.findByUsername("testuser")).thenReturn(java.util.Optional.of(mockUser));

        // Act
        ResponseEntity<?> response = authController.authenticateUser(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(JwtResponse.class, response.getBody());

        JwtResponse jwtResponse = (JwtResponse) response.getBody();
        assertNotNull(jwtResponse);
        assertEquals("test-jwt-token", jwtResponse.getToken());
        assertEquals("testuser", jwtResponse.getUsername());
        assertEquals("test@example.com", jwtResponse.getEmail());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtUtils).generateJwtToken(authentication);
    }

    @Test
    void registerUser_WithNewUsername_ShouldRegisterSuccessfully() {
        // Arrange
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");

        // Setup role service mock
        Role userRole = new Role("ROLE_USER");
        when(roleService.getOrCreateRole("ROLE_USER")).thenReturn(userRole);

        User savedUser = new User();
        savedUser.setUsername("newuser");
        savedUser.setEmail("newuser@example.com");
        savedUser.setPassword("encoded-password");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(emailVerificationService.sendVerificationEmail(any(User.class))).thenReturn(true);

        // Act
        ResponseEntity<?> response = authController.registerUser(signupRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // The response can be either JwtResponse (auto-login successful) or MessageResponse (fallback)
        Object responseBody = response.getBody();
        assertNotNull(responseBody);

        if (responseBody instanceof JwtResponse) {
            // Auto-login was successful
            JwtResponse jwtResponse = (JwtResponse) responseBody;
            assertNotNull(jwtResponse.getToken());
            assertEquals("newuser", jwtResponse.getUsername());
        } else if (responseBody instanceof MessageResponse) {
            // Auto-login failed, fallback message
            MessageResponse messageResponse = (MessageResponse) responseBody;
            assertTrue(messageResponse.getMessage().contains("Registration successful"));
        } else {
            fail("Response body should be either JwtResponse or MessageResponse");
        }

        verify(userRepository).existsByUsername("newuser");
        verify(userRepository).existsByEmail("newuser@example.com");
        verify(passwordEncoder).encode("password");
        verify(roleService).getOrCreateRole("ROLE_USER");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_WithExistingUsername_ShouldReturnError() {
        // Arrange
        when(userRepository.existsByUsername("newuser")).thenReturn(true);

        // Act
        ResponseEntity<?> response = authController.registerUser(signupRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof MessageResponse);

        MessageResponse messageResponse = (MessageResponse) response.getBody();
        assertNotNull(messageResponse);
        assertEquals("Error: Username is already taken!", messageResponse.getMessage());

        verify(userRepository).existsByUsername("newuser");
    }

    @Test
    void registerUser_WithExistingEmail_ShouldReturnError() {
        // Arrange
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(true);

        // Act
        ResponseEntity<?> response = authController.registerUser(signupRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertInstanceOf(MessageResponse.class, response.getBody());

        MessageResponse messageResponse = (MessageResponse) response.getBody();
        assertNotNull(messageResponse);
        assertEquals("Error: Email is already in use!", messageResponse.getMessage());

        verify(userRepository).existsByUsername("newuser");
        verify(userRepository).existsByEmail("newuser@example.com");
    }

    @Test
    void registerUser_WithAdminRole_ShouldRegisterSuccessfully() {
        // Arrange
        when(userRepository.existsByUsername("newadmin")).thenReturn(false);
        when(userRepository.existsByEmail("newadmin@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");

        // Setup role service mocks
        Role userRole = new Role("ROLE_USER");
        Role adminRole = new Role("ROLE_ADMIN");
        // Use lenient() for the USER role as it might not be used in this test
        lenient().when(roleService.getOrCreateRole("ROLE_USER")).thenReturn(userRole);
        when(roleService.getOrCreateRole("ROLE_ADMIN")).thenReturn(adminRole);

        User savedUser = new User();
        savedUser.setUsername("newadmin");
        savedUser.setEmail("newadmin@example.com");
        savedUser.setPassword("encoded-password");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(emailVerificationService.sendVerificationEmail(any(User.class))).thenReturn(true);

        // Create signup request with admin role
        SignupRequest adminSignupRequest = new SignupRequest();
        adminSignupRequest.setUsername("newadmin");
        adminSignupRequest.setEmail("newadmin@example.com");
        adminSignupRequest.setPassword("password");
        adminSignupRequest.setConfirmPassword("password");
        adminSignupRequest.setSellerTypeId(1); // 1 = private seller
        Set<String> roles = new HashSet<>();
        roles.add("admin");
        adminSignupRequest.setRole(roles);

        // Act
        ResponseEntity<?> response = authController.registerUser(adminSignupRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // The response can be either JwtResponse (auto-login successful) or MessageResponse (fallback)
        Object responseBody = response.getBody();
        assertNotNull(responseBody);

        if (responseBody instanceof JwtResponse) {
            // Auto-login was successful
            JwtResponse jwtResponse = (JwtResponse) responseBody;
            assertNotNull(jwtResponse.getToken());
            assertEquals("newadmin", jwtResponse.getUsername());
        } else if (responseBody instanceof MessageResponse) {
            // Auto-login failed, fallback message
            MessageResponse messageResponse = (MessageResponse) responseBody;
            assertTrue(messageResponse.getMessage().contains("Registration successful"));
        } else {
            fail("Response body should be either JwtResponse or MessageResponse");
        }

        verify(userRepository).existsByUsername("newadmin");
        verify(userRepository).existsByEmail("newadmin@example.com");
        verify(passwordEncoder).encode("password");
        verify(roleService).getOrCreateRole("ROLE_ADMIN");
        verify(userRepository).save(any(User.class));
    }

    // ==================== Token refresh ====================

    private User refreshUser(int tokenVersion) {
        Role userRole = new Role();
        userRole.setName("ROLE_USER");

        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setRoles(new HashSet<>(Collections.singletonList(userRole)));
        user.setTokenVersion(tokenVersion);
        return user;
    }

    private com.caryo.marketplace.payload.request.TokenRefreshRequest refreshRequest(String token) {
        com.caryo.marketplace.payload.request.TokenRefreshRequest request =
                new com.caryo.marketplace.payload.request.TokenRefreshRequest();
        request.setRefreshToken(token);
        return request;
    }

    @Test
    void refreshToken_WithValidRefreshToken_ShouldReturnNewTokenPair() {
        User user = refreshUser(2);

        when(jwtUtils.validateJwtToken("valid.refresh.token")).thenReturn(true);
        when(jwtUtils.isRefreshToken("valid.refresh.token")).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken("valid.refresh.token")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(jwtUtils.getTokenVersionFromJwtToken("valid.refresh.token")).thenReturn(2);
        when(jwtUtils.generateJwtTokenForUser(user)).thenReturn("new.access.token");
        when(jwtUtils.generateRefreshToken("testuser", 2)).thenReturn("new.refresh.token");

        ResponseEntity<?> response = authController.refreshToken(refreshRequest("valid.refresh.token"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        JwtResponse body = (JwtResponse) response.getBody();
        assertNotNull(body);
        assertEquals("new.access.token", body.getToken());
        assertEquals("new.refresh.token", body.getRefreshToken());
        assertEquals("testuser", body.getUsername());
    }

    @Test
    void refreshToken_WithAccessTokenInsteadOfRefreshToken_ShouldReturnUnauthorized() {
        when(jwtUtils.validateJwtToken("plain.access.token")).thenReturn(true);
        when(jwtUtils.isRefreshToken("plain.access.token")).thenReturn(false);

        ResponseEntity<?> response = authController.refreshToken(refreshRequest("plain.access.token"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void refreshToken_WithRevokedTokenVersion_ShouldReturnUnauthorized() {
        // Logout bumps the user's token version; older refresh tokens must be rejected
        User user = refreshUser(5);

        when(jwtUtils.validateJwtToken("stale.refresh.token")).thenReturn(true);
        when(jwtUtils.isRefreshToken("stale.refresh.token")).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken("stale.refresh.token")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(jwtUtils.getTokenVersionFromJwtToken("stale.refresh.token")).thenReturn(4);

        ResponseEntity<?> response = authController.refreshToken(refreshRequest("stale.refresh.token"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void refreshToken_WithExpiredToken_ShouldReturnUnauthorized() {
        when(jwtUtils.validateJwtToken("expired.refresh.token"))
                .thenThrow(new com.caryo.marketplace.exception.jwt.ExpiredJwtTokenException("expired"));

        ResponseEntity<?> response = authController.refreshToken(refreshRequest("expired.refresh.token"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void refreshToken_WithUnknownUser_ShouldReturnUnauthorized() {
        when(jwtUtils.validateJwtToken("orphan.refresh.token")).thenReturn(true);
        when(jwtUtils.isRefreshToken("orphan.refresh.token")).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken("orphan.refresh.token")).thenReturn("ghost");
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.refreshToken(refreshRequest("orphan.refresh.token"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }
}
