package com.autotrader.autotraderbackend.payload.response;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Tag("unit")
@Tag("dto")
@Tag("complex")
@DisplayName("CarListingResponse Tests")
class CarListingResponseTest {

    private ObjectMapper objectMapper;

    // Test data constants
    private static final Long TEST_ID = 1L;
    private static final String TEST_TITLE = "Test Car Listing";
    private static final Integer TEST_MODEL_YEAR = 2020;
    private static final Integer TEST_MILEAGE = 50000;
    private static final BigDecimal TEST_PRICE = new BigDecimal("25000.00");
    private static final String TEST_CURRENCY = "USD";
    private static final String TEST_DESCRIPTION = "Well-maintained test car";
    private static final LocalDateTime TEST_CREATED_AT = LocalDateTime.of(2024, 1, 1, 12, 0);

    // Nested object constants
    private static final Long BRAND_ID = 1L;
    private static final Long MODEL_ID = 1L;
    private static final Long TRANSMISSION_ID = 1L;
    private static final Long FUEL_TYPE_ID = 1L;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Helper method to create a basic CarListingResponse for testing
     */
    private CarListingResponse createBasicTestResponse() {
        CarListingResponse response = new CarListingResponse();
        response.setId(TEST_ID);
        response.setTitle(TEST_TITLE);
        response.setModelYear(TEST_MODEL_YEAR);
        response.setMileage(TEST_MILEAGE);
        response.setPrice(TEST_PRICE);
        response.setCurrency(TEST_CURRENCY);
        response.setDescription(TEST_DESCRIPTION);
        response.setCreatedAt(TEST_CREATED_AT);
        response.setApproved(true);
        response.setIsSold(false);
        response.setIsArchived(false);
        response.setIsUserActive(true);
        response.setSellerId(100L);
        response.setSellerUsername("testuser");
        return response;
    }

    /**
     * Helper method to create nested response objects
     */
    private CarBrandResponse createTestBrand() {
        return new CarBrandResponse(BRAND_ID, "Toyota", "toyota", "Toyota", "تويوتا", true);
    }

    private CarModelResponse createTestModel() {
        return new CarModelResponse(MODEL_ID, "Camry", "camry", "Camry", "كامري", true, BRAND_ID);
    }

    private TransmissionResponse createTestTransmission() {
        return new TransmissionResponse(TRANSMISSION_ID, "Automatic", "automatic", "Automatic", "أوتوماتيكي");
    }

    private FuelTypeResponse createTestFuelType() {
        return new FuelTypeResponse(FUEL_TYPE_ID, "Gasoline", "gasoline", "Gasoline", "بنزين");
    }

    private ListingMediaResponse createTestMedia() {
        ListingMediaResponse media = new ListingMediaResponse();
        media.setId(1L);
        media.setUrl("https://example.com/image.jpg");
        media.setFileKey("listings/1/image.jpg");
        media.setFileName("car-image.jpg");
        media.setContentType("image/jpeg");
        media.setSize(1024000L);
        media.setSortOrder(1);
        media.setIsPrimary(true);
        media.setMediaType("image");
        return media;
    }

    /**
     * Helper method to assert basic CarListingResponse properties
     */
    private void assertBasicCarListingProperties(CarListingResponse response) {
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
        assertEquals(TEST_TITLE, response.getTitle());
        assertEquals(TEST_MODEL_YEAR, response.getModelYear());
        assertEquals(TEST_MILEAGE, response.getMileage());
        assertEquals(TEST_PRICE, response.getPrice());
        assertEquals(TEST_CURRENCY, response.getCurrency());
        assertEquals(TEST_DESCRIPTION, response.getDescription());
        assertEquals(TEST_CREATED_AT, response.getCreatedAt());
        assertTrue(response.getApproved());
        assertFalse(response.getIsSold());
        assertFalse(response.getIsArchived());
        assertTrue(response.getIsUserActive());
    }

    @Nested
    @DisplayName("Basic Field Tests")
    class BasicFieldTests {

        @Test
        @DisplayName("Should create CarListingResponse with no-args constructor")
        void noArgsConstructor_ShouldCreateEmptyResponse() {
            // When
            CarListingResponse response = new CarListingResponse();

            // Then
            assertNotNull(response);
            assertNull(response.getId());
            assertNull(response.getTitle());
            assertNull(response.getPrice());
            assertNull(response.getCurrency());
            assertNull(response.getDescription());
            assertNull(response.getCreatedAt());
            assertNull(response.getApproved());
            assertNotNull(response.getMedia()); // Media is initialized as new ArrayList<>()
            assertTrue(response.getMedia().isEmpty());
        }

