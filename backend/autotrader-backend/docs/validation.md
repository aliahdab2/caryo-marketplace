# Validation Framework

This document describes the validation framework used in the Car Listing application.

## Standard Validation

We use Jakarta Bean Validation (JSR 380) for validating request DTOs and entities. Common validations include:

- `@NotNull` - Ensures a field is not null
- `@NotBlank` - Ensures a string field is not null and contains at least one non-whitespace character
- `@Min` / `@Max` - Ensures numeric values are within specified bounds
- `@Digits` - Controls the number of digits in a numeric value
- `@Positive` / `@PositiveOrZero` - Ensures numbers are positive or non-negative

## Custom Validations

### CurrentYearOrEarlier

The `@CurrentYearOrEarlier` annotation is a custom validation that ensures a year value is not greater than the current year.

#### Usage

```java
@NotNull(message = "Year is required")
@Min(value = 1920, message = "Year must be 1920 or later")
@CurrentYearOrEarlier(message = "Year must not be later than the current year")
@Digits(integer = 4, fraction = 0, message = "Year must be a 4-digit number")
private Integer modelYear;
```

#### Implementation

The validation is implemented using two components:

1. **Annotation Interface**:
   ```java
   @Target({ElementType.FIELD, ElementType.PARAMETER})
   @Retention(RetentionPolicy.RUNTIME)
   @Constraint(validatedBy = CurrentYearOrEarlierValidator.class)
   public @interface CurrentYearOrEarlier {
       String message() default "Year must not be later than the current year";
       Class<?>[] groups() default {};
       Class<? extends Payload>[] payload() default {};
   }
   ```

2. **Validator Implementation**:
   ```java
   public class CurrentYearOrEarlierValidator implements ConstraintValidator<CurrentYearOrEarlier, Integer> {
       @Override
       public boolean isValid(Integer year, ConstraintValidatorContext context) {
           if (year == null) {
               return true;
           }
           int currentYear = Year.now().getValue();
           return year <= currentYear;
       }
   }
   ```

#### Advantages

- **Dynamic Validation**: The maximum valid year is always the current year, automatically updating as time passes
- **No Hard-Coding**: Avoids hard-coded year values that would need to be updated annually
- **Reusable**: The annotation can be applied to any year field that needs this validation

## Using Custom Validations

To add a new custom validation:

1. Create an annotation interface in the `validation` package
2. Create a validator implementation that implements `ConstraintValidator`
3. Apply the annotation to fields that need the validation
