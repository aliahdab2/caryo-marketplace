# 📧 Email Service Configuration Guide

## 🎯 Overview

This guide explains how to configure the email service with flexible website names and multi-language support for Arabic and English. The service now includes enhanced Arabic email templates with cultural sensitivity and professional design.

## 🔧 Configuration Options

### 1. Website Name Configuration

The email service supports configurable website names for both English and Arabic:

#### Development Environment (`application-dev.properties`)
```properties
# Website configuration
app.website.name=Caryo Marketplace
app.website.name.ar=كاريو
app.website.url=http://localhost:3000
app.website.support-email=support@caryo.sy
```

#### Production Environment (`application-prod.properties`)
```properties
# Website configuration (configurable via environment variables)
app.website.name=${WEBSITE_NAME:Caryo Marketplace}
app.website.name.ar=${WEBSITE_NAME_AR:كاريو}
app.website.url=${WEBSITE_URL:https://caryo.sy}
app.website.support-email=${WEBSITE_SUPPORT_EMAIL:support@caryo.sy}
```

### 2. Language Configuration

#### Default Language Settings
```properties
# Email language settings
app.email.default-language=en
app.email.supported-languages=en,ar
```

#### Production Environment Variables
```properties
app.email.default-language=${EMAIL_DEFAULT_LANGUAGE:en}
app.email.supported-languages=${EMAIL_SUPPORTED_LANGUAGES:en,ar}
```

## 🚀 How to Customize Website Name

### Option 1: Development Environment
Edit `backend/caryo-backend/src/main/resources/application-dev.properties`:

```properties
# Change these values to your desired website name
app.website.name=YourWebsiteName
app.website.name.ar=اسم موقعك بالعربية
app.website.url=http://localhost:3000
app.website.support-email=support@yourwebsite.com
```

### Option 2: Production Environment
Set environment variables when deploying:

```bash
# Set your website name
export WEBSITE_NAME="YourWebsiteName"
export WEBSITE_NAME_AR="اسم موقعك بالعربية"
export WEBSITE_URL="https://yourwebsite.com"
export WEBSITE_SUPPORT_EMAIL="support@yourwebsite.com"

# Set default language
export EMAIL_DEFAULT_LANGUAGE="en"  # or "ar" for Arabic
```

## 🌐 Multi-Language Support

### Supported Languages
- **English (en)**: Default language
- **Arabic (ar)**: Full RTL support with Arabic translations

### Language Selection

#### 1. Contact Form API
The contact form API now supports language selection:

```json
POST /api/contact
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I have a question about your services.",
  "language": "en"  // or "ar" for Arabic
}
```

#### 2. Email Service Methods
All email service methods support language parameter:

```java
// Send welcome email in Arabic
emailService.sendWelcomeEmail(user, "ar");

// Send listing approved email in English
emailService.sendListingApprovedEmail(seller, listing, "en");

// Send contact form in Arabic
emailService.sendContactFormEmail(name, email, message, "ar");
```

## 📧 Email Templates

### Template Structure
All email templates now support:
- **Configurable website name** (English and Arabic)
- **Multi-language content** (English and Arabic)
- **RTL support** for Arabic emails
- **Dynamic URLs** based on configuration

### Template Variables
Each template automatically receives these variables:
- `websiteName`: Website name in current language
- `websiteUrl`: Website URL from configuration
- `supportEmail`: Support email from configuration
- `language`: Current language code ("en" or "ar")

### Available Templates
1. **welcome.html** - Welcome email for new users
2. **listing-approved.html** - Listing approval notification
3. **listing-expired.html** - Listing expiration notification
4. **listing-renewal.html** - Listing renewal confirmation
5. **contact-form.html** - Support team notification
6. **contact-confirmation.html** - Sender confirmation

## 🔄 Event Listener Integration

The event listeners automatically use the default language configured in the application properties. To send emails in a specific language, you can modify the listeners:

```java
// Example: Send listing approved email in Arabic
emailService.sendListingApprovedEmail(seller, listing, "ar");
```

## 🧪 Testing

### Test Different Languages
1. **English Test**:
   ```bash
   curl -X POST http://localhost:8080/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john@example.com",
       "message": "Test message",
       "language": "en"
     }'
   ```

2. **Arabic Test**:
   ```bash
   curl -X POST http://localhost:8080/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "أحمد محمد",
       "email": "ahmed@example.com",
       "message": "رسالة تجريبية",
       "language": "ar"
     }'
   ```

### MailDev Testing
1. Start the development environment
2. Access MailDev Web UI: http://localhost:1080
3. Submit contact forms in different languages
4. Verify email templates render correctly