        @Test
        @DisplayName("Should set and get all basic fields correctly")
        void basicFields_GetterSetter_ShouldWorkCorrectly() {
            // Given
            CarListingResponse response = createBasicTestResponse();

            // Then
            assertBasicCarListingProperties(response);
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {" ", "\t", "\n", "Valid Title"})
        @DisplayName("Should handle various title inputs")
        void title_VariousInputs_ShouldHandleCorrectly(String title) {
            // Given
            CarListingResponse response = new CarListingResponse();

            // When
            response.setTitle(title);

            // Then
            assertEquals(title, response.getTitle());
        }

        @Test
        @DisplayName("Should handle different price values")
        void price_DifferentValues_ShouldHandleCorrectly() {
            // Given
            CarListingResponse response = new CarListingResponse();
            BigDecimal[] testPrices = {
                new BigDecimal("0.00"),
                new BigDecimal("1000.50"),
                new BigDecimal("999999.99"),
                new BigDecimal("-100.00") // Though negative prices shouldn't occur in practice
            };

            for (BigDecimal price : testPrices) {
                // When
                response.setPrice(price);

                // Then
                assertEquals(price, response.getPrice());
            }
        }
    }

    @Nested
    @DisplayName("Nested Object Tests")
    class NestedObjectTests {

        @Test
        @DisplayName("Should set and get nested brand object")
        void brand_NestedObject_ShouldWorkCorrectly() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            CarBrandResponse brand = createTestBrand();

            // When
            response.setBrand(brand);

            // Then
            assertNotNull(response.getBrand());
            assertEquals(BRAND_ID, response.getBrand().getId());
            assertEquals("Toyota", response.getBrand().getName());
            assertEquals("toyota", response.getBrand().getSlug());
            assertEquals("Toyota", response.getBrand().getDisplayNameEn());
            assertEquals("تويوتا", response.getBrand().getDisplayNameAr());
            assertTrue(response.getBrand().getIsActive());
        }

        @Test
        @DisplayName("Should set and get nested model object")
        void model_NestedObject_ShouldWorkCorrectly() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            CarModelResponse model = createTestModel();

            // When
            response.setModel(model);

