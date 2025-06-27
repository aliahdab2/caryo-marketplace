# Autotrader Marketplace API Documentation

This document provides detailed information about the available API endpoints in the Autotrader Marketplace backend service.

## Quick Start Guide

### Starting the Application
```bash
# Navigate to the project directory
cd backend/autotrader-backend

# Start the Spring Boot application
./gradlew bootRun
```

### Testing Authentication Flow
```bash
# 1. Register a new user
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","email":"testuser1@example.com","password":"password123"}'

# 2. Login to get a JWT token
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123"}'

# 3. Save the token from the response
# Example: TOKEN="eyJhbGciOiJIUzI1NiJ9..."

# 4. Use the token to access protected endpoints
curl -X GET http://localhost:8080/api/listings/my-listings \
  -H "Authorization: Bearer $TOKEN"

# 5. Test the new filtering API (no authentication required)
# Simple brand filter
curl -X GET "http://localhost:8080/api/listings/filter?brand=Toyota"

# Advanced hierarchical filtering
curl -X POST http://localhost:8080/api/listings/filter \
  -H "Content-Type: application/json" \
  -d '{"brand":"Toyota:Camry;Corolla,Honda","minYear":2020,"maxYear":2024}'
```

### Testing the New Filtering API

The filtering API supports powerful search capabilities without requiring authentication:

```bash
# Find all Toyota cars
curl -X GET "http://localhost:8080/api/listings/filter?brand=Toyota"

# Find specific models from Toyota (Camry and Corolla only)
curl -X GET "http://localhost:8080/api/listings/filter?brand=Toyota:Camry;Corolla"

# Find Toyota Camry and all Honda cars
curl -X GET "http://localhost:8080/api/listings/filter?brand=Toyota:Camry,Honda"

# Complex filtering with multiple criteria
curl -X POST http://localhost:8080/api/listings/filter \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota:Camry;Corolla,Honda:Civic,BMW",
    "minYear": 2018,
    "maxYear": 2024,
    "minPrice": 15000,
    "maxPrice": 50000,
    "maxMileage": 80000
  }'

# Search with pagination
curl -X GET "http://localhost:8080/api/listings/filter?brand=Mercedes-Benz&page=0&size=5&sort=price,asc"
```

### Interactive API Documentation

Once the application is running, you can access the interactive Swagger UI documentation at:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

The Swagger UI provides:
- Complete API documentation with request/response examples
- Interactive testing interface for all endpoints
- Real-time schema validation
- Built-in authentication testing for protected endpoints
```

### Running API Tests

#### Automated Testing Script
```bash
# From the project root directory
./run-postman-tests.sh
```

This script will:
- Install Newman (Postman CLI) if not already installed
- Check if the Spring Boot application is running
- Execute all API tests with proper authentication
- Generate detailed HTML and CLI reports
- Provide diagnostics if tests fail

The HTML report will be available at `results/html-report.html`.

#### Test Coverage
The automated API tests cover:
- **Authentication**: User registration, login, and JWT token validation
- **Reference Data**: Governorates, car brands, models, and other lookup data
- **Car Listings**: CRUD operations and advanced hierarchical filtering
- **Error Handling**: Invalid requests, authentication failures, and data validation

All tests include proper authentication and validate both success and error scenarios.

#### Manual Testing with Newman
```bash
# Install Newman CLI tool
npm install -g newman newman-reporter-htmlextra

# Run the test collection manually
newman run "./src/test/resources/postman/autotrader-api-collection.json" \
  --environment "../../postman/test_environment.json" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export results/report.html
```

#### Manual Testing with Postman
1. Start the application with `./gradlew bootRun`
2. Import the collection and environment into Postman:
   - Collection: `src/test/resources/postman/autotrader-api-collection.json`
   - Environment: `../../postman/test_environment.json`
3. Run the collection in Postman

## Base URL

For local development: `http://localhost:8080`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication

#### Register a User

- **Endpoint**: `POST /api/auth/signup`
- **Access**: Public
- **Description**: Creates a new user account
- **Request Body**:
  ```json
  {
    "username": "yourUsername",
    "email": "your.email@example.com",
    "password": "yourPassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "User registered successfully!"
  }
  ```
- **Response (400 Bad Request)** - Username/email already taken:
  ```json
  {
    "message": "Error: Username is already taken!"
  }
  ```

#### Login User

- **Endpoint**: `POST /api/auth/signin`
- **Access**: Public
- **Description**: Authenticates a user and returns a JWT token
- **Request Body**:
  ```json
  {
    "username": "yourUsername",
    "password": "yourPassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "username": "yourUsername",
    "email": "your.email@example.com",
    "roles": ["ROLE_USER"],
    "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
  }
  ```
- **Response (401 Unauthorized)** - Invalid credentials:
  ```json
  {
    "message": "Invalid username or password"
  }
  ```

### Car Listings

#### Create Car Listing

