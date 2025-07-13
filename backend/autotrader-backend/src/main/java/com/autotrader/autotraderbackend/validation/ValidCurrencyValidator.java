package com.autotrader.autotraderbackend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Validator implementation for {@link ValidCurrency} annotation.
 * 
 * <p>This validator ensures that currency codes comply with Syrian marketplace requirements,
 * supporting both USD (primary for car sales) and SYP (local currency).</p>
 * 
 * <p>The validator performs the following checks:</p>
 * <ul>
 *   <li>Validates against supported currency codes (case-insensitive)</li>
 *   <li>Ensures currency codes follow ISO 4217 format (3 letters)</li>
 *   <li>Handles null values gracefully (delegates to @NotNull if required)</li>
 *   <li>Provides detailed logging for debugging purposes</li>
 * </ul>
 * 
 * @since 1.0
 * @see ValidCurrency
 */
public class ValidCurrencyValidator implements ConstraintValidator<ValidCurrency, String> {
    
    private static final Logger logger = LoggerFactory.getLogger(ValidCurrencyValidator.class);
    
    /**
     * Set of supported currency codes for the Syrian marketplace.
     * 
     * <ul>
     *   <li><strong>USD</strong> - US Dollar (primary for car sales in Syria)</li>
     *   <li><strong>SYP</strong> - Syrian Pound (local currency)</li>
     * </ul>
     */
    private static final Set<String> SUPPORTED_CURRENCIES = Set.of("USD", "SYP");
    
    /**
     * Pattern to validate ISO 4217 currency code format (exactly 3 uppercase letters).
     */
    private static final Pattern CURRENCY_CODE_PATTERN = Pattern.compile("^[A-Z]{3}$");
    
    /**
     * {@inheritDoc}
     */
    @Override
    public void initialize(ValidCurrency constraintAnnotation) {
        logger.debug("Initializing ValidCurrencyValidator with supported currencies: {}", SUPPORTED_CURRENCIES);
    }
    
    /**
     * Validates the currency code against Syrian marketplace requirements.
     * 
     * @param currency the currency code to validate (may be null)
     * @param context the constraint validator context
     * @return true if the currency is valid or null, false otherwise
     */
    @Override
    public boolean isValid(String currency, ConstraintValidatorContext context) {
        // Allow null values - let @NotNull annotation handle null validation if required
        if (currency == null) {
            logger.debug("Currency validation: null value allowed, delegating to @NotNull if present");
            return true;
        }
        
        // Trim whitespace and convert to uppercase for consistency
        String normalizedCurrency = currency.trim().toUpperCase();
        
        // Validate format first (ISO 4217 compliance)
        if (!CURRENCY_CODE_PATTERN.matcher(normalizedCurrency).matches()) {
            logger.debug("Currency validation failed: '{}' does not match ISO 4217 format (3 uppercase letters)", currency);
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Currency code must be exactly 3 letters (ISO 4217 format). Provided: '" + currency + "'"
            ).addConstraintViolation();
            return false;
        }
        
        // Validate against supported currencies
        boolean isSupported = SUPPORTED_CURRENCIES.contains(normalizedCurrency);
        
        if (!isSupported) {
            logger.debug("Currency validation failed: '{}' is not in supported currencies: {}", 
                normalizedCurrency, SUPPORTED_CURRENCIES);
            
            // Provide detailed error message with suggestions
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                String.format("Unsupported currency: '%s'. Syrian marketplace supports: %s. " +
                             "USD is recommended for car sales, SYP for local transactions.", 
                             currency, String.join(", ", SUPPORTED_CURRENCIES))
            ).addConstraintViolation();
            return false;
        }
        
        logger.debug("Currency validation successful: '{}' is supported", normalizedCurrency);
        return true;
    }
    
    /**
     * Utility method to get supported currencies for external use.
     * 
     * @return immutable set of supported currency codes
     */
    public static Set<String> getSupportedCurrencies() {
        return SUPPORTED_CURRENCIES;
    }
    
    /**
     * Utility method to check if a currency is supported without full validation.
     * 
     * @param currency the currency code to check
     * @return true if the currency is supported, false otherwise
     */
    public static boolean isCurrencySupported(String currency) {
        if (currency == null) {
            return false;
        }
        return SUPPORTED_CURRENCIES.contains(currency.trim().toUpperCase());
    }
}
