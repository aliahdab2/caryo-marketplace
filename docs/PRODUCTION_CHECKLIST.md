# Caryo Production Readiness Checklist

## Status: 🟡 In Progress

Last updated: February 2026

---

## 1. Infrastructure

### Database
- [ ] **PostgreSQL**: Managed service (AWS RDS, DigitalOcean, Supabase)
- [ ] **Backups**: Automated daily backups enabled
- [ ] **Connection pooling**: HikariCP configured (default in Spring Boot)
- [ ] **Credentials**: Strong password generated (`openssl rand -base64 32`)

### File Storage
- [ ] **Production storage**: Choose one:
  - [ ] AWS S3
  - [ ] Cloudflare R2 (recommended - no egress fees)
  - [ ] DigitalOcean Spaces
  - [ ] Self-hosted MinIO with backups
- [ ] **CDN**: Configure for static assets/images
- [ ] **Backup**: Versioning or replication enabled

### Hosting
- [ ] **Backend**: Choose deployment:
  - [ ] Docker on VPS (DigitalOcean, Hetzner, Linode)
  - [ ] AWS ECS/Fargate
  - [ ] Railway/Render
- [ ] **Frontend**: Vercel (recommended for Next.js) or same as backend
- [ ] **Domain**: caryo.sy configured with DNS

---

## 2. Security

### SSL/HTTPS
- [ ] **SSL certificate**: Let's Encrypt or Cloudflare
- [ ] **Force HTTPS**: Redirect all HTTP to HTTPS
- [ ] **HSTS**: Already configured in SecurityConfig ✅

### Secrets Management
- [ ] **Environment variables**: Not hardcoded in code ✅
- [ ] **Production .env**: Separate from development
- [ ] **Secrets rotation**: Plan for key rotation

### Application Security
- [ ] **JWT secret**: Strong secret for production (`openssl rand -base64 64`)
- [ ] **CORS**: Restrict to production domain only
- [ ] **Rate limiting**: Already implemented ✅
- [ ] **Input validation**: Already implemented ✅

---

## 3. Email

### SMTP Provider (Choose one)
- [ ] **SendGrid**: Good deliverability, free tier 100/day
- [ ] **AWS SES**: Cheapest at scale (~$0.10/1000 emails)
- [ ] **Mailgun**: Developer-friendly
- [ ] **Resend**: Modern, good DX

### Configuration
- [ ] **SPF record**: Add to DNS
- [ ] **DKIM**: Configure with provider
- [ ] **DMARC**: Add policy to DNS
- [ ] **From address**: noreply@caryo.sy verified

---

## 4. Monitoring & Observability

### Error Tracking
- [ ] **Sentry**: Configure DSN for production
  ```env
  SENTRY_DSN=https://xxx@sentry.io/xxx
  SENTRY_ENVIRONMENT=production
  ```

### Uptime Monitoring
- [ ] **UptimeRobot** (free) or **BetterStack**
- [ ] **Health endpoint**: /actuator/health ✅

### Logging
- [ ] **Log level**: INFO for production (configured ✅)
- [ ] **Log retention**: Cloud provider or centralized logging (optional for launch)

---

## 5. Performance

### Backend
- [ ] **JVM settings**: Configure heap size for production
  ```
  JAVA_OPTS=-Xms512m -Xmx1024m
  ```
- [ ] **Connection pool**: HikariCP defaults are good

### Frontend
- [ ] **Build optimization**: `next build` for production
- [ ] **Image optimization**: Next.js Image component ✅
- [ ] **Bundle analysis**: Run `npm run analyze` to check size

### Caching (Optional for launch)
- [ ] **Redis**: For session/cache (can add later)
- [ ] **CDN caching**: Static assets

---

## 6. Data & Compliance

### Backup Strategy
- [ ] **Database**: Daily automated backups
- [ ] **File storage**: Versioning or cross-region replication
- [ ] **Backup testing**: Verify restore process works

### Legal
- [ ] **Privacy Policy**: Page exists
- [ ] **Terms of Service**: Page exists
- [ ] **Cookie consent**: If using analytics

---

## 7. Pre-Launch Testing

### Functional
- [ ] **User registration**: Works end-to-end
- [ ] **Login/logout**: JWT flow works
- [ ] **Create listing**: With image upload
- [ ] **Search/filter**: Listings searchable
- [ ] **Messaging**: Buyer-seller communication
- [ ] **Admin panel**: Approval workflow

### Security Testing
- [ ] **OWASP Top 10**: Basic security scan
- [ ] **SQL injection**: Tested (JPA parameterized ✅)
- [ ] **XSS**: Tested (DOMPurify ✅)

### Performance
- [ ] **Load test**: Basic load test with k6 or Artillery
- [ ] **Mobile**: Test on real devices

---

## 8. Deployment

### CI/CD
- [ ] **GitHub Actions**: Already configured ✅
- [ ] **Deployment pipeline**: Auto-deploy to staging
- [ ] **Production deploy**: Manual trigger or protected branch

### Rollback Plan
- [ ] **Previous version**: Can rollback quickly
- [ ] **Database migrations**: Forward-only, tested

---

## 9. Launch Day

### Go-Live Checklist
- [ ] **DNS propagation**: Verify domain resolves
- [ ] **SSL working**: Test https://caryo.sy
- [ ] **Smoke test**: Register, login, create listing
- [ ] **Monitoring**: Sentry and uptime alerts active
- [ ] **Team contacts**: Who to call if issues

---

## Quick Start Commands

```bash
# Generate secure passwords
openssl rand -base64 32  # Database password
openssl rand -base64 64  # JWT secret
openssl rand -hex 20     # MinIO access key
openssl rand -base64 32  # MinIO secret key

# Test production build locally
./gradlew bootJar
java -jar build/libs/autotrader-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

# Frontend production build
cd frontend && npm run build && npm start
```

---

## Estimated Effort

| Task | Time | Priority |
|------|------|----------|
| Database setup (managed) | 1 hour | Critical |
| File storage (R2/S3) | 2 hours | Critical |
| Email provider | 1-2 hours | Critical |
| SSL/Domain | 1 hour | Critical |
| Sentry setup | 30 min | High |
| Deployment pipeline | 2-4 hours | High |
| Security review | 2 hours | High |
| Load testing | 2 hours | Medium |

**Total**: ~1-2 days of focused work

---

## Notes

- Start with the **Critical** items first
- You can launch without Redis/centralized logging
- Add monitoring/optimization after initial launch
