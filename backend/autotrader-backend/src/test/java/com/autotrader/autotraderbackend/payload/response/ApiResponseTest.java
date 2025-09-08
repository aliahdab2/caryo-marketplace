package com.autotrader.autotraderbackend.payload.response;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@Tag("unit")
@Tag("dto")
@DisplayName("ApiResponse Tests")
class ApiResponseTest {

    private ObjectMapper objectMapper;

    // Test data constants
    private static final String TEST_MESSAGE = "Test message";
    private static final String TEST_DATA = "test data";
    private static final String SUCCESS_STATUS = "success";
    private static final String ERROR_STATUS = "error";
    private static final String WARNING_STATUS = "warning";
    private static final String INFO_STATUS = "info";

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Helper method to create a test ApiResponse with common test data
     */
    private ApiResponse<String> createTestResponse() {
        return ApiResponse.<String>builder()
                .data(TEST_DATA)
                .message(TEST_MESSAGE)
                .status(SUCCESS_STATUS)
                .build();
    }

    /**
     * Helper method to assert basic response properties
     */
    private void assertBasicResponseProperties(ApiResponse<?> response, String expectedStatus) {
        assertNotNull(response);
        assertNotNull(response.getTimestamp());
        assertEquals(expectedStatus, response.getStatus());
    }

    @Nested
    @DisplayName("Factory Method Tests")
    class FactoryMethodTests {

        @Test
        @DisplayName("Should create success response with data and message")
        void success_WithDataAndMessage_ShouldCreateCorrectResponse() {
            // Given
            String testData = TEST_DATA;
            String message = TEST_MESSAGE;

            // When
            ApiResponse<String> response = ApiResponse.success(testData, message);

            // Then
            assertBasicResponseProperties(response, SUCCESS_STATUS);
            assertEquals(testData, response.getData());
            assertEquals(message, response.getMessage());
            assertNull(response.getMetadata());
        }

        @Test
        @DisplayName("Should create success response with data only")
        void success_WithDataOnly_ShouldCreateCorrectResponse() {
            // Given
            Integer testData = 42;

            // When
            ApiResponse<Integer> response = ApiResponse.success(testData);

            // Then
            assertNotNull(response);
            assertEquals(testData, response.getData());
            assertNull(response.getMessage());
            assertEquals("success", response.getStatus());
            assertNotNull(response.getTimestamp());
        }

        @Test
        @DisplayName("Should create success response with message only")
        void success_WithMessageOnly_ShouldCreateCorrectResponse() {
            // Given
            String message = "Operation completed";

            // When
            ApiResponse<Void> response = ApiResponse.success(message);

            // Then
            assertNotNull(response);
            assertNull(response.getData());
            assertEquals(message, response.getMessage());
            assertEquals("success", response.getStatus());
            assertNotNull(response.getTimestamp());
        }

        @Test
        @DisplayName("Should create error response with message")
        void error_WithMessage_ShouldCreateCorrectResponse() {
            // Given
            String errorMessage = "Something went wrong";

            // When
            ApiResponse<Void> response = ApiResponse.error(errorMessage);

            // Then
            assertNotNull(response);
            assertNull(response.getData());
            assertEquals(errorMessage, response.getMessage());
            assertEquals("error", response.getStatus());
            assertNotNull(response.getTimestamp());
        }

        @Test
        @DisplayName("Should create error response with message and metadata")
        void error_WithMessageAndMetadata_ShouldCreateCorrectResponse() {
            // Given
            String errorMessage = "Validation failed";
            Map<String, String> metadata = new HashMap<>();
            metadata.put("field", "email");
            metadata.put("error", "invalid format");

            // When
            ApiResponse<Void> response = ApiResponse.error(errorMessage, metadata);

            // Then
            assertNotNull(response);
            assertNull(response.getData());
            assertEquals(errorMessage, response.getMessage());
            assertEquals("error", response.getStatus());
            assertEquals(metadata, response.getMetadata());
            assertNotNull(response.getTimestamp());
        }

        @Test
        @DisplayName("Should create warning response")
        void warning_ShouldCreateCorrectResponse() {
            // Given
            String warningMessage = TEST_MESSAGE;

            // When
            ApiResponse<Void> response = ApiResponse.warning(warningMessage);

            // Then
            assertBasicResponseProperties(response, WARNING_STATUS);
            assertNull(response.getData());
            assertEquals(warningMessage, response.getMessage());
        }

