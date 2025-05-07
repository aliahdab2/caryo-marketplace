package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SignupRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void whenAllFieldsValid_thenNoViolations() {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("password123");

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        assertTrue(violations.isEmpty(), "Should have no violations for valid request");
    }

    // --- Username Tests ---
    @ParameterizedTest
    @NullSource // For null username
    void whenUsernameNull_thenOneViolation(String username) {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername(username);
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("password123");

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        assertEquals(1, violations.size(), "Should have 1 violation for null username");
        ConstraintViolation<SignupRequest> violation = violations.iterator().next();
        assertEquals("username", violation.getPropertyPath().toString());
        assertEquals(jakarta.validation.constraints.NotBlank.class, violation.getConstraintDescriptor().getAnnotation().annotationType(), "Violation should be for @NotBlank");
    }

    @Test
    void whenUsernameWhitespace_thenOneViolation() {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("   ");
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("password123");

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        assertEquals(1, violations.size(), "Should have 1 violation for whitespace username (NotBlank)");
        ConstraintViolation<SignupRequest> violation = violations.iterator().next();
        assertEquals("username", violation.getPropertyPath().toString());
        assertEquals(jakarta.validation.constraints.NotBlank.class, violation.getConstraintDescriptor().getAnnotation().annotationType(), "Violation should be for @NotBlank");
    }

    @Test
    void whenUsernameEmpty_thenTwoViolations() {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername(""); // Empty username
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("password123");

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        assertEquals(2, violations.size(), "Should have 2 violations for empty username (NotBlank, Size)");
        boolean foundNotBlank = false;
        boolean foundSize = false;
        for (ConstraintViolation<SignupRequest> v : violations) {
            if (v.getPropertyPath().toString().equals("username")) {
                if (v.getConstraintDescriptor().getAnnotation().annotationType().equals(jakarta.validation.constraints.NotBlank.class)) {
                    foundNotBlank = true;
                } else if (v.getConstraintDescriptor().getAnnotation().annotationType().equals(jakarta.validation.constraints.Size.class)) {
                    foundSize = true;
                }
            }
        }
        assertTrue(foundNotBlank, "NotBlank violation for username not found for empty input");
        assertTrue(foundSize, "Size violation for username not found for empty input");
    }

    // --- Email Tests ---
    @ParameterizedTest
    @NullSource // For null email
    void whenEmailNull_thenOneViolation(String email) {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail(email);
        signupRequest.setPassword("password123");

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        assertEquals(1, violations.size(), "Should have 1 violation for null email");
        ConstraintViolation<SignupRequest> violation = violations.iterator().next();
        assertEquals("email", violation.getPropertyPath().toString());
        assertEquals(jakarta.validation.constraints.NotBlank.class, violation.getConstraintDescriptor().getAnnotation().annotationType(), "Violation should be for @NotBlank");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "}) // For empty or whitespace email
    void whenEmailEmptyOrWhitespace_thenCorrectViolations(String email) {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail(email);
        signupRequest.setPassword("password123");

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        if (email.trim().isEmpty() && email.length() == 0) {
            // Empty string: only NotBlank
            assertEquals(1, violations.size(), "Should have 1 violation for empty email (NotBlank)");
            ConstraintViolation<SignupRequest> violation = violations.iterator().next();
            assertEquals("email", violation.getPropertyPath().toString());
            assertEquals(jakarta.validation.constraints.NotBlank.class, violation.getConstraintDescriptor().getAnnotation().annotationType(), "Violation should be for @NotBlank");
        } else {
            // Whitespace string: NotBlank + Email or Size
            assertEquals(2, violations.size(), "Should have 2 violations for whitespace email (NotBlank, Email/Size)");
            boolean foundNotBlank = false;
            boolean foundSize = false;
            boolean foundEmail = false;
            for (ConstraintViolation<SignupRequest> v : violations) {
                if (v.getPropertyPath().toString().equals("email")) {
                    if (v.getConstraintDescriptor().getAnnotation().annotationType().equals(jakarta.validation.constraints.NotBlank.class)) {
                        foundNotBlank = true;
                    } else if (v.getConstraintDescriptor().getAnnotation().annotationType().equals(jakarta.validation.constraints.Size.class)) {
                        foundSize = true;
                    } else if (v.getConstraintDescriptor().getAnnotation().annotationType().equals(jakarta.validation.constraints.Email.class)) {
                        foundEmail = true;
                    }
                }
            }
            assertTrue(foundNotBlank, "NotBlank violation for email not found for whitespace input");
            assertTrue(foundSize || foundEmail, "Size or Email violation for email not found for whitespace input");
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"invalid", "invalid@", "@example.com"})
    void whenEmailFormatIsInvalid_thenOneViolation(String email) {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail(email);
        signupRequest.setPassword("password123");

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        assertEquals(1, violations.size(), "Should have 1 violation for invalid email format: " + email);
        ConstraintViolation<SignupRequest> violation = violations.iterator().next();
        assertEquals("email", violation.getPropertyPath().toString());
        assertEquals(jakarta.validation.constraints.Email.class, violation.getConstraintDescriptor().getAnnotation().annotationType(), "Violation should be for @Email");
    }

    // --- Password Tests ---
    @Test
    void whenPasswordNull_thenOneViolation() {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword(null); // Null password

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        assertEquals(1, violations.size(), "Should have 1 violation for null password");
        ConstraintViolation<SignupRequest> violation = violations.iterator().next();
        assertEquals("password", violation.getPropertyPath().toString());
        assertEquals(jakarta.validation.constraints.NotBlank.class, violation.getConstraintDescriptor().getAnnotation().annotationType(), "Violation should be for @NotBlank");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "}) // Empty or whitespace password
    void whenPasswordEmptyOrWhitespace_thenTwoViolations(String password) {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword(password);

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(signupRequest);
        assertEquals(2, violations.size(), "Should have 2 violations for password: '" + password + "' (NotBlank, Size)");
        boolean foundNotBlank = false;
        boolean foundSize = false;
        for (ConstraintViolation<SignupRequest> v : violations) {
            if (v.getPropertyPath().toString().equals("password")) {
                if (v.getConstraintDescriptor().getAnnotation().annotationType().equals(jakarta.validation.constraints.NotBlank.class)) {
                    foundNotBlank = true;
                } else if (v.getConstraintDescriptor().getAnnotation().annotationType().equals(jakarta.validation.constraints.Size.class)) {
                    foundSize = true;
                }
            }
        }
        assertTrue(foundNotBlank, "NotBlank violation for password not found for input: '" + password + "'");
        assertTrue(foundSize, "Size violation for password not found for input: '" + password + "'");
    }

    @Test
    void testGettersAndSetters() {
        SignupRequest signupRequest = new SignupRequest();
        
        signupRequest.setUsername("testuser");
        assertEquals("testuser", signupRequest.getUsername());
        
        signupRequest.setEmail("test@example.com");
        assertEquals("test@example.com", signupRequest.getEmail());
        
        signupRequest.setPassword("password123");
        assertEquals("password123", signupRequest.getPassword());
        
        Set<String> roles = new HashSet<>();
        roles.add("user");
        roles.add("admin");
        
        signupRequest.setRole(roles);
        assertEquals(roles, signupRequest.getRole());
    }

    @Test
    void testRoleAssignment() {
        SignupRequest signupRequest = new SignupRequest();
        
        // Test null role
        assertNull(signupRequest.getRole());
        
        // Test adding roles
        Set<String> roles = new HashSet<>();
        roles.add("user");
        signupRequest.setRole(roles);
        assertEquals(1, signupRequest.getRole().size());
        assertTrue(signupRequest.getRole().contains("user"));
        
        // Test updating roles
        Set<String> newRoles = new HashSet<>();
        newRoles.add("admin");
        signupRequest.setRole(newRoles);
        assertEquals(1, signupRequest.getRole().size());
        assertTrue(signupRequest.getRole().contains("admin"));
    }
}