- **Endpoint**: `POST /api/listings`
- **Access**: Authenticated users
- **Description**: Creates a new car listing
- **Authentication**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "title": "2019 Toyota Camry",
    "brand": "Toyota",
    "model": "Camry",
    "modelYear": 2019,
    "price": 18500,
    "mileage": 35000,
    "location": "New York, NY",
    "description": "Excellent condition, one owner, no accidents",
    "imageUrl": "https://example.com/camry.jpg"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "title": "2019 Toyota Camry",
    "brand": "Toyota",
    "model": "Camry",
    "modelYear": 2019,
    "price": 18500,
    "mileage": 35000,
    "location": "New York, NY",
    "description": "Excellent condition, one owner, no accidents",
    "imageUrl": "https://example.com/camry.jpg",
    "approved": false,
    "userId": 1,
    "createdAt": "2025-04-30T10:15:30Z",
    "updatedAt": null,
    "isSold": false,
    "isArchived": false,
    "isUserActive": true,
    "isExpired": false
  }
  ```
- **Response (400 Bad Request)** - Invalid data:
  ```json
  {
    "message": "Error: Invalid listing data",
    "errors": {
      "price": "Price must be greater than 0",
      "title": "Title is required"
    }
  }
  ```

#### Get User's Listings

- **Endpoint**: `GET /api/listings/my-listings`
- **Access**: Authenticated users
- **Description**: Retrieves all listings created by the authenticated user
- **Authentication**: Required (JWT token)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "title": "2019 Toyota Camry",
      "brand": "Toyota",
      "model": "Camry",
      "modelYear": 2019,
      "price": 18500,
      "mileage": 35000,
      "location": "New York, NY",
      "description": "Excellent condition, one owner, no accidents",
      "imageUrl": "https://example.com/camry.jpg",
      "approved": false,
      "userId": 1,
      "createdAt": "2025-04-30T10:15:30Z",
      "updatedAt": null,
      "isSold": false,
      "isArchived": false,
      "isUserActive": true,
      "isExpired": false
    }
  ]
  ```

#### Filter Car Listings

The filtering API supports powerful hierarchical brand/model filtering that allows for complex search queries. You can use either POST (with request body) or GET (with query parameters) methods.

##### POST Method - Filter with Request Body

- **Endpoint**: `POST /api/listings/filter`
- **Access**: Public
- **Description**: Returns a paginated list of car listings matching the provided filter criteria. By default, only approved, unsold, and non-archived listings are returned.
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "brand": "Toyota:Camry;Corolla,Honda:Civic,BMW",
    "minYear": 2018,
    "maxYear": 2024,
    "minPrice": 15000,
    "maxPrice": 50000,
    "minMileage": 0,
    "maxMileage": 80000,
    "location": "new-york-ny",
    "locationId": 1,
    "isSold": false,
    "isArchived": false,
    "sellerTypeId": 1
  }
  ```

**Advanced Brand/Model Filtering Syntax:**

The `brand` parameter supports hierarchical filtering with the following syntax:
- **Single brand**: `"Toyota"` → All Toyota cars
- **Brand with specific model**: `"Toyota:Camry"` → Only Toyota Camry cars
- **Brand with multiple models**: `"Toyota:Camry;Corolla"` → Toyota Camry and Corolla cars
- **Multiple brands with models**: `"Toyota:Camry;Corolla,Honda:Civic"` → Toyota Camry/Corolla AND Honda Civic cars
- **Mixed brand filtering**: `"Toyota:Camry,Honda"` → Toyota Camry cars AND all Honda cars
- **Complex example**: `"Toyota:Camry;Corolla,Honda:Civic,BMW"` → Toyota Camry/Corolla AND Honda Civic AND all BMW cars

**Important Requirements:**
- **Brand context is mandatory**: When filtering by models, you must always provide the parent brand
- **No model-only filtering**: Sending only the `model` parameter without `brand` will be ignored
- **Frontend responsibility**: The frontend must construct the brand:model syntax properly

**Special Characters in Model Names:**
- Model names containing colons are supported: `"Toyota:Prius:Hybrid"` (brand="Toyota", model="Prius:Hybrid")
- Brands with hyphens: `"Mercedes-Benz:C-Class"`

**Bilingual Support:**
- All brand and model searches work in both English and Arabic
- Search is case-insensitive and supports partial matching

- **Response (200 OK)**:
  ```json
  {
    "content": [
      {
        "id": 1,
        "title": "2019 Toyota Camry",
        "brandNameEn": "Toyota",
        "brandNameAr": "تويوتا",
        "modelNameEn": "Camry",
        "modelNameAr": "كامري",
        "modelYear": 2019,
        "price": 18500,
        "mileage": 35000,
        "location": "New York, NY",
        "description": "Excellent condition, one owner, no accidents",
        "approved": true,
        "sold": false,
        "archived": false,
        "createdAt": "2025-04-30T10:15:30Z",
        "media": [
          {
            "id": 1,
            "fileName": "camry_front.jpg",
            "fileUrl": "https://example.com/images/camry_front.jpg",
            "mediaType": "IMAGE",
            "isPrimary": true
          }
        ]
      }
    ],
    "pageable": {
      "sort": {
        "sorted": true,
        "unsorted": false
      },
      "pageNumber": 0,
      "pageSize": 10
    },
    "totalElements": 1,
    "totalPages": 1,
    "last": true,
    "numberOfElements": 1,
    "first": true
  }
  ```

##### GET Method - Filter with Query Parameters

- **Endpoint**: `GET /api/listings/filter`
- **Access**: Public
- **Description**: Returns a paginated list of car listings matching the provided filter criteria as query parameters
- **Authentication**: Not required
- **Query Parameters**:
  - `brand` (string): Brand filter using hierarchical syntax (same as POST method)
  - `model` (string): **DEPRECATED** - Model filter (ignored if provided without brand context)
  - `minYear` (integer): Minimum model year (1920+)
  - `maxYear` (integer): Maximum model year (current year or earlier)
  - `minPrice` (decimal): Minimum price
  - `maxPrice` (decimal): Maximum price
  - `minMileage` (integer): Minimum mileage
  - `maxMileage` (integer): Maximum mileage
  - `location` (string): Location slug
  - `locationId` (long): Location ID
  - `isSold` (boolean): Filter by sold status
  - `isArchived` (boolean): Filter by archived status
  - `sellerTypeId` (long): Filter by seller type ID
  - `page` (integer): Page number (0-based, default: 0)
  - `size` (integer): Page size (default: 10)
  - `sort` (string): Sort criteria (default: createdAt,desc)

**Important Note**: The `model` parameter is deprecated and will be ignored. You must use the hierarchical `brand` syntax to filter by models (e.g., `brand=Toyota:Camry` instead of `brand=Toyota&model=Camry`).

**Example Requests:**

```bash
# Simple brand filter
GET /api/listings/filter?brand=Toyota

