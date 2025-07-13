package com.autotrader.autotraderbackend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Comprehensive test suite for {@link CurrencyUtil}.
 * 
 * <p>Tests cover all utility methods including validation, formatting,
 * recommendations, and Syrian marketplace-specific functionality.</p>
 */
@DisplayName("CurrencyUtil Tests")
class CurrencyUtilTest {

    @Nested
    @DisplayName("Currency Validation Tests")
    class CurrencyValidationTests {

        @ParameterizedTest
        @ValueSource(strings = {"USD", "SYP", "usd", "syp", "Usd", "Syp", " USD ", " SYP "})
        @DisplayName("Should validate and normalize supported currencies")
        void shouldValidateAndNormalizeSupportedCurrencies(String currency) {
            String result = CurrencyUtil.validateAndNormalize(currency);
            
            assertThat(result)
                .isIn("USD", "SYP")
                .isEqualTo(currency.trim().toUpperCase());
        }

        @Test
        @DisplayName("Should throw exception for null currency")
        void shouldThrowExceptionForNullCurrency() {
            assertThatThrownBy(() -> CurrencyUtil.validateAndNormalize(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Currency cannot be null or empty");
        }

        @Test
        @DisplayName("Should throw exception for empty currency")
        void shouldThrowExceptionForEmptyCurrency() {
            assertThatThrownBy(() -> CurrencyUtil.validateAndNormalize(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Currency cannot be null or empty");
        }

        @ParameterizedTest
        @ValueSource(strings = {"EUR", "GBP", "JPY", "INVALID"})
        @DisplayName("Should throw exception for unsupported currencies")
        void shouldThrowExceptionForUnsupportedCurrencies(String currency) {
            assertThatThrownBy(() -> CurrencyUtil.validateAndNormalize(currency))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported currency")
                .hasMessageContaining(currency);
        }
    }

    @Nested
    @DisplayName("Price Formatting Tests")
    class PriceFormattingTests {

        @Test
        @DisplayName("Should format USD prices correctly")
        void shouldFormatUsdPricesCorrectly() {
            BigDecimal amount = new BigDecimal("25000.50");
            String formatted = CurrencyUtil.formatPrice(amount, "USD");
            
            assertThat(formatted).isEqualTo("$25,000.50");
        }

        @Test
        @DisplayName("Should format SYP prices correctly without decimals")
        void shouldFormatSypPricesCorrectlyWithoutDecimals() {
            BigDecimal amount = new BigDecimal("12500000");
            String formatted = CurrencyUtil.formatPrice(amount, "SYP");
            
            assertThat(formatted).isEqualTo("SYR12,500,000");
        }

        @Test
        @DisplayName("Should handle large USD amounts")
        void shouldHandleLargeUsdAmounts() {
            BigDecimal amount = new BigDecimal("125000.99");
            String formatted = CurrencyUtil.formatPrice(amount, "USD");
            
            assertThat(formatted).isEqualTo("$125,000.99");
        }

        @Test
        @DisplayName("Should handle SYP amounts with decimals by rounding")
        void shouldHandleSypAmountsWithDecimalsByRounding() {
            BigDecimal amount = new BigDecimal("12500000.75");
            String formatted = CurrencyUtil.formatPrice(amount, "SYP");
            
            assertThat(formatted).isEqualTo("SYR12,500,001");
        }

        @Test
        @DisplayName("Should throw exception for null amount")
        void shouldThrowExceptionForNullAmount() {
            assertThatThrownBy(() -> CurrencyUtil.formatPrice(null, "USD"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Amount cannot be null");
        }

        @Test
        @DisplayName("Should format price with currency code")
        void shouldFormatPriceWithCurrencyCode() {
            BigDecimal amount = new BigDecimal("25000.50");
            String formatted = CurrencyUtil.formatPriceWithCode(amount, "USD");
            
            assertThat(formatted).isEqualTo("25000.50 USD");
        }
    }

    @Nested
    @DisplayName("Currency Recommendation Tests")
    class CurrencyRecommendationTests {

        @Test
        @DisplayName("Should recommend USD for budget range")
        void shouldRecommendUsdForBudgetRange() {
            String currency = CurrencyUtil.getRecommendedCurrency(CurrencyUtil.PriceRange.BUDGET);
            assertThat(currency).isEqualTo("USD");
        }

        @Test
        @DisplayName("Should recommend USD for all price ranges")
        void shouldRecommendUsdForAllPriceRanges() {
            for (CurrencyUtil.PriceRange range : CurrencyUtil.PriceRange.values()) {
                String currency = CurrencyUtil.getRecommendedCurrency(range);
                assertThat(currency).isEqualTo("USD");
            }
        }

        @Test
        @DisplayName("Should return default currency for null price range")
        void shouldReturnDefaultCurrencyForNullPriceRange() {
            String currency = CurrencyUtil.getRecommendedCurrency(null);
            assertThat(currency).isEqualTo(CurrencyUtil.DEFAULT_CURRENCY);
        }
    }

    @Nested
    @DisplayName("Currency Information Tests")
    class CurrencyInformationTests {

        @Test
        @DisplayName("Should get USD currency info")
        void shouldGetUsdCurrencyInfo() {
            CurrencyUtil.CurrencyInfo info = CurrencyUtil.getCurrencyInfo("USD");
            
            assertThat(info.getCode()).isEqualTo("USD");
            assertThat(info.getName()).isEqualTo("US Dollar");
            assertThat(info.getSymbol()).isEqualTo("$");
            assertThat(info.getDecimalPlaces()).isEqualTo(2);
            assertThat(info.getDescription()).contains("Primary currency for car sales");
        }

        @Test
        @DisplayName("Should get SYP currency info")
        void shouldGetSypCurrencyInfo() {
            CurrencyUtil.CurrencyInfo info = CurrencyUtil.getCurrencyInfo("SYP");
            
            assertThat(info.getCode()).isEqualTo("SYP");
            assertThat(info.getName()).isEqualTo("Syrian Pound");
            assertThat(info.getSymbol()).isEqualTo("SYR");
            assertThat(info.getDecimalPlaces()).isEqualTo(0);
            assertThat(info.getDescription()).contains("Local currency");
        }

        @Test
        @DisplayName("Should get all currency info")
        void shouldGetAllCurrencyInfo() {
            Map<String, CurrencyUtil.CurrencyInfo> allInfo = CurrencyUtil.getAllCurrencyInfo();
            
            assertThat(allInfo)
                .hasSize(2)
                .containsKeys("USD", "SYP");
        }

        @Test
        @DisplayName("Should throw exception for unsupported currency info")
        void shouldThrowExceptionForUnsupportedCurrencyInfo() {
            assertThatThrownBy(() -> CurrencyUtil.getCurrencyInfo("EUR"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported currency");
        }
    }

    @Nested
    @DisplayName("Currency Type Check Tests")
    class CurrencyTypeCheckTests {

        @ParameterizedTest
        @ValueSource(strings = {"USD", "usd", "Usd", " USD "})
        @DisplayName("Should identify USD as default currency")
        void shouldIdentifyUsdAsDefaultCurrency(String currency) {
            assertThat(CurrencyUtil.isDefaultCurrency(currency)).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"SYP", "EUR", "GBP", ""})
        @DisplayName("Should identify non-USD as not default currency")
        void shouldIdentifyNonUsdAsNotDefaultCurrency(String currency) {
            assertThat(CurrencyUtil.isDefaultCurrency(currency)).isFalse();
        }

        @Test
        @DisplayName("Should handle null for default currency check")
        void shouldHandleNullForDefaultCurrencyCheck() {
            assertThat(CurrencyUtil.isDefaultCurrency(null)).isFalse();
        }

        @ParameterizedTest
        @ValueSource(strings = {"SYP", "syp", "Syp", " SYP "})
        @DisplayName("Should identify SYP as local currency")
        void shouldIdentifySypAsLocalCurrency(String currency) {
            assertThat(CurrencyUtil.isLocalCurrency(currency)).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"USD", "EUR", "GBP", ""})
        @DisplayName("Should identify non-SYP as not local currency")
        void shouldIdentifyNonSypAsNotLocalCurrency(String currency) {
            assertThat(CurrencyUtil.isLocalCurrency(currency)).isFalse();
        }

        @Test
        @DisplayName("Should handle null for local currency check")
        void shouldHandleNullForLocalCurrencyCheck() {
            assertThat(CurrencyUtil.isLocalCurrency(null)).isFalse();
        }
    }

    @Nested
    @DisplayName("Amount Validation Tests")
    class AmountValidationTests {

        @Test
        @DisplayName("Should validate positive USD amount with 2 decimals")
        void shouldValidatePositiveUsdAmountWithTwoDecimals() {
            BigDecimal amount = new BigDecimal("25000.50");
            assertThat(CurrencyUtil.isValidAmount(amount, "USD")).isTrue();
        }

        @Test
        @DisplayName("Should validate positive SYP amount with no decimals")
        void shouldValidatePositiveSypAmountWithNoDecimals() {
            BigDecimal amount = new BigDecimal("12500000");
            assertThat(CurrencyUtil.isValidAmount(amount, "SYP")).isTrue();
        }

        @Test
        @DisplayName("Should reject negative amounts")
        void shouldRejectNegativeAmounts() {
            BigDecimal amount = new BigDecimal("-1000");
            assertThat(CurrencyUtil.isValidAmount(amount, "USD")).isFalse();
        }

        @Test
        @DisplayName("Should reject null amounts")
        void shouldRejectNullAmounts() {
            assertThat(CurrencyUtil.isValidAmount(null, "USD")).isFalse();
        }

        @Test
        @DisplayName("Should reject USD amount with too many decimals")
        void shouldRejectUsdAmountWithTooManyDecimals() {
            BigDecimal amount = new BigDecimal("25000.123");
            assertThat(CurrencyUtil.isValidAmount(amount, "USD")).isFalse();
        }

        @Test
        @DisplayName("Should reject SYP amount with decimals")
        void shouldRejectSypAmountWithDecimals() {
            BigDecimal amount = new BigDecimal("12500000.50");
            assertThat(CurrencyUtil.isValidAmount(amount, "SYP")).isFalse();
        }

        @Test
        @DisplayName("Should accept zero amount")
        void shouldAcceptZeroAmount() {
            BigDecimal amount = BigDecimal.ZERO;
            assertThat(CurrencyUtil.isValidAmount(amount, "USD")).isTrue();
        }
    }

    @Nested
    @DisplayName("Constants Tests")
    class ConstantsTests {

        @Test
        @DisplayName("Should have correct default currency")
        void shouldHaveCorrectDefaultCurrency() {
            assertThat(CurrencyUtil.DEFAULT_CURRENCY).isEqualTo("USD");
        }

        @Test
        @DisplayName("Should have correct local currency")
        void shouldHaveCorrectLocalCurrency() {
            assertThat(CurrencyUtil.LOCAL_CURRENCY).isEqualTo("SYP");
        }

        @Test
        @DisplayName("Should have correct supported currencies")
        void shouldHaveCorrectSupportedCurrencies() {
            Set<String> supported = CurrencyUtil.SUPPORTED_CURRENCIES;
            
            assertThat(supported)
                .hasSize(2)
                .containsExactlyInAnyOrder("USD", "SYP");
        }
    }

    @Nested
    @DisplayName("CurrencyInfo Class Tests")
    class CurrencyInfoClassTests {

        @Test
        @DisplayName("Should create currency info correctly")
        void shouldCreateCurrencyInfoCorrectly() {
            CurrencyUtil.CurrencyInfo info = new CurrencyUtil.CurrencyInfo(
                "USD", "US Dollar", "$", 2, "Test description"
            );
            
            assertThat(info.getCode()).isEqualTo("USD");
            assertThat(info.getName()).isEqualTo("US Dollar");
            assertThat(info.getSymbol()).isEqualTo("$");
            assertThat(info.getDecimalPlaces()).isEqualTo(2);
            assertThat(info.getDescription()).isEqualTo("Test description");
        }

        @Test
        @DisplayName("Should implement toString correctly")
        void shouldImplementToStringCorrectly() {
            CurrencyUtil.CurrencyInfo info = new CurrencyUtil.CurrencyInfo(
                "USD", "US Dollar", "$", 2, "Test description"
            );
            
            String toString = info.toString();
            assertThat(toString)
                .contains("USD")
                .contains("US Dollar")
                .contains("Test description");
        }

        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        void shouldImplementEqualsAndHashCodeCorrectly() {
            CurrencyUtil.CurrencyInfo info1 = new CurrencyUtil.CurrencyInfo(
                "USD", "US Dollar", "$", 2, "Description 1"
            );
            CurrencyUtil.CurrencyInfo info2 = new CurrencyUtil.CurrencyInfo(
                "USD", "US Dollar", "$", 2, "Description 2"
            );
            CurrencyUtil.CurrencyInfo info3 = new CurrencyUtil.CurrencyInfo(
                "SYP", "Syrian Pound", "S£", 0, "Description 3"
            );
            
            assertThat(info1).isEqualTo(info2);
            assertThat(info1).isNotEqualTo(info3);
            assertThat(info1.hashCode()).isEqualTo(info2.hashCode());
        }
    }

    @Nested
    @DisplayName("Utility Class Tests")
    class UtilityClassTests {

        @Test
        @DisplayName("Should not allow instantiation")
        void shouldNotAllowInstantiation() {
            assertThatThrownBy(() -> {
                // Use reflection to try to instantiate the utility class
                var constructor = CurrencyUtil.class.getDeclaredConstructor();
                constructor.setAccessible(true);
                constructor.newInstance();
            })
            .hasCauseInstanceOf(UnsupportedOperationException.class)
            .cause()
            .hasMessageContaining("utility class");
        }
    }
}