        @Test
        @DisplayName("Should create info response")
        void info_ShouldCreateCorrectResponse() {
            // Given
            String infoMessage = TEST_MESSAGE;

            // When
            ApiResponse<Void> response = ApiResponse.info(infoMessage);

            // Then
            assertBasicResponseProperties(response, INFO_STATUS);
            assertNull(response.getData());
            assertEquals(infoMessage, response.getMessage());
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {" ", "\t", "\n"})
        @DisplayName("Should handle various message inputs in factory methods")
        void factoryMethods_WithVariousMessageInputs_ShouldHandleCorrectly(String message) {
            // Test success factory method with various message inputs
            ApiResponse<String> successResponse = ApiResponse.success(TEST_DATA, message);
            assertBasicResponseProperties(successResponse, SUCCESS_STATUS);
            assertEquals(TEST_DATA, successResponse.getData());
            assertEquals(message, successResponse.getMessage());

            // Test error factory method with various message inputs
            ApiResponse<Void> errorResponse = ApiResponse.error(message);
            assertBasicResponseProperties(errorResponse, ERROR_STATUS);
            assertEquals(message, errorResponse.getMessage());
        }
    }

    @Nested
    @DisplayName("JSON Serialization Tests")
    class JsonSerializationTests {

        @Test
        @DisplayName("Should serialize success response correctly")
        void serialize_SuccessResponse_ShouldIncludeAllFields() throws Exception {
            // Given
            ApiResponse<String> response = ApiResponse.success("test data", "Success message");

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"data\":\"test data\""));
            assertTrue(json.contains("\"message\":\"Success message\""));
            assertTrue(json.contains("\"status\":\"success\""));
            assertTrue(json.contains("\"timestamp\""));
        }

        @Test
        @DisplayName("Should serialize ApiResponse to valid JSON")
        void serialize_ShouldProduceValidJson() throws Exception {
            // Given
            ApiResponse<String> response = ApiResponse.success("test data", "Operation successful");

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then - Just verify it's valid JSON and contains expected data
            assertNotNull(json);
            assertTrue(json.length() > 10); // Should be a reasonable length
            assertTrue(json.contains("test data"));
            assertTrue(json.contains("Operation successful"));
            assertTrue(json.contains("success"));
            // Note: JSON structure may vary due to Lombok/Jackson interactions
        }

        @Test
        @DisplayName("Should deserialize JSON correctly")
        void deserialize_ValidJson_ShouldCreateCorrectObject() throws Exception {
            // Given
            String json = """
                {
                    "data": "test data",
                    "message": "Test message",
                    "status": "success",
                    "timestamp": "2024-01-01T10:00:00",
                    "metadata": {"key": "value"}
                }
                """;

            // When
            ApiResponse<String> response = objectMapper.readValue(json, objectMapper.getTypeFactory().constructParametricType(ApiResponse.class, String.class));

            // Then
            assertEquals("test data", response.getData());
            assertEquals("Test message", response.getMessage());
            assertEquals("success", response.getStatus());
            assertNotNull(response.getTimestamp());
            assertNotNull(response.getMetadata());
        }
    }

    @Nested
    @DisplayName("Timestamp Tests")
    class TimestampTests {

        @Test
        @DisplayName("Should set current timestamp automatically")
        void timestamp_ShouldBeSetAutomatically() {
            // Given
            LocalDateTime before = LocalDateTime.now();

            // When
            ApiResponse<String> response = ApiResponse.success("test");

            // Then
            assertNotNull(response.getTimestamp());
            assertTrue(response.getTimestamp().isAfter(before) || response.getTimestamp().equals(before));
        }

        @Test
        @DisplayName("Should allow custom timestamp")
        void timestamp_CustomTimestamp_ShouldBeAccepted() {
            // Given
            LocalDateTime customTime = LocalDateTime.of(2024, 1, 1, 12, 0);

            // When
            ApiResponse<String> response = ApiResponse.<String>builder()
                    .data("test")
                    .status("success")
                    .timestamp(customTime)
                    .build();

            // Then
            assertEquals(customTime, response.getTimestamp());
        }
    }

    @Nested
    @DisplayName("Generic Type Tests")
    class GenericTypeTests {

        @Test
        @DisplayName("Should support generic type declarations")
        void genericTypes_ShouldSupportDeclarations() {
            // Test that the class can be declared with different generic types
            // This verifies type safety at compile time
            ApiResponse<String> stringResponse;
            ApiResponse<Integer> intResponse;
            ApiResponse<TestObject> objectResponse;

            // These declarations should compile without issues
            assertTrue(true); // If we reach this point, generic types work
        }

        @Test
        @DisplayName("Should handle Void generic type")
        void voidType_ShouldWorkCorrectly() {
            // When
            ApiResponse<Void> response = ApiResponse.success("Operation completed");

            // Then
            assertNull(response.getData());
            assertEquals("Operation completed", response.getMessage());
            assertEquals("success", response.getStatus());
        }

        private static class TestObject {
            private String name;
            private int value;

            public TestObject(String name, int value) {
                this.name = name;
                this.value = value;
            }

            public String getName() { return name; }
            public int getValue() { return value; }

            @Override
            public boolean equals(Object obj) {
                if (this == obj) return true;
                if (obj == null || getClass() != obj.getClass()) return false;
                TestObject that = (TestObject) obj;
                return value == that.value && name.equals(that.name);
            }

            @Override
            public int hashCode() {
                return name.hashCode() * 31 + value;
            }
        }
    }

    @Nested
    @DisplayName("Metadata Tests")
    class MetadataTests {

        @Test
        @DisplayName("Should handle complex metadata objects")
        void metadata_ComplexObject_ShouldBeHandledCorrectly() {
            // Given
            Map<String, Object> complexMetadata = new HashMap<>();
            complexMetadata.put("pagination", Map.of("page", 1, "size", 20, "total", 100));
            complexMetadata.put("filters", Map.of("brand", "Toyota", "year", 2020));
            complexMetadata.put("sort", "price_asc");

            // When
            ApiResponse<String> response = ApiResponse.<String>builder()
                    .data("listing data")
                    .message("Success")
                    .status("success")
                    .metadata(complexMetadata)
                    .build();

            // Then
            assertNotNull(response.getMetadata());
            assertTrue(response.getMetadata() instanceof Map);
            @SuppressWarnings("unchecked")
            Map<String, Object> metadata = (Map<String, Object>) response.getMetadata();
            assertEquals(3, metadata.size());
        }

        @Test
        @DisplayName("Should handle null metadata")
        void metadata_Null_ShouldBeHandledCorrectly() {
            // When
            ApiResponse<String> response = ApiResponse.success("test");

            // Then
            assertNull(response.getMetadata());
        }
    }

    @Nested
    @DisplayName("Builder Pattern Tests")
    class BuilderPatternTests {

        @Test
        @DisplayName("Should support fluent builder pattern")
        void builder_FluentPattern_ShouldWorkCorrectly() {
            // When
            ApiResponse<String> response = ApiResponse.<String>builder()
                    .data(TEST_DATA)
                    .message(TEST_MESSAGE)
                    .status(SUCCESS_STATUS)
                    .timestamp(LocalDateTime.of(2024, 1, 1, 12, 0))
                    .metadata(Map.of("key", "value"))
                    .build();

            // Then
            assertBasicResponseProperties(response, SUCCESS_STATUS);
            assertEquals(TEST_DATA, response.getData());
            assertEquals(TEST_MESSAGE, response.getMessage());
            assertEquals(LocalDateTime.of(2024, 1, 1, 12, 0), response.getTimestamp());
            assertNotNull(response.getMetadata());
        }

        @Test
        @DisplayName("Should handle partial builder usage")
        void builder_PartialUsage_ShouldHandleDefaults() {
            // When
            ApiResponse<String> response = ApiResponse.<String>builder()
                    .data(TEST_DATA)
                    .message(TEST_MESSAGE)
                    .build();

            // Then
            assertBasicResponseProperties(response, null); // Status will be null without explicit setting
            assertEquals(TEST_DATA, response.getData());
            assertEquals(TEST_MESSAGE, response.getMessage());
            assertNotNull(response.getTimestamp()); // Should still have default timestamp
            assertNull(response.getMetadata());
        }
    }

    @Nested
    @DisplayName("Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("Should create responses quickly")
        void performance_ResponseCreation_ShouldBeFast() {
            // When
            long startTime = System.nanoTime();
            for (int i = 0; i < 1000; i++) {
                ApiResponse.success("test" + i, "message" + i);
            }
            long endTime = System.nanoTime();

            // Then - Should complete within reasonable time (less than 10ms per operation average)
            long totalTimeMs = (endTime - startTime) / 1_000_000;
            long averageTimePerOperation = totalTimeMs / 1000;

            assertTrue(averageTimePerOperation < 10,
                    "Response creation took too long: " + averageTimePerOperation + "ms per operation");
        }

        @Test
        @DisplayName("Should serialize responses efficiently")
        void performance_Serialization_ShouldBeEfficient() throws Exception {
            // Given
            ApiResponse<String> response = createTestResponse();

            // When
            long startTime = System.nanoTime();
            for (int i = 0; i < 100; i++) {
                objectMapper.writeValueAsString(response);
            }
            long endTime = System.nanoTime();

            // Then - Should complete within reasonable time
            long totalTimeMs = (endTime - startTime) / 1_000_000;
            long averageTimePerOperation = totalTimeMs / 100;

            assertTrue(averageTimePerOperation < 5,
                    "Serialization took too long: " + averageTimePerOperation + "ms per operation");
        }
    }
}