# Hierarchical filtering
GET /api/listings/filter?brand=Toyota:Camry;Corolla,Honda&minYear=2020&maxYear=2024

# Price range with location
GET /api/listings/filter?minPrice=15000&maxPrice=50000&location=new-york-ny

# Complex filtering with pagination
GET /api/listings/filter?brand=Mercedes-Benz:C-Class,BMW:X5&minYear=2019&page=0&size=20&sort=price,asc
```

- **Response**: Same structure as POST method

**Filter Examples by Use Case:**

1. **Find all Toyota cars**: `brand=Toyota`
2. **Find Toyota Camry and Corolla only**: `brand=Toyota:Camry;Corolla`
3. **Find Toyota Camry and all Honda cars**: `brand=Toyota:Camry,Honda`
4. **Find luxury cars**: `brand=BMW,Mercedes-Benz,Audi&minPrice=30000`
5. **Find affordable sedans**: `brand=Toyota:Camry;Corolla,Honda:Civic;Accord&maxPrice=25000`
6. **Find recent cars in specific location**: `minYear=2020&location=new-york-ny`

## Frontend Migration Guide

### Old Approach (Deprecated)
```javascript
// ❌ This will no longer work - model parameter is ignored
const filters = {
  brand: "Toyota",
  model: "Camry"
};
```

### New Approach (Required)
```javascript
// ✅ Use hierarchical brand syntax
const filters = {
  brand: "Toyota:Camry"  // brand:model format
};

// ✅ Multiple models from same brand
const filters = {
  brand: "Toyota:Camry;Corolla"  // brand:model1;model2 format
};

// ✅ Multiple brands with specific models
const filters = {
  brand: "Toyota:Camry,Honda:Civic"  // brand1:model1,brand2:model2 format
};

// ✅ Mix of specific models and all models from a brand
const filters = {
  brand: "Toyota:Camry,Honda"  // Toyota Camry only + all Honda cars
};
```

### Frontend Implementation Requirements
1. **Always provide brand context** when filtering by models
2. **Build the hierarchical syntax** on the frontend before sending to API
3. **Remove any usage** of the separate `model` parameter
4. **Update filter UI** to construct proper brand:model combinations

#### Favorites

#### Add Listing to Favorites

- **Endpoint**: `POST /api/favorites/{listingId}`
- **Access**: Authenticated users
- **Description**: Adds a car listing to the user's favorites/watchlist
- **Authentication**: Required (JWT token)
- **Parameters**:
  - `listingId` (path parameter): ID of the car listing to add to favorites
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "carListing": {
      "id": 123,
      "title": "2019 Toyota Camry",
      // ... other car listing fields
    },
    "createdAt": "2024-03-21T10:15:30Z"
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "timestamp": "2024-03-21T10:15:30.123Z",
    "status": 404,
    "error": "Not Found",
    "message": "Car listing with id '123' was not found",
    "path": "/api/favorites/123",
    "details": null
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "timestamp": "2024-03-21T10:15:30.123Z",
    "status": 401,
    "error": "Unauthorized",
    "message": "User must be authenticated",
    "path": "/api/favorites/123",
    "details": null
  }
  ```

#### Remove Listing from Favorites

- **Endpoint**: `DELETE /api/favorites/{listingId}`
- **Access**: Authenticated users
- **Description**: Removes a car listing from the user's favorites/watchlist
- **Authentication**: Required (JWT token)
- **Parameters**:
  - `listingId` (path parameter): ID of the car listing to remove from favorites
