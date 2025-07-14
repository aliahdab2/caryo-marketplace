package com.autotrader.autotraderbackend.validation;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprehensive test suite for {@link ValidCurrencyValidator}.
 * 
 * <p>Tests cover various scenarios including:</p>
 * <ul>
 *   <li>Valid currency codes (USD, SYP)</li>
 *   <li>Invalid currency codes</li>
 *   <li>Case sensitivity handling</li>
 *   <li>Format validation (ISO 4217)</li>
 *   <li>Null and empty value handling</li>
 *   <li>Edge cases and error messages</li>
 * </ul>
 */
@DisplayName("ValidCurrencyValidator Tests")
class ValidCurrencyValidatorTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    /**
     * Test class to validate currency fields.
     */
    static class TestCurrencyHolder {
        @ValidCurrency
        private String currency;

        public TestCurrencyHolder(String currency) {
            this.currency = currency;
        }

        public String getCurrency() {
            return currency;
        }
    }

    @Nested
    @DisplayName("Valid Currency Tests")
    class ValidCurrencyTests {

        @ParameterizedTest
        @ValueSource(strings = {"USD", "SYP"})
        @DisplayName("Should accept supported currencies")
        void shouldAcceptSupportedCurrencies(String currency) {
            TestCurrencyHolder holder = new TestCurrencyHolder(currency);
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).isEmpty();
        }

        @ParameterizedTest
        @ValueSource(strings = {"usd", "syp", "Usd", "Syp", "USD ", " SYP", " USD "})
        @DisplayName("Should handle case variations and whitespace")
        void shouldHandleCaseVariationsAndWhitespace(String currency) {
            TestCurrencyHolder holder = new TestCurrencyHolder(currency);
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should allow null currency (delegated to @NotNull)")
        void shouldAllowNullCurrency() {
            TestCurrencyHolder holder = new TestCurrencyHolder(null);
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).isEmpty();
        }
    }

    @Nested
    @DisplayName("Invalid Currency Tests")
    class InvalidCurrencyTests {

        @ParameterizedTest
        @ValueSource(strings = {"EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY"})
        @DisplayName("Should reject unsupported currencies")
        void shouldRejectUnsupportedCurrencies(String currency) {
            TestCurrencyHolder holder = new TestCurrencyHolder(currency);
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).hasSize(1);
            assertThat(violations.iterator().next().getMessage())
                .contains("Unsupported currency")
                .contains(currency)
                .contains("USD")
                .contains("SYP");
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "   ", "US", "USDD", "U", "12", "123", "$", "US$", "SY"})
        @DisplayName("Should reject invalid currency formats")
        void shouldRejectInvalidFormats(String currency) {
            TestCurrencyHolder holder = new TestCurrencyHolder(currency);
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).hasSize(1);
            ConstraintViolation<TestCurrencyHolder> violation = violations.iterator().next();
            
            if (currency.trim().isEmpty()) {
                assertThat(violation.getMessage()).contains("ISO 4217 format");
            } else if (!currency.matches("^[A-Z]{3}$") && !currency.trim().isEmpty()) {
                assertThat(violation.getMessage()).contains("ISO 4217 format");
            }
        }

        @Test
        @DisplayName("Should provide detailed error message for unsupported currency")
        void shouldProvideDetailedErrorMessage() {
            TestCurrencyHolder holder = new TestCurrencyHolder("EUR");
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).hasSize(1);
            String errorMessage = violations.iterator().next().getMessage();
            
            assertThat(errorMessage)
                .contains("Unsupported currency: 'EUR'")
                .contains("Syrian marketplace supports: USD, SYP")
                .contains("USD is recommended for car sales")
                .contains("SYP for local transactions");
        }

        @Test
        @DisplayName("Should provide format error message for invalid format")
        void shouldProvideFormatErrorMessage() {
            TestCurrencyHolder holder = new TestCurrencyHolder("US");
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).hasSize(1);
            String errorMessage = violations.iterator().next().getMessage();
            
            assertThat(errorMessage)
                .contains("Currency code must be exactly 3 letters")
                .contains("ISO 4217 format")
                .contains("Provided: 'US'");
        }
    }

    @Nested
    @DisplayName("Utility Methods Tests")
    class UtilityMethodsTests {

        @Test
        @DisplayName("Should return correct supported currencies")
        void shouldReturnCorrectSupportedCurrencies() {
            Set<String> supportedCurrencies = ValidCurrencyValidator.getSupportedCurrencies();
            
            assertThat(supportedCurrencies)
                .hasSize(2)
                .containsExactlyInAnyOrder("USD", "SYP");
        }

        @ParameterizedTest
        @ValueSource(strings = {"USD", "SYP", "usd", "syp", "Usd", "Syp"})
        @DisplayName("Should correctly identify supported currencies")
        void shouldCorrectlyIdentifySupportedCurrencies(String currency) {
            assertThat(ValidCurrencyValidator.isCurrencySupported(currency)).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"EUR", "GBP", "JPY", "", "   ", "US", "USDD"})
        @DisplayName("Should correctly identify unsupported currencies")
        void shouldCorrectlyIdentifyUnsupportedCurrencies(String currency) {
            assertThat(ValidCurrencyValidator.isCurrencySupported(currency)).isFalse();
        }

        @Test
        @DisplayName("Should handle null in utility method")
        void shouldHandleNullInUtilityMethod() {
            assertThat(ValidCurrencyValidator.isCurrencySupported(null)).isFalse();
        }
    }

    @Nested
    @DisplayName("Syrian Marketplace Specific Tests")
    class SyrianMarketplaceTests {

        @Test
        @DisplayName("Should prioritize USD for car sales scenario")
        void shouldPrioritizeUsdForCarSales() {
            // Test that USD is accepted (primary currency for car sales in Syria)
            TestCurrencyHolder usdHolder = new TestCurrencyHolder("USD");
            Set<ConstraintViolation<TestCurrencyHolder>> usdViolations = validator.validate(usdHolder);
            
            assertThat(usdViolations).isEmpty();
            
            // Test that SYP is also accepted (local currency)
            TestCurrencyHolder sypHolder = new TestCurrencyHolder("SYP");
            Set<ConstraintViolation<TestCurrencyHolder>> sypViolations = validator.validate(sypHolder);
            
            assertThat(sypViolations).isEmpty();
        }

        @Test
        @DisplayName("Should suggest appropriate currencies in error message")
        void shouldSuggestAppropriateCurrenciesInErrorMessage() {
            TestCurrencyHolder holder = new TestCurrencyHolder("EUR");
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            String errorMessage = violations.iterator().next().getMessage();
            
            assertThat(errorMessage)
                .contains("USD is recommended for car sales")
                .contains("SYP for local transactions");
        }
    }

    @Nested
    @DisplayName("Edge Cases Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle currency with leading/trailing whitespace")
        void shouldHandleCurrencyWithWhitespace() {
            TestCurrencyHolder holder = new TestCurrencyHolder("  USD  ");
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should handle mixed case currency")
        void shouldHandleMixedCaseCurrency() {
            TestCurrencyHolder holder = new TestCurrencyHolder("uSd");
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).isEmpty();
        }

        @ParameterizedTest
        @ValueSource(strings = {"usd\n", "USD\t", "SYP\r"})
        @DisplayName("Should handle currency with special whitespace characters")
        void shouldHandleCurrencyWithSpecialWhitespace(String currency) {
            TestCurrencyHolder holder = new TestCurrencyHolder(currency);
            Set<ConstraintViolation<TestCurrencyHolder>> violations = validator.validate(holder);
            
            assertThat(violations).isEmpty();
        }
    }
}
