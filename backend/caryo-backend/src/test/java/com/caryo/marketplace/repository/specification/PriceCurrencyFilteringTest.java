package com.caryo.marketplace.repository.specification;

import com.caryo.marketplace.model.CarBrand;
import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.CarModel;
import com.caryo.marketplace.model.Country;
import com.caryo.marketplace.model.Governorate;
import com.caryo.marketplace.model.Location;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.request.ListingFilterRequest;
import com.caryo.marketplace.repository.CarListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Price filtering must be scoped to a single currency.
 *
 * <p>Listings store a price plus their own currency (USD or SYP) and the two
 * are never normalised against each other. A Syrian Pound price is roughly four
 * orders of magnitude larger than the equivalent USD price, so an unscoped
 * numeric range silently mixes the two: a buyer asking for "5,000–15,000"
 * meaning dollars would otherwise be shown a 12,000 SYP car worth under a
 * dollar.</p>
 *
 * <p>These tests run the specification as a real query rather than asserting
 * the predicate tree, so they fail if the scoping is dropped anywhere between
 * the filter object and the SQL.</p>
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Price filtering is scoped to one currency")
class PriceCurrencyFilteringTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private CarListingRepository carListingRepository;

    private User seller;
    private Location location;
    private CarModel model;

    @BeforeEach
    void setUp() {
        seller = new User();
        seller.setUsername("currency-seller");
        seller.setEmail("currency-seller@example.com");
        seller.setPassword("password");
        seller = entityManager.persistAndFlush(seller);

        Country country = new Country();
        country.setCountryCode("SY");
        country.setDisplayNameEn("Syria");
        country.setDisplayNameAr("سوريا");
        country = entityManager.persistAndFlush(country);

        Governorate governorate = new Governorate();
        governorate.setDisplayNameEn("Damascus");
        governorate.setDisplayNameAr("دمشق");
        governorate.setSlug("damascus");
        governorate.setCountry(country);
        governorate = entityManager.persistAndFlush(governorate);

        location = new Location();
        location.setDisplayNameEn("Damascus");
        location.setDisplayNameAr("دمشق");
        location.setSlug("damascus");
        location.setGovernorate(governorate);
        location = entityManager.persistAndFlush(location);

        CarBrand brand = new CarBrand();
        brand.setName("toyota");
        brand.setSlug("toyota");
        brand.setDisplayNameEn("Toyota");
        brand.setDisplayNameAr("تويوتا");
        brand = entityManager.persistAndFlush(brand);

        model = new CarModel();
        model.setName("camry");
        model.setSlug("camry");
        model.setDisplayNameEn("Camry");
        model.setDisplayNameAr("كامري");
        model.setBrand(brand);
        model = entityManager.persistAndFlush(model);
    }

    @Test
    @DisplayName("a USD range must not match a numerically-similar SYP listing")
    void priceRangeWithoutCurrency_scopesToUsd() {
        createListing("USD car", new BigDecimal("12000.00"), "USD");
        createListing("SYP car", new BigDecimal("12000.00"), "SYP");

        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setMinPrice(new BigDecimal("5000"));
        filter.setMaxPrice(new BigDecimal("15000"));

        assertThat(titlesMatching(filter)).containsExactly("USD car");
    }

    @Test
    @DisplayName("an explicit SYP range returns only SYP listings")
    void priceRangeWithExplicitCurrency_scopesToThatCurrency() {
        createListing("USD car", new BigDecimal("12000.00"), "USD");
        createListing("SYP car", new BigDecimal("12000.00"), "SYP");

        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setMinPrice(new BigDecimal("5000"));
        filter.setMaxPrice(new BigDecimal("15000"));
        filter.setCurrency("SYP");

        assertThat(titlesMatching(filter)).containsExactly("SYP car");
    }

    @Test
    @DisplayName("currency alone filters listings without any price bound")
    void currencyWithoutPriceBounds_stillFilters() {
        createListing("USD car", new BigDecimal("12000.00"), "USD");
        createListing("SYP car", new BigDecimal("450000000.00"), "SYP");

        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setCurrency("SYP");

        assertThat(titlesMatching(filter)).containsExactly("SYP car");
    }

    @Test
    @DisplayName("currency matching is case-insensitive")
    void currencyMatching_isCaseInsensitive() {
        createListing("USD car", new BigDecimal("12000.00"), "USD");

        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setCurrency("usd");

        assertThat(titlesMatching(filter)).containsExactly("USD car");
    }

    @Test
    @DisplayName("no price bound and no currency returns every currency")
    void noPriceAndNoCurrency_returnsEverything() {
        createListing("USD car", new BigDecimal("12000.00"), "USD");
        createListing("SYP car", new BigDecimal("450000000.00"), "SYP");

        ListingFilterRequest filter = new ListingFilterRequest();

        assertThat(titlesMatching(filter)).containsExactlyInAnyOrder("USD car", "SYP car");
    }

    @Test
    @DisplayName("a realistic SYP price survives the round trip (regression: DECIMAL(10,2) overflow)")
    void syrianPoundPrice_persistsWithoutOverflow() {
        BigDecimal syrianPrice = new BigDecimal("450000000.00");
        createListing("SYP car", syrianPrice, "SYP");
        entityManager.clear();

        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setCurrency("SYP");
        filter.setMinPrice(new BigDecimal("400000000"));
        filter.setMaxPrice(new BigDecimal("500000000"));

        List<CarListing> found = carListingRepository.findAll(
                CarListingSpecification.fromFilter(filter, (Governorate) null));

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getPrice()).isEqualByComparingTo(syrianPrice);
    }

    private List<String> titlesMatching(ListingFilterRequest filter) {
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, (Governorate) null);
        return carListingRepository.findAll(spec).stream().map(CarListing::getTitle).toList();
    }

    private void createListing(String title, BigDecimal price, String currency) {
        CarListing listing = new CarListing();
        listing.setTitle(title);
        listing.setModel(model);
        listing.setModelYear(2022);
        listing.setMileage(5000);
        listing.setPrice(price);
        listing.setCurrency(currency);
        listing.setLocation(location);
        listing.setGovernorate(location.getGovernorate());
        listing.setDescription("Test description");
        listing.setSeller(seller);
        listing.setApproved(true);
        listing.setSold(false);
        listing.setArchived(false);
        entityManager.persistAndFlush(listing);
    }
}