- **Response (200 OK)**: Empty response
- **Response (404 Not Found)**:
  ```json
  {
    "timestamp": "2024-03-21T10:15:30.123Z",
    "status": 404,
    "error": "Not Found",
    "message": "Car listing with id '123' was not found",
    "path": "/api/favorites/123",
    "details": null
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "timestamp": "2024-03-21T10:15:30.123Z",
    "status": 401,
    "error": "Unauthorized",
    "message": "User must be authenticated",
    "path": "/api/favorites/123",
    "details": null
  }
  ```

#### Get User's Favorites

- **Endpoint**: `GET /api/favorites`
- **Access**: Authenticated users
- **Description**: Returns all car listings that the user has marked as favorite/watchlist
- **Authentication**: Required (JWT token)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 123,
      "title": "2019 Toyota Camry",
      "brand": "Toyota",
      "model": "Camry",
      "modelYear": 2019,
      "price": 18500,
      "mileage": 35000,
      "location": "New York, NY",
      "description": "Excellent condition, one owner, no accidents",
      "imageUrl": "https://example.com/camry.jpg",
      "approved": true,
      "userId": 1,
      "createdAt": "2024-03-21T10:15:30Z",
      "updatedAt": null,
      "isSold": false,
      "isArchived": false,
      "isUserActive": true,
      "isExpired": false
    }
    // ... more listings
  ]
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "timestamp": "2024-03-21T10:15:30.123Z",
    "status": 401,
    "error": "Unauthorized",
    "message": "User must be authenticated",
    "path": "/api/favorites",
    "details": null
  }
  ```

#### Check if Listing is Favorite

- **Endpoint**: `GET /api/favorites/{listingId}/check`
- **Access**: Authenticated users
- **Description**: Checks if a specific car listing is in the user's favorites/watchlist
- **Authentication**: Required (JWT token)
- **Parameters**:
  - `listingId` (path parameter): ID of the car listing to check
- **Response (200 OK)**:
  ```json
  true
  ```
  or
  ```json
  false
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "timestamp": "2024-03-21T10:15:30.123Z",
    "status": 404,
    "error": "Not Found",
    "message": "Car listing with id '123' was not found",
    "path": "/api/favorites/123/check",
    "details": null
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "timestamp": "2024-03-21T10:15:30.123Z",
    "status": 401,
    "error": "Unauthorized",
    "message": "User must be authenticated",
    "path": "/api/favorites/123/check",
    "details": null
  }
  ```

### Status Endpoints

#### Check Service Status

- **Endpoint**: `GET /status`
- **Access**: Public
- **Description**: Simple health check to verify the service is running
- **Response (200 OK)**:
  ```json
  {
    "status": "Service is up and running",
    "timestamp": "2025-04-30T12:34:56Z"
  }
  ```

#### Check API Status

- **Endpoint**: `GET /api/status`
- **Access**: Public
- **Description**: Health check for the API layer
- **Response (200 OK)**:
  ```json
  {
    "status": "API is up and running",
    "timestamp": "2025-04-30T12:34:56Z"
  }
  ```

## Error Responses

### Standard Error Format

Most error responses follow this format:

```json
{
  "timestamp": "2025-04-30T12:34:56Z", // Or current time in yyyy-MM-dd hh:mm:ss format
  "status": 400, // HTTP status code
  "error": "Bad Request", // HTTP status reason phrase
  "message": "Error message details", // Specific error message
  "path": "/api/endpoint", // The request path that caused the error
  "details": null // Optional map for more detailed errors, e.g., validation errors Map<String, List<String>>
}
```

### Common HTTP Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Testing the API

### Using cURL

#### Register a User
```bash
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","email":"testuser1@example.com","password":"password123"}'
```

#### Login
```bash
curl -X POST http://localhost:8080/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123"}'
```

#### Create a Car Listing (after login)
```bash
# First get a token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123"}' | grep -o '"accessToken":"[^"]*' | cut -d':' -f2 | tr -d '"')

# Then create a listing
curl -X POST http://localhost:8080/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"2019 Toyota Camry","brand":"Toyota","model":"Camry","modelYear":2019,"price":18500,"mileage":35000,"location":"New York, NY","description":"Excellent condition, one owner, no accidents","imageUrl":"https://example.com/camry.jpg"}'
```

#### Get Your Listings
```bash
# Using the token from previous step
curl -X GET http://localhost:8080/api/listings/my-listings \
  -H "Authorization: Bearer $TOKEN"
```

#### Add a Listing to Favorites
```bash
# Using the token from previous step
curl -X POST http://localhost:8080/api/favorites/123 \
  -H "Authorization: Bearer $TOKEN"
```

#### Remove a Listing from Favorites
```bash
# Using the token from previous step
curl -X DELETE http://localhost:8080/api/favorites/123 \
  -H "Authorization: Bearer $TOKEN"
```

#### Get Your Favorite Listings
```bash
# Using the token from previous step
curl -X GET http://localhost:8080/api/favorites \
  -H "Authorization: Bearer $TOKEN"
```

#### Check if a Listing is in Your Favorites
```bash
# Using the token from previous step
curl -X GET http://localhost:8080/api/favorites/123/check \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

