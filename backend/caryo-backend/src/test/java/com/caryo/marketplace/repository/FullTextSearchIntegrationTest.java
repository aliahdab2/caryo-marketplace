package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.*;
import com.caryo.marketplace.util.TestDataBuilder;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Statement;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for PostgreSQL full-text search on car_listings.
 * Uses Testcontainers to test against a real PostgreSQL instance with
 * tsvector, GIN index, and trigger — features not available in H2.
 */
@DataJpaTest
@Testcontainers
@ActiveProfiles("integration")
@DisplayName("Full-Text Search Integration Tests")
class FullTextSearchIntegrationTest {

    private static final int MAX_RESULTS = 1000;

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");
        registry.add("app.search.fulltext.enabled", () -> "true");
    }

    @Autowired
    private DataSource dataSource;

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private CarListingRepository carListingRepository;

    private static boolean ftsSchemaCreated = false;

    /**
     * Add tsvector column, trigger, and GIN index after Hibernate DDL creates the base schema.
     * Uses raw JDBC (outside Spring's transaction) so DDL is committed immediately
     * and survives @DataJpaTest's per-test transaction rollback.
     */
    private void ensureFtsSchema() throws Exception {
        if (ftsSchemaCreated) return;
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(true);
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("ALTER TABLE car_listings ADD COLUMN IF NOT EXISTS search_vector tsvector");
                stmt.execute("""
                    CREATE OR REPLACE FUNCTION car_listings_search_vector_update() RETURNS trigger AS $t$
                    BEGIN
                        NEW.search_vector :=
                            setweight(to_tsvector('simple', coalesce(NEW.brand_name_en, '')), 'A') ||
                            setweight(to_tsvector('simple', coalesce(NEW.brand_name_ar, '')), 'A') ||
                            setweight(to_tsvector('simple', coalesce(NEW.model_name_en, '')), 'A') ||
                            setweight(to_tsvector('simple', coalesce(NEW.model_name_ar, '')), 'A') ||
                            setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'B') ||
                            setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C') ||
                            setweight(to_tsvector('simple', coalesce(NEW.governorate_name_en, '')), 'D') ||
                            setweight(to_tsvector('simple', coalesce(NEW.governorate_name_ar, '')), 'D');
                        RETURN NEW;
                    END;
                    $t$ LANGUAGE plpgsql
                """);
                stmt.execute("DROP TRIGGER IF EXISTS car_listings_search_vector_trigger ON car_listings");
                stmt.execute("""
                    CREATE TRIGGER car_listings_search_vector_trigger
                        BEFORE INSERT OR UPDATE OF title, description, brand_name_en, brand_name_ar,
                                                    model_name_en, model_name_ar, governorate_name_en, governorate_name_ar
                        ON car_listings
                        FOR EACH ROW
                        EXECUTE FUNCTION car_listings_search_vector_update()
                """);
                stmt.execute("CREATE INDEX IF NOT EXISTS idx_car_listings_search_vector ON car_listings USING GIN (search_vector)");
            }
        }
        ftsSchemaCreated = true;
    }

    private User testUser;
    private Country testCountry;
    private Governorate damascus;
    private Governorate aleppo;
    private CarBrand toyota;
    private CarBrand bmw;
    private CarModel camry;
    private CarModel x5;

    @BeforeEach
    void setUp() throws Exception {
        ensureFtsSchema();

        testUser = TestDataBuilder.createValidUser("testuser", "test@example.com");
        entityManager.persistAndFlush(testUser);

        testCountry = TestDataBuilder.createTestCountry();
        entityManager.persistAndFlush(testCountry);

        damascus = new Governorate();
        damascus.setDisplayNameEn("Damascus");
        damascus.setDisplayNameAr("دمشق");
        damascus.setSlug("damascus");
        damascus.setIsActive(true);
        damascus.setCountry(testCountry);
        entityManager.persistAndFlush(damascus);

        aleppo = new Governorate();
        aleppo.setDisplayNameEn("Aleppo");
        aleppo.setDisplayNameAr("حلب");
        aleppo.setSlug("aleppo");
        aleppo.setIsActive(true);
        aleppo.setCountry(testCountry);
        entityManager.persistAndFlush(aleppo);

        toyota = new CarBrand();
        toyota.setName("Toyota");
        toyota.setDisplayNameEn("Toyota");
        toyota.setDisplayNameAr("تويوتا");
        toyota.setSlug("toyota");
        toyota.setIsActive(true);
        entityManager.persistAndFlush(toyota);

        bmw = new CarBrand();
        bmw.setName("BMW");
        bmw.setDisplayNameEn("BMW");
        bmw.setDisplayNameAr("بي إم دبليو");
        bmw.setSlug("bmw");
        bmw.setIsActive(true);
        entityManager.persistAndFlush(bmw);

        camry = new CarModel();
        camry.setName("Camry");
        camry.setDisplayNameEn("Camry");
        camry.setDisplayNameAr("كامري");
        camry.setSlug("camry");
        camry.setIsActive(true);
        camry.setBrand(toyota);
        entityManager.persistAndFlush(camry);

        x5 = new CarModel();
        x5.setName("X5");
        x5.setDisplayNameEn("X5");
        x5.setDisplayNameAr("إكس 5");
        x5.setSlug("x5");
        x5.setIsActive(true);
        x5.setBrand(bmw);
        entityManager.persistAndFlush(x5);
    }

    private CarListing createListing(String title, String description,
                                     CarModel model, Governorate governorate) {
        return createListing(title, description, model, governorate,
                model.getBrand().getDisplayNameEn(), model.getBrand().getDisplayNameAr(),
                model.getDisplayNameEn(), model.getDisplayNameAr());
    }

    private CarListing createListing(String title, String description,
                                     CarModel model, Governorate governorate,
                                     String brandNameEn, String brandNameAr,
                                     String modelNameEn, String modelNameAr) {
        CarListing listing = new CarListing();
        listing.setTitle(title);
        listing.setDescription(description);
        listing.setModelYear(2022);
        listing.setMileage(30000);
        listing.setPrice(BigDecimal.valueOf(25000));
        listing.setCurrency("USD");
        listing.setSeller(testUser);
        listing.setModel(model);
        listing.setGovernorate(governorate);
        listing.setBrandNameEn(brandNameEn);
        listing.setBrandNameAr(brandNameAr);
        listing.setModelNameEn(modelNameEn);
        listing.setModelNameAr(modelNameAr);
        listing.setGovernorateNameEn(governorate.getDisplayNameEn());
        listing.setGovernorateNameAr(governorate.getDisplayNameAr());
        listing.setApproved(true);
        listing.setSold(false);
        listing.setArchived(false);
        entityManager.persistAndFlush(listing);
        return listing;
    }

    @Test
    @DisplayName("Should find listings by English brand name")
    void findByFullTextSearch_withEnglishBrandName_shouldReturnMatches() {
        CarListing toyotaListing = createListing("Toyota Camry 2022",
                "Well maintained sedan", camry, damascus);
        createListing("BMW X5 2022", "Luxury SUV", x5, aleppo);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("Toyota", MAX_RESULTS);

        assertThat(results).containsExactly(toyotaListing.getId());
    }

    @Test
    @DisplayName("Should find listings by Arabic brand name")
    void findByFullTextSearch_withArabicBrandName_shouldReturnMatches() {
        CarListing toyotaListing = createListing("Toyota Camry 2022",
                "Well maintained sedan", camry, damascus);
        createListing("BMW X5 2022", "Luxury SUV", x5, aleppo);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("تويوتا", MAX_RESULTS);

        assertThat(results).containsExactly(toyotaListing.getId());
    }

    @Test
    @DisplayName("Should find listings by model name")
    void findByFullTextSearch_withModelName_shouldReturnMatches() {
        CarListing camryListing = createListing("Toyota Camry 2022",
                "Reliable sedan for daily commute", camry, damascus);
        createListing("BMW X5 2022", "Luxury SUV", x5, aleppo);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("Camry", MAX_RESULTS);

        assertThat(results).containsExactly(camryListing.getId());
    }

    @Test
    @DisplayName("Should find listings by description text")
    void findByFullTextSearch_withDescriptionText_shouldReturnMatches() {
        CarListing luxuryListing = createListing("BMW X5 2022",
                "Luxury SUV with panoramic sunroof", x5, aleppo);
        createListing("Toyota Camry 2022", "Basic sedan", camry, damascus);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("sunroof", MAX_RESULTS);

        assertThat(results).containsExactly(luxuryListing.getId());
    }

    @Test
    @DisplayName("Should find listings by governorate name")
    void findByFullTextSearch_withGovernorateName_shouldReturnMatches() {
        CarListing damascusListing = createListing("Toyota Camry 2022",
                "Great car", camry, damascus);
        createListing("BMW X5 2022", "SUV", x5, aleppo);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("Damascus", MAX_RESULTS);

        assertThat(results).containsExactly(damascusListing.getId());
    }

    @Test
    @DisplayName("Should find listings by Arabic governorate name")
    void findByFullTextSearch_withArabicGovernorateName_shouldReturnMatches() {
        createListing("Toyota Camry 2022", "Great car", camry, damascus);
        CarListing aleppoListing = createListing("BMW X5 2022", "SUV", x5, aleppo);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("حلب", MAX_RESULTS);

        assertThat(results).containsExactly(aleppoListing.getId());
    }

    @Test
    @DisplayName("Should return multiple matches for multi-word query")
    void findByFullTextSearch_withMultiWordQuery_shouldReturnMatches() {
        CarListing listing1 = createListing("Toyota Camry 2022",
                "Sedan in excellent condition", camry, damascus);
        CarListing listing2 = createListing("Toyota Camry 2021",
                "Another Camry for sale", camry, aleppo);
        createListing("BMW X5 2022", "SUV", x5, aleppo);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("Toyota Camry", MAX_RESULTS);

        assertThat(results).hasSize(2);
        assertThat(results).containsExactlyInAnyOrder(listing1.getId(), listing2.getId());
    }

    @Test
    @DisplayName("Should return empty list when no matches found")
    void findByFullTextSearch_withNoMatches_shouldReturnEmpty() {
        createListing("Toyota Camry 2022", "Sedan", camry, damascus);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("Mercedes", MAX_RESULTS);

        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should rank brand/model matches higher than description matches")
    void findByFullTextSearch_shouldRankBrandHigherThanDescription() {
        // This listing has "luxury" only in description (weight C)
        CarListing descriptionMatch = createListing("BMW X5 2022",
                "Luxury vehicle with all options", x5, aleppo);
        // This listing does not contain "luxury" at all
        createListing("Toyota Camry 2022", "Basic sedan", camry, damascus);
        entityManager.clear();

        // "BMW" is in brand name (weight A) — should rank first for BMW search
        List<Long> results = carListingRepository.findIdsByFullTextSearch("BMW", MAX_RESULTS);

        assertThat(results).containsExactly(descriptionMatch.getId());
    }

    @Test
    @DisplayName("Should handle special characters safely")
    void findByFullTextSearch_withSpecialCharacters_shouldNotFail() {
        createListing("Toyota Camry 2022", "Great car", camry, damascus);
        entityManager.clear();

        // plainto_tsquery handles special characters safely (strips operators)
        List<Long> results = carListingRepository.findIdsByFullTextSearch("Toyota & | ! ( )", MAX_RESULTS);

        // Should still match "Toyota" after stripping operators
        assertThat(results).hasSize(1);
    }

    // === New edge case tests ===

    @Test
    @DisplayName("Should return empty for empty string query")
    void findByFullTextSearch_withEmptyString_shouldReturnEmpty() {
        createListing("Toyota Camry 2022", "Great car", camry, damascus);
        entityManager.clear();

        // plainto_tsquery('simple', '') produces an empty tsquery — matches nothing
        List<Long> results = carListingRepository.findIdsByFullTextSearch("", MAX_RESULTS);

        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should be case-insensitive (simple config lowercases)")
    void findByFullTextSearch_withLowercase_shouldMatchTitleCase() {
        CarListing listing = createListing("Toyota Camry 2022", "Sedan", camry, damascus);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("toyota", MAX_RESULTS);

        assertThat(results).containsExactly(listing.getId());
    }

    @Test
    @DisplayName("Should NOT match partial words (whole-word matching only)")
    void findByFullTextSearch_withPartialWord_shouldNotMatch() {
        createListing("Toyota Camry 2022", "Sedan", camry, damascus);
        entityManager.clear();

        // "Toy" is a prefix of "Toyota" but plainto_tsquery does whole-word matching
        List<Long> results = carListingRepository.findIdsByFullTextSearch("Toy", MAX_RESULTS);

        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should match on brand even when description is minimal")
    void findByFullTextSearch_withMinimalDescription_shouldStillMatchBrand() {
        // Description has no searchable terms — only brand/model in the search vector
        CarListing listing = createListing("Toyota Camry 2022", "N/A", camry, damascus);
        entityManager.clear();

        // Should still match on brand name (weight A)
        List<Long> results = carListingRepository.findIdsByFullTextSearch("Toyota", MAX_RESULTS);

        assertThat(results).containsExactly(listing.getId());
    }

    @Test
    @DisplayName("Should handle NULL brand names gracefully via coalesce")
    void findByFullTextSearch_withNullBrandNames_shouldStillMatchTitle() {
        // Create listing with null brand names — trigger uses coalesce(NULL, '') = ''
        CarListing listing = createListing("Unique Title Only", "Some description", camry, damascus,
                null, null, null, null);
        entityManager.clear();

        // Should match on title text
        List<Long> results = carListingRepository.findIdsByFullTextSearch("Unique", MAX_RESULTS);

        assertThat(results).containsExactly(listing.getId());
    }

    @Test
    @DisplayName("Should respect maxResults limit")
    void findByFullTextSearch_shouldRespectMaxResultsLimit() {
        // Create 5 Toyota listings
        for (int i = 0; i < 5; i++) {
            createListing("Toyota Camry " + (2020 + i), "Sedan " + i, camry, damascus);
        }
        entityManager.clear();

        // Limit to 3 results
        List<Long> results = carListingRepository.findIdsByFullTextSearch("Toyota", 3);

        assertThat(results).hasSize(3);
    }

    @Test
    @DisplayName("Should rank brand match (A) higher than description match (C) for same term")
    void findByFullTextSearch_shouldRankWeightAHigherThanWeightC() {
        // Listing 1: has "luxury" in description only (weight C)
        CarListing descOnly = createListing("BMW X5 2022",
                "Luxury vehicle with premium features", x5, aleppo);
        // Listing 2: has "Luxury" in brand name (weight A) via custom brand names
        CarBrand luxuryBrand = new CarBrand();
        luxuryBrand.setName("Luxury Motors");
        luxuryBrand.setDisplayNameEn("Luxury Motors");
        luxuryBrand.setDisplayNameAr("محركات فاخرة");
        luxuryBrand.setSlug("luxury-motors");
        luxuryBrand.setIsActive(true);
        entityManager.persistAndFlush(luxuryBrand);

        CarModel luxuryModel = new CarModel();
        luxuryModel.setName("LX1");
        luxuryModel.setDisplayNameEn("LX1");
        luxuryModel.setDisplayNameAr("إل إكس 1");
        luxuryModel.setSlug("lx1");
        luxuryModel.setIsActive(true);
        luxuryModel.setBrand(luxuryBrand);
        entityManager.persistAndFlush(luxuryModel);

        CarListing brandMatch = createListing("LX1 2022",
                "Standard sedan", luxuryModel, damascus);
        entityManager.clear();

        List<Long> results = carListingRepository.findIdsByFullTextSearch("Luxury", MAX_RESULTS);

        // Brand match (weight A) should come before description match (weight C)
        assertThat(results).hasSize(2);
        assertThat(results.get(0)).isEqualTo(brandMatch.getId());
        assertThat(results.get(1)).isEqualTo(descOnly.getId());
    }
}
