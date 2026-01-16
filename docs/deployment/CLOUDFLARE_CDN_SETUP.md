# Cloudflare CDN Setup Guide

This guide explains how to set up Cloudflare CDN for Caryo Marketplace to achieve industry-standard image delivery performance.

## Why Cloudflare?

| Feature | Free Tier | Benefit |
|---------|-----------|---------|
| CDN | ✅ Unlimited | Global edge caching |
| SSL/TLS | ✅ Free | Automatic HTTPS |
| DDoS Protection | ✅ Included | Security |
| Polish (Image Optimization) | ⚠️ Pro plan | WebP auto-conversion |
| Caching | ✅ Free | Reduced origin load |
| Analytics | ✅ Basic | Traffic insights |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│ Cloudflare  │────▶│  Imgproxy   │────▶│   MinIO     │
│             │     │    CDN      │     │  (resize)   │     │  (storage)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │
                    (cached at edge)
```

## Setup Steps

### Step 1: Add Your Domain to Cloudflare

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Click "Add a Site"
3. Enter your domain (e.g., `caryo.com`)
4. Choose the **Free** plan
5. Update your nameservers at your registrar

### Step 2: Configure DNS Records

Add these DNS records in Cloudflare dashboard:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | YOUR_SERVER_IP | ✅ Proxied |
| A | api | YOUR_SERVER_IP | ✅ Proxied |
| A | images | YOUR_SERVER_IP | ✅ Proxied |
| CNAME | www | caryo.com | ✅ Proxied |

### Step 3: SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Go to **Edge Certificates**
4. Enable **Always Use HTTPS**
5. Enable **Automatic HTTPS Rewrites**

### Step 4: Caching Rules

Go to **Caching** → **Configuration**:

```
Browser Cache TTL: 1 year (for images)
```

#### Cache Rules (Rules → Page Rules or Cache Rules)

**Rule 1: Cache Images (High Priority)**
```
URL: *caryo.com/api/files/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year
```

**Rule 2: Cache Imgproxy Output**
```
URL: *caryo.com/imgproxy/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year
```

**Rule 3: Bypass Cache for API**
```
URL: *caryo.com/api/* (excluding /api/files/*)
Settings:
  - Cache Level: Bypass
```

### Step 5: Performance Settings

Go to **Speed** → **Optimization**:

1. **Auto Minify**: Enable JS, CSS, HTML
2. **Brotli**: Enable
3. **Early Hints**: Enable
4. **Rocket Loader**: Test before enabling

### Step 6: Security Settings

Go to **Security** → **Settings**:

1. **Security Level**: Medium
2. **Challenge Passage**: 30 minutes
3. **Browser Integrity Check**: Enable

### Step 7: Configure Your Application

Add environment variables:

```bash
# .env.production
NEXT_PUBLIC_CDN_URL=https://caryo.com
NEXT_PUBLIC_IMGPROXY_URL=https://caryo.com/imgproxy
NEXT_PUBLIC_API_URL=https://api.caryo.com
```

### Step 8: Update nginx Configuration

```nginx
# /etc/nginx/sites-available/caryo

upstream imgproxy {
    server 127.0.0.1:8081;
}

upstream backend {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name caryo.com api.caryo.com;
    
    # Cloudflare Real IP
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    real_ip_header CF-Connecting-IP;

    # Imgproxy location
    location /imgproxy/ {
        proxy_pass http://imgproxy/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Caching headers
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Cache-Status $upstream_cache_status;
    }

    # API location
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /api/files/ {
        proxy_pass http://backend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

## Verification

### Test CDN is Working

```bash
# Check response headers
curl -I https://caryo.com/api/files/listings/1/image.jpg

# Should see:
# cf-ray: xxxxxxx (Cloudflare Ray ID)
# cf-cache-status: HIT (or MISS on first request)
```

### Test Image Optimization

```bash
# Request WebP version
curl -I -H "Accept: image/webp" https://caryo.com/imgproxy/insecure/rs:fit:800:0/...

# Check content-type is image/webp
```

## Performance Results

After setup, you should see:

| Metric | Before | After |
|--------|--------|-------|
| **First Contentful Paint** | ~2.5s | ~1.2s |
| **Largest Contentful Paint** | ~4.0s | ~2.0s |
| **Image Load Time** | ~1.5s | ~0.3s |
| **Cache Hit Ratio** | 0% | 90%+ |

## Monitoring

### Cloudflare Analytics

1. Go to **Analytics** → **Traffic**
2. Monitor:
   - Requests
   - Bandwidth saved
   - Cache hit ratio
   - Threats blocked

### Imgproxy Metrics

Imgproxy exposes Prometheus metrics at `/metrics`:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'imgproxy'
    static_configs:
      - targets: ['imgproxy:8080']
```

## Troubleshooting

### Images Not Caching

1. Check Cache-Control headers from origin
2. Verify Page Rules are active
3. Purge cache: **Caching** → **Configuration** → **Purge Everything**

### SSL Certificate Issues

1. Ensure "Full (strict)" mode
2. Check origin has valid certificate
3. Wait 24 hours for certificate propagation

### Slow First Load

Normal - first request goes to origin. Subsequent requests are cached.

## Cost Estimation

| Plan | Monthly Cost | Best For |
|------|--------------|----------|
| **Free** | $0 | Development, small sites |
| **Pro** | $20/month | Production, includes Polish |
| **Business** | $200/month | High traffic, advanced features |

## Next Steps

1. ✅ Add domain to Cloudflare
2. ✅ Configure caching rules
3. ✅ Update application environment variables
4. ✅ Test and verify
5. ⬜ Consider upgrading to Pro for Polish (WebP auto-conversion)
