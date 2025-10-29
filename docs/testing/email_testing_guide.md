# Email Testing Guide

This guide explains how email functionality is tested in the AutoTrader Marketplace application using a comprehensive unit and integration test strategy.

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;
import jakarta.mail.internet.MimeMessage;

@Configuration
@Profile("test")
public class TestEmailConfig {

    private static final Logger logger = LoggerFactory.getLogger(TestEmailConfig.class);

    /**
     * Mock JavaMailSender that logs email attempts instead of sending real emails
     */
    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        return new JavaMailSender() {
            @Override
            public void send(SimpleMailMessage simpleMessage) {
                logger.info("Mock email send: {} to {}",
                    simpleMessage.getSubject(),
                    simpleMessage.getTo() != null && simpleMessage.getTo().length > 0
                        ? simpleMessage.getTo()[0] : "unknown");
            }

            @Override
            public void send(MimeMessage mimeMessage) {
                logger.info("Mock email send: MimeMessage (test mode)");
            }

            @Override
            public void send(MimeMessagePreparator mimeMessagePreparator) {
                logger.info("Mock email send: MimeMessagePreparator (test mode)");
            }

            @Override
            public MimeMessage createMimeMessage() {
                return new MockMimeMessage();
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) {
                for (SimpleMailMessage message : simpleMessages) {
                    send(message);
                }
            }

            @Override
            public void send(MimeMessage... mimeMessages) {
                for (MimeMessage message : mimeMessages) {
                    send(message);
                }
            }

            @Override
            public void send(MimeMessagePreparator... mimeMessagePreparators) {
                for (MimeMessagePreparator preparator : mimeMessagePreparators) {
                    send(preparator);
                }
            }

            @Override
            public MimeMessage createMimeMessage(java.io.InputStream contentStream) {
                return createMimeMessage();
            }
        };
    }

    /**
     * Simple mock MimeMessage for testing
     */
    private static class MockMimeMessage extends MimeMessage {
        public MockMimeMessage() {
            super((jakarta.mail.Session) null);
        }

        @Override
        public void saveChanges() {
            // No-op for mock
        }
    }

    /**
     * Real template engine for testing actual email templates
     */
    @Bean
    @Primary
    public TemplateEngine templateEngine() {
        SpringTemplateEngine templateEngine = new SpringTemplateEngine();

        ClassLoaderTemplateResolver templateResolver = new ClassLoaderTemplateResolver();
        templateResolver.setPrefix("templates/emails/");
        templateResolver.setSuffix(".html");
        templateResolver.setTemplateMode(TemplateMode.HTML);
        templateResolver.setCharacterEncoding("UTF-8");
        templateResolver.setCacheable(false);

        templateEngine.setTemplateResolver(templateResolver);
        return templateEngine;
    }
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
- **Location**: `ContactControllerTest.java`
- **Strategy**: MockMvc with standalone setup and mock EmailService
- **Coverage**: HTTP endpoint testing, validation, error handling

### 3. Application Context Tests
- **Location**: `AutotraderBackendApplicationTests.java`
- **Strategy**: Full Spring Boot context with `@Import(TestEmailConfig.class)`
- **Coverage**: Spring context loading, dependency injection, real template resolution

## Running Email Tests

### All Email Tests
```bash
# Runs all unit and integration tests
./gradlew test
```

### Specific Email Test Classes
```bash
# Unit tests for EmailService
./gradlew test --tests=EmailServiceTest

# Integration tests for ContactController
./gradlew test --tests=ContactControllerTest

# Application context tests
./gradlew test --tests=AutotraderBackendApplicationTests
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
- [GreenMail - Test Email Server for Java](https://www.icegreen.com/greenmail/)
- [Spring Boot Mail Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/io.html#io.email)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)