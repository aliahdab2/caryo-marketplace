package com.autotrader.autotraderbackend.payload.response;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Tag("unit")
@Tag("dto")
@Tag("security")
@Tag("authentication")
@DisplayName("JwtResponse Tests")
class JwtResponseTest {

    private ObjectMapper objectMapper;

    // Test data constants
    private static final String TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    private static final String TEST_TYPE = "Bearer";
    private static final Long TEST_ID = 1L;
    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_EMAIL = "test@example.com";
    private static final List<String> TEST_ROLES = Arrays.asList("ROLE_USER", "ROLE_ADMIN");

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    /**
     * Helper method to create a basic JwtResponse for testing
     */
    private JwtResponse createBasicJwtResponse() {
        return new JwtResponse(TEST_TOKEN, TEST_ID, TEST_USERNAME, TEST_EMAIL, TEST_ROLES);
    }

    /**
     * Helper method to create a JwtResponse with no-args constructor
     */
    private JwtResponse createEmptyJwtResponse() {
        JwtResponse response = new JwtResponse();
        response.setToken(TEST_TOKEN);
        response.setId(TEST_ID);
        response.setUsername(TEST_USERNAME);
        response.setEmail(TEST_EMAIL);
        response.setRoles(TEST_ROLES);
        return response;
    }

    /**
     * Helper method to assert basic JwtResponse properties
     */
    private void assertBasicJwtProperties(JwtResponse response) {
        assertNotNull(response);
        assertEquals(TEST_TOKEN, response.getToken());
        assertEquals(TEST_TYPE, response.getType());
        assertEquals(TEST_ID, response.getId());
        assertEquals(TEST_USERNAME, response.getUsername());
        assertEquals(TEST_EMAIL, response.getEmail());
        assertEquals(TEST_ROLES, response.getRoles());
    }

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Should create JwtResponse with no-args constructor")
        void noArgsConstructor_ShouldCreateEmptyResponse() {
            // When
            JwtResponse response = new JwtResponse();

            // Then
            assertNotNull(response);
            assertNull(response.getToken());
            assertEquals("Bearer", response.getType()); // Default value
            assertNull(response.getId());
            assertNull(response.getUsername());
            assertNull(response.getEmail());
            assertNull(response.getRoles());
        }

        @Test
        @DisplayName("Should create JwtResponse with all-args constructor")
        void allArgsConstructor_ShouldCreateCompleteResponse() {
            // When
            JwtResponse response = createBasicJwtResponse();

            // Then
            assertBasicJwtProperties(response);
        }

        @Test
        @DisplayName("Should handle constructor with null roles")
        void constructor_NullRoles_ShouldHandleGracefully() {
            // When
            JwtResponse response = new JwtResponse(TEST_TOKEN, TEST_ID, TEST_USERNAME, TEST_EMAIL, null);

            // Then
            assertNotNull(response);
            assertEquals(TEST_TOKEN, response.getToken());
            assertEquals(TEST_ID, response.getId());
            assertNull(response.getRoles());
        }

