package com.autotrader.autotraderbackend.util;

import com.autotrader.autotraderbackend.validation.ValidCurrencyValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Utility class for currency-related operations in the Syrian marketplace.
 * 
 * <p>This class provides comprehensive currency handling functionality including:</p>
 * <ul>
 *   <li>Currency validation and normalization</li>
 *   <li>Price formatting for display</li>
 *   <li>Currency conversion (when rates are available)</li>
 *   <li>Market-specific currency recommendations</li>
 * </ul>
 * 
 * <p>The utility is designed specifically for the Syrian car marketplace where USD
 * is the primary currency for car sales and SYP is used for local transactions.</p>
 * 
 * @since 1.0
 */
public final class CurrencyUtil {
    
    private static final Logger logger = LoggerFactory.getLogger(CurrencyUtil.class);
    
    /**
     * Default currency for new car listings in the Syrian market.
     */
    public static final String DEFAULT_CURRENCY = "USD";
    
    /**
     * Local currency of Syria.
     */
    public static final String LOCAL_CURRENCY = "SYP";
    
    /**
     * Set of all supported currencies.
     */
    public static final Set<String> SUPPORTED_CURRENCIES = ValidCurrencyValidator.getSupportedCurrencies();
    
    /**
     * Currency information for supported currencies.
     */
    private static final Map<String, CurrencyInfo> CURRENCY_INFO = Map.of(
        "USD", new CurrencyInfo("USD", "US Dollar", "$", 2, "Primary currency for car sales in Syria"),
        "SYP", new CurrencyInfo("SYP", "Syrian Pound", "SYR", 0, "Local currency for domestic transactions")
    );
    
    // Private constructor to prevent instantiation
    private CurrencyUtil() {
        throw new UnsupportedOperationException("CurrencyUtil is a utility class and cannot be instantiated");
    }
    
    /**
     * Validates and normalizes a currency code.
     * 
     * @param currency the currency code to validate and normalize
     * @return the normalized currency code in uppercase
     * @throws IllegalArgumentException if the currency is not supported
     */
    public static String validateAndNormalize(String currency) {
        if (currency == null || currency.trim().isEmpty()) {
            throw new IllegalArgumentException("Currency cannot be null or empty");
        }
        
        String normalized = currency.trim().toUpperCase();
        
        if (!ValidCurrencyValidator.isCurrencySupported(normalized)) {
            throw new IllegalArgumentException(
                String.format("Unsupported currency: %s. Supported currencies: %s", 
                    currency, String.join(", ", SUPPORTED_CURRENCIES))
            );
        }
        
        return normalized;
    }
    
    /**
     * Formats a price for display with appropriate currency symbol and formatting.
     * 
     * @param amount the amount to format
     * @param currency the currency code
     * @return formatted price string
     */
    public static String formatPrice(BigDecimal amount, String currency) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        
        String normalizedCurrency = validateAndNormalize(currency);
        CurrencyInfo info = CURRENCY_INFO.get(normalizedCurrency);
        
        if (info == null) {
            logger.warn("No formatting info available for currency: {}", normalizedCurrency);
            return String.format("%s %s", normalizedCurrency, amount.toString());
        }
        
        // Round to appropriate decimal places
        BigDecimal roundedAmount = amount.setScale(info.decimalPlaces, RoundingMode.HALF_UP);
        
        // Format based on currency
        if ("USD".equals(normalizedCurrency)) {
            return String.format("$%,." + info.decimalPlaces + "f", roundedAmount);
        } else if ("SYP".equals(normalizedCurrency)) {
            // Format SYP with no decimal places and appropriate grouping
            return String.format("SYR%,.0f", roundedAmount);
        }
        
