# Email Testing Guide

This guide explains how email functionality is tested in the AutoTrader Marketplace application, including both integration tests and API tests.

## Overview

The email service testing strategy uses mock `JavaMailSender` to provide reliable, fast, and CI-compatible testing without requiring external SMTP services.

## Testing Architecture

### Test Profile Configuration

Email tests use a dedicated test profile that provides:

- **Mock Email Service**: `TestEmailConfig` with mock `JavaMailSender`
- **Real Template Engine**: Uses actual Thymeleaf email templates
- **H2 Database**: In-memory database for fast test execution
- **Proper Logging**: slf4j logging instead of console output

### Key Components

#### TestEmailConfig.java
```java
@Configuration
@Profile("test")
public class TestEmailConfig {
    // Provides mock JavaMailSender that logs email attempts
    // Uses real ClassLoaderTemplateResolver for template testing
}
```

#### application-test.properties
```properties
# Test profile configuration
spring.profiles.active=test
spring.mail.host=localhost
spring.mail.port=25
spring.mail.test-connection=false

# Thymeleaf configuration for real templates
spring.thymeleaf.prefix=classpath:/templates/emails/
spring.thymeleaf.suffix=.html
```

## Test Types

### 1. Unit Tests
- **Location**: `EmailServiceTest.java`
- **Strategy**: Mock all dependencies including `JavaMailSender`
- **Coverage**: Service methods, error handling, validation

### 2. Integration Tests
- **Location**: `AutotraderBackendApplicationTests.java`
- **Strategy**: Use `@Import(TestEmailConfig.class)` with test profile
- **Coverage**: Spring context loading, dependency injection

### 3. API Tests (Postman)
- **Location**: `contact-email-tests.json`
- **Strategy**: Test profile with mock email service
- **Coverage**: End-to-end contact form functionality

## Running Email Tests

### Integration Tests
```bash
./gradlew test
```

### API Tests
```bash
# Starts app with test profile automatically
./src/test/scripts/run_postman_tests.sh
```

### Individual Postman Email Tests
```bash
cd src/test/resources/postman
newman run collections/contact-email-tests.json -e environment.json
```

## Test Scenarios Covered

### Contact Form Tests
1. **English Contact Form**
   - Valid form submission
   - Success response with English message
   - Email service mock verification

2. **Arabic Contact Form**
   - Valid form submission with Arabic content
   - Success response with Arabic message
   - RTL language handling

3. **Validation Tests**
   - Missing required fields
   - Invalid email format
   - Error response validation

## Benefits of This Approach

### ✅ Advantages
- **Fast**: No network calls or external dependencies
- **Reliable**: Consistent results across environments
- **CI Compatible**: No SMTP server setup required
- **Real Templates**: Tests actual email template rendering
- **Complete Coverage**: Tests API endpoints and service logic

### ❌ What We Don't Test
- Actual email delivery (handled by email provider)
- SMTP connection issues (infrastructure concern)
- Email client rendering (frontend/design concern)

## Best Practices

### Do ✅
- Use test profile for API tests
- Mock external services (JavaMailSender)
- Test template rendering with real templates
- Verify email service method calls
- Test both success and error scenarios

### Don't ❌
- Require external SMTP servers for tests
- Use `System.out.println` for logging
- Skip email testing due to complexity
- Test actual email delivery in unit/API tests

## Troubleshooting

### Common Issues

1. **Template Not Found Error**
   ```
   Error resolving template [contact-form]
   ```
   **Solution**: Ensure `spring.thymeleaf.prefix` is correctly configured

2. **JavaMailSender Bean Not Found**
   ```
   Parameter 0 of constructor required a bean of type 'JavaMailSender'
   ```
   **Solution**: Verify test profile is active and `TestEmailConfig` is loaded

3. **Profile Not Active**
   ```
   No active profile set, falling back to default profiles
   ```
   **Solution**: Ensure `--spring.profiles.active=test` is set

### Debug Commands
```bash
# Check if test profile is active
curl http://localhost:8080/actuator/env | grep "test"

# View application logs
tail -f build/bootRun.log | grep -i email

# Test contact endpoint directly
curl -X POST http://localhost:8080/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test","language":"en"}'
```

## File Locations

### Configuration
- `src/main/java/.../config/TestEmailConfig.java` - Mock email configuration
- `src/main/resources/application-test.properties` - Test profile settings
- `src/test/resources/application-test.properties` - Integration test settings

### Tests
- `src/test/java/.../service/EmailServiceTest.java` - Unit tests
- `src/test/resources/postman/collections/contact-email-tests.json` - API tests
- `src/test/scripts/run_postman_tests.sh` - Test execution script

### Templates
- `src/main/resources/templates/emails/contact-form.html` - Contact email template
- `src/main/resources/templates/emails/contact-confirmation.html` - Confirmation template

## Future Improvements

- Add more email template tests (user registration, password reset)
- Implement email content validation in tests
- Add performance benchmarks for email service
- Consider adding email preview functionality for development

## References

- [Spring Boot Testing Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-testing)
- [Thymeleaf Testing Guide](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html#testing)
- [MockMail Documentation](https://javaee.github.io/javamail/docs/api/javax/mail/Session.html)