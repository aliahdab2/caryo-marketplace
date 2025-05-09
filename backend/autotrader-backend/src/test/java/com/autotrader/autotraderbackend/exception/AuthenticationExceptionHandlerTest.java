package com.autotrader.autotraderbackend.exception;

import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthenticationExceptionHandlerTest {

    @InjectMocks
    private com.autotrader.autotraderbackend.exception.AuthenticationExceptionHandler exceptionHandler;

    @Mock
    private WebRequest webRequest;

    @Mock
    private MethodArgumentNotValidException methodArgumentNotValidException;

    @Mock
    private BindingResult bindingResult;

    @Mock
    private FieldError fieldError;

    @Mock
    private ConstraintViolationException constraintViolationException;

    @Mock
    private ConstraintViolation<Object> constraintViolation;

    @Mock
    private Path path;

    @BeforeEach
    void setUp() {
        // Common setup if needed
    }

    @Test
    public void handleAuthenticationException_ShouldReturn401() {
        // Arrange
        AuthenticationException ex = new AuthenticationException("Authentication failed") {};

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleAuthenticationException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getMessage().contains("Authentication failed"));
    }

    @Test
    public void handleBadCredentialsException_ShouldReturn401() {
        // Arrange
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleBadCredentialsException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Invalid username or password", response.getBody().getMessage());
    }

    @Test
    public void handleAccessDeniedException_ShouldReturn403() {
        // Arrange
        AccessDeniedException ex = new AccessDeniedException("Access denied");

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleAccessDeniedException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody(), "Response body should not be null."); // Ensure body is not null
        // Corrected assertion to check for the exact message produced by the handler.
        assertEquals("Forbidden: Access Denied", response.getBody().getMessage());
    }

    @Test
    public void handleUsernameNotFoundException_ShouldReturn401() {
        // Arrange
        UsernameNotFoundException ex = new UsernameNotFoundException("User not found");

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleUsernameNotFoundException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Authentication failed: Invalid credentials", response.getBody().getMessage());
    }

    @Test
    public void handleDisabledException_ShouldReturn401() {
        // Arrange
        DisabledException ex = new DisabledException("Account is disabled");

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleDisabledException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Account is disabled", response.getBody().getMessage());
    }

    @Test
    public void handleLockedException_ShouldReturn401() {
        // Arrange
        LockedException ex = new LockedException("Account is locked");

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleLockedException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Account is locked", response.getBody().getMessage());
    }

    @Test
    public void handleExpiredJwtException_ShouldReturn401() {
        // Arrange
        ExpiredJwtException ex = mock(ExpiredJwtException.class);

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleJwtException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("JWT token has expired", response.getBody().getMessage());
    }

    @Test
    public void handleUnsupportedJwtException_ShouldReturn401() {
        // Arrange
        UnsupportedJwtException ex = mock(UnsupportedJwtException.class);

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleJwtException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("JWT token is unsupported", response.getBody().getMessage());
    }

    @Test
    public void handleMalformedJwtException_ShouldReturn401() {
        // Arrange
        MalformedJwtException ex = mock(MalformedJwtException.class);

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleJwtException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Invalid JWT token", response.getBody().getMessage());
    }

    @Test
    public void handleSignatureException_ShouldReturn401() {
        // Arrange
        SignatureException ex = mock(SignatureException.class);

        // Act
        ResponseEntity<MessageResponse> response = exceptionHandler.handleJwtException(ex, webRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Invalid JWT token", response.getBody().getMessage());
    }

    @Test
    public void handleValidationExceptions_ShouldReturn400WithErrors() {
        // Arrange
        when(methodArgumentNotValidException.getBindingResult()).thenReturn(bindingResult);
        when(fieldError.getField()).thenReturn("username");
        when(fieldError.getDefaultMessage()).thenReturn("Username cannot be empty");
        when(bindingResult.getAllErrors()).thenReturn(Arrays.asList(fieldError));

        // Act
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleValidationExceptions(methodArgumentNotValidException);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Username cannot be empty", response.getBody().get("username"));
    }

    @Test
    public void handleConstraintViolationException_ShouldReturn400WithErrors() {
        // Arrange
        Set<ConstraintViolation<?>> violations = new HashSet<>();
        violations.add((ConstraintViolation<?>) constraintViolation);

        when(constraintViolationException.getConstraintViolations()).thenReturn(violations);
        when(constraintViolation.getPropertyPath()).thenReturn(path);
        when(path.toString()).thenReturn("email");
        when(constraintViolation.getMessage()).thenReturn("Email must be valid");

        // Act
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleConstraintViolationException(constraintViolationException);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Email must be valid", response.getBody().get("email"));
    }
}