Import the collection and environment files:
- Collection: `src/test/resources/postman/autotrader-api-tests.json`
- Environment: `src/test/resources/postman/environment.json`

### Using the Automated Test Script

To run all API tests automatically:
```bash
./src/test/scripts/run_postman_tests.sh
```

## Core Endpoints

- `GET /api/listings` - Get all approved car listings (public)
- `GET /api/listings/{id}` - Get details of a specific car listing (public)
- **Response (200 OK)** should also include `isSold`, `isArchived`, `isUserActive`, `isExpired`.
- `PUT /api/listings/{id}` - Update a listing (authenticated owner only)
- `DELETE /api/listings/{id}` - Delete a listing (authenticated owner only)
- `POST /api/admin/listings/{id}/approve` - Approve a listing (admin only)

### Pause & Resume Operations

#### Pause Listing
- **Endpoint**: `PUT /api/listings/{id}/pause`
- **Access**: Authenticated owner of the listing
- **Description**: Temporarily deactivates a listing, hiding it from public view
- **Authentication**: Required (JWT token)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to pause
- **Response (200 OK)**:
  ```json
  {
    "id": 123,
    "title": "2019 Toyota Camry",
    "isUserActive": false,
    "message": "Listing successfully paused"
  }
  ```
- **Error Responses**:
  - **400 Bad Request**: When listing cannot be paused in its current state
  - **403 Forbidden**: When user is not the owner of the listing
  - **404 Not Found**: When listing does not exist
  - **409 Conflict**: When listing is already paused

#### Resume Listing
- **Endpoint**: `PUT /api/listings/{id}/resume`
- **Access**: Authenticated owner of the listing
- **Description**: Reactivates a paused listing, making it visible in public listings
- **Authentication**: Required (JWT token)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to resume
- **Response (200 OK)**:
  ```json
  {
    "id": 123,
    "title": "2019 Toyota Camry",
    "isUserActive": true,
    "message": "Listing successfully resumed"
  }
  ```
- **Error Responses**:
  - **400 Bad Request**: When listing cannot be resumed in its current state
  - **403 Forbidden**: When user is not the owner of the listing
  - **404 Not Found**: When listing does not exist
  - **409 Conflict**: When listing is already active

### Additional Operations

## Media Management

### Upload Image for Listing

- **Endpoint**: `POST /api/listings/{listingId}/upload-image`
- **Access**: Authenticated owner of the listing
- **Description**: Uploads an image file and associates it with the specified car listing
- **Authentication**: Required (JWT token)
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `listingId` (path parameter): ID of the car listing
  - `file` (form-data): The image file to upload (JPEG, PNG, GIF, or WebP)
- **Response (200 OK)**:
  ```json
  {
    "message": "File uploaded successfully",
    "imageKey": "listings/123/your-image.jpg"
  }
  ```
- **Response (400 Bad Request)**:
  ```json
  {
    "message": "Error: File cannot be empty!"
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "message": "User must be logged in to upload images"
  }
  ```
- **Response (403 Forbidden)**:
  ```json
  {
    "message": "You don't have permission to upload images for this listing"
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "Listing not found"
  }
  ```
- **Response (500 Internal Server Error)**:
  ```json
  {
    "message": "Failed to upload file: [error details]"
  }
  ```

### Create Listing with Image

- **Endpoint**: `POST /api/listings/with-image`
- **Access**: Authenticated users
- **Description**: Creates a new car listing with an initial image
- **Authentication**: Required (JWT token)
- **Content-Type**: `multipart/form-data`
- **Request Parts**:
  - `listing` (JSON): Car listing details in JSON format
  - `image` (file): The image file to upload
- **Response (201 Created)**:
  ```json
  {
    "id": 125,
    "title": "2024 Honda Civic",
    // ... other listing fields
    "media": [
      {
        "id": 1,
        "url": "https://storage.example.com/listings/125/civic.jpg",
        "type": "IMAGE",
        "sortOrder": 1
      }
    ]
  }
  ```
- **Response (400 Bad Request)**:
  ```json
  {
    "message": "Image file is required and cannot be empty"
  }
  ```

#### Filter Listings (GET)
- **Endpoint**: `GET /api/listings/filter`
- **Access**: Public
- **Description**: Returns filtered listings using query parameters
- **Parameters**: brand, model, minYear, maxYear, location, locationId, minPrice, maxPrice, minMileage, maxMileage, isSold, isArchived
- **Response**: Paginated list of listings

#### Filter Listings (POST)
- **Endpoint**: `POST /api/listings/filter`
- **Access**: Public
- **Description**: Returns filtered listings using request body
- **Request Body**: JSON with filter criteria
- **Response**: Paginated list of listings

## Pause & Resume Functionality

### Pause a Listing

- **Endpoint**: `PUT /api/listings/{id}/pause`
- **Access**: Authenticated owner of the listing
- **Description**: Temporarily hides a listing from public view while preserving all its data
- **Authentication**: Required (JWT token)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to pause
- **Response (200 OK)**:
  ```json
  {
    "id": 123,
    "title": "2019 Toyota Camry",
    "brand": "Toyota",
    "model": "Camry",
    "isUserActive": false,
    "approved": true,
    // ... other listing fields
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "message": "Unauthorized"
  }
  ```
