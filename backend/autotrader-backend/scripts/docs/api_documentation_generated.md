# Caryo Marketplace API Documentation

This is the comprehensive API documentation for the Caryo Marketplace platform, including all endpoints, examples, and testing information.

Last updated: July 14, 2025

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Car Listings](#car-listings)
4. [Filtering and Search](#filtering-and-search)
5. [Reference Data](#reference-data)
6. [User Management](#user-management)
7. [Testing](#testing)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

## Overview

The Caryo Marketplace API provides endpoints for managing car listings, user accounts, and reference data. The API follows REST principles and supports both modern slug-based filtering (AutoTrader UK pattern) and legacy hierarchical filtering for backward compatibility.

### Base URLs
- **Production**: `https://api.caryomarketplace.com`
- **Development**: `http://localhost:8080`

### API Version
Current version: **v1.0**

## Authentication

Authentication is handled using JWT tokens with Bearer authentication.

### Register New User

**POST** `/api/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "Password123!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

### Login User

**POST** `/api/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "username": "testuser",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "userId": 1,
  "username": "testuser",
  "email": "testuser@example.com",
  "roles": ["ROLE_USER"]
}
```

### Get User Profile

**GET** `/api/auth/me`

Returns the current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```


## Car Listings

### List All Approved Listings

**GET** `/api/listings`

Returns a paginated list of all approved, unsold, and unarchived car listings. Each listing includes an array of its associated media items.

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 10)
- `sort` (optional): Sort field and direction (default: createdAt,desc)

**Response Example:**
```json
{
  "content": [
    {
      "id": 1,
      "title": "2020 Toyota Camry",
      "price": 25000,
      "year": 2020,
      "mileage": 15000,
      "carModel": {
        "id": 1,
        "name_en": "Camry",
        "name_ar": "كامري",
        "slug": "camry",
        "carBrand": {
          "id": 1,
          "name_en": "Toyota",
          "name_ar": "تويوتا",
          "slug": "toyota"
        }
      },
      "media": [
        {
          "id": 1,
          "mediaType": "IMAGE",
          "fileName": "car-image.jpg",
          "isPrimary": true,
          "displayOrder": 1
        }
      ],
      "approved": true,
      "sold": false,
      "archived": false
    }
  ],
  "totalElements": 50,
  "totalPages": 5,
  "number": 0,
  "size": 10,
  "last": false
}
```

### Get Listing by ID

**GET** `/api/listings/{id}`

Returns the details of a specific car listing, including media items.

**Path Parameters:**
- `id` (required): Listing ID

### Create New Listing

**POST** `/api/listings`

Creates a new car listing without an image. Authentication required.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body Example:**
```json
{
  "title": "2020 Toyota Camry",
  "description": "Excellent condition, low mileage",
  "price": 25000,
  "year": 2020,
  "mileage": 15000,
  "carModelId": 1,
  "locationId": 1,
  "sellerTypeId": 1
}
```

### Create Listing with Image

**POST** `/api/listings/with-image`

Creates a new car listing with an initial image. Authentication required.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `listing`: JSON data (same as above)
- `image`: Image file (JPEG, PNG, GIF, or WebP)

### Update Listing

**PUT** `/api/listings/{id}`

Updates an existing listing. Only the owner can update their listing.

### Delete Listing

**DELETE** `/api/listings/{id}`

Deletes a listing. Only the owner can delete their listing.

### Get My Listings

**GET** `/api/listings/my-listings`

Returns all listings created by the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

### Upload Image to Listing

**POST** `/api/listings/{listingId}/upload-image`

Uploads an additional image to an existing listing.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: Image file

### Listing Status Management

#### Pause Listing
**PUT** `/api/listings/{id}/pause`

Temporarily hides an approved listing from public view.

#### Resume Listing
**PUT** `/api/listings/{id}/resume`

Makes a paused listing visible again.

#### Mark as Sold
**POST** `/api/listings/{id}/mark-sold`

Marks a listing as sold, removing it from active listings.

#### Archive Listing
**POST** `/api/listings/{id}/archive`

Archives a listing for long-term storage.

#### Unarchive Listing
**POST** `/api/listings/{id}/unarchive`

Restores an archived listing to active status.

## Filtering and Search

### Filter Listings (GET - Recommended)

**GET** `/api/listings/filter`

Filter car listings using query parameters. Supports both new slug-based filtering (AutoTrader UK pattern) and legacy filtering.

#### New Slug-Based Filtering (Recommended)

The API now supports AutoTrader UK style repeated parameters for maximum flexibility:

**Query Parameters:**
- `brandSlugs` (repeatable): Brand slugs (e.g., `?brandSlugs=toyota&brandSlugs=honda&brandSlugs=bmw`)
- `modelSlugs` (repeatable): Model slugs (e.g., `?modelSlugs=camry&modelSlugs=civic&modelSlugs=x3`)

**Example URL Patterns:**

Filter by multiple brands:
```
GET /api/listings/filter?brandSlugs=toyota&brandSlugs=honda&brandSlugs=bmw
```

Filter by multiple models:
```
GET /api/listings/filter?modelSlugs=camry&modelSlugs=civic&modelSlugs=x3
```

Filter by both brands and models:
```
GET /api/listings/filter?brandSlugs=toyota&brandSlugs=honda&modelSlugs=camry&modelSlugs=civic&modelSlugs=accord
```

#### Other Filter Parameters

- `minYear`, `maxYear`: Year range
- `minPrice`, `maxPrice`: Price range  
- `minMileage`, `maxMileage`: Mileage range
- `location`: Location slug or name
- `locationId`: Location ID
- `sellerTypeId`: Seller type ID
- `isSold`: Include sold listings (default: false)
- `isArchived`: Include archived listings (default: false)

#### Pagination Parameters

- `page`: Page number (default: 0)
- `size`: Page size (default: 10, max: 100)
- `sort`: Sort criteria (e.g., `createdAt,desc`, `price,asc`)

#### Validation Rules

- Maximum 10 brand slugs per request
- Maximum 20 model slugs per request
- All slug values are normalized (lowercase, trimmed)

**Example Complete Request:**
```
GET /api/listings/filter?brandSlugs=toyota&brandSlugs=honda&modelSlugs=camry&modelSlugs=civic&minYear=2020&maxYear=2023&minPrice=15000&maxPrice=30000&page=0&size=20&sort=price,asc
```

### Filter Listings (POST)

**POST** `/api/listings/filter`

Alternative filtering method using POST with request body.

**Headers:**
- `Content-Type: application/json`

**Request Body Example:**
```json
{
  "brandSlugs": ["toyota", "honda", "bmw"],
  "modelSlugs": ["camry", "civic", "x3"],
  "minYear": 2020,
  "maxYear": 2023,
  "minPrice": 15000,
  "maxPrice": 30000,
  "locationId": 1,
  "sellerTypeId": 1
}
```

### Legacy Filtering (Deprecated)

The API still supports legacy hierarchical brand filtering for backward compatibility, but slug-based filtering is recommended for new implementations.

**Legacy Parameter:**
- `brand`: Hierarchical syntax (e.g., `Toyota:Camry;Corolla` or `Toyota:Camry,Honda`)

## Admin Endpoints

### Get All Listings (Admin)

**GET** `/api/listings/admin/all`

Returns all listings regardless of approval status. Admin access required.

**Headers:**
- `Authorization: Bearer <admin-token>`

### Approve Listing (Admin)

**PUT** `/api/listings/admin/{id}/approve`

Approves a pending listing, making it visible to the public.

### Reject Listing (Admin)

**PUT** `/api/listings/admin/{id}/reject`

Rejects and removes a pending listing.

**Request Body (Optional):**
```json
{
  "reason": "Rejection reason"
}
```

### Delete Listing (Admin)

**DELETE** `/api/listings/admin/{id}`

Deletes any listing regardless of ownership.

## Reference Data

### Get All Reference Data

**GET** `/api/reference-data`

Returns all reference data including car brands, models, locations, and seller types.

**Headers:**
- `Authorization: Bearer <token>`

**Response Example:**
```json
{
  "carBrands": [
    {
      "id": 1,
      "name_en": "Toyota",
      "name_ar": "تويوتا",
      "slug": "toyota",
      "carModels": [
        {
          "id": 1,
          "name_en": "Camry",
          "name_ar": "كامري",
          "slug": "camry"
        }
      ]
    }
  ],
  "locations": [
    {
      "id": 1,
      "name_en": "Dubai",
      "name_ar": "دبي",
      "slug": "dubai"
    }
  ],
  "sellerTypes": [
    {
      "id": 1,
      "name_en": "Individual",
      "name_ar": "فرد"
    }
  ]
}
```

### Get Car Brands

**GET** `/api/car-brands`

Returns all car brands with their models.

### Get Car Models by Brand

**GET** `/api/car-brands/{brandId}/models`

Returns all models for a specific brand.

### Get Locations

**GET** `/api/locations`

Returns all available locations.

## User Management

### User Registration

**POST** `/api/auth/register`

Registers a new user account.

**Headers:**
- `Content-Type: application/json`

**Request Body Example:**
```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "Password123!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Response Example:**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

### User Login

**POST** `/api/auth/login`

Authenticates a user and returns a JWT token.

**Headers:**
- `Content-Type: application/json`

**Request Body Example:**
```json
{
  "username": "testuser",
  "password": "Password123!"
}
```

**Response Example:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "userId": 1,
  "username": "testuser",
  "email": "testuser@example.com",
  "roles": ["ROLE_USER"]
}
```

### Get User Profile

**GET** `/api/auth/me`

Returns the current user's profile information.

**Headers:**
- `Authorization: Bearer <token>`

### Update User Profile

**PUT** `/api/auth/me`

Updates the current user's profile information.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

## Testing

### Postman Collections

The API includes comprehensive Postman test collections for automated testing.

#### Available Collections

1. **Main API Collection** (`autotrader-api-collection.json`)
   - Authentication tests
   - Reference data tests
   - Basic listing operations
   - Slug-based filtering tests

2. **Comprehensive Slug Filtering Tests** (`slug-filtering-tests.json`)
   - Complete end-to-end filtering tests
   - AutoTrader UK pattern validation
   - Input validation tests
   - Performance testing

#### Running Tests

**Automated Script:**
```bash
# Run all slug filtering tests
./run-slug-filtering-tests.sh

# Run specific collection
./run-slug-filtering-tests.sh --collection slug
./run-slug-filtering-tests.sh --collection main
```

**Manual Newman Execution:**
```bash
newman run backend/autotrader-backend/src/test/resources/postman/collections/slug-filtering-tests.json \
  --environment backend/autotrader-backend/src/test/resources/postman/environment.json
```

#### Test Examples

**Single Brand Filtering Test:**
```javascript
pm.test("Single brand filter works", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    jsonData.content.forEach(listing => {
        pm.expect(listing.carModel.carBrand.slug).to.equal('toyota');
    });
});
```

**Multiple Brand Filtering Test (AutoTrader UK Pattern):**
```javascript
pm.test("Multiple brand filter works", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    const allowedBrands = ['toyota', 'honda'];
    jsonData.content.forEach(listing => {
        pm.expect(allowedBrands).to.include(listing.carModel.carBrand.slug);
    });
});
```

#### Test Coverage

✅ **Authentication & Authorization**
- User registration and login
- Token validation
- Role-based access control

✅ **Listing Management**
- Create, read, update, delete operations
- Media upload and management
- Status changes (pause, resume, archive)

✅ **Slug-Based Filtering**
- Single and multiple brand filtering
- Model slug filtering
- Combined brand + model filtering
- Price and year range filtering
- Pagination with filtering

✅ **Validation & Error Handling**
- Input validation limits
- Error response formats
- Edge case handling

### API Testing Examples

#### cURL Examples

**Filter by Multiple Brands (AutoTrader UK Pattern):**
```bash
curl -X GET "http://localhost:8080/api/listings/filter?brandSlugs=toyota&brandSlugs=honda&brandSlugs=bmw" \
  -H "Accept: application/json"
```

**Combined Filtering with Price Range:**
```bash
curl -X GET "http://localhost:8080/api/listings/filter?brandSlugs=toyota&modelSlugs=camry&minPrice=20000&maxPrice=40000" \
  -H "Accept: application/json"
```

**POST Filtering with JSON Body:**
```bash
curl -X POST "http://localhost:8080/api/listings/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "brandSlugs": ["toyota", "honda"],
    "modelSlugs": ["camry", "civic"],
    "minPrice": 15000,
    "maxPrice": 35000
  }'
```

#### JavaScript/Fetch Examples

**Basic Brand Filtering:**
```javascript
const response = await fetch('/api/listings/filter?brandSlugs=toyota&brandSlugs=honda');
const data = await response.json();
```

**Dynamic URL Builder:**
```javascript
const buildFilterUrl = (filters) => {
  const params = new URLSearchParams();
  
  if (filters.brandSlugs) {
    filters.brandSlugs.forEach(slug => params.append('brandSlugs', slug));
  }
  
  if (filters.modelSlugs) {
    filters.modelSlugs.forEach(slug => params.append('modelSlugs', slug));
  }
  
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  
  return `/api/listings/filter?${params.toString()}`;
};

// Usage
const url = buildFilterUrl({
  brandSlugs: ['toyota', 'honda'],
  modelSlugs: ['camry', 'civic'],
  minPrice: 20000,
  maxPrice: 40000
});
```

### Load Testing

**Performance Benchmarks:**
- Single brand filter: < 200ms response time
- Multiple brand filter (5 brands): < 300ms response time
- Combined filters with pagination: < 400ms response time

**Recommended Load Testing Tools:**
- Apache Bench (ab)
- JMeter
- Artillery.io

**Example Load Test:**
```bash
# Test 100 concurrent requests for brand filtering
ab -n 1000 -c 100 "http://localhost:8080/api/listings/filter?brandSlugs=toyota"
```

## Error Responses

The API returns standard HTTP status codes and error messages in JSON format:

### Common Error Formats

**400 Bad Request:**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Price must be positive"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "message": "Full authentication is required to access this resource"
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied"
}
```

**404 Not Found:**
```json
{
  "message": "Listing not found"
}
```

**409 Conflict:**
```json
{
  "message": "Listing is already paused"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal server error"
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- Search/filter endpoints: 100 requests per minute per user
- File upload endpoints: 10 requests per minute per user
- All other endpoints: 50 requests per minute per user

## Best Practices

### Filtering Performance
1. Use slug-based filtering (`brandSlugs`, `modelSlugs`) for better performance
2. Limit the number of filter values (max 10 brands, 20 models)
3. Use pagination for large result sets
4. Consider caching reference data on the client side

### Image Upload
1. Supported formats: JPEG, PNG, GIF, WebP
2. Maximum file size: 10MB per image
3. Maximum 20 images per listing
4. Images are automatically optimized and resized

### Authentication
1. JWT tokens expire after 24 hours
2. Refresh tokens before expiration to maintain session
3. Store tokens securely (httpOnly cookies recommended for web apps)
4. Implement proper logout functionality

### Pagination
1. Use reasonable page sizes (10-50 items)
2. Implement proper pagination controls in UI
3. Sort by relevant fields (createdAt, price, etc.)
4. Handle empty results gracefully

---

*Last updated: July 14, 2025*
*API Version: 1.0*
*Base URL: `https://api.caryomarketplace.com` (production) | `http://localhost:8080` (development)*