## 📋 Configuration Examples

### Example 1: Car Marketplace
```properties
app.website.name=CarMarket
app.website.name.ar=سوق السيارات
app.website.url=https://carmarket.com
app.website.support-email=support@carmarket.com
app.email.default-language=en
```

### Example 2: Arabic-First Marketplace
```properties
app.website.name=سوق العرب
app.website.name.ar=سوق العرب
app.website.url=https://souqalarab.com
app.website.support-email=support@souqalarab.com
app.email.default-language=ar
```

### Example 3: Bilingual Marketplace
```properties
app.website.name=AutoHub
app.website.name.ar=أوتو هب
app.website.url=https://autohub.com
app.website.support-email=support@autohub.com
app.email.default-language=en
```

## 🔧 Environment Variables Reference

### Development
| Variable | Default | Description |
|----------|---------|-------------|
| `app.website.name` | Caryo Marketplace | English website name |
| `app.website.name.ar` | كاريو | Arabic website name |
| `app.website.url` | http://localhost:3000 | Website URL |
| `app.website.support-email` | support@caryo.sy | Support email |
| `app.email.default-language` | en | Default email language |

### Production
| Variable | Default | Description |
|----------|---------|-------------|
| `WEBSITE_NAME` | Caryo Marketplace | English website name |
| `WEBSITE_NAME_AR` | كاريو | Arabic website name |
| `WEBSITE_URL` | https://caryo.sy | Website URL |
| `WEBSITE_SUPPORT_EMAIL` | support@caryo.sy | Support email |
| `EMAIL_DEFAULT_LANGUAGE` | en | Default email language |

## 🚨 Troubleshooting

### Common Issues

1. **Website name not updating**:
   - Check application properties file
   - Restart the application after changes
   - Verify environment variables in production

2. **Arabic emails not rendering correctly**:
   - Ensure UTF-8 encoding is set
   - Check that Arabic font is available
   - Verify RTL direction is applied

3. **Language not switching**:
   - Check the `language` parameter in API calls
   - Verify the language code is "en" or "ar"
   - Check application logs for language selection

### Debug Commands
```bash
# Check current configuration
curl http://localhost:8080/actuator/env | grep website

# Test email service
curl -X POST http://localhost:8080/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test","language":"en"}'
```

## 📚 Best Practices

1. **Website Name Consistency**: Use the same website name across all templates
2. **Language Detection**: Implement user language preference detection
3. **Fallback Language**: Always provide English as fallback
4. **Testing**: Test both languages thoroughly before deployment
5. **Localization**: Consider cultural differences in email content

## 🌟 Enhanced Arabic Email Templates

### Available Templates
- **Standard Templates**: Basic functionality with multi-language support
  - `welcome.html`, `listing-approved.html`, `contact-confirmation.html`

- **Enhanced Templates**: Professional design with cultural sensitivity
  - `welcome-improved.html` - Islamic greetings, rich content, modern design
  - `listing-approved-improved.html` - Congratulations styling, detailed information
  - `contact-confirmation-improved.html` - Professional response timeline, multiple contact methods

### Key Features of Enhanced Templates
- 🕌 **Islamic Cultural Sensitivity**: "السلام عليكم ورحمة الله وبركاته"
- 🎨 **Professional Design**: Modern gradients, responsive layout
- 📱 **Mobile Optimized**: Fully responsive design for all devices
- 📊 **Rich Content**: Detailed information, tips, and guidance
- 🔗 **Multiple Contact Methods**: WhatsApp, email, phone support
- 🌍 **Regional Context**: Saudi Arabia localization

### Using Enhanced Templates
To use the enhanced templates, update your `EmailService` calls to reference the improved template names:
```java
// Instead of "welcome"
emailService.sendTemplatedEmail(user.getEmail(), subject, "welcome-improved", variables, "ar");

// Instead of "listing-approved"
emailService.sendTemplatedEmail(user.getEmail(), subject, "listing-approved-improved", variables, "ar");
```

## 🎉 Summary

The email service now supports:
- ✅ **Configurable website names** for English and Arabic
- ✅ **Multi-language email templates** with RTL support
- ✅ **Enhanced Arabic templates** with cultural sensitivity
- ✅ **Professional email design** with modern styling
- ✅ **Flexible configuration** via properties or environment variables
- ✅ **Language selection** in API calls
- ✅ **Automatic template variable injection**
- ✅ **Comprehensive testing support**

This makes the email service highly flexible and ready for any marketplace name and language requirements!