# Email Template System Documentation

## Overview

The Caryo email template system provides a comprehensive solution for managing all email communications in the application. It supports bilingual content (English/Arabic), responsive design, and easy customization.

## Features

- ✅ **Bilingual Support**: All templates support English and Arabic
- ✅ **Responsive Design**: Mobile-friendly email layouts
- ✅ **Template Management**: Centralized configuration and management
- ✅ **Branding Consistency**: Unified styling across all emails
- ✅ **Easy Customization**: Simple template modification
- ✅ **RTL Support**: Right-to-left layout for Arabic content

## Email Templates

### 1. Welcome Email (`welcome-enhanced.html`)
**Purpose**: Sent to new users after registration
**Template**: `welcome-enhanced.html`
**Variables**:
- `userName`: User's username
- `userEmail`: User's email address
- `websiteName`: Website name (Caryo/أوتو تريدر)
- `websiteUrl`: Website URL

**Features**:
- Personalized welcome message
- Feature highlights
- Call-to-action buttons
- Support contact information

### 2. Password Reset Email (`password-reset.html`)
**Purpose**: Sent when user requests password reset
**Template**: `password-reset.html`
**Variables**:
- `userName`: User's username
- `resetUrl`: Password reset link
- `websiteName`: Website name
- `expiryHours`: Token expiry time

**Features**:
- Secure reset token
- Security notices
- Expiry information

### 3. Password Reset Confirmation (`password-reset-confirmation.html`)
**Purpose**: Sent after successful password reset
**Template**: `password-reset-confirmation.html`
**Variables**:
- `userName`: User's username
- `websiteName`: Website name
- `loginUrl`: Login page URL

### 4. Contact Form Notification (`contact-form.html`)
**Purpose**: Sent to admin when contact form is submitted
**Template**: `contact-form.html`
**Variables**:
- `senderName`: Sender's name
- `senderEmail`: Sender's email
- `message`: Contact message
- `timestamp`: Submission timestamp

### 5. Contact Form Confirmation (`contact-confirmation.html`)
**Purpose**: Sent to user after contact form submission
**Template**: `contact-confirmation.html`
**Variables**:
- `userName`: User's name
- `supportEmail`: Support email address
- `websiteName`: Website name

### 6. Listing Approved (`listing-approved.html`)
**Purpose**: Sent when car listing is approved
**Template**: `listing-approved.html`
**Variables**:
- `userName`: User's username
- `listingTitle`: Car listing title
- `listingUrl`: Listing URL
- `websiteName`: Website name

### 7. Listing Expired (`listing-expired.html`)
**Purpose**: Sent when car listing expires
**Template**: `listing-expired.html`
**Variables**:
- `userName`: User's username
- `listingTitle`: Car listing title
- `renewalUrl`: Renewal URL
- `websiteName`: Website name

### 8. Listing Renewal Reminder (`listing-renewal.html`)
**Purpose**: Sent as reminder to renew expiring listing
**Template**: `listing-renewal.html`
**Variables**:
- `userName`: User's username
- `listingTitle`: Car listing title
- `expiryDate`: Expiry date
- `renewalUrl`: Renewal URL
- `websiteName`: Website name

## Template Structure

### Base Template (`base-email.html`)
All email templates extend the base template which provides:
- Common CSS styles
- Responsive design
- RTL support
- Branding elements

### Template Components
1. **Header**: Logo and title
2. **Content**: Main message and information
3. **Call-to-Action**: Buttons and links
4. **Footer**: Contact information and links

## Customization Guide

### 1. Modifying Email Content

To modify email content, edit the corresponding HTML template:

```html
<!-- Example: Modify welcome message -->
<p class="content-text" th:text="${language == 'ar' ? 'مرحباً بك في ' + websiteName + '!' : 'Welcome to ' + websiteName + '!'}">
    Welcome to Caryo!
</p>
```

### 2. Adding New Variables

To add new variables to a template:

1. **Update EmailServiceImpl.java**:
```java
Map<String, Object> variables = new HashMap<>();
variables.put("newVariable", value);
```

2. **Update HTML template**:
```html
<span th:text="${newVariable}">Default Value</span>
```

### 3. Creating New Templates

To create a new email template:

1. **Create HTML file** in `src/main/resources/templates/emails/`
2. **Add method** to `EmailService.java`
3. **Implement method** in `EmailServiceImpl.java`
4. **Update configuration** in `email-templates-config.yml`

### 4. Styling Customization

Modify CSS in the template or base template:

```css
/* Example: Change primary color */
.btn-primary {
    background: linear-gradient(135deg, #your-color 0%, #your-color 100%);
}
```

## Configuration

### Email Template Configuration (`email-templates-config.yml`)

The configuration file defines:
- Template names and subjects
- Required variables
- Features and capabilities
- Branding settings
- Management options

### Environment Variables

Configure email settings in `application.properties`:

```properties
# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${GMAIL_USERNAME}
spring.mail.password=${GMAIL_APP_PASSWORD}

# Website Configuration
app.website.name=Caryo
app.website.name.ar=أوتو تريدر
app.website.url=http://localhost:3000
```

## Usage Examples

### Sending Welcome Email

```java
@Autowired
private EmailService emailService;

// Send welcome email to new user
emailService.sendWelcomeEmail(user);

// Send welcome email with specific language
emailService.sendWelcomeEmail(user, "ar");
```

### Sending Password Reset Email

```java
// Send password reset email
emailService.sendPasswordResetEmail(user, resetToken, resetUrl);
```

### Sending Custom Email

```java
// Send custom templated email
Map<String, Object> variables = new HashMap<>();
variables.put("userName", user.getUsername());
variables.put("customMessage", "Your custom message");

emailService.sendTemplatedEmail(
    user.getEmail(),
    "Custom Subject",
    "custom-template",
    variables,
    "en"
);
```

## Best Practices

### 1. Template Design
- Use responsive design
- Include clear call-to-action buttons
- Maintain consistent branding
- Test on multiple email clients

### 2. Content Management
- Use bilingual content
- Keep messages concise and clear
- Include relevant links
- Provide support contact information

### 3. Technical Implementation
- Handle email sending errors gracefully
- Log email activities for monitoring
- Use async processing for better performance
- Implement email tracking (optional)

### 4. Testing
- Test templates in different email clients
- Verify RTL layout for Arabic content
- Check mobile responsiveness
- Validate all links and buttons

## Troubleshooting

### Common Issues

1. **Emails not sending**:
   - Check SMTP configuration
   - Verify email credentials
   - Check application logs

2. **Template not found**:
   - Verify template file exists
   - Check template name in code
   - Ensure proper file path

3. **Variables not displaying**:
   - Check variable names match
   - Verify variables are added to Map
   - Check Thymeleaf syntax

4. **Styling issues**:
   - Test in different email clients
   - Use inline CSS for better compatibility
   - Check responsive design

### Debugging

Enable debug logging in `application.properties`:

```properties
logging.level.org.springframework.mail=DEBUG
logging.level.com.caryo.caryomarketplace.service.EmailServiceImpl=DEBUG
```

## Future Enhancements

### Planned Features
- Email template preview system
- A/B testing for email templates
- Email analytics and tracking
- Template version control
- Drag-and-drop template editor
- Email scheduling system

### Integration Opportunities
- Newsletter system
- Marketing automation
- Customer support integration
- Analytics and reporting

## Support

For questions or issues with the email template system:
- Check application logs
- Review this documentation
- Contact the development team
- Create an issue in the project repository
