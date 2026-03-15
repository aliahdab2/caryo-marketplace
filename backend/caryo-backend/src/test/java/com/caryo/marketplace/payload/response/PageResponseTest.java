package com.caryo.marketplace.payload.response;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
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
@Tag("pagination")
@DisplayName("PageResponse Tests")
class PageResponseTest {

    private ObjectMapper objectMapper;

    // Test data constants
    private static final int TEST_PAGE = 0;
    private static final int TEST_SIZE = 10;
    private static final long TEST_TOTAL_ELEMENTS = 25L;
    private static final int TEST_TOTAL_PAGES = 3;
    private static final boolean TEST_LAST = false;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    /**
     * Helper method to create a basic PageResponse for testing
     */
    private <T> PageResponse<T> createBasicPageResponse(List<T> content) {
        PageResponse<T> response = new PageResponse<>();
        response.setContent(content);
        response.setPage(TEST_PAGE);
        response.setSize(TEST_SIZE);
        response.setTotalElements(TEST_TOTAL_ELEMENTS);
        response.setTotalPages(TEST_TOTAL_PAGES);
        response.setLast(TEST_LAST);
        return response;
    }

    /**
     * Helper method to create test content
     */
    private List<String> createTestContent(int size) {
        List<String> content = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            content.add("Item " + i);
        }
        return content;
    }

    /**
     * Helper method to assert basic PageResponse properties
     */
    private <T> void assertBasicPageProperties(PageResponse<T> response, List<T> expectedContent, int expectedPage, int expectedSize) {
        assertNotNull(response);
        assertEquals(expectedContent, response.getContent());
        assertEquals(expectedPage, response.getPage());
        assertEquals(expectedSize, response.getSize());
    }

    @Nested
    @DisplayName("Basic Constructor Tests")
    class BasicConstructorTests {

        @Test
        @DisplayName("Should create PageResponse with no-args constructor")
        void noArgsConstructor_ShouldCreateEmptyResponse() {
            // When
            PageResponse<String> response = new PageResponse<>();

            // Then
            assertNotNull(response);
            assertNull(response.getContent());
            assertEquals(0, response.getPage());
            assertEquals(0, response.getSize());
            assertEquals(0L, response.getTotalElements());
            assertEquals(0, response.getTotalPages());
            assertFalse(response.isLast());
        }

        @Test
        @DisplayName("Should create PageResponse with all-args constructor")
        void allArgsConstructor_ShouldCreateCompleteResponse() {
            // Given
            List<String> content = createTestContent(5);

            // When
            PageResponse<String> response = new PageResponse<>(
                content, TEST_PAGE, TEST_SIZE, TEST_TOTAL_ELEMENTS, TEST_TOTAL_PAGES, TEST_LAST
            );

            // Then
            assertBasicPageProperties(response, content, TEST_PAGE, TEST_SIZE);
            assertEquals(TEST_TOTAL_ELEMENTS, response.getTotalElements());
            assertEquals(TEST_TOTAL_PAGES, response.getTotalPages());
            assertEquals(TEST_LAST, response.isLast());
        }
    }

    @Nested
    @DisplayName("Generic Type Tests")
    class GenericTypeTests {

        @Test
        @DisplayName("Should support generic type with String content")
        void stringType_ShouldWorkCorrectly() {
            // Given
            List<String> content = Arrays.asList("Item 1", "Item 2", "Item 3");

            // When
            PageResponse<String> response = createBasicPageResponse(content);

            // Then
            assertBasicPageProperties(response, content, TEST_PAGE, TEST_SIZE);
            assertEquals("Item 1", response.getContent().get(0));
            assertEquals("Item 2", response.getContent().get(1));
        }

        @Test
        @DisplayName("Should support generic type with Integer content")
        void integerType_ShouldWorkCorrectly() {
            // Given
            List<Integer> content = Arrays.asList(1, 2, 3, 4, 5);

            // When
            PageResponse<Integer> response = createBasicPageResponse(content);

            // Then
            assertBasicPageProperties(response, content, TEST_PAGE, TEST_SIZE);
            assertEquals(1, response.getContent().get(0));
            assertEquals(5, response.getContent().get(4));
        }

        @Test
        @DisplayName("Should support generic type with custom object content")
        void customObjectType_ShouldWorkCorrectly() {
            // Given
            List<TestObject> content = Arrays.asList(
                new TestObject("Object1", 100),
                new TestObject("Object2", 200)
            );

            // When
            PageResponse<TestObject> response = createBasicPageResponse(content);

            // Then
            assertBasicPageProperties(response, content, TEST_PAGE, TEST_SIZE);
            assertEquals("Object1", response.getContent().get(0).getName());
            assertEquals(200, response.getContent().get(1).getValue());
        }

        /**
         * Simple test object for generic type testing
         */
        private static class TestObject {
            private final String name;
            private final int value;

            public TestObject(String name, int value) {
                this.name = name;
                this.value = value;
            }

            public String getName() { return name; }
            public int getValue() { return value; }
        }
    }

    @Nested
    @DisplayName("Pagination Logic Tests")
    class PaginationLogicTests {

        @Test
        @DisplayName("Should handle first page correctly")
        void firstPage_ShouldHandleCorrectly() {
            // Given
            List<String> content = createTestContent(10);

            // When
            PageResponse<String> response = new PageResponse<>();
            response.setContent(content);
            response.setPage(0);
            response.setSize(10);
            response.setTotalElements(100L);
            response.setTotalPages(10);
            response.setLast(false);

            // Then
            assertEquals(0, response.getPage());
            assertEquals(10, response.getSize());
            assertEquals(100L, response.getTotalElements());
            assertEquals(10, response.getTotalPages());
            assertFalse(response.isLast());
        }

        @Test
        @DisplayName("Should handle last page correctly")
        void lastPage_ShouldHandleCorrectly() {
            // Given
            List<String> content = createTestContent(5); // Last page has fewer items

            // When
            PageResponse<String> response = new PageResponse<>();
            response.setContent(content);
            response.setPage(4);
            response.setSize(10);
            response.setTotalElements(45L);
            response.setTotalPages(5);
            response.setLast(true);

            // Then
            assertEquals(4, response.getPage());
            assertEquals(10, response.getSize());
            assertEquals(45L, response.getTotalElements());
            assertEquals(5, response.getTotalPages());
            assertTrue(response.isLast());
        }

        @Test
        @DisplayName("Should handle single page correctly")
        void singlePage_ShouldHandleCorrectly() {
            // Given
            List<String> content = createTestContent(5);

            // When
            PageResponse<String> response = new PageResponse<>();
            response.setContent(content);
            response.setPage(0);
            response.setSize(10);
            response.setTotalElements(5L);
            response.setTotalPages(1);
            response.setLast(true);

            // Then
            assertEquals(0, response.getPage());
            assertEquals(5, response.getContent().size());
            assertEquals(5L, response.getTotalElements());
            assertEquals(1, response.getTotalPages());
            assertTrue(response.isLast());
        }

        @Test
        @DisplayName("Should handle empty result set correctly")
        void emptyResult_ShouldHandleCorrectly() {
            // When
            PageResponse<String> response = new PageResponse<>();
            response.setContent(new ArrayList<>());
            response.setPage(0);
            response.setSize(10);
            response.setTotalElements(0L);
            response.setTotalPages(0);
            response.setLast(true);

            // Then
            assertNotNull(response.getContent());
            assertTrue(response.getContent().isEmpty());
            assertEquals(0L, response.getTotalElements());
            assertEquals(0, response.getTotalPages());
            assertTrue(response.isLast());
        }
    }

    @Nested
    @DisplayName("JSON Serialization Tests")
    class JsonSerializationTests {

        @Test
        @DisplayName("Should serialize PageResponse to valid JSON")
        void serialize_ShouldCreateValidJson() throws Exception {
            // Given
            List<String> content = Arrays.asList("Item 1", "Item 2");
            PageResponse<String> response = createBasicPageResponse(content);

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"content\":"));
            assertTrue(json.contains("\"page\":0"));
            assertTrue(json.contains("\"size\":10"));
            assertTrue(json.contains("\"totalElements\":25"));
            assertTrue(json.contains("\"totalPages\":3"));
            assertTrue(json.contains("\"last\":false"));
            assertTrue(json.contains("Item 1"));
            assertTrue(json.contains("Item 2"));
        }

        @Test
        @DisplayName("Should deserialize JSON to PageResponse correctly")
        void deserialize_ShouldCreateCorrectObject() throws Exception {
            // Given
            String json = """
                {
                    "content": ["Item 1", "Item 2", "Item 3"],
                    "page": 1,
                    "size": 20,
                    "totalElements": 50,
                    "totalPages": 3,
                    "last": false
                }
                """;

            // When
            PageResponse<String> response = objectMapper.readValue(json,
                new TypeReference<PageResponse<String>>() {});

            // Then
            assertNotNull(response);
            assertEquals(3, response.getContent().size());
            assertEquals("Item 1", response.getContent().get(0));
            assertEquals(1, response.getPage());
            assertEquals(20, response.getSize());
            assertEquals(50L, response.getTotalElements());
            assertEquals(3, response.getTotalPages());
            assertFalse(response.isLast());
        }

        @Test
        @DisplayName("Should handle empty content in JSON serialization")
        void serialize_EmptyContent_ShouldWorkCorrectly() throws Exception {
            // Given
            PageResponse<String> response = new PageResponse<>();
            response.setContent(new ArrayList<>());
            response.setPage(0);
            response.setSize(10);
            response.setTotalElements(0L);
            response.setTotalPages(0);
            response.setLast(true);

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"content\":[]"));
            assertTrue(json.contains("\"totalElements\":0"));
            assertTrue(json.contains("\"last\":true"));
        }
    }

    @Nested
    @DisplayName("Edge Cases and Validation Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle null content gracefully")
        void nullContent_ShouldHandleGracefully() {
            // When
            PageResponse<String> response = new PageResponse<>();
            response.setContent(null);
            response.setPage(0);
            response.setSize(10);

            // Then
            assertNull(response.getContent());
            assertEquals(0, response.getPage());
            assertEquals(10, response.getSize());
        }

        @Test
        @DisplayName("Should handle negative page numbers")
        void negativePage_ShouldHandleCorrectly() {
            // When
            PageResponse<String> response = new PageResponse<>();
            response.setPage(-1);
            response.setSize(10);

            // Then
            assertEquals(-1, response.getPage());
            assertEquals(10, response.getSize());
        }

        @Test
        @DisplayName("Should handle zero size")
        void zeroSize_ShouldHandleCorrectly() {
            // When
            PageResponse<String> response = new PageResponse<>();
            response.setPage(0);
            response.setSize(0);
            response.setTotalElements(100L);

            // Then
            assertEquals(0, response.getPage());
            assertEquals(0, response.getSize());
            assertEquals(100L, response.getTotalElements());
        }

        @ParameterizedTest
        @ValueSource(ints = {0, 1, 10, 50, 100, 1000})
        @DisplayName("Should handle various page sizes")
        void variousPageSizes_ShouldHandleCorrectly(int size) {
            // When
            PageResponse<String> response = new PageResponse<>();
            response.setSize(size);

            // Then
            assertEquals(size, response.getSize());
        }

        @ParameterizedTest
        @ValueSource(longs = {0L, 1L, 100L, 1000L, 10000L, 1000000L})
        @DisplayName("Should handle various total element counts")
        void variousTotalElements_ShouldHandleCorrectly(long totalElements) {
            // When
            PageResponse<String> response = new PageResponse<>();
            response.setTotalElements(totalElements);

            // Then
            assertEquals(totalElements, response.getTotalElements());
        }
    }

    @Nested
    @DisplayName("Integration Tests")
    class IntegrationTests {

        @Test
        @DisplayName("Should create complete PageResponse with all properties")
        void completePageResponse_ShouldWorkCorrectly() {
            // Given - Create a complete page response
            List<String> content = createTestContent(8);

            // When
            PageResponse<String> response = new PageResponse<>();
            response.setContent(content);
            response.setPage(2);
            response.setSize(10);
            response.setTotalElements(85L);
            response.setTotalPages(9);
            response.setLast(false);

            // Then - Verify all properties
            assertEquals(content, response.getContent());
            assertEquals(8, response.getContent().size());
            assertEquals(2, response.getPage());
            assertEquals(10, response.getSize());
            assertEquals(85L, response.getTotalElements());
            assertEquals(9, response.getTotalPages());
            assertFalse(response.isLast());
        }

        @Test
        @DisplayName("Should maintain data integrity through serialization round-trip")
        void serializationRoundTrip_ShouldMaintainIntegrity() throws Exception {
            // Given
            List<String> originalContent = Arrays.asList("A", "B", "C");
            PageResponse<String> original = new PageResponse<>(
                originalContent, 1, 15, 45L, 3, false
            );

            // When - Serialize and deserialize
            String json = objectMapper.writeValueAsString(original);
            PageResponse<String> deserialized = objectMapper.readValue(json,
                new TypeReference<PageResponse<String>>() {});

            // Then - Verify all data is preserved
            assertEquals(original.getContent(), deserialized.getContent());
            assertEquals(original.getPage(), deserialized.getPage());
            assertEquals(original.getSize(), deserialized.getSize());
            assertEquals(original.getTotalElements(), deserialized.getTotalElements());
            assertEquals(original.getTotalPages(), deserialized.getTotalPages());
            assertEquals(original.isLast(), deserialized.isLast());
        }
    }
}
