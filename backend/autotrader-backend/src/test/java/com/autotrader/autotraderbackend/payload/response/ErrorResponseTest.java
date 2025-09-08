package com.autotrader.autotraderbackend.payload.response;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@Tag("unit")
@Tag("dto")
@DisplayName("ErrorResponse Tests")
class ErrorResponseTest {

    private ObjectMapper objectMapper;

    // Test data constants
    private static final int TEST_STATUS_400 = 400;
    private static final int TEST_STATUS_404 = 404;
    private static final int TEST_STATUS_500 = 500;
    private static final String TEST_MESSAGE = "Test error message";
    private static final String TEST_DETAILS = "Detailed error description";
    private static final String TEST_TIMESTAMP = "2024-01-01T10:00:00Z";

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    /**
     * Helper method to create a test ErrorResponse with common test data
     */
    private ErrorResponse createTestErrorResponse() {
        return new ErrorResponse(TEST_STATUS_400, TEST_MESSAGE, TEST_DETAILS, TEST_TIMESTAMP);
    }

    /**
     * Helper method to assert basic ErrorResponse properties
     */
    private void assertBasicErrorResponseProperties(ErrorResponse response, int expectedStatus) {
        assertNotNull(response);
        assertEquals(expectedStatus, response.getStatus());
    }

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Should create ErrorResponse with no-args constructor")
        void noArgsConstructor_ShouldCreateEmptyResponse() {
            // When
            ErrorResponse response = new ErrorResponse();

            // Then
            assertNotNull(response);
            assertEquals(0, response.getStatus());
            assertNull(response.getMessage());
            assertNull(response.getDetails());
            assertNull(response.getTimestamp());
        }

        @Test
        @DisplayName("Should create ErrorResponse with all-args constructor")
        void allArgsConstructor_ShouldCreateCompleteResponse() {
            // Given
            int status = TEST_STATUS_404;
            String message = TEST_MESSAGE;
            String details = TEST_DETAILS;
            String timestamp = TEST_TIMESTAMP;

            // When
            ErrorResponse response = new ErrorResponse(status, message, details, timestamp);

            // Then
            assertBasicErrorResponseProperties(response, status);
            assertEquals(message, response.getMessage());
            assertEquals(details, response.getDetails());
            assertEquals(timestamp, response.getTimestamp());
        }