- **Response (403 Forbidden)**:
  ```json
  {
    "message": "You are not authorized to pause this listing"
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "Listing not found"
  }
  ```
- **Response (409 Conflict)**:
  ```json
  {
    "message": "Listing is already paused or cannot be paused in its current state"
  }
  ```

### Resume a Listing

- **Endpoint**: `PUT /api/listings/{id}/resume`
- **Access**: Authenticated owner of the listing
- **Description**: Makes a previously paused listing visible again in public listings
- **Authentication**: Required (JWT token)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to resume
- **Response (200 OK)**:
  ```json
  {
    "id": 123,
    "title": "2019 Toyota Camry",
    "brand": "Toyota",
    "model": "Camry",
    "isUserActive": true,
    "approved": true,
    // ... other listing fields
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "message": "Unauthorized"
  }
  ```
- **Response (403 Forbidden)**:
  ```json
  {
    "message": "You are not authorized to resume this listing"
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "Listing not found"
  }
  ```
- **Response (409 Conflict)**:
  ```json
  {
    "message": "Listing is already active or cannot be resumed in its current state"
  }
  ```

### Reference Data Endpoints

#### Get Governorates

- **Endpoint**: `GET /api/reference-data/governorates`
- **Access**: Public
- **Description**: Retrieves a list of all active governorates with translated display names.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "displayNameEn": "Damascus",
      "displayNameAr": "دمشق",
      "slug": "damascus",
      "countryCode": "SY"
    },
    {
      "id": 2,
      "displayNameEn": "Aleppo",
      "displayNameAr": "حلب",
      "slug": "aleppo",
      "countryCode": "SY"
    }
    // ... more governorates
  ]
  ```

#### Car Conditions
- **Endpoint**: `GET /api/reference-data/car-conditions`
- **Access**: Public
- **Description**: Returns all car condition options
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "displayNameEn": "New",
      "displayNameAr": "جديد",
      "slug": "new"
    },
    {
      "id": 2,
      "displayNameEn": "Used - Excellent",
      "displayNameAr": "مستعمل - ممتاز",
      "slug": "used-excellent"
    },
    {
      "id": 3,
      "displayNameEn": "Used - Good",
      "displayNameAr": "مستعمل - جيد",
      "slug": "used-good"
    }
    // ... more conditions
  ]
  ```

#### Drive Types
- **Endpoint**: `GET /api/reference-data/drive-types`
- **Access**: Public
- **Description**: Returns all drive type options
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "displayNameEn": "Front-Wheel Drive",
      "displayNameAr": "دفع أمامي",
      "slug": "fwd"
    },
    {
      "id": 2,
      "displayNameEn": "Rear-Wheel Drive",
      "displayNameAr": "دفع خلفي",
      "slug": "rwd"
    },
    {
      "id": 3,
      "displayNameEn": "All-Wheel Drive",
      "displayNameAr": "دفع رباعي",
      "slug": "awd"
    }
    // ... more drive types
  ]
  ```

#### Body Styles
- **Endpoint**: `GET /api/reference-data/body-styles`
- **Access**: Public
- **Description**: Returns all body style options
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "displayNameEn": "Sedan",
      "displayNameAr": "سيدان",
      "slug": "sedan"
    },
    {
      "id": 2,
      "displayNameEn": "SUV",
      "displayNameAr": "دفع رباعي",
      "slug": "suv"
    },
    {
      "id": 3,
      "displayNameEn": "Hatchback",
      "displayNameAr": "هاتشباك",
      "slug": "hatchback"
    }
    // ... more body styles
  ]
  ```

#### Transmissions
- **Endpoint**: `GET /api/reference-data/transmissions`
- **Access**: Public
- **Description**: Returns all transmission options
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "displayNameEn": "Automatic",
      "displayNameAr": "أوتوماتيك",
      "slug": "automatic"
    },
    {
      "id": 2,
      "displayNameEn": "Manual",
      "displayNameAr": "يدوي",
      "slug": "manual"
    },
    {
      "id": 3,
      "displayNameEn": "CVT",
      "displayNameAr": "CVT",
      "slug": "cvt"
    }
    // ... more transmissions
  ]
  ```

#### Commonly Used Values

- **Car Brands**: Toyota, Ford, Honda, BMW, Tesla
- **Car Models**: Camry, Mustang, Civic, 3 Series, Model S
- **Locations**: New York, NY; Los Angeles, CA; Chicago, IL; Houston, TX; Phoenix, AZ

### Car Brand and Model Data

#### Get All Car Brands

- **Endpoint**: `GET /api/reference-data/brands`
- **Access**: Public
- **Description**: Retrieves a list of all active car brands/makes.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "displayNameEn": "Toyota",
      "displayNameAr": "تويوتا",
      "slug": "toyota",
      "active": true
    },
    {
      "id": 2,
      "displayNameEn": "Ford",
      "displayNameAr": "فورد",
      "slug": "ford",
      "active": true
    }
    // ... more brands
  ]
  ```