        @Test
        @DisplayName("Should handle constructor with empty roles")
        void constructor_EmptyRoles_ShouldHandleCorrectly() {
            // When
            List<String> emptyRoles = new ArrayList<>();
            JwtResponse response = new JwtResponse(TEST_TOKEN, TEST_ID, TEST_USERNAME, TEST_EMAIL, emptyRoles);

            // Then
            assertNotNull(response);
            assertEquals(TEST_TOKEN, response.getToken());
            assertNotNull(response.getRoles());
            assertTrue(response.getRoles().isEmpty());
        }
    }

    @Nested
    @DisplayName("Getter and Setter Tests")
    class GetterSetterTests {

        @Test
        @DisplayName("Should set and get token correctly")
        void token_GetterSetter_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setToken(TEST_TOKEN);

            // Then
            assertEquals(TEST_TOKEN, response.getToken());
        }

        @Test
        @DisplayName("Should set and get type correctly")
        void type_GetterSetter_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();
            String customType = "Custom";

            // When
            response.setType(customType);

            // Then
            assertEquals(customType, response.getType());
        }

        @Test
        @DisplayName("Should set and get user ID correctly")
        void id_GetterSetter_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setId(TEST_ID);

            // Then
            assertEquals(TEST_ID, response.getId());
        }

        @Test
        @DisplayName("Should set and get username correctly")
        void username_GetterSetter_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setUsername(TEST_USERNAME);

            // Then
            assertEquals(TEST_USERNAME, response.getUsername());
        }

        @Test
        @DisplayName("Should set and get email correctly")
        void email_GetterSetter_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setEmail(TEST_EMAIL);

            // Then
            assertEquals(TEST_EMAIL, response.getEmail());
        }

        @Test
        @DisplayName("Should set and get roles correctly")
        void roles_GetterSetter_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setRoles(TEST_ROLES);

            // Then
            assertEquals(TEST_ROLES, response.getRoles());
            assertEquals(2, response.getRoles().size());
            assertTrue(response.getRoles().contains("ROLE_USER"));
            assertTrue(response.getRoles().contains("ROLE_ADMIN"));
        }
    }

    @Nested
    @DisplayName("Role Management Tests")
    class RoleManagementTests {

        @Test
        @DisplayName("Should handle single role correctly")
        void singleRole_ShouldHandleCorrectly() {
            // Given
            List<String> singleRole = Arrays.asList("ROLE_USER");

            // When
            JwtResponse response = new JwtResponse(TEST_TOKEN, TEST_ID, TEST_USERNAME, TEST_EMAIL, singleRole);

            // Then
            assertNotNull(response.getRoles());
            assertEquals(1, response.getRoles().size());
            assertEquals("ROLE_USER", response.getRoles().get(0));
        }

        @Test
        @DisplayName("Should handle multiple roles correctly")
        void multipleRoles_ShouldHandleCorrectly() {
            // Given
            List<String> multipleRoles = Arrays.asList("ROLE_USER", "ROLE_ADMIN", "ROLE_MODERATOR");

            // When
            JwtResponse response = new JwtResponse(TEST_TOKEN, TEST_ID, TEST_USERNAME, TEST_EMAIL, multipleRoles);

            // Then
            assertNotNull(response.getRoles());
            assertEquals(3, response.getRoles().size());
            assertTrue(response.getRoles().contains("ROLE_USER"));
            assertTrue(response.getRoles().contains("ROLE_ADMIN"));
            assertTrue(response.getRoles().contains("ROLE_MODERATOR"));
        }

        @Test
        @DisplayName("Should handle role modifications")
        void roleModifications_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = createBasicJwtResponse();

            // When - Modify roles
            List<String> newRoles = Arrays.asList("ROLE_NEW");
            response.setRoles(newRoles);

            // Then
            assertEquals(newRoles, response.getRoles());
            assertEquals(1, response.getRoles().size());
            assertEquals("ROLE_NEW", response.getRoles().get(0));
        }
    }

    @Nested
    @DisplayName("JSON Serialization Tests")
    class JsonSerializationTests {

        @Test
        @DisplayName("Should serialize JwtResponse to valid JSON")
        void serialize_ShouldCreateValidJson() throws Exception {
            // Given
            JwtResponse response = createBasicJwtResponse();

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"token\":\"" + TEST_TOKEN + "\""));
            assertTrue(json.contains("\"type\":\"Bearer\""));
            assertTrue(json.contains("\"id\":" + TEST_ID));
            assertTrue(json.contains("\"username\":\"" + TEST_USERNAME + "\""));
            assertTrue(json.contains("\"email\":\"" + TEST_EMAIL + "\""));
            assertTrue(json.contains("\"roles\":"));
            assertTrue(json.contains("ROLE_USER"));
            assertTrue(json.contains("ROLE_ADMIN"));
        }

        @Test
        @DisplayName("Should deserialize JSON to JwtResponse correctly")
        void deserialize_ShouldCreateCorrectObject() throws Exception {
            // Given
            String json = """
                {
                    "token": "test.jwt.token",
                    "type": "Bearer",
                    "id": 123,
                    "username": "johndoe",
                    "email": "john@example.com",
                    "roles": ["ROLE_USER", "ROLE_ADMIN"]
                }
                """;

            // When
            JwtResponse response = objectMapper.readValue(json, JwtResponse.class);

            // Then
            assertNotNull(response);
            assertEquals("test.jwt.token", response.getToken());
            assertEquals("Bearer", response.getType());
            assertEquals(123L, response.getId());
            assertEquals("johndoe", response.getUsername());
            assertEquals("john@example.com", response.getEmail());
            assertNotNull(response.getRoles());
            assertEquals(2, response.getRoles().size());
            assertTrue(response.getRoles().contains("ROLE_USER"));
            assertTrue(response.getRoles().contains("ROLE_ADMIN"));
        }

        @Test
        @DisplayName("Should handle JSON with null roles")
        void serialize_NullRoles_ShouldWorkCorrectly() throws Exception {
            // Given
            JwtResponse response = new JwtResponse(TEST_TOKEN, TEST_ID, TEST_USERNAME, TEST_EMAIL, null);

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"roles\":null"));
            assertTrue(json.contains("\"token\":\"" + TEST_TOKEN + "\""));
        }

        @Test
        @DisplayName("Should handle JSON with empty roles")
        void serialize_EmptyRoles_ShouldWorkCorrectly() throws Exception {
            // Given
            JwtResponse response = new JwtResponse(TEST_TOKEN, TEST_ID, TEST_USERNAME, TEST_EMAIL, new ArrayList<>());

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"roles\":[]"));
            assertTrue(json.contains("\"token\":\"" + TEST_TOKEN + "\""));
        }
    }

    @Nested
    @DisplayName("Edge Cases and Validation Tests")
    class EdgeCasesTests {

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {" ", "\t", "\n", "short", "a_very_long_username_that_exceeds_normal_limits_and_should_still_be_handled"})
        @DisplayName("Should handle various username inputs")
        void username_VariousInputs_ShouldHandleCorrectly(String username) {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setUsername(username);

            // Then
            assertEquals(username, response.getUsername());
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {" ", "invalid-email", "user@", "@domain.com", "valid@example.com", "test.email+tag@subdomain.domain.co.uk"})
        @DisplayName("Should handle various email inputs")
        void email_VariousInputs_ShouldHandleCorrectly(String email) {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setEmail(email);

            // Then
            assertEquals(email, response.getEmail());
        }

        @Test
        @DisplayName("Should handle null token")
        void token_NullValue_ShouldHandleCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setToken(null);

            // Then
            assertNull(response.getToken());
        }

        @Test
        @DisplayName("Should handle very long JWT token")
        void token_LongValue_ShouldHandleCorrectly() {
            // Given
            String longToken = "A".repeat(1000) + "." + "B".repeat(1000) + "." + "C".repeat(1000);
            JwtResponse response = new JwtResponse();

            // When
            response.setToken(longToken);

            // Then
            assertEquals(longToken, response.getToken());
        }

        @Test
        @DisplayName("Should handle zero ID")
        void id_ZeroValue_ShouldHandleCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setId(0L);

            // Then
            assertEquals(0L, response.getId());
        }

        @Test
        @DisplayName("Should handle negative ID")
        void id_NegativeValue_ShouldHandleCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();

            // When
            response.setId(-1L);

            // Then
            assertEquals(-1L, response.getId());
        }

        @Test
        @DisplayName("Should handle very large ID")
        void id_LargeValue_ShouldHandleCorrectly() {
            // Given
            Long largeId = Long.MAX_VALUE;
            JwtResponse response = new JwtResponse();

            // When
            response.setId(largeId);

            // Then
            assertEquals(largeId, response.getId());
        }
    }

    @Nested
    @DisplayName("Integration Tests")
    class IntegrationTests {

        @Test
        @DisplayName("Should create complete JwtResponse using constructor")
        void completeJwtResponse_Constructor_ShouldWorkCorrectly() {
            // When
            JwtResponse response = createBasicJwtResponse();

            // Then
            assertBasicJwtProperties(response);
        }

        @Test
        @DisplayName("Should create complete JwtResponse using setters")
        void completeJwtResponse_Setters_ShouldWorkCorrectly() {
            // When
            JwtResponse response = createEmptyJwtResponse();

            // Then
            assertBasicJwtProperties(response);
        }

        @Test
        @DisplayName("Should maintain data integrity through serialization round-trip")
        void serializationRoundTrip_ShouldMaintainIntegrity() throws Exception {
            // Given
            JwtResponse original = createBasicJwtResponse();

            // When - Serialize and deserialize
            String json = objectMapper.writeValueAsString(original);
            JwtResponse deserialized = objectMapper.readValue(json, JwtResponse.class);

            // Then - Verify all data is preserved
            assertEquals(original.getToken(), deserialized.getToken());
            assertEquals(original.getType(), deserialized.getType());
            assertEquals(original.getId(), deserialized.getId());
            assertEquals(original.getUsername(), deserialized.getUsername());
            assertEquals(original.getEmail(), deserialized.getEmail());
            assertEquals(original.getRoles(), deserialized.getRoles());
        }

        @Test
        @DisplayName("Should handle JWT response with minimal required fields")
        void minimalJwtResponse_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = new JwtResponse();
            response.setToken(TEST_TOKEN);
            response.setId(TEST_ID);

            // Then
            assertNotNull(response);
            assertEquals(TEST_TOKEN, response.getToken());
            assertEquals(TEST_ID, response.getId());
            assertEquals("Bearer", response.getType()); // Default value
            assertNull(response.getUsername());
            assertNull(response.getEmail());
            assertNull(response.getRoles());
        }

        @Test
        @DisplayName("Should handle JWT response update scenario")
        void jwtResponseUpdate_ShouldWorkCorrectly() {
            // Given
            JwtResponse response = createBasicJwtResponse();

            // When - Update token (refresh scenario)
            String newToken = "new.jwt.token";
            response.setToken(newToken);

            // Then
            assertEquals(newToken, response.getToken());
            assertEquals(TEST_ID, response.getId()); // Other fields unchanged
            assertEquals(TEST_USERNAME, response.getUsername());
            assertEquals(TEST_EMAIL, response.getEmail());
            assertEquals(TEST_ROLES, response.getRoles());
        }
    }

    @Nested
    @DisplayName("Security-Related Tests")
    class SecurityTests {

        @Test
        @DisplayName("Should handle sensitive token data appropriately")
        void sensitiveData_ShouldBeHandledCorrectly() {
            // Given
            String sensitiveToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_payload_data.signature";
            JwtResponse response = new JwtResponse();

            // When
            response.setToken(sensitiveToken);

            // Then
            assertEquals(sensitiveToken, response.getToken());
            // Note: In a real application, you might want to ensure tokens are not logged
        }

        @Test
        @DisplayName("Should handle role-based authorization data")
        void roleBasedAuth_ShouldWorkCorrectly() {
            // Given - Simulate admin user
            List<String> adminRoles = Arrays.asList("ROLE_USER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN");
            JwtResponse response = new JwtResponse(TEST_TOKEN, TEST_ID, TEST_USERNAME, TEST_EMAIL, adminRoles);

            // Then
            assertTrue(response.getRoles().contains("ROLE_ADMIN"));
            assertTrue(response.getRoles().contains("ROLE_SUPER_ADMIN"));
            assertEquals(3, response.getRoles().size());
        }

        @Test
        @DisplayName("Should handle anonymous user scenario")
        void anonymousUser_ShouldWorkCorrectly() {
            // Given - Anonymous user (no roles)
            JwtResponse response = new JwtResponse("anon-token", null, "anonymous", null, new ArrayList<>());

            // Then
            assertEquals("anon-token", response.getToken());
            assertNull(response.getId());
            assertEquals("anonymous", response.getUsername());
            assertNull(response.getEmail());
            assertNotNull(response.getRoles());
            assertTrue(response.getRoles().isEmpty());
        }
    }
}