        @Test
        @DisplayName("Should create ErrorResponse with partial constructor arguments")
        void partialConstructor_ShouldHandleNullValues() {
            // When
            ErrorResponse response = new ErrorResponse(500, "Internal error", null, null);

            // Then
            assertNotNull(response);
            assertEquals(500, response.getStatus());
            assertEquals("Internal error", response.getMessage());
            assertNull(response.getDetails());
            assertNull(response.getTimestamp());
        }
    }

    @Nested
    @DisplayName("Getter and Setter Tests")
    class GetterSetterTests {

        @Test
        @DisplayName("Should set and get status correctly")
        void status_GetterSetter_ShouldWorkCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse();
            int expectedStatus = 400;

            // When
            response.setStatus(expectedStatus);

            // Then
            assertEquals(expectedStatus, response.getStatus());
        }

        @Test
        @DisplayName("Should set and get message correctly")
        void message_GetterSetter_ShouldWorkCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse();
            String expectedMessage = "Validation failed";

            // When
            response.setMessage(expectedMessage);

            // Then
            assertEquals(expectedMessage, response.getMessage());
        }

        @Test
        @DisplayName("Should set and get details correctly")
        void details_GetterSetter_ShouldWorkCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse();
            String expectedDetails = "Email format is invalid";

            // When
            response.setDetails(expectedDetails);

            // Then
            assertEquals(expectedDetails, response.getDetails());
        }

        @Test
        @DisplayName("Should set and get timestamp correctly")
        void timestamp_GetterSetter_ShouldWorkCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse();
            String expectedTimestamp = "2024-01-01T10:00:00.123Z";

            // When
            response.setTimestamp(expectedTimestamp);

            // Then
            assertEquals(expectedTimestamp, response.getTimestamp());
        }

        @Test
        @DisplayName("Should handle null values in setters")
        void setters_NullValues_ShouldBeHandledCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse(500, "Error", "Details", "2024-01-01T10:00:00Z");

            // When
            response.setMessage(null);
            response.setDetails(null);
            response.setTimestamp(null);

            // Then
            assertNull(response.getMessage());
            assertNull(response.getDetails());
            assertNull(response.getTimestamp());
            assertEquals(500, response.getStatus()); // Status should remain unchanged
        }
    }

    @Nested
    @DisplayName("JSON Serialization Tests")
    class JsonSerializationTests {

        @Test
        @DisplayName("Should serialize complete ErrorResponse correctly")
        void serialize_CompleteResponse_ShouldIncludeAllFields() throws Exception {
            // Given
            ErrorResponse response = new ErrorResponse(404, "Not Found", "Resource not found", "2024-01-01T10:00:00Z");

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"status\":404"));
            assertTrue(json.contains("\"message\":\"Not Found\""));
            assertTrue(json.contains("\"details\":\"Resource not found\""));
            assertTrue(json.contains("\"timestamp\":\"2024-01-01T10:00:00Z\""));
        }

        @Test
        @DisplayName("Should serialize ErrorResponse with null values")
        void serialize_WithNullValues_ShouldHandleCorrectly() throws Exception {
            // Given
            ErrorResponse response = new ErrorResponse(500, "Server Error", null, null);

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"status\":500"));
            assertTrue(json.contains("\"message\":\"Server Error\""));
            assertTrue(json.contains("\"details\":null"));
            assertTrue(json.contains("\"timestamp\":null"));
        }

        @Test
        @DisplayName("Should deserialize JSON to ErrorResponse correctly")
        void deserialize_ValidJson_ShouldCreateCorrectObject() throws Exception {
            // Given
            String json = """
                {
                    "status": 400,
                    "message": "Bad Request",
                    "details": "Invalid input parameters",
                    "timestamp": "2024-01-01T10:00:00Z"
                }
                """;

            // When
            ErrorResponse response = objectMapper.readValue(json, ErrorResponse.class);

            // Then
            assertEquals(400, response.getStatus());
            assertEquals("Bad Request", response.getMessage());
            assertEquals("Invalid input parameters", response.getDetails());
            assertEquals("2024-01-01T10:00:00Z", response.getTimestamp());
        }

        @Test
        @DisplayName("Should handle missing fields during deserialization")
        void deserialize_IncompleteJson_ShouldHandleDefaults() throws Exception {
            // Given
            String json = """
                {
                    "status": 404,
                    "message": "Not Found"
                }
                """;

            // When
            ErrorResponse response = objectMapper.readValue(json, ErrorResponse.class);

            // Then
            assertEquals(404, response.getStatus());
            assertEquals("Not Found", response.getMessage());
            assertNull(response.getDetails());
            assertNull(response.getTimestamp());
        }

        @Test
        @DisplayName("Should handle special characters in message and details")
        void serialize_SpecialCharacters_ShouldBeHandledCorrectly() throws Exception {
            // Given
            ErrorResponse response = new ErrorResponse(
                422,
                "Unprocessable Entity: Invalid data",
                "Field 'email' contains invalid characters: <>&\"",
                "2024-01-01T10:00:00Z"
            );

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"message\":\"Unprocessable Entity: Invalid data\""));
            assertTrue(json.contains("\"details\":\"Field 'email' contains invalid characters: <>&\\\"\""));
        }
    }

    @Nested
    @DisplayName("HTTP Status Code Tests")
    class HttpStatusTests {

        @Test
        @DisplayName("Should handle common HTTP status codes")
        void statusCodes_CommonCodes_ShouldBeHandledCorrectly() {
            // Test various common HTTP status codes
            int[] statusCodes = {200, 201, 400, 401, 403, 404, 422, 500, 502, 503};

            for (int statusCode : statusCodes) {
                ErrorResponse response = new ErrorResponse();
                response.setStatus(statusCode);
                assertEquals(statusCode, response.getStatus());
            }
        }

        @ParameterizedTest
        @ValueSource(ints = {-1, 0, 999, 2000})
        @DisplayName("Should handle edge case status codes")
        void statusCodes_EdgeCases_ShouldBeHandledCorrectly(int statusCode) {
            // Given
            ErrorResponse response = new ErrorResponse();

            // When
            response.setStatus(statusCode);

            // Then
            assertEquals(statusCode, response.getStatus());
        }
    }

    @Nested
    @DisplayName("Message Content Tests")
    class MessageContentTests {

        @Test
        @DisplayName("Should handle various message lengths")
        void messageContent_DifferentLengths_ShouldBeHandledCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse();

            // Very short message
            response.setMessage("Error");
            assertEquals("Error", response.getMessage());

            // Long message
            String longMessage = "This is a very long error message that contains detailed information about what went wrong and how to potentially fix it. It includes multiple sentences and provides comprehensive context.";
            response.setMessage(longMessage);
            assertEquals(longMessage, response.getMessage());

            // Empty string
            response.setMessage("");
            assertEquals("", response.getMessage());
        }

        @Test
        @DisplayName("Should handle special characters in messages")
        void messageContent_SpecialCharacters_ShouldBeHandledCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse();

            // Messages with special characters
            String[] specialMessages = {
                "Error: Invalid JSON format - expected '{' but found '['",
                "Database connection failed: timeout after 30s",
                "Validation failed: field 'price' must be > 0",
                "Access denied: insufficient permissions for user 'admin'"
            };

            for (String message : specialMessages) {
                response.setMessage(message);
                assertEquals(message, response.getMessage());
            }
        }

        @Test
        @DisplayName("Should handle multi-line messages")
        void messageContent_MultiLine_ShouldBeHandledCorrectly() {
            // Given
            String multiLineMessage = "Validation failed:\n" +
                                   "- Email format is invalid\n" +
                                   "- Password is too weak\n" +
                                   "- Username already exists";

            ErrorResponse response = new ErrorResponse();

            // When
            response.setMessage(multiLineMessage);

            // Then
            assertEquals(multiLineMessage, response.getMessage());
        }
    }

    @Nested
    @DisplayName("Timestamp Format Tests")
    class TimestampFormatTests {

        @Test
        @DisplayName("Should handle different timestamp formats")
        void timestamp_DifferentFormats_ShouldBeHandledCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse();

            // Test different timestamp formats
            String[] timestamps = {
                "2024-01-01T10:00:00Z",
                "2024-01-01T10:00:00.123Z",
                "2024-01-01T10:00:00+02:00",
                "2024-01-01T10:00:00.123+02:00",
                "2024-01-01 10:00:00",
                "2024/01/01 10:00:00"
            };

            for (String timestamp : timestamps) {
                response.setTimestamp(timestamp);
                assertEquals(timestamp, response.getTimestamp());
            }
        }

        @Test
        @DisplayName("Should handle empty and null timestamps")
        void timestamp_EmptyAndNull_ShouldBeHandledCorrectly() {
            // Given
            ErrorResponse response = new ErrorResponse();

            // Empty string
            response.setTimestamp("");
            assertEquals("", response.getTimestamp());

            // Null
            response.setTimestamp(null);
            assertNull(response.getTimestamp());
        }
    }

    @Nested
    @DisplayName("Integration Tests")
    class IntegrationTests {

        @Test
        @DisplayName("Should create complete error response for common scenarios")
        void integration_CommonScenarios_ShouldWorkCorrectly() {
            // Test 404 Not Found scenario
            ErrorResponse notFound = new ErrorResponse(404, "Not Found", "The requested resource was not found", "2024-01-01T10:00:00Z");
            assertEquals(404, notFound.getStatus());
            assertEquals("Not Found", notFound.getMessage());
            assertEquals("The requested resource was not found", notFound.getDetails());

            // Test 400 Bad Request scenario
            ErrorResponse badRequest = new ErrorResponse(400, "Bad Request", "Invalid input parameters", "2024-01-01T10:00:00Z");
            assertEquals(400, badRequest.getStatus());
            assertEquals("Bad Request", badRequest.getMessage());

            // Test 500 Internal Server Error scenario
            ErrorResponse serverError = new ErrorResponse(500, "Internal Server Error", "An unexpected error occurred", "2024-01-01T10:00:00Z");
            assertEquals(500, serverError.getStatus());
            assertEquals("Internal Server Error", serverError.getMessage());
        }

        @Test
        @DisplayName("Should maintain object integrity through serialization round-trip")
        void integration_SerializationRoundTrip_ShouldMaintainIntegrity() throws Exception {
            // Given
            ErrorResponse original = createTestErrorResponse();

            // When - Serialize and then deserialize
            String json = objectMapper.writeValueAsString(original);
            ErrorResponse deserialized = objectMapper.readValue(json, ErrorResponse.class);

            // Then - All fields should match
            assertEquals(original.getStatus(), deserialized.getStatus());
            assertEquals(original.getMessage(), deserialized.getMessage());
            assertEquals(original.getDetails(), deserialized.getDetails());
            assertEquals(original.getTimestamp(), deserialized.getTimestamp());
        }

        @Test
        @DisplayName("Should handle multiple round-trip serializations")
        void integration_MultipleRoundTrips_ShouldMaintainConsistency() throws Exception {
            // Given
            ErrorResponse original = createTestErrorResponse();

            // When - Multiple serialize/deserialize cycles
            String json1 = objectMapper.writeValueAsString(original);
            ErrorResponse deserialized1 = objectMapper.readValue(json1, ErrorResponse.class);

            String json2 = objectMapper.writeValueAsString(deserialized1);
            ErrorResponse deserialized2 = objectMapper.readValue(json2, ErrorResponse.class);

            // Then - Should maintain consistency across multiple cycles
            assertEquals(original.getStatus(), deserialized2.getStatus());
            assertEquals(original.getMessage(), deserialized2.getMessage());
            assertEquals(original.getDetails(), deserialized2.getDetails());
            assertEquals(original.getTimestamp(), deserialized2.getTimestamp());

            // JSON should be identical
            assertEquals(json1, json2);
        }
    }
}
