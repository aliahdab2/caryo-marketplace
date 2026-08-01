# Environment Variables Configuration Guide

Complete guide for configuring environment variables in Caryo Marketplace.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [Deployment Examples](#deployment-examples)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### For Development

```bash
# 1. Copy the example file
cd /path/to/caryo-marketplace
cp .env.example .env

# 2. Generate secrets
openssl rand -base64 64  # JWT_SECRET
openssl rand -base64 32  # DATABASE_PASSWORD
openssl rand -hex 20     # MINIO_ACCESS_KEY
openssl rand -base64 32  # MINIO_SECRET_KEY

# 3. Edit .env and replace REPLACE_WITH_* values
nano .env  # or use your preferred editor

# 4. Verify .env is not tracked by git
git check-ignore .env  # Should output: .env
```

### For Production

**DO NOT use development secrets in production!**

1. Follow development setup
2. Generate **NEW** secrets (different from dev)
3. Use HTTPS URLs only
4. Store in secure secrets manager
5. Review [SECURITY_QUICK_START.md](./SECURITY_QUICK_START.md)

---

## Development Setup

### Step 1: Create .env File

```bash
cp .env.example .env
```

### Step 2: Generate Secure Secrets

```bash
# Generate JWT Secret (64 bytes recommended)
echo "JWT_SECRET=$(openssl rand -base64 64)"

# Generate Database Password
echo "DATABASE_PASSWORD=$(openssl rand -base64 32)"

# Generate MinIO Access Key
echo "MINIO_ACCESS_KEY=$(openssl rand -hex 20)"

# Generate MinIO Secret Key
echo "MINIO_SECRET_KEY=$(openssl rand -base64 32)"

# Generate NextAuth Secret (for frontend)
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
```

### Step 3: Configure Development Values

Edit `.env`:

```bash
# JWT Configuration
JWT_SECRET=<paste generated secret>
JWT_EXPIRATION_MS=1800000
JWT_REFRESH_EXPIRATION_MS=2592000000

# Database (local PostgreSQL)
DATABASE_URL=jdbc:postgresql://localhost:5432/caryo_db
DATABASE_USERNAME=caryo_user
DATABASE_PASSWORD=<paste generated password>

# MinIO (local S3-compatible storage)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=<paste generated key>
MINIO_SECRET_KEY=<paste generated secret>
MINIO_BUCKET_NAME=caryo-uploads
MINIO_REGION=us-east-1

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# CORS (development)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Google OAuth (get from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/oauth2/callback/google

# Email (Gmail example - use app password)
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@caryo.sy
EMAIL_SUPPORT=support@caryo.sy

# Application URL (development)
# Every link in outbound email — verification, password reset, newsletter
# confirm/unsubscribe — is derived from this single value.
WEBSITE_URL=http://localhost:3000
```

### Step 4: Verify Configuration

```bash
# Test database connection
cd backend/caryo-backend
./gradlew bootRun

# Should see in logs:
# - Database connection successful
# - JWT configuration loaded
# - MinIO connection successful
```

---

## Production Setup

### Critical Differences from Development

| Setting | Development | Production |
|---------|-------------|------------|
| **JWT_SECRET** | Any secure random string | **DIFFERENT** secure random string |
| **CORS_ALLOWED_ORIGINS** | `http://localhost:3000` | `https://caryo.sy,https://www.caryo.sy` |
| **All URLs** | `http://localhost:*` | `https://yourdomain.com` |
| **Database** | Local PostgreSQL | Production database with SSL |
| **MinIO/S3** | Local MinIO | Production S3 or MinIO cluster |
| **Secrets Storage** | `.env` file | Secrets manager (Vault, AWS, etc.) |

### Step 1: Generate Production Secrets

```bash
# NEVER reuse development secrets!

# Production JWT Secret
openssl rand -base64 64 > jwt_secret.txt

# Production Database Password
openssl rand -base64 32 > db_password.txt

# Production MinIO Keys
openssl rand -hex 20 > minio_access.txt
openssl rand -base64 32 > minio_secret.txt

# Save these securely, then DELETE the text files
```

### Step 2: Configure Production Values

```bash
# JWT Configuration
JWT_SECRET=<PRODUCTION_SECRET_DIFFERENT_FROM_DEV>
JWT_EXPIRATION_MS=1800000
JWT_REFRESH_EXPIRATION_MS=2592000000

# Database (production)
DATABASE_URL=jdbc:postgresql://prod-db.yourdomain.com:5432/caryo_production
DATABASE_USERNAME=caryo_prod_user
DATABASE_PASSWORD=<STRONG_PRODUCTION_PASSWORD>

# MinIO/S3 (production)
MINIO_ENDPOINT=https://storage.yourdomain.com
MINIO_ACCESS_KEY=<PRODUCTION_ACCESS_KEY>
MINIO_SECRET_KEY=<PRODUCTION_SECRET_KEY>
MINIO_BUCKET_NAME=caryo-production-uploads
MINIO_REGION=us-east-1

# OpenAI (NEW key, not the one from development)
OPENAI_API_KEY=sk-proj-PRODUCTION_KEY

# CORS (HTTPS ONLY!)
CORS_ALLOWED_ORIGINS=https://caryo.sy,https://www.caryo.sy,https://api.caryo.sy

# Google OAuth (production credentials)
GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=production-client-secret
GOOGLE_REDIRECT_URI=https://api.caryo.sy/oauth2/callback/google

# Email (production SMTP)
EMAIL_USERNAME=noreply@caryo.sy
EMAIL_PASSWORD=<PRODUCTION_SMTP_PASSWORD>
EMAIL_FROM=noreply@caryo.sy
EMAIL_SUPPORT=support@caryo.sy

# Application URL (HTTPS ONLY!) — all email links derive from this
WEBSITE_URL=https://caryo.sy

# Monitoring (highly recommended)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

### Step 3: Store Secrets Securely

**DO NOT store production secrets in .env files on the server!**

Choose one of these methods:

#### Option A: HashiCorp Vault (Recommended for self-hosted)

```bash
# Store secrets
vault kv put secret/caryo/production \
  jwt_secret="your-secret" \
  database_password="your-password" \
  openai_api_key="your-key"

# Retrieve in application startup script
export JWT_SECRET=$(vault kv get -field=jwt_secret secret/caryo/production)
```

#### Option B: AWS Secrets Manager

```bash
# Store secrets
aws secretsmanager create-secret \
  --name caryo/production/jwt-secret \
  --secret-string "your-jwt-secret"

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id caryo/production/jwt-secret \
  --query SecretString --output text
```

#### Option C: Google Cloud Secret Manager

```bash
# Store secrets
echo -n "your-jwt-secret" | \
  gcloud secrets create caryo-jwt-secret --data-file=-

# Retrieve in application
gcloud secrets versions access latest \
  --secret="caryo-jwt-secret"
```

#### Option D: Kubernetes Secrets

```bash
# Create secret from literals
kubectl create secret generic caryo-secrets \
  --from-literal=jwt-secret='your-secret' \
  --from-literal=database-password='your-password' \
  --from-literal=openai-api-key='your-key' \
  -n production

# Reference in deployment.yaml
env:
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: caryo-secrets
        key: jwt-secret
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example | How to Generate |
|----------|-------------|---------|-----------------|
| `JWT_SECRET` | Secret for signing JWT tokens | (base64 string) | `openssl rand -base64 64` |
| `DATABASE_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/db` | N/A |
| `DATABASE_USERNAME` | Database username | `caryo_user` | Create in PostgreSQL |
| `DATABASE_PASSWORD` | Database password | (random string) | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI API key for translations | `sk-proj-...` | OpenAI Platform |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `https://caryo.sy` | Your domain |

### Optional but Recommended

| Variable | Description | Default | When to Set |
|----------|-------------|---------|-------------|
| `MINIO_ENDPOINT` | MinIO/S3 endpoint | `http://localhost:9000` | Always (prod) |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` | Always (prod) |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` | Always (prod) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | None | If using Google auth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | None | If using Google auth |
| `EMAIL_USERNAME` | SMTP username | None | If using email features |
| `EMAIL_PASSWORD` | SMTP password | None | If using email features |
| `SENTRY_DSN` | Sentry error tracking | None | Production monitoring |

### Feature Flags

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `PAYPAL_ENABLED` | Enable PayPal payments | `false` | `true`/`false` |
| `STRIPE_ENABLED` | Enable Stripe payments | `false` | `true`/`false` |
| `NEWSLETTER_ENABLED` | Enable newsletter signup | `true` | `true`/`false` |
| `DATA_INIT_ENABLED` | Initialize sample data on startup | `true` | `true`/`false` |

---

## Deployment Examples

### Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    image: caryo-backend:latest
    env_file:
      - .env.production  # NEVER commit this file!
    # OR use environment variables directly:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
      - DATABASE_USERNAME=${DATABASE_USERNAME}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - minio

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=caryo_production
      - POSTGRES_USER=${DATABASE_USERNAME}
      - POSTGRES_PASSWORD=${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio:latest
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: caryo-backend
  namespace: production
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: caryo-backend:latest
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: caryo-secrets
              key: jwt-secret
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: caryo-secrets
              key: database-password
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: caryo-secrets
              key: openai-api-key
        - name: DATABASE_URL
          value: "jdbc:postgresql://postgres-service:5432/caryo_production"
        - name: CORS_ALLOWED_ORIGINS
          value: "https://caryo.sy,https://www.caryo.sy"
```

### Systemd Service

```ini
# /etc/systemd/system/caryo-backend.service
[Unit]
Description=Caryo Marketplace Backend
After=network.target postgresql.service

[Service]
Type=simple
User=caryo
WorkingDirectory=/opt/caryo/backend
EnvironmentFile=/opt/caryo/.env.production
ExecStart=/opt/caryo/backend/bin/caryo-backend
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## Troubleshooting

### "JWT secret not configured"

**Problem:** Application fails to start with JWT configuration error.

**Solution:**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET  # Should output your secret

# If empty, check .env file
cat .env | grep JWT_SECRET

# Generate new secret if needed
openssl rand -base64 64
```

### "CORS error in browser"

**Problem:** Frontend can't connect to backend due to CORS.

**Solution:**
```bash
# Check CORS configuration
echo $CORS_ALLOWED_ORIGINS

# For development, should be:
# http://localhost:3000,http://localhost:3001

# For production, should be (HTTPS only):
# https://caryo.sy,https://www.caryo.sy

# Restart backend after changing CORS
./gradlew bootRun
```

### "Database connection failed"

**Problem:** Can't connect to PostgreSQL database.

**Solution:**
```bash
# Test database connection
psql -h localhost -U caryo_user -d caryo_db

# If connection fails, check:
# 1. PostgreSQL is running
sudo systemctl status postgresql

# 2. Database exists
sudo -u postgres psql -c "\l" | grep caryo

# 3. User has permissions
sudo -u postgres psql -c "\du" | grep caryo_user

# 4. Environment variables are correct
echo $DATABASE_URL
echo $DATABASE_USERNAME
echo $DATABASE_PASSWORD
```

### "OpenAI API calls failing"

**Problem:** Translation or OpenAI features not working.

**Solution:**
```bash
# Test OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# If "invalid_api_key" error:
# 1. Check key is set correctly
echo $OPENAI_API_KEY

# 2. Verify key on OpenAI platform
# https://platform.openai.com/api-keys

# 3. Generate new key if needed
# See: docs/OPENAI_KEY_REVOCATION.md
```

### Environment variables not loaded

**Problem:** Application doesn't see environment variables.

**Solution:**
```bash
# For local development:
# Make sure .env is in the correct location
ls -la .env

# For Docker:
# Check if env_file is specified
docker-compose config | grep env_file

# For Kubernetes:
# Verify secret exists
kubectl get secrets -n production | grep caryo

# For systemd:
# Check EnvironmentFile path
systemctl cat caryo-backend | grep EnvironmentFile
```

---

## Security Best Practices

### DO:
- ✅ Use different secrets for each environment
- ✅ Store production secrets in a secrets manager
- ✅ Rotate secrets periodically (quarterly recommended)
- ✅ Use HTTPS for all production URLs
- ✅ Set up monitoring for secret usage
- ✅ Limit secret access to necessary personnel
- ✅ Use app-specific passwords for email

### DO NOT:
- ❌ Commit .env files to git
- ❌ Reuse development secrets in production
- ❌ Share secrets via email or chat
- ❌ Use weak passwords or predictable secrets
- ❌ Store secrets in application code
- ❌ Use HTTP URLs in production
- ❌ Grant broad access to production secrets

---

## Related Documentation

- [Security Quick Start](./SECURITY_QUICK_START.md) - Production deployment security
- [Security Configuration](./SECURITY_CONFIGURATION.md) - Detailed security settings
- [OpenAI Key Revocation](./OPENAI_KEY_REVOCATION.md) - How to revoke exposed keys

---

**Last Updated:** January 2026
