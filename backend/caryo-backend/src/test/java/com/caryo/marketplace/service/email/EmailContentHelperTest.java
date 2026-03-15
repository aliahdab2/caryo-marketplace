package com.caryo.marketplace.service.email;

import com.caryo.marketplace.model.CarListing;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EmailContentHelperTest {

    private EmailContentHelper contentHelper;

    @BeforeEach
    void setUp() {
        contentHelper = new EmailContentHelper();
        ReflectionTestUtils.setField(contentHelper, "websiteName", "Caryo Marketplace");
        ReflectionTestUtils.setField(contentHelper, "websiteNameAr", "كاريو");
        ReflectionTestUtils.setField(contentHelper, "websiteUrl", "https://caryo.sy");
    }

    @Test
    void shouldReturnEnglishWebsiteName() {
        String name = contentHelper.getWebsiteName("en");
        assertThat(name).isEqualTo("Caryo Marketplace");
    }

    @Test
    void shouldReturnArabicWebsiteName() {
        String name = contentHelper.getWebsiteName("ar");
        assertThat(name).isEqualTo("كاريو");
    }

    @Test
    void shouldReturnDefaultEnglishNameWhenNull() {
        ReflectionTestUtils.setField(contentHelper, "websiteName", null);
        String name = contentHelper.getWebsiteName("en");
        assertThat(name).isEqualTo("Caryo Marketplace");
    }

    @Test
    void shouldReturnDefaultArabicNameWhenNull() {
        ReflectionTestUtils.setField(contentHelper, "websiteNameAr", null);
        String name = contentHelper.getWebsiteName("ar");
        assertThat(name).isEqualTo("كاريو");
    }

    @Test
    void shouldGenerateListingTitle() {
        CarListing listing = mock(CarListing.class);
        when(listing.getBrandNameEn()).thenReturn("Toyota");
        when(listing.getModelNameEn()).thenReturn("Camry");
        when(listing.getModelYear()).thenReturn(2023);
        when(listing.getPrice()).thenReturn(new BigDecimal("25000"));

        String title = contentHelper.getListingTitle(listing, "en");

        assertThat(title).isEqualTo("Toyota Camry 2023 - $25000");
    }

    @Test
    void shouldGenerateTitleWithPartialInfo() {
        CarListing listing = mock(CarListing.class);
        when(listing.getBrandNameEn()).thenReturn("Honda");
        when(listing.getModelNameEn()).thenReturn(null);
        when(listing.getModelYear()).thenReturn(2022);
        when(listing.getPrice()).thenReturn(null);

        String title = contentHelper.getListingTitle(listing, "en");

        assertThat(title).isEqualTo("Honda 2022");
    }

    @Test
    void shouldReturnDefaultTitleForEmptyListing() {
        CarListing listing = mock(CarListing.class);
        when(listing.getBrandNameEn()).thenReturn(null);
        when(listing.getModelNameEn()).thenReturn(null);
        when(listing.getModelYear()).thenReturn(null);
        when(listing.getPrice()).thenReturn(null);

        assertThat(contentHelper.getListingTitle(listing, "en")).isEqualTo("Car Listing");
        assertThat(contentHelper.getListingTitle(listing, "ar")).isEqualTo("إعلان سيارة");
    }

    @Test
    void shouldReturnUnknownListingForNull() {
        assertThat(contentHelper.getListingTitle(null, "en")).isEqualTo("Unknown Listing");
        assertThat(contentHelper.getListingTitle(null, "ar")).isEqualTo("إعلان غير معروف");
    }

    @Test
    void shouldBuildListingUrl() {
        String url = contentHelper.buildListingUrl(123L);
        assertThat(url).isEqualTo("https://caryo.sy/listings/123");
    }

    @Test
    void shouldBuildVerificationUrl() {
        String url = contentHelper.buildVerificationUrl("abc123token");
        assertThat(url).isEqualTo("https://caryo.sy/auth/verify-email?token=abc123token");
    }

    @Test
    void shouldBuildFeedbackUrl() {
        String url = contentHelper.buildFeedbackUrl(456L);
        assertThat(url).isEqualTo("https://caryo.sy/feedback?listing=456");
    }

    @Test
    void shouldReturnWebsiteUrl() {
        String url = contentHelper.getWebsiteUrl();
        assertThat(url).isEqualTo("https://caryo.sy");
    }

    @Test
    void shouldReturnDefaultReasonInEnglish() {
        String reason = contentHelper.getDefaultReason("en");
        assertThat(reason).isEqualTo("No specific reason provided");
    }

    @Test
    void shouldReturnDefaultReasonInArabic() {
        String reason = contentHelper.getDefaultReason("ar");
        assertThat(reason).isEqualTo("غير محدد");
    }
}
