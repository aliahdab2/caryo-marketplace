# Password Reset API Documentation

This document describes the password reset functionality implemented in the Caryo Marketplace backend.

## Overview

The password reset system provides a secure way for users to reset their passwords when they forget them. It includes rate limiting, comprehensive validation, and security measures to prevent abuse.

## Security Features

- **Rate Limiting**: 3 attempts per email per hour, 10 attempts per IP per hour
- **Token Expiration**: Reset tokens expire after 1 hour
- **Single Use Tokens**: Each token can only be used once
- **Password Validation**: Strong password requirements enforced
- **Email Masking**: Email addresses are masked in logs for privacy
- **Retry Logic**: Email sending includes retry mechanism with exponential backoff
- **Input Validation**: Comprehensive validation of all inputs
- **Audit Logging**: All password reset activities are logged with IP addresses

## API Endpoints

### 1. Initiate Password Reset

Initiates the password reset process by sending a reset link to the user's email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Request Validation:**
- `email`: Required, must be a valid email format

**Response Codes:**
- `200 OK`: Request processed successfully (always returned to prevent user enumeration)
- `400 Bad Request`: Invalid request format or validation errors
- `429 Too Many Requests`: Rate limit exceeded

**Success Response:**
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

**Rate Limit Response:**
```json
{
  "message": "Too many password reset attempts. Please try again later."
}
```

**Validation Error Response:**
```json
{
  "message": "Invalid email address"
}
```

### 2. Validate Reset Token

Validates if a password reset token is valid and not expired.

**Endpoint:** `GET /api/auth/reset-password/validate?token={token}`

**Parameters:**
- `token`: The reset token to validate

**Response Codes:**
- `200 OK`: Token is valid
- `400 Bad Request`: Token is invalid or expired

**Success Response:**
```json
{
  "message": "Token is valid"
}
```

**Error Response:**
```json
{
  "message": "Error: Invalid or expired reset token"
}
```

### 3. Reset Password

Resets the user's password using a valid reset token.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewSecurePassword123!"
}
```

**Request Validation:**
- `token`: Required, 10-500 characters
- `newPassword`: Required, must meet password strength requirements:
  - 8-128 characters long
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one digit
  - At least one special character
  - No common weak patterns
  - No sequential characters (123, abc)
  - No excessive repeated characters

**Response Codes:**
- `200 OK`: Password reset successfully
- `400 Bad Request`: Invalid token, weak password, or validation errors
- `429 Too Many Requests`: Rate limit exceeded

**Success Response:**
```json
{
  "message": "Password has been reset successfully!"
}
```

**Error Responses:**
```json
{
  "message": "Invalid or expired reset token"
}
```

```json
{
  "message": "Password does not meet security requirements: Password must contain at least one uppercase letter"
}
```

```json
{
  "message": "New password must be different from your current password"
}
```

## Password Requirements

The system enforces strong password requirements:

1. **Length**: 8-128 characters
2. **Character Types**: Must include:
   - At least one lowercase letter (a-z)
   - At least one uppercase letter (A-Z)
   - At least one digit (0-9)
   - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
3. **Security Checks**:
   - Cannot contain common weak passwords
   - Cannot have sequential characters (123, abc, 321, cba)
   - Cannot have more than 2 consecutive repeated characters
   - Must be different from current password

## Rate Limiting

The system implements rate limiting to prevent abuse:

- **Per Email**: Maximum 3 password reset requests per email address per hour
- **Per IP Address**: Maximum 10 password reset requests per IP address per hour

When rate limits are exceeded, the API returns HTTP 429 (Too Many Requests).

## Security Considerations

### Token Security
- Tokens are generated using cryptographically secure random number generation
- Tokens are 32 bytes (256 bits) encoded in Base64 URL-safe format
- Tokens expire after 1 hour
- Tokens are single-use only
- All existing tokens for a user are invalidated when password is reset

### Email Security
- Email addresses are masked in logs to protect privacy
- Email sending includes retry logic with exponential backoff
- Email content is validated for suspicious patterns
- Failed email deliveries don't fail the password reset process

### Logging and Monitoring
- All password reset activities are logged with timestamps and IP addresses
- Failed attempts are logged with detailed error information
- Rate limiting violations are logged for security monitoring
- Email addresses are masked in all log entries

## Error Handling

The API provides detailed error messages while maintaining security:

1. **User Enumeration Prevention**: Always returns success for forgot password requests
2. **Detailed Validation**: Provides specific validation errors for password requirements
3. **Rate Limiting**: Clear messages when limits are exceeded
4. **Token Validation**: Consistent error messages for invalid/expired tokens

## Integration Examples

### JavaScript/Frontend Integration

```javascript
// Initiate password reset
async function forgotPassword(email) {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  const result = await response.json();
  
  if (response.status === 429) {
    // Handle rate limiting
    alert('Too many attempts. Please try again later.');
  } else {
    alert(result.message);
  }
}

// Validate reset token
async function validateToken(token) {
  const response = await fetch(`/api/auth/reset-password/validate?token=${token}`);
  return response.ok;
}

// Reset password
async function resetPassword(token, newPassword) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });
  
  const result = await response.json();
  
  if (response.ok) {
    alert('Password reset successfully!');
  } else {
    alert(`Error: ${result.message}`);
  }
}
```

### cURL Examples

```bash
# Initiate password reset
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Validate token
curl -X GET "http://localhost:8080/api/auth/reset-password/validate?token=your-token-here"

# Reset password
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token-here","newPassword":"NewSecurePassword123!"}'
```

## Database Schema

### password_reset_tokens Table

```sql
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_expiry ON password_reset_tokens(expiry_date);
```

## Monitoring and Maintenance

### Scheduled Tasks

The system includes a scheduled task that runs every hour to clean up expired and used tokens:

```java
@Scheduled(fixedRate = 3600000) // Every hour
public void cleanupExpiredTokens() {
    passwordResetService.cleanupExpiredTokens();
}
```

### Metrics to Monitor

1. **Password Reset Request Rate**: Monitor for unusual spikes
2. **Failed Email Deliveries**: Track email sending failures
3. **Rate Limiting Violations**: Monitor for potential abuse
4. **Token Usage Patterns**: Track token validation and usage
5. **Password Reset Success Rate**: Monitor completion rates

### Alerts to Configure

1. High rate of password reset requests from single IP
2. High rate of failed email deliveries
3. Unusual patterns in password reset attempts
4. Database errors in token operations
5. Email service unavailability

## Testing

The password reset functionality includes comprehensive tests:

- **Unit Tests**: `PasswordResetServiceTest`, `PasswordValidatorTest`
- **Integration Tests**: `PasswordResetIntegrationTest`
- **Security Tests**: Rate limiting, token validation, password strength
- **Email Tests**: Mock email sending and validation

Run tests with:
```bash
./gradlew test --tests "*PasswordReset*"
```

## Configuration

### Application Properties

```properties
# Frontend URL for reset links
app.frontend.url=http://localhost:3000

# Email configuration
app.email.from=noreply@caryo.sy
app.email.support=support@caryo.sy
app.website.name=Caryo Marketplace

# Token expiry (in hours)
app.password-reset.token-expiry-hours=1

# Rate limiting
app.password-reset.max-attempts-per-email=3
app.password-reset.max-attempts-per-ip=10
```

### Environment Variables

```bash
# Email service configuration
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-app-password
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
```
