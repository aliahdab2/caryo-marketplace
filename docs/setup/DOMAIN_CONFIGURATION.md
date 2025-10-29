# Domain Configuration Guide

## Current Setup Status
✅ **Development-Ready**: Your sitemap configuration now defaults to `localhost:3000` for development
🔄 **Production-Flexible**: Easy to update when you choose your domain name

## Environment Variable Setup

### Development (.env.local)
```bash
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (when you have your domain)
```bash
SITE_URL=https://your-chosen-domain.com
NEXT_PUBLIC_SITE_URL=https://your-chosen-domain.com
```

## What Changes When You Pick Your Domain

### 1. Environment Variables
Update these in your production deployment:
- `SITE_URL` in your hosting platform (Vercel, Netlify, etc.)
- `NEXT_PUBLIC_SITE_URL` for client-side usage

### 2. No Code Changes Needed! 🎉
Your configuration is already set up to use environment variables, so:
- ✅ Sitemap will automatically use the correct domain
- ✅ Robots.txt will reference the right URLs
- ✅ Structured data will have correct canonical URLs
- ✅ SEO tests will work with any domain

### 3. Search Engine Setup (After Domain Decision)
Once you have your domain:
1. Update production environment variables
2. Deploy to production
3. Submit sitemap to Google Search Console at `https://your-domain.com/sitemap.xml`
4. Verify domain ownership in Google Search Console

## Testing Different Domains

### Local Testing with Custom Domain
```bash
# Test with your potential domain locally
SITE_URL=https://my-potential-domain.com npm run build
SITE_URL=https://my-potential-domain.com npm run sitemap
```

### Validate Sitemap Generation
```bash
# Check the generated sitemap
cat public/sitemap.xml | grep "your-domain"
```

## Domain Selection Considerations

### SEO-Friendly Domain Tips
- Keep it short and memorable
- Include keywords if possible (e.g., "cars", "auto", "marketplace")
- Choose `.com` if available
- Avoid hyphens and numbers if possible

### Technical Considerations
- Ensure HTTPS is available
- Check domain history (not penalized by Google)
- Verify it's not blacklisted

## Migration Checklist (When Domain is Final)

### Pre-Migration
- [ ] Purchase domain and set up hosting
- [ ] Configure SSL certificate
- [ ] Set up DNS records

### During Migration
- [ ] Update `SITE_URL` environment variable
- [ ] Deploy updated configuration
- [ ] Test sitemap generation at new domain
- [ ] Verify robots.txt accessibility

### Post-Migration
- [ ] Submit new sitemap to Google Search Console
- [ ] Set up Google Analytics with new domain
- [ ] Update any external links or references
- [ ] Monitor indexing status

## Emergency Domain Change
If you need to change domains after going live:
1. Update environment variables
2. Deploy new configuration
3. Submit new sitemap to search engines
4. Keep old domain active for 301 redirects (if possible)
5. Update Google Search Console property

## Current Configuration Files
These files automatically adapt to your domain choice:
- `frontend/next-sitemap.config.js` ✅ Uses environment variables
- `src/utils/seo/structuredData.ts` ✅ Uses NEXT_PUBLIC_SITE_URL
- `.github/workflows/seo-testing.yml` ✅ Works with any domain
