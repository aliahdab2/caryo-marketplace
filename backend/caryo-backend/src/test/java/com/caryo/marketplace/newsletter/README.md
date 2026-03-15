# Newsletter System Tests

This directory contains comprehensive tests for the newsletter subscription system.

## Test Coverage

### NewsletterControllerTest
- **Integration tests** for REST API endpoints
- **Coverage**: 15 test cases covering all API scenarios
- **Tests include**:
  - Successful subscription with English/Arabic languages
  - Email validation (invalid formats, missing emails)
  - Duplicate subscription handling
  - Confirmation workflow
  - Unsubscribe workflow
  - Statistics endpoint
  - Default language and source handling

### NewsletterServiceTest
- **Unit tests** for business logic
- **Coverage**: 12 test cases covering all service methods
- **Tests include**:
  - New subscription creation
  - Existing subscription reactivation
  - Email confirmation process
  - Unsubscribe process
  - Error handling and resilience
  - Email service exception handling
  - Email normalization (trim, lowercase)

## Running Tests

```bash
# Run all newsletter tests
./gradlew test --tests="*Newsletter*"

# Run only controller tests
./gradlew test --tests="NewsletterControllerTest"

# Run only service tests
./gradlew test --tests="NewsletterServiceTest"
```

## Test Features

- **Mocked EmailService**: Prevents actual email sending during tests
- **Database cleanup**: Each test runs with a clean state
- **Error simulation**: Tests error scenarios and exception handling
- **Validation testing**: Comprehensive input validation coverage
- **Edge case coverage**: Handles duplicate subscriptions, invalid tokens, etc.

## Test Results Summary

- **Total Tests**: 27
- **Controller Tests**: 15
- **Service Tests**: 12
- **Coverage**: All major code paths and error scenarios
- **Status**: ✅ All tests passing

The tests ensure the newsletter system is robust, secure, and handles all expected use cases and edge cases properly.
