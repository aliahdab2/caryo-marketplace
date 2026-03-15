# 🔐 Test Account Credentials for Development

## 👤 Available Test Accounts

### 1. **Regular User Account**
```
Username: user
Email:    user@caryo.sy
Password: Password123!
Role:     ROLE_USER
```

**Use for:**
- Testing regular user features
- Favorites, saved searches
- Viewing listings
- Contact forms

---

### 2. **Admin Account**
```
Username: admin
Email:    admin@caryo.sy
Password: Admin123!
Roles:    ROLE_ADMIN, ROLE_USER
```

**Use for:**
- Admin panel access
- Managing all listings
- User management
- System configuration

---

### 3. **Dealer Account** ⭐
```
Username: dealer
Email:    dealer@caryo.sy
Password: Dealer123!
Roles:    ROLE_DEALER, ROLE_USER

Business Details:
- Business Name:  Test Dealership Syria
- Business Email: business@testdealer.sy
- Business Phone: +963-11-234-5678
- VAT Number:     TEST-VAT-12345
- Address:        Damascus Test Address
```

**Use for:**
- **Testing dealer dashboard** ✨
- **Trial system features** 
- **Subscription management**
- Creating listings as dealer
- Dealer profile management
- Payment flow testing

---

## 🚀 Quick Start

### Sign In as Dealer:
```bash
1. Visit: http://localhost:3000/en/auth/signin
2. Enter:
   - Email: dealer@caryo.sy
   - Password: Dealer123!
3. Click "Sign In"
4. Visit Dashboard: http://localhost:3000/en/dashboard
```

### What You'll See:
✅ **Trial Banner** - Shows trial status and expiry  
✅ **Listing Limits** - 15 listings during trial  
✅ **Upgrade Modal** - Subscription tier options  
✅ **Dealer Stats** - Your listings, views, inquiries  
✅ **Quick Actions** - Create listing, upgrade, etc.  

---

## 📊 Dashboard Behavior by User Type

### Regular User (`user`)
```
Dashboard loads → No trial banner → Standard features
```
- Shows favorites count
- Shows saved searches/alerts
- View listings only
- No trial features

### Admin User (`admin`)
```
Dashboard loads → Admin privileges → Full access
```
- All user features PLUS
- Admin panel access
- Manage all content
- User management

### Dealer User (`dealer`) ⭐
```
Dashboard loads → Trial banner appears → Full dealer experience
```
- Trial status tracking
- Listing limit monitoring
- Upgrade prompts
- Subscription management
- All dealer features

---

## 🔧 Development Environment Access

When backend is running (`./caryo.sh dev start`), you'll see:

```
Development Environment Started Successfully!
Available Services:
- API Server:     http://localhost:8080
- Swagger UI:     http://localhost:8080/swagger-ui/index.html
- Mail Server:    http://localhost:8025 (Mailpit Web UI)
- MinIO Console:  http://localhost:9001 (minioadmin/minioadmin)
- Adminer:        http://localhost:8081 (postgres/postgres)
- Debug Port:     5005
- Admin Account:  admin / Admin123! (ROLE_ADMIN, ROLE_USER)
- User Account:   user / Password123! (ROLE_USER)
- Redis:          localhost:6379
```

**Note:** Dealer credentials are listed in this document for easy reference!

---

## 🎯 Testing Scenarios

### Test Trial System:
1. Sign in as `dealer@caryo.sy`
2. Visit dashboard
3. See trial banner with:
   - Days remaining (60 days)
   - Listings used (0/15)
   - Progress bar
   - Upgrade button

### Test Listing Creation:
1. Sign in as `dealer@caryo.sy`
2. Click "New Listing" button
3. Create a car listing
4. Check listing count updates
5. Trial banner shows progress

### Test Upgrade Flow:
1. Sign in as `dealer@caryo.sy`
2. Click "Upgrade Now" in trial banner
3. See subscription tiers:
   - Basic: $50/month (100 listings)
   - Advanced: $100/month (250 listings)
   - Professional: $200/month (unlimited)
4. Select tier
5. See payment instructions

### Test Non-Dealer User:
1. Sign in as `user@caryo.sy`
2. Visit dashboard
3. No trial banner (expected)
4. Clean console (no errors)
5. Standard dashboard features work

---

## 🐛 Troubleshooting

### "Failed to fetch trial status: 403"
**Cause:** You're signed in as a regular user, not a dealer

**Solution:** 
- Sign out
- Sign in as `dealer@caryo.sy`
- Dashboard will show trial features

### "Trial features not enabled"
**Cause:** Backend not running or dealer profile not created

**Solution:**
```bash
# Start backend
cd backend/caryo-backend
./caryo.sh dev start

# Wait for initialization
# Dealer account created automatically
```

### Clean Console:
The dashboard now handles ALL user types gracefully:
- ✅ Regular users: No errors, standard dashboard
- ✅ Dealers: Trial features appear
- ✅ Admins: Full access
- ✅ No console errors for any user type

---

## 📝 Notes

- All accounts are created automatically on backend startup
- Passwords follow security requirements (uppercase, lowercase, numbers, special chars)
- Dealer account has trial enabled by default
- Trial period: 60 days, 15 listings
- All accounts are marked as verified for easy testing
- Safe to use in development only!

---

## 🔐 Security Reminder

**⚠️ IMPORTANT:** These credentials are for **DEVELOPMENT ONLY**

In production:
- Use strong, unique passwords
- Enable 2FA
- Rotate credentials regularly
- Never commit production credentials
- Use environment variables for sensitive data

---

**Happy Testing! 🚀**

Use the **dealer account** to see all the amazing trial and subscription features!