#### Get Models for a Specific Brand

- **Endpoint**: `GET /api/reference-data/brands/{brandId}/models`
- **Access**: Public
- **Description**: Retrieves a list of active car models for a given brand ID.
- **Parameters**:
  - `brandId` (path parameter): The ID of the car brand.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 101,
      "displayNameEn": "Camry", 
      "displayNameAr": "كامري",
      "slug": "camry",
      "active": true,
      "brandId": 1 
    },
    {
      "id": 102,
      "displayNameEn": "Corolla",
      "displayNameAr": "كورولا",
      "slug": "corolla",
      "active": true,
      "brandId": 1
    }
    // ... more models for the brand
  ]
  ```
- **Response (404 Not Found)** - Brand not found:
  ```json
  {
    "timestamp": "2025-05-01T10:00:00Z",
    "status": 404,
    "error": "Not Found",
    "message": "CarBrand not found with id: 999",
    "path": "/api/reference-data/brands/999/models"
  }
  ```

#### Get Trims for a Specific Model

- **Endpoint**: `GET /api/reference-data/brands/{brandId}/models/{modelId}/trims`
- **Access**: Public
- **Description**: Retrieves a list of active car trims for a given model ID.
- **Parameters**:
  - `brandId` (path parameter): The ID of the car brand.
  - `modelId` (path parameter): The ID of the car model.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1001,
      "displayNameEn": "SE",
      "displayNameAr": "إس إي",
      "slug": "se",
      "active": true,
      "modelId": 101
    },
    {
      "id": 1002,
      "displayNameEn": "XLE",
      "displayNameAr": "إكس إل إي",
      "slug": "xle",
      "active": true,
      "modelId": 101
    }
    // ... more trims for the model
  ]
  ```
- **Response (404 Not Found)** - Model not found:
  ```json
  {
    "timestamp": "2025-05-01T10:00:00Z",
    "status": 404,
    "error": "Not Found",
    "message": "CarModel not found with id: 999",
    "path": "/api/reference-data/brands/1/models/999/trims"
  }
  ```

## Admin Operations

### Admin Dashboard and Management

#### Get All Listings (Admin)
- **Endpoint**: `GET /api/admin/listings`
- **Access**: Admin only
- **Description**: Retrieves all car listings, including unapproved, paused, and archived listings
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `page` (query parameter, optional): Page number for pagination (default: 0)
  - `size` (query parameter, optional): Number of items per page (default: 10)
  - `sort` (query parameter, optional): Field and direction to sort by (e.g., "createdAt,desc")
- **Response (200 OK)**:
  ```json
  {
    "content": [
      {
        "id": 1,
        "title": "2019 Toyota Camry",
        "brand": "Toyota",
        "model": "Camry",
        "modelYear": 2019,
        "price": 18500,
        "mileage": 35000,
        "approved": false,
        "isUserActive": true,
        "archived": false,
        "sold": false,
        "userId": 1,
        "createdAt": "2025-04-30T10:15:30Z"
      },
      // ... more listings
    ],
    "pageable": {
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      },
      "pageNumber": 0,
      "pageSize": 10,
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalElements": 42,
    "totalPages": 5,
    "last": false,
    "first": true,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "size": 10,
    "number": 0,
    "numberOfElements": 10,
    "empty": false
  }
  ```

#### Get Pending Approval Listings
- **Endpoint**: `GET /api/admin/listings/pending`
- **Access**: Admin only
- **Description**: Retrieves all car listings that are awaiting approval
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `page` (query parameter, optional): Page number for pagination (default: 0)
  - `size` (query parameter, optional): Number of items per page (default: 10)
- **Response (200 OK)**:
  ```json
  {
    "content": [
      {
        "id": 1,
        "title": "2019 Toyota Camry",
        "brand": "Toyota",
        "model": "Camry",
        "modelYear": 2019,
        "price": 18500,
        "mileage": 35000,
        "approved": false,
        "isUserActive": true,
        "archived": false,
        "sold": false,
        "userId": 1,
        "createdAt": "2025-04-30T10:15:30Z"
      },
      // ... more listings
    ],
    "totalElements": 15,
    "totalPages": 2,
    // ... pagination details
  }
  ```

