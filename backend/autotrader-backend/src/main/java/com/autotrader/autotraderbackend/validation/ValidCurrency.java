package com.autotrader.autotraderbackend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validation annotation to ensure currency code compliance with Syrian marketplace requirements.
 * 
 * <p>This annotation validates that the provided currency code is one of the supported 
 * currencies for the Caryo marketplace operating in Syria.</p>
 * 
 * <h3>Supported Currencies:</h3>
 * <ul>
 *   <li><strong>USD</strong> - US Dollar (primary currency for car sales in Syria)</li>
 *   <li><strong>SYP</strong> - Syrian Pound (local currency for domestic transactions)</li>
 * </ul>
 * 
 * <p>The validation is case-insensitive and follows ISO 4217 currency code standards.</p>
 * 
 * <h3>Usage Example:</h3>
 * <pre>{@code
 * public class CarListing {
 *     @ValidCurrency
 *     @NotNull
 *     private String currency;
 * }
 * }</pre>
 * 
 * @since 1.0
 * @see ValidCurrencyValidator
 */
@Documented
@Constraint(validatedBy = ValidCurrencyValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCurrency {
    
    /**
     * Default validation error message.
     * Can be overridden to provide custom error messages.
     * 
     * @return the validation error message
     */
    String message() default "Currency must be one of the supported currencies: USD (US Dollar), SYP (Syrian Pound)";
    
    /**
     * Validation groups for conditional validation.
     * 
     * @return array of validation groups
     */
    Class<?>[] groups() default {};
    
    /**
     * Payload for validation metadata.
     * 
     * @return array of payload classes
     */
    Class<? extends Payload>[] payload() default {};
}