        return String.format("%s %s", info.symbol, roundedAmount.toString());
    }
    
    /**
     * Formats a price for API responses with currency code.
     * 
     * @param amount the amount to format
     * @param currency the currency code
     * @return formatted price with currency code
     */
    public static String formatPriceWithCode(BigDecimal amount, String currency) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        
        String normalizedCurrency = validateAndNormalize(currency);
        CurrencyInfo info = CURRENCY_INFO.get(normalizedCurrency);
        
        if (info == null) {
            return String.format("%s %s", amount.toString(), normalizedCurrency);
        }
        
        BigDecimal roundedAmount = amount.setScale(info.decimalPlaces, RoundingMode.HALF_UP);
        return String.format("%s %s", roundedAmount.toString(), normalizedCurrency);
    }
    
    /**
     * Gets the recommended currency for car listings based on price range.
     * 
     * @param priceRange the estimated price range
     * @return recommended currency code
     */
    public static String getRecommendedCurrency(PriceRange priceRange) {
        if (priceRange == null) {
            return DEFAULT_CURRENCY;
        }
        
        // For Syrian market, USD is typically used for cars
        // SYP might be used for very local, low-value transactions
        switch (priceRange) {
            case BUDGET:
            case ECONOMY:
            case MID_RANGE:
            case LUXURY:
            case EXOTIC:
                return "USD"; // USD recommended for all car price ranges
            default:
                return DEFAULT_CURRENCY;
        }
    }
    
    /**
     * Gets currency information for a given currency code.
     * 
     * @param currency the currency code
     * @return currency information
     * @throws IllegalArgumentException if currency is not supported
     */
    public static CurrencyInfo getCurrencyInfo(String currency) {
        String normalizedCurrency = validateAndNormalize(currency);
        CurrencyInfo info = CURRENCY_INFO.get(normalizedCurrency);
        
        if (info == null) {
            throw new IllegalArgumentException("No information available for currency: " + currency);
        }
        
        return info;
    }
    
    /**
     * Gets all supported currencies with their information.
     * 
     * @return map of currency code to currency information
     */
    public static Map<String, CurrencyInfo> getAllCurrencyInfo() {
        return Collections.unmodifiableMap(CURRENCY_INFO);
    }
    
    /**
     * Checks if a currency is the default currency for the marketplace.
     * 
     * @param currency the currency to check
     * @return true if it's the default currency
     */
    public static boolean isDefaultCurrency(String currency) {
        if (currency == null) {
            return false;
        }
        return DEFAULT_CURRENCY.equals(currency.trim().toUpperCase());
    }
    
    /**
     * Checks if a currency is the local currency.
     * 
     * @param currency the currency to check
     * @return true if it's the local currency
     */
    public static boolean isLocalCurrency(String currency) {
        if (currency == null) {
            return false;
        }
        return LOCAL_CURRENCY.equals(currency.trim().toUpperCase());
    }
    
    /**
     * Validates a price amount for a given currency.
     * 
     * @param amount the amount to validate
     * @param currency the currency code
     * @return true if the amount is valid for the currency
     */
    public static boolean isValidAmount(BigDecimal amount, String currency) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }
        
        try {
            String normalizedCurrency = validateAndNormalize(currency);
            CurrencyInfo info = CURRENCY_INFO.get(normalizedCurrency);
            
            if (info == null) {
                return false;
            }
            
            // Check if amount has appropriate decimal places
            return amount.scale() <= info.decimalPlaces;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
    
    /**
     * Price range enumeration for currency recommendations.
     */
    public enum PriceRange {
        BUDGET,      // Under $5,000
        ECONOMY,     // $5,000 - $15,000
        MID_RANGE,   // $15,000 - $35,000
        LUXURY,      // $35,000 - $100,000
        EXOTIC       // Over $100,000
    }
    
    /**
     * Currency information holder class.
     */
    public static class CurrencyInfo {
        private final String code;
        private final String name;
        private final String symbol;
        private final int decimalPlaces;
        private final String description;
        
        public CurrencyInfo(String code, String name, String symbol, int decimalPlaces, String description) {
            this.code = code;
            this.name = name;
            this.symbol = symbol;
            this.decimalPlaces = decimalPlaces;
            this.description = description;
        }
        
        public String getCode() { return code; }
        public String getName() { return name; }
        public String getSymbol() { return symbol; }
        public int getDecimalPlaces() { return decimalPlaces; }
        public String getDescription() { return description; }
        
        @Override
        public String toString() {
            return String.format("%s (%s) - %s", code, name, description);
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            CurrencyInfo that = (CurrencyInfo) o;
            return Objects.equals(code, that.code);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(code);
        }
    }
}
