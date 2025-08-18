# AutoTrader API Postman Tests

This directory contains comprehensive Postman collections for testing the AutoTrader API, including all the new admin endpoints and listing moderation features.

## 📁 Collections Overview

### Main Collections

1. **`autotrader-api-collection.json`** - Main comprehensive API collection
   - Reference data endpoints
   - Authentication flows
   - Listing operations
   - Search and filtering
   - Saved searches
   - **NEW**: Admin endpoints section

2. **`collections/admin-endpoints-tests.json`** - Dedicated admin testing collection
   - Complete admin workflow testing
   - Listing moderation actions
   - Error handling scenarios
   - Setup and cleanup procedures

### Specialized Collections

- `collections/auth-tests.json` - Authentication and authorization tests
- `collections/listings-media-tests.json` - Media upload and management tests
- `collections/pause-resume-tests.json` - Listing pause/resume functionality
- `collections/saved-searches-tests.json` - Saved search functionality
- `collections/reference-data-tests.json` - Reference data endpoints
- `collections/contact-email-tests.json` - Contact email functionality
- `collections/slug-filtering-tests.json` - URL slug filtering tests

## 🌍 Environment Setup

### Environment File: `environment.json`

The environment file contains all necessary variables:

```json
{
  "baseUrl": "http://localhost:8080",
  "auth_token": "",
  "admin_token": "",
  "listing_id": "",
  "test_listing_id": "",
  "test_username": "default_user",
  "test_email": "default@example.com",
  "test_password": "password123",
  "admin_username": "admin",
  "admin_email": "admin@autotrader.com",
  "admin_password": "Admin123!"
}
```

### Required Environment Variables