#### Approve Listing
- **Endpoint**: `POST /api/admin/listings/{id}/approve`
- **Access**: Admin only
- **Description**: Approves a car listing, making it visible to the public
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to approve
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "title": "2019 Toyota Camry",
    "approved": true,
    // ... other listing fields
    "updatedAt": "2025-04-30T10:15:30Z"
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "Listing not found"
  }
  ```
- **Response (409 Conflict)**:
  ```json
  {
    "message": "Listing is already approved"
  }
  ```

#### Reject Listing
- **Endpoint**: `POST /api/admin/listings/{id}/reject`
- **Access**: Admin only
- **Description**: Rejects a car listing with optional feedback
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to reject
- **Request Body**:
  ```json
  {
    "reason": "Insufficient information provided about vehicle history"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "title": "2019 Toyota Camry",
    "approved": false,
    "rejectionReason": "Insufficient information provided about vehicle history",
    // ... other listing fields
    "updatedAt": "2025-04-30T10:15:30Z"
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "Listing not found"
  }
  ```

#### Delete Any Listing
- **Endpoint**: `DELETE /api/admin/listings/{id}`
- **Access**: Admin only
- **Description**: Permanently deletes any car listing
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to delete
- **Response (204 No Content)**
- **Response (404 Not Found)**:
  ```json
  {
    "message": "Listing not found"
  }
  ```

#### Archive Any Listing
- **Endpoint**: `POST /api/admin/listings/{id}/archive`
- **Access**: Admin only
- **Description**: Archives any car listing
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to archive
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "title": "2019 Toyota Camry",
    "archived": true,
    // ... other listing fields
    "updatedAt": "2025-04-30T10:15:30Z"
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "Listing not found"
  }
  ```

#### Unarchive Any Listing
- **Endpoint**: `POST /api/admin/listings/{id}/unarchive`
- **Access**: Admin only
- **Description**: Unarchives any car listing
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `id` (path parameter): ID of the car listing to unarchive
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "title": "2019 Toyota Camry",
    "archived": false,
    // ... other listing fields 
    "updatedAt": "2025-04-30T10:15:30Z"
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "Listing not found"
  }
  ```

#### Get Listing Statistics
- **Endpoint**: `GET /api/admin/stats/listings`
- **Access**: Admin only
- **Description**: Retrieves statistics about all listings in the system
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Response (200 OK)**:
  ```json
  {
    "totalListings": 356,
    "pendingApproval": 42,
    "approved": 287,
    "rejected": 27,
    "archived": 53,
    "sold": 124,
    "paused": 15,
    "listingsByBrand": {
      "Toyota": 87,
      "Ford": 65,
      "Honda": 45,
      // ... other brands
    },
    "listingsByLocation": {
      "New York, NY": 56,
      "Los Angeles, CA": 42,
      // ... other locations
    },
    "averagePrice": 22450.75,
    "averageDaysToSell": 23.5
  }
  ```

### User Management (Admin)

#### Get All Users
- **Endpoint**: `GET /api/admin/users`
- **Access**: Admin only
- **Description**: Retrieves all users registered in the system
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `page` (query parameter, optional): Page number for pagination (default: 0)
  - `size` (query parameter, optional): Number of items per page (default: 10)
- **Response (200 OK)**:
  ```json
  {
    "content": [
      {
        "id": 1,
        "username": "johndoe",
        "email": "john.doe@example.com",
        "roles": ["ROLE_USER"],
        "enabled": true,
        "createdAt": "2025-03-10T08:15:30Z",
        "listingCount": 3
      },
      // ... more users
    ],
    "totalElements": 156,
    "totalPages": 16,
    // ... pagination details
  }
  ```

#### Get User Details
- **Endpoint**: `GET /api/admin/users/{id}`
- **Access**: Admin only
- **Description**: Retrieves detailed information about a specific user
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `id` (path parameter): ID of the user to retrieve
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["ROLE_USER"],
    "enabled": true,
    "createdAt": "2025-03-10T08:15:30Z",
    "lastActive": "2025-04-29T14:23:45Z",
    "listings": [
      {
        "id": 42,
        "title": "2020 Ford Mustang",
        "approved": true,
        "isUserActive": true,
        "archived": false,
        "sold": false,
        "createdAt": "2025-04-15T10:30:22Z"
      },
      // ... more listings
    ],
    "listingCount": 3,
    "favoriteCount": 7,
    "messageCount": 15
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "User not found"
  }
  ```

#### Disable User
- **Endpoint**: `PUT /api/admin/users/{id}/disable`
- **Access**: Admin only
- **Description**: Disables a user account, preventing them from logging in
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `id` (path parameter): ID of the user to disable
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john.doe@example.com",
    "enabled": false,
    // ... other user fields
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "User not found"
  }
  ```

#### Enable User
- **Endpoint**: `PUT /api/admin/users/{id}/enable`
- **Access**: Admin only
- **Description**: Enables a previously disabled user account
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Parameters**:
  - `id` (path parameter): ID of the user to enable
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john.doe@example.com",
    "enabled": true,
    // ... other user fields
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "message": "User not found"
  }
  ```

#### Get User Statistics
- **Endpoint**: `GET /api/admin/stats/users`
- **Access**: Admin only
- **Description**: Retrieves statistics about user activity in the system
- **Authentication**: Required (JWT token with ROLE_ADMIN)
- **Response (200 OK)**:
  ```json
  {
    "totalUsers": 156,
    "activeInLastWeek": 87,
    "activeInLastMonth": 124,
    "usersWithListings": 83,
    "averageListingsPerUser": 2.3,
    "registrationsLastMonth": 24,
    "topListingCreators": [
      {"username": "cardealer1", "count": 45},
      {"username": "autoseller", "count": 32},
      // ... other users
    ],
    "usersByRole": {
      "ROLE_USER": 152,
      "ROLE_ADMIN": 4,
      "ROLE_MODERATOR": 8
    }
  }
  ```
