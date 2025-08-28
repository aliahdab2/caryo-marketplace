# Email Template System

## Overview

This directory contains all email templates organized by category for easy maintenance and management. The system follows Spring Boot best practices and provides a centralized approach to email template management.

## Directory Structure

```
templates/emails/
├── config/                          # Configuration files
│   ├── template-registry.yml        # Template metadata and registry
│   └── email-templates-config.yml   # Email configuration
├── user-management/                 # User account related emails
│   ├── welcome.html                 # Welcome email for new users
│   ├── welcome-enhanced.html        # Enhanced welcome email
│   ├── password-reset.html          # Password reset email
│   └── password-reset-confirmation.html # Password reset confirmation
├── notifications/                   # System notifications
│   ├── listing-approved.html        # Listing approval notification
│   ├── listing-approved-improved.html # Enhanced approval notification
│   ├── listing-expired.html         # Listing expiration notification
│   └── listing-renewal.html         # Listing renewal reminder
├── communication/                   # User communication
│   ├── contact-form.html            # Contact form notification
│   ├── contact-confirmation.html    # Contact form confirmation
│   └── contact-confirmation-improved.html # Enhanced confirmation
├── base/                            # Base templates
│   └── base-email.html              # Base email template
└── README.md                        # This file
```

## Best Practices

### 1. Template Organization
- **Categorize by Purpose**: Group templates by their function (user-management, notifications, etc.)
- **Consistent Naming**: Use descriptive, consistent names for templates
- **Version Control**: Keep multiple versions when making significant changes
- **Metadata Management**: Always update template registry when adding new templates

### 2. Template Development
- **Use Constants**: Always use `EmailTemplateConstants` for template names and variables
- **Validate Variables**: Ensure all required variables are provided
- **Test Both Languages**: Verify templates work in both English and Arabic
- **Responsive Design**: Ensure templates work on mobile devices
- **Error Handling**: Include proper error handling and fallbacks

### 3. Code Integration
- **Use Builder Pattern**: Use `EmailTemplateBuilder` for constructing emails
- **Service Layer**: Use `EmailTemplateService` for template management
- **Validation**: Use `EmailTemplateValidationService` for comprehensive validation
- **Error Handling**: Always handle template resolution errors gracefully
- **Logging**: Use proper logging for debugging and monitoring

### 4. Testing
- **Unit Tests**: Test individual components (services, builders, constants)
- **Integration Tests**: Test complete email sending workflows
- **Validation Tests**: Test template validation and error scenarios
- **Performance Tests**: Test template loading and processing performance

## Usage Examples

### Using EmailTemplateBuilder

```java
@Autowired
private EmailTemplateBuilder templateBuilder;

// Build a welcome email
EmailTemplateBuilder.EmailTemplateData welcomeData = templateBuilder
    .template(EmailTemplateConstants.TEMPLATE_WELCOME)
    .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
    .user(user.getUsername(), user.getEmail())
    .website(websiteName, websiteUrl)
    .withLanguage()
    .build();

// Send the email
emailService.sendTemplatedEmail(
    user.getEmail(),
    "Welcome to AutoTrader!",
    welcomeData.getTemplateName(),
    welcomeData.getVariables(),
    welcomeData.getLanguage()
);
```

### Using EmailTemplateService

```java
@Autowired
private EmailTemplateService templateService;

// Get template metadata
Optional<Map<String, Object>> metadata = templateService.getTemplateMetadata("welcome");

// Validate template
boolean isValid = templateService.validateTemplate("welcome", variables);

// Get templates by category
List<String> userManagementTemplates = templateService.getTemplatesByCategory("user-management");
```

## Template Variables

### Common Variables
- `userName`: User's username
- `userEmail`: User's email address
- `websiteName`: Website name (AutoTrader/أوتو تريدر)
- `websiteUrl`: Website URL
- `language`: Template language (en/ar)

### User Management Variables
- `resetUrl`: Password reset URL
- `expiryHours`: Token expiry time
- `loginUrl`: Login page URL

### Notification Variables
- `listingTitle`: Car listing title
- `listingUrl`: Listing URL
- `renewalUrl`: Renewal URL
- `expiryDate`: Expiry date

### Communication Variables
- `senderName`: Sender's name
- `senderEmail`: Sender's email
- `message`: Contact message
- `timestamp`: Submission timestamp
- `supportEmail`: Support email address

## Adding New Templates

### 1. Create Template File
Create the HTML template in the appropriate category directory:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title th:text="${language == 'ar' ? 'Arabic Title' : 'English Title'}">Title</title>
</head>
<body th:dir="${language == 'ar' ? 'rtl' : 'ltr'}">
    <!-- Template content -->
</body>
</html>
```

### 2. Update Template Registry
Add template metadata to `config/template-registry.yml`:

```yaml
template-registry:
  user-management:
    new-template:
      path: "user-management/new-template.html"
      description: "Description of the new template"
      variables: ["userName", "userEmail", "websiteName"]
      languages: ["en", "ar"]
      category: "user-management"
```

### 3. Add Constants
Add template name to `EmailTemplateConstants.java`:

```java
public static final String TEMPLATE_NEW_TEMPLATE = "new-template";
```

### 4. Create Service Method
Add method to `EmailServiceImpl.java`:

```java
public void sendNewTemplateEmail(User user, String language) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("userName", user.getUsername());
    variables.put("userEmail", user.getEmail());
    // ... other variables
    
    String subject = language.equals("ar") ? "Arabic Subject" : "English Subject";
    
    sendTemplatedEmail(
        user.getEmail(),
        subject,
        EmailTemplateConstants.TEMPLATE_NEW_TEMPLATE,
        variables,
        language
    );
}
```

## Testing Templates

### 1. Unit Tests
Create tests for template validation:

```java
@Test
void testTemplateValidation() {
    Map<String, Object> variables = new HashMap<>();
    variables.put("userName", "testuser");
    variables.put("userEmail", "test@example.com");
    
    assertTrue(templateService.validateTemplate("welcome", variables));
}
```

### 2. Integration Tests
Test email sending with real templates:

```java
@Test
void testWelcomeEmailSending() {
    User user = createTestUser();
    assertDoesNotThrow(() -> emailService.sendWelcomeEmail(user));
}
```

## Troubleshooting

### Common Issues

1. **Template Not Found**
   - Check template path in registry
   - Verify template file exists
   - Ensure correct template name
   - Use validation service to check template integrity

2. **Missing Variables**
   - Check required variables in registry
   - Verify all variables are provided
   - Use template validation service
   - Check variable types and formats

3. **Language Issues**
   - Check language support in registry
   - Verify RTL layout for Arabic
   - Test both languages
   - Validate template encoding

4. **Template Parsing Errors**
   - Check Thymeleaf syntax in templates
   - Validate HTML structure
   - Test template rendering
   - Check for special characters in Arabic text

### Debug Mode
Enable debug logging in `application.properties`:

```properties
logging.level.com.autotrader.autotraderbackend.service.EmailTemplateService=DEBUG
logging.level.com.autotrader.autotraderbackend.service.EmailTemplateValidationService=DEBUG
logging.level.org.thymeleaf=DEBUG
```

### Validation Tools
Use the validation endpoints to check template integrity:

```bash
# Validate all templates
curl -X GET http://localhost:8080/api/admin/email-templates/validate/all

# Validate specific template
curl -X POST http://localhost:8080/api/admin/email-templates/welcome/validate \
  -H "Content-Type: application/json" \
  -d '{"userName":"test","userEmail":"test@example.com"}'

# Get validation summary
curl -X GET http://localhost:8080/api/admin/email-templates/validate/summary
```

## Maintenance

### Regular Tasks
- Review template usage statistics
- Update outdated templates
- Test template rendering
- Validate email client compatibility
- Check for broken links

### Version Control
- Keep template versions when making changes
- Document template changes
- Test templates before deployment
- Backup template configurations

## Support

For questions or issues:
- Check application logs
- Review template registry
- Test template validation
- Contact development team