- `baseUrl` - API base URL (default: http://localhost:8080)
- `auth_token` - JWT token for regular user authentication
- `admin_token` - JWT token for admin user authentication
- `listing_id` - ID of a test listing for operations
- `test_listing_id` - ID of listing created during admin tests

## 🚀 Getting Started

### 1. Import Collections

1. Open Postman
2. Click "Import" 
3. Select the collection files you want to test:
   - For comprehensive testing: `autotrader-api-collection.json`
   - For admin-specific testing: `collections/admin-endpoints-tests.json`

### 2. Import Environment

1. Import `environment.json`
2. Set it as your active environment
3. Verify the `baseUrl` matches your running server

### 3. Start the Application

```bash
cd backend/autotrader-backend
./gradlew bootRun
```

### 4. Run Tests

#### Option A: Run Main Collection
1. Select "AutoTrader API" collection
2. Click "Run collection"
3. Select all folders or specific sections
4. Run the tests

#### Option B: Run Admin Tests
1. Select "Admin Endpoints Tests" collection
2. Click "Run collection" 
3. Tests will automatically:
   - Create admin user
   - Login and get token
   - Create test listing
   - Test all admin operations
   - Clean up test data

## 🔧 New Admin Endpoints Tested

### Admin Dashboard
- `GET /api/admin/listings` - Get all listings with moderation status
- Search and filtering with admin-specific parameters

### Listing Moderation Actions
- `POST /api/admin/listings/{id}/approve` - Approve pending listing
- `PUT /api/admin/listings/{id}/hide` - Hide listing from public view
- `PUT /api/admin/listings/{id}/unhide` - Restore hidden listing
- `POST /api/admin/listings/{id}/mark-sold` - Mark listing as sold
- `POST /api/admin/listings/{id}/unmark-sold` - Remove sold status
- `POST /api/admin/listings/{id}/archive` - Archive listing
- `POST /api/admin/listings/{id}/unarchive` - Restore archived listing

### Response Enhancements
All admin endpoints now return enhanced `CarListingResponse` with:
- `approved` - Approval status
- `hiddenByAdmin` - Admin visibility control
- `isSold` - Sold status (computed from moderation actions)
- `isArchived` - Archive status (computed from moderation actions)
- `isExpired` - Expiration status
- `status` - Overall listing status (PENDING, ACTIVE, HIDDEN, SOLD, ARCHIVED, EXPIRED)

## 🧪 Test Scenarios Covered

### Authentication & Authorization
- ✅ User registration and login
- ✅ Admin user creation and authentication
- ✅ JWT token validation
- ✅ Role-based access control (ADMIN role required)
- ✅ Unauthorized access prevention

### Listing Management
- ✅ Create test listings
- ✅ Retrieve listings with moderation status
- ✅ Search and filter listings (admin view)
- ✅ Pagination support

### Moderation Workflow
- ✅ Approve pending listings
- ✅ Hide/unhide listings
- ✅ Mark/unmark as sold
- ✅ Archive/unarchive listings
- ✅ Status transitions and validation
- ✅ Audit trail creation (moderation actions)

### Error Handling
- ✅ Non-existent listing handling (404)
- ✅ Unauthorized access (401)
- ✅ Invalid parameters validation
- ✅ Proper error messages

### Data Integrity
- ✅ Status consistency across operations
- ✅ Moderation action recording
- ✅ Latest-action-wins logic
- ✅ Computed status fields accuracy

## 📊 Test Results Validation

Each test includes comprehensive assertions:

### Status Code Validation
```javascript
pm.test("Request successful", function () {
    pm.response.to.have.status(200);
});
```

### Response Structure Validation
```javascript
pm.test("Response includes moderation status", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('approved');
    pm.expect(jsonData).to.have.property('hiddenByAdmin');
    pm.expect(jsonData).to.have.property('isSold');
    pm.expect(jsonData).to.have.property('isArchived');
    pm.expect(jsonData).to.have.property('status');
});
```

### Business Logic Validation
```javascript
pm.test("Listing status updated correctly", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.approved).to.be.true;
    pm.expect(jsonData.status).to.equal('ACTIVE');
});
```

## 🔄 Continuous Integration

These tests can be integrated into CI/CD pipelines using Newman:

```bash
# Install Newman
npm install -g newman

# Run main collection
newman run autotrader-api-collection.json -e environment.json

# Run admin tests
newman run collections/admin-endpoints-tests.json -e environment.json

# Generate HTML report
newman run collections/admin-endpoints-tests.json -e environment.json -r html
```

## 📝 Notes

### Database State
- Tests use the application's H2/PostgreSQL database
- Sample data is created by Flyway migrations
- Admin tests create and clean up their own test data
- Some tests may depend on existing sample data

### Authentication Tokens
- Tokens are automatically generated and stored in environment variables
- Admin tests handle token lifecycle automatically
- Tokens expire based on JWT configuration

### Test Order
- Admin collection tests are designed to run in sequence
- Each test builds on the previous test's state
- Setup and cleanup sections ensure proper test isolation

## 🐛 Troubleshooting

### Common Issues

1. **Server not running**
   - Ensure `./gradlew bootRun` is running
   - Check `baseUrl` in environment matches server

2. **Authentication failures**
   - Verify admin user creation succeeded
   - Check JWT token is properly set in environment
   - Ensure user has ADMIN role

3. **Test data conflicts**
   - Run cleanup section if tests fail midway
   - Restart application to reset H2 database
   - Check for existing test data conflicts

4. **Database migration issues**
   - Ensure all Flyway migrations have run successfully
   - Check application logs for migration errors
   - Verify sample data was inserted correctly

### Debug Tips

- Enable Postman console to see detailed logs
- Check application logs for server-side errors
- Verify environment variables are set correctly
- Use individual test runs to isolate issues

## 🔄 Updates Made

### Recent Changes (Current Branch)
- ✅ Added comprehensive admin endpoints collection
- ✅ Updated main collection with admin section
- ✅ Enhanced environment with admin variables
- ✅ Added moderation status validation tests
- ✅ Implemented proper error handling tests
- ✅ Added automated test data setup/cleanup

### Migration from Previous Version
- Removed references to deleted database columns (`sold`, `archived`, `expired`)
- Updated response validation for computed status fields
- Added new admin-specific endpoints
- Enhanced authentication flow for admin users