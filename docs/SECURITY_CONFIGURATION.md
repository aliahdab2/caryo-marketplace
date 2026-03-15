# Security Configuration Guide

This document outlines the security hardening measures implemented in Caryo Marketplace and the required configuration for production deployment.

## Table of Contents
- [Critical Actions Before Deployment](#critical-actions-before-deployment)
- [Environment Variables](#environment-variables)
- [Security Features](#security-features)
- [Rate Limiting](#rate-limiting)
- [CORS Configuration](#cors-configuration)
- [JWT Configuration](#jwt-configuration)
- [Production Checklist](#production-checklist)

---

## Critical Actions Before Deployment

### 1. Revoke Exposed API Keys

**CRITICAL:** The following API key was previously committed and must be revoked immediately:

```
OpenAI API Key: sk-proj-krvAH...
```

**Action Required:**
1. Go to https://platform.openai.com/api-keys
2. Revoke the exposed key
3. Generate a new key
4. Set it via environment variable only (see below)

### 2. Generate New Secrets

Generate cryptographically secure secrets for production:

```bash
# JWT Secret (base64-encoded, 64+ bytes)
openssl rand -base64 64

# Other secrets
openssl rand -base64 32
```

### 3. Remove Secrets from Git History

If secrets were committed, remove them from git history:

```bash
# WARNING: This rewrites git history. Coordinate with your team.
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/caryo-backend/src/main/resources/application.properties" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if repository is private and coordinated)
git push origin --force --all
```

---

## Environment Variables

### Required Environment Variables for Production

Create a `.env` file (NEVER commit this) with the following variables:

```bash
# JWT Configuration
JWT_SECRET=<base64-encoded-secret-from-openssl>
JWT_EXPIRATION_MS=1800000  # 30 minutes
JWT_REFRESH_EXPIRATION_MS=2592000000  # 30 days

# Database Configuration
DATABASE_URL=jdbc:postgresql://your-db-host:5432/caryo_production
DATABASE_USERNAME=caryo_user
DATABASE_PASSWORD=<strong-password>

# MinIO/S3 Storage
MINIO_ENDPOINT=https://storage.yourdomain.com
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>
MINIO_BUCKET_NAME=caryo-uploads
MINIO_REGION=us-east-1

# OpenAI (for translations)
OPENAI_API_KEY=<your-new-api-key>

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://caryo.sy,https://www.caryo.sy

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Email Configuration
EMAIL_USERNAME=<your-smtp-username>
EMAIL_PASSWORD=<your-smtp-password>
EMAIL_FROM=noreply@caryo.sy
EMAIL_SUPPORT=support@caryo.sy

# Application URLs
WEBSITE_URL=https://caryo.sy
PASSWORD_RESET_BASE_URL=https://caryo.sy/reset-password
NEWSLETTER_CONFIRMATION_URL=https://caryo.sy/newsletter/confirm
```

### Setting Environment Variables

**Docker/Docker Compose:**
```yaml
services:
  backend:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
      # ... other variables
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: caryo-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded>
  # ... other secrets
```

**Traditional Deployment:**
```bash
# Add to /etc/environment or ~/.bashrc
export JWT_SECRET="your-secret-here"
export DATABASE_URL="jdbc:postgresql://..."
```

---

## Security Features

### 1. Security Headers

The following security headers are automatically added to all responses:

- **X-XSS-Protection**: Prevents XSS attacks
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Strict-Transport-Security (HSTS)**: Forces HTTPS
- **Content-Security-Policy (CSP)**: Prevents unauthorized script execution
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

**File:** `SecurityConfig.java:105-138`

### 2. Message Sanitization

All user-generated message content is sanitized to prevent XSS attacks:

- Removes dangerous HTML tags (`<script>`, `<iframe>`, `<object>`, etc.)
- Removes event handlers (`onclick`, `onerror`, etc.)
- Escapes HTML special characters
- Logs potential attack attempts

**File:** `MessageSanitizationService.java`

### 3. File Upload Security

File uploads are validated using:

- **Content-based detection** (Apache Tika) - not just extension checking
- **Size limits**: 5MB/10MB enforced
- **Whitelist approach**: Only specific MIME types allowed
- **Virus scanning**: Recommended to add ClamAV integration

**Files:** `FileValidator.java`, `FileValidationService.java`

### 4. Password Security

Password requirements:
- Minimum 8 characters
- Maximum 128 characters
- At least 2 character types (lowercase, uppercase, digits, special chars)
- Rejects common weak passwords
- Limits excessive repeated characters
- BCrypt hashing with proper strength

**File:** `PasswordValidator.java`

---

## Rate Limiting

### Implemented Rate Limits

| Endpoint | Limit | Window | Key Type |
|----------|-------|--------|----------|
| `/api/auth/signin` | 5 requests | 60 seconds | IP Address |
| `/api/auth/signup` | 3 requests | 1 hour | IP Address |
| `/api/auth/forgot-password` | 3 requests | 1 hour | IP Address |
| `/api/conversations/{id}/messages` | 20 requests | 60 seconds | User ID |

### Adding Rate Limits

To add rate limiting to an endpoint:

```java
@RateLimit(
    maxRequests = 10,
    windowSeconds = 60,
    keyType = RateLimitKeyType.IP,
    message = "Too many requests. Please try again later."
)
@PostMapping("/your-endpoint")
public ResponseEntity<?> yourMethod() {
    // ...
}
```

### Rate Limit Key Types

- `RateLimitKeyType.IP` - Limit by IP address (for public endpoints)
- `RateLimitKeyType.USER` - Limit by authenticated user
- `RateLimitKeyType.IP_AND_ENDPOINT` - Combine IP with endpoint name
- `RateLimitKeyType.USER_AND_ENDPOINT` - Combine user with endpoint name

### Production Considerations

The current implementation uses in-memory storage. For production with multiple servers, consider:

1. **Redis-based rate limiting**:
```xml
<!-- Add to build.gradle -->
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
implementation 'io.github.bucket4j:bucket4j-redis:8.0.0'
```

2. **Distributed rate limiting** with Bucket4j and Redis

---

## CORS Configuration

### Development
```properties
app.cors.allowed-origins=http://localhost:3000,http://localhost:3001
```

### Production
```properties
app.cors.allowed-origins=https://caryo.sy,https://www.caryo.sy
```

**File:** `CorsConfig.java`

**Important:**
- NEVER use `allowedOriginPattern("*")` in production
- Only list exact origins you control
- Always use HTTPS in production

---

## JWT Configuration

### Token Expiration Strategy

**Access Tokens:**
- Short-lived: 30 minutes
- Used for API authentication
- Stored in memory (not localStorage)

**Refresh Tokens (Future Implementation):**
- Long-lived: 30 days
- Used to obtain new access tokens
- Stored securely (HTTP-only cookies)

### JWT Secret Requirements

- **Minimum 256 bits** (32 bytes) for HS256
- **Base64-encoded**
- **Cryptographically random**
- **Different for each environment** (dev/staging/prod)
- **Rotated periodically** (quarterly recommended)

### Generating JWT Secret

```bash
# Generate a strong JWT secret
openssl rand -base64 64

# Example output:
# 8kH3J...L9mP== (64 characters)
```

---

## Production Checklist

### Before Deployment

- [ ] Revoke exposed OpenAI API key
- [ ] Generate new JWT secret (64 bytes, base64-encoded)
- [ ] Generate strong database password
- [ ] Generate MinIO access/secret keys
- [ ] Set up OAuth credentials (Google)
- [ ] Configure SMTP for emails
- [ ] Set CORS_ALLOWED_ORIGINS to production domains only
- [ ] Remove `.env` files from git history
- [ ] Verify `.gitignore` includes `.env` patterns
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure database backups
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure log aggregation (ELK/CloudWatch)
- [ ] Set up uptime monitoring

### Security Testing

- [ ] Run OWASP ZAP security scan
- [ ] Test rate limiting on all protected endpoints
- [ ] Verify CORS only allows production origins
- [ ] Test XSS prevention in messaging system
- [ ] Verify file upload restrictions
- [ ] Test SQL injection protection
- [ ] Verify authentication/authorization on all endpoints
- [ ] Check security headers in production
- [ ] Test password reset flow
- [ ] Verify JWT token expiration

### Monitoring

- [ ] Set up alerts for failed auth attempts
- [ ] Monitor rate limit violations
- [ ] Track XSS sanitization events
- [ ] Monitor file upload rejections
- [ ] Set up database performance monitoring
- [ ] Configure application performance monitoring (APM)

---

## Security Incident Response

### If a Secret is Compromised

1. **Immediately revoke** the compromised secret
2. **Generate a new secret** using the commands above
3. **Update environment variables** in all environments
4. **Restart services** to use new secrets
5. **Review access logs** for unauthorized use
6. **Notify users** if user data was accessed
7. **Document the incident** for future reference

### Rate Limit Bypass Detected

1. Check logs for attacking IP addresses
2. Block IPs at firewall/load balancer level
3. Consider reducing rate limits temporarily
4. Review rate limit configuration
5. Consider implementing CAPTCHA for sensitive endpoints

### XSS Attack Detected

1. Review sanitization logs for the attack pattern
2. Verify sanitization is working correctly
3. Check if any malicious content was stored
4. Clean database if necessary
5. Consider additional sanitization rules

---

## Additional Recommendations

### 1. Web Application Firewall (WAF)

Consider deploying a WAF like:
- AWS WAF
- Cloudflare WAF
- ModSecurity

### 2. Database Security

- Use read-only database users for read operations
- Enable SSL/TLS for database connections
- Implement query timeouts
- Regular security patches

### 3. Secrets Management

For production, use a secrets management service:
- AWS Secrets Manager
- HashiCorp Vault (already configured)
- Azure Key Vault
- Google Secret Manager

### 4. Security Audits

- Quarterly security reviews
- Annual penetration testing
- Dependency vulnerability scanning (Dependabot)
- Code security scanning (SonarQube, Snyk)

---

## Support

For security issues, contact: security@caryo.sy

**Report Security Vulnerabilities:**
Do not open public issues for security vulnerabilities. Email security@caryo.sy with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 24 hours.