            // Then
            assertNotNull(response.getModel());
            assertEquals(MODEL_ID, response.getModel().getId());
            assertEquals("Camry", response.getModel().getName());
            assertEquals("camry", response.getModel().getSlug());
            assertEquals("Camry", response.getModel().getDisplayNameEn());
            assertEquals("كامري", response.getModel().getDisplayNameAr());
            assertEquals(BRAND_ID, response.getModel().getBrandId());
            assertTrue(response.getModel().getIsActive());
        }

        @Test
        @DisplayName("Should set and get nested transmission object")
        void transmission_NestedObject_ShouldWorkCorrectly() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            TransmissionResponse transmission = createTestTransmission();

            // When
            response.setTransmission(transmission);

            // Then
            assertNotNull(response.getTransmission());
            assertEquals(TRANSMISSION_ID, response.getTransmission().getId());
            assertEquals("Automatic", response.getTransmission().getName());
            assertEquals("automatic", response.getTransmission().getSlug());
            assertEquals("Automatic", response.getTransmission().getDisplayNameEn());
            assertEquals("أوتوماتيكي", response.getTransmission().getDisplayNameAr());
        }

        @Test
        @DisplayName("Should set and get nested fuel type object")
        void fuelType_NestedObject_ShouldWorkCorrectly() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            FuelTypeResponse fuelType = createTestFuelType();

            // When
            response.setFuelType(fuelType);

            // Then
            assertNotNull(response.getFuelType());
            assertEquals(FUEL_TYPE_ID, response.getFuelType().getId());
            assertEquals("Gasoline", response.getFuelType().getName());
            assertEquals("gasoline", response.getFuelType().getSlug());
            assertEquals("Gasoline", response.getFuelType().getDisplayNameEn());
            assertEquals("بنزين", response.getFuelType().getDisplayNameAr());
        }
    }

    @Nested
    @DisplayName("Deprecated Method Tests")
    class DeprecatedMethodTests {

        @Test
        @DisplayName("Should delegate brand name getters to nested object when available")
        @SuppressWarnings("deprecation") // Intentionally testing deprecated methods
        void deprecatedBrandGetters_ShouldDelegateToNestedObject() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            CarBrandResponse brand = createTestBrand();
            response.setBrand(brand);

            // When & Then - Test deprecated getters delegate to nested object
            assertEquals("Toyota", response.getBrandNameEn());
            assertEquals("تويوتا", response.getBrandNameAr());
        }

        @Test
        @DisplayName("Should fall back to deprecated fields when nested object is null")
        @SuppressWarnings("deprecation") // Intentionally testing deprecated methods
        void deprecatedBrandGetters_ShouldFallbackToDeprecatedFields() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            response.setBrandNameEn("Fallback Brand EN");
            response.setBrandNameAr("Fallback Brand AR");

            // When & Then - Test deprecated getters fall back to deprecated fields
            assertEquals("Fallback Brand EN", response.getBrandNameEn());
            assertEquals("Fallback Brand AR", response.getBrandNameAr());
        }

        @Test
        @DisplayName("Should delegate model name getters to nested object when available")
        @SuppressWarnings("deprecation") // Intentionally testing deprecated methods
        void deprecatedModelGetters_ShouldDelegateToNestedObject() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            CarModelResponse model = createTestModel();
            response.setModel(model);

            // When & Then
            assertEquals("Camry", response.getModelNameEn());
            assertEquals("كامري", response.getModelNameAr());
        }

        @Test
        @DisplayName("Should delegate transmission getters to nested object when available")
        @SuppressWarnings("deprecation") // Intentionally testing deprecated methods
        void deprecatedTransmissionGetters_ShouldDelegateToNestedObject() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            TransmissionResponse transmission = createTestTransmission();
            response.setTransmission(transmission);

            // When & Then
            assertEquals("Automatic", response.getTransmissionNameEn());
            assertEquals("أوتوماتيكي", response.getTransmissionNameAr());
        }

        @Test
        @DisplayName("Should delegate fuel type getters to nested object when available")
        @SuppressWarnings("deprecation") // Intentionally testing deprecated methods
        void deprecatedFuelTypeGetters_ShouldDelegateToNestedObject() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            FuelTypeResponse fuelType = createTestFuelType();
            response.setFuelType(fuelType);

            // When & Then
            assertEquals("Gasoline", response.getFuelTypeNameEn());
            assertEquals("بنزين", response.getFuelTypeNameAr());
        }
    }

    @Nested
    @DisplayName("Media Collection Tests")
    class MediaCollectionTests {

        @Test
        @DisplayName("Should handle empty media collection")
        void media_EmptyCollection_ShouldHandleCorrectly() {
            // Given
            CarListingResponse response = createBasicTestResponse();

            // When
            response.setMedia(new ArrayList<>());

            // Then
            assertNotNull(response.getMedia());
            assertTrue(response.getMedia().isEmpty());
        }

        @Test
        @DisplayName("Should handle media collection with items")
        void media_WithItems_ShouldHandleCorrectly() {
            // Given
            CarListingResponse response = createBasicTestResponse();
            List<ListingMediaResponse> mediaList = Arrays.asList(
                createTestMedia(),
                createTestMedia() // Second media item
            );
            mediaList.get(1).setId(2L);
            mediaList.get(1).setSortOrder(2);

            // When
            response.setMedia(mediaList);

            // Then
            assertNotNull(response.getMedia());
            assertEquals(2, response.getMedia().size());
            assertEquals(1, response.getMedia().get(0).getSortOrder());
            assertEquals(2, response.getMedia().get(1).getSortOrder());
        }

        @Test
        @DisplayName("Should handle null media collection gracefully")
        void media_NullCollection_ShouldHandleGracefully() {
            // Given
            CarListingResponse response = createBasicTestResponse();

            // When
            response.setMedia(null);

            // Then - Should handle null gracefully
            assertNotNull(response.getMedia()); // Media is initialized as new ArrayList<>()
            assertTrue(response.getMedia().isEmpty());
        }
    }

    @Nested
    @DisplayName("JSON Serialization Tests")
    class JsonSerializationTests {

        @Test
        @DisplayName("Should serialize CarListingResponse with all fields")
        void serialize_CompleteResponse_ShouldIncludeAllFields() throws Exception {
            // Given
            CarListingResponse response = createBasicTestResponse();
            response.setBrand(createTestBrand());
            response.setModel(createTestModel());
            response.setTransmission(createTestTransmission());
            response.setFuelType(createTestFuelType());
            response.setMedia(Arrays.asList(createTestMedia()));

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"id\":1"));
            assertTrue(json.contains("\"title\":\"Test Car Listing\""));
            assertTrue(json.contains("\"modelYear\":2020"));
            assertTrue(json.contains("\"mileage\":50000"));
            assertTrue(json.contains("\"price\":25000.00"));
            assertTrue(json.contains("\"currency\":\"USD\""));
            assertTrue(json.contains("\"approved\":true"));
            assertTrue(json.contains("\"isSold\":false"));
            assertTrue(json.contains("\"isArchived\":false"));
            assertTrue(json.contains("\"isUserActive\":true"));
        }

        @Test
        @DisplayName("Should serialize nested objects correctly")
        void serialize_NestedObjects_ShouldIncludeNestedFields() throws Exception {
            // Given
            CarListingResponse response = createBasicTestResponse();
            response.setBrand(createTestBrand());
            response.setTransmission(createTestTransmission());

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"brand\":{"));
            assertTrue(json.contains("\"transmission\":{"));
            assertTrue(json.contains("\"displayNameEn\":\"Toyota\""));
            assertTrue(json.contains("\"displayNameAr\":\"تويوتا\""));
            assertTrue(json.contains("\"name\":\"Automatic\""));
        }

        @Test
        @DisplayName("Should serialize media collection correctly")
        void serialize_MediaCollection_ShouldIncludeMediaFields() throws Exception {
            // Given
            CarListingResponse response = createBasicTestResponse();
            response.setMedia(Arrays.asList(createTestMedia()));

            // When
            String json = objectMapper.writeValueAsString(response);

            // Then
            assertTrue(json.contains("\"media\":["));
            assertTrue(json.contains("\"url\":\"https://example.com/image.jpg\""));
            assertTrue(json.contains("\"fileName\":\"car-image.jpg\""));
            assertTrue(json.contains("\"contentType\":\"image/jpeg\""));
            assertTrue(json.contains("\"isPrimary\":true"));
        }

        @Test
        @DisplayName("Should deserialize JSON correctly")
        void deserialize_ValidJson_ShouldCreateCorrectObject() throws Exception {
            // Given
            String json = """
                {
                    "id": 1,
                    "title": "Test Car",
                    "modelYear": 2020,
                    "mileage": 50000,
                    "price": 25000.00,
                    "currency": "USD",
                    "approved": true,
                    "isSold": false,
                    "isArchived": false,
                    "isUserActive": true,
                    "sellerId": 100,
                    "sellerUsername": "testuser"
                }
                """;

            // When
            CarListingResponse response = objectMapper.readValue(json, CarListingResponse.class);

            // Then
            assertEquals(1L, response.getId());
            assertEquals("Test Car", response.getTitle());
            assertEquals(2020, response.getModelYear());
            assertEquals(50000, response.getMileage());
            assertEquals(new BigDecimal("25000.00"), response.getPrice());
            assertEquals("USD", response.getCurrency());
            assertTrue(response.getApproved());
            assertFalse(response.getIsSold());
            assertFalse(response.getIsArchived());
            assertTrue(response.getIsUserActive());
            assertEquals(100L, response.getSellerId());
            assertEquals("testuser", response.getSellerUsername());
        }
    }

    @Nested
    @DisplayName("Integration Tests")
    class IntegrationTests {

        @Test
        @DisplayName("Should create complete CarListingResponse with all nested objects")
        void integration_CompleteResponse_ShouldWorkCorrectly() {
            // Given - Create a complete CarListingResponse
            CarListingResponse response = createBasicTestResponse();

            // Set all nested objects
            response.setBrand(createTestBrand());
            response.setModel(createTestModel());
            response.setTransmission(createTestTransmission());
            response.setFuelType(createTestFuelType());

            // Set media collection
            response.setMedia(Arrays.asList(createTestMedia()));

            // Set location and governorate
            LocationResponse location = new LocationResponse();
            location.setId(1L);
            location.setDisplayNameEn("Damascus");
            location.setDisplayNameAr("دمشق");
            response.setLocationDetails(location);

            GovernorateResponse governorate = new GovernorateResponse();
            governorate.setId(1L);
            governorate.setDisplayNameEn("Damascus");
            governorate.setDisplayNameAr("دمشق");
            response.setGovernorateDetails(governorate);

            // Set contact information
            response.setContactName("John Doe");
            response.setContactEmail("john@example.com");
            response.setContactPhone("+963-11-1234567");
            response.setContactPreference("email");

            // When & Then - Verify all fields are accessible
            assertBasicCarListingProperties(response);
            assertNotNull(response.getBrand());
            assertNotNull(response.getModel());
            assertNotNull(response.getTransmission());
            assertNotNull(response.getFuelType());
            assertNotNull(response.getLocationDetails());
            assertNotNull(response.getGovernorateDetails());
            assertEquals("John Doe", response.getContactName());
            assertEquals("john@example.com", response.getContactEmail());
            assertEquals("+963-11-1234567", response.getContactPhone());
            assertEquals("email", response.getContactPreference());
        }

        @Test
        @DisplayName("Should maintain data integrity through serialization round-trip")
        void integration_SerializationRoundTrip_ShouldMaintainIntegrity() throws Exception {
            // Given
            CarListingResponse original = createBasicTestResponse();
            original.setBrand(createTestBrand());
            original.setModel(createTestModel());
            original.setMedia(Arrays.asList(createTestMedia()));

            // When - Serialize and deserialize
            String json = objectMapper.writeValueAsString(original);
            CarListingResponse deserialized = objectMapper.readValue(json, CarListingResponse.class);

            // Then - Verify all data is preserved
            assertEquals(original.getId(), deserialized.getId());
            assertEquals(original.getTitle(), deserialized.getTitle());
            assertEquals(original.getModelYear(), deserialized.getModelYear());
            assertEquals(original.getMileage(), deserialized.getMileage());
            assertEquals(original.getPrice(), deserialized.getPrice());
            assertEquals(original.getCurrency(), deserialized.getCurrency());
            assertEquals(original.getApproved(), deserialized.getApproved());
            assertEquals(original.getIsSold(), deserialized.getIsSold());
            assertEquals(original.getIsArchived(), deserialized.getIsArchived());
            assertEquals(original.getIsUserActive(), deserialized.getIsUserActive());

            // Verify nested objects
            assertEquals(original.getBrand().getId(), deserialized.getBrand().getId());
            assertEquals(original.getModel().getId(), deserialized.getModel().getId());
            assertEquals(original.getMedia().size(), deserialized.getMedia().size());
        }
    }

    @Nested
    @DisplayName("Edge Cases and Validation Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle extreme values for numeric fields")
        void numericFields_ExtremeValues_ShouldHandleCorrectly() {
            // Given
            CarListingResponse response = new CarListingResponse();

            // Test extreme values
            response.setModelYear(1886); // First car year
            response.setMileage(1000000); // Very high mileage
            response.setPrice(new BigDecimal("999999999.99")); // Very high price

            // Then
            assertEquals(1886, response.getModelYear());
            assertEquals(1000000, response.getMileage());
            assertEquals(new BigDecimal("999999999.99"), response.getPrice());
        }

        @Test
        @DisplayName("Should handle very long text fields")
        void textFields_LongValues_ShouldHandleCorrectly() {
            // Given
            CarListingResponse response = new CarListingResponse();
            String longTitle = "A".repeat(500); // Very long title
            String longDescription = "B".repeat(2000); // Very long description

            // When
            response.setTitle(longTitle);
            response.setDescription(longDescription);

            // Then
            assertEquals(longTitle, response.getTitle());
            assertEquals(longDescription, response.getDescription());
        }

        @Test
        @DisplayName("Should handle special characters in text fields")
        void textFields_SpecialCharacters_ShouldHandleCorrectly() {
            // Given
            CarListingResponse response = new CarListingResponse();
            String titleWithSpecialChars = "Toyota Camry 2020 - الأفضل في فئته! 🚗";
            String descriptionWithSpecialChars = "مع ضمان شامل وصيانة منتظمة. شامل: ✓ ضمان ✓ صيانة ✓ فحص شامل";

            // When
            response.setTitle(titleWithSpecialChars);
            response.setDescription(descriptionWithSpecialChars);

            // Then
            assertEquals(titleWithSpecialChars, response.getTitle());
            assertEquals(descriptionWithSpecialChars, response.getDescription());
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"USD", "SYP", "EUR", "GBP", "JPY", "invalid", "123", "$"})
        @DisplayName("Should handle various currency values")
        void currency_VariousValues_ShouldHandleCorrectly(String currency) {
            // Given
            CarListingResponse response = new CarListingResponse();

            // When
            response.setCurrency(currency);

            // Then
            assertEquals(currency, response.getCurrency());
        }
    }
}
