# Security Quick Start Guide

This guide walks you through the essential security setup steps to get Caryo Marketplace production-ready.

## Prerequisites

- OpenSSL installed
- Access to your production environment
- Admin access to external services (OpenAI, Google OAuth, SMTP)

---

## Step 1: Revoke Exposed Secrets (CRITICAL - Do This First!)

### OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Find and revoke the key starting with `sk-proj-krvAH...`
3. Generate a new API key
4. Save it temporarily (you'll add it to `.env` in Step 3)

---

## Step 2: Generate New Secrets

Run these commands to generate cryptographically secure secrets:

```bash
# JWT Secret (save this output)
openssl rand -base64 64

# Database Password (save this output)
openssl rand -base64 32

# MinIO Access Key (save this output)
openssl rand -hex 20

# MinIO Secret Key (save this output)
openssl rand -base64 32

# NextAuth Secret (save this output)
openssl rand -base64 32
```

**Save all these outputs!** You'll need them in the next step.

---

## Step 3: Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit the file
nano .env  # or use your favorite editor
```

Replace all `REPLACE_WITH_*` values with:
- JWT_SECRET: Output from `openssl rand -base64 64`
- DATABASE_PASSWORD: Output from `openssl rand -base64 32`
- MINIO_ACCESS_KEY: Output from `openssl rand -hex 20`
- MINIO_SECRET_KEY: Output from `openssl rand -base64 32`
- OPENAI_API_KEY: New key from OpenAI dashboard
- GOOGLE_CLIENT_ID: From Google Cloud Console
- GOOGLE_CLIENT_SECRET: From Google Cloud Console
- EMAIL_USERNAME: Your SMTP email
- EMAIL_PASSWORD: Your SMTP app password

**Development Example:**
```bash
JWT_SECRET=8kH3J...L9mP==  # Your generated secret
DATABASE_URL=jdbc:postgresql://localhost:5432/caryo_db
DATABASE_USERNAME=caryo_user
DATABASE_PASSWORD=xK9m...P2q==  # Your generated password
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
# ... etc
```

**Production Example:**
```bash
JWT_SECRET=DIFFERENT_SECRET_THAN_DEV  # Never reuse secrets!
DATABASE_URL=jdbc:postgresql://prod-db.yourdomain.com:5432/caryo_production
DATABASE_USERNAME=caryo_prod_user
DATABASE_PASSWORD=STRONG_PRODUCTION_PASSWORD
CORS_ALLOWED_ORIGINS=https://caryo.sy,https://www.caryo.sy
WEBSITE_URL=https://caryo.sy
# ... etc
```

---

## Step 4: Verify .gitignore

Ensure `.env` files are never committed:

```bash
# Check if .env is ignored
git check-ignore .env

# Should output: .env
```

If it doesn't output `.env`, the file will be committed! Double-check `.gitignore`.

---

## Step 5: Configure CORS for Production

In your `.env` file, set:

```bash
# PRODUCTION ONLY - Use your actual domains
CORS_ALLOWED_ORIGINS=https://caryo.sy,https://www.caryo.sy,https://api.caryo.sy
```

**Never use:**
- `http://` in production (only HTTPS)
- Wildcards (`*`)
- Development URLs

---

## Step 6: Set Up HTTPS/TLS

### Option A: Using Nginx with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d caryo.sy -d www.caryo.sy -d api.caryo.sy

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option B: Using Cloud Provider

- **AWS**: Use AWS Certificate Manager (ACM) + ALB
- **GCP**: Use Google-managed SSL certificates
- **Azure**: Use Azure Application Gateway + SSL

### Option C: Using Cloudflare

1. Add your domain to Cloudflare
2. Enable "Full (strict)" SSL/TLS mode
3. Use Cloudflare origin certificates for backend

---

## Step 7: Deploy and Test

### Deployment

```bash
# Build the backend
cd backend/autotrader-backend
./gradlew build

# Build the frontend
cd ../../frontend
npm run build

# Deploy (method depends on your infrastructure)
# Docker Compose example:
docker-compose -f docker-compose.prod.yml up -d
```

### Security Testing

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST https://caryo.sy/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  echo "Request $i"
done

# Expected: First 5 succeed or fail auth, next 5 return 429 Too Many Requests

# Test CORS
curl -H "Origin: https://evil.com" \
  --verbose \
  https://api.caryo.sy/api/public/listings

# Expected: No Access-Control-Allow-Origin header

# Test security headers
curl -I https://caryo.sy

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: ...
```

---

## Step 8: Set Up Monitoring

### Error Tracking (Sentry - Recommended)

```bash
# Add to .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

### Uptime Monitoring

Set up monitoring with:
- **UptimeRobot** (free)
- **Pingdom**
- **AWS CloudWatch**
- **Datadog**

Monitor these endpoints:
- `https://caryo.sy/actuator/health`
- `https://api.caryo.sy/service-status`

### Log Aggregation

Configure centralized logging:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **AWS CloudWatch Logs**
- **Google Cloud Logging**
- **Datadog Logs**

---

## Step 9: Database Security

```sql
-- Create production database user with limited permissions
CREATE USER caryo_prod_user WITH PASSWORD 'your-strong-password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE caryo_production TO caryo_prod_user;
GRANT USAGE ON SCHEMA public TO caryo_prod_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO caryo_prod_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO caryo_prod_user;

-- For read-only operations, create a separate user
CREATE USER caryo_readonly WITH PASSWORD 'another-strong-password';
GRANT CONNECT ON DATABASE caryo_production TO caryo_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO caryo_readonly;
```

---

## Step 10: Backup Strategy

### Database Backups

```bash
# Automated daily backups
0 2 * * * pg_dump -U caryo_prod_user -h localhost caryo_production | gzip > /backups/caryo_$(date +\%Y\%m\%d).sql.gz

# Retention: Keep 30 days
find /backups -name "caryo_*.sql.gz" -mtime +30 -delete
```

### Media File Backups

```bash
# Sync MinIO bucket to backup location
aws s3 sync s3://caryo-uploads s3://caryo-backups/$(date +%Y%m%d) --storage-class STANDARD_IA
```

---

## Production Checklist

Before going live, verify:

### Critical Security

- [ ] OpenAI API key revoked and replaced
- [ ] JWT secret generated and set (different from dev)
- [ ] Database password is strong and unique
- [ ] All secrets set via environment variables
- [ ] `.env` file is NOT in git repository
- [ ] CORS only allows production domains
- [ ] HTTPS/TLS enabled and working
- [ ] Security headers present in responses

### Authentication

- [ ] JWT tokens expire after 30 minutes
- [ ] Password reset works correctly
- [ ] Email verification works
- [ ] Google OAuth configured for production
- [ ] Rate limiting active on auth endpoints

### Testing

- [ ] Rate limits tested and working
- [ ] XSS sanitization tested on messages
- [ ] File upload restrictions tested
- [ ] CORS tested with unauthorized origin
- [ ] Security headers verified
- [ ] Authentication flow tested end-to-end

### Monitoring

- [ ] Error tracking configured (Sentry/similar)
- [ ] Uptime monitoring configured
- [ ] Database backups automated
- [ ] Log aggregation configured
- [ ] Alerts set up for critical errors

### Documentation

- [ ] Team knows how to access production secrets
- [ ] Incident response plan documented
- [ ] Backup restoration process documented
- [ ] Deployment process documented

---

## Common Issues

### "CORS error in production"

**Problem:** Frontend can't connect to backend

**Solution:**
1. Check `CORS_ALLOWED_ORIGINS` includes your frontend domain
2. Ensure using `https://` not `http://`
3. Verify no trailing slashes in origins
4. Check browser console for exact error

### "JWT token invalid"

**Problem:** Authentication fails after deployment

**Solution:**
1. Ensure `JWT_SECRET` is set in production environment
2. Verify secret is base64-encoded
3. Check token expiration settings
4. Clear browser localStorage and retry

### "Rate limit not working"

**Problem:** Rate limits not being enforced

**Solution:**
1. Verify `@EnableAspectJAutoProxy` is in a configuration class
2. Check `@RateLimit` annotation is on correct methods
3. Ensure `RateLimitAspect` bean is created
4. Check application logs for AspectJ errors

### "Database connection failed"

**Problem:** Can't connect to database

**Solution:**
1. Verify `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` are correct
2. Check database is accessible from application server
3. Verify database user permissions
4. Check firewall rules

---

## Need Help?

- **Security Issues:** security@caryo.sy
- **General Support:** support@caryo.sy
- **Documentation:** [SECURITY_CONFIGURATION.md](./SECURITY_CONFIGURATION.md)

---

**Remember:** Security is an ongoing process, not a one-time setup. Regularly review and update your security measures.
