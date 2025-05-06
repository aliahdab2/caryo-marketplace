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
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","email":"testuser1@example.com","password":"password123"}'

# 2. Login to get a JWT token
curl -X POST http://localhost:8080/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123"}'

# 3. Save the token from the response
# Example: TOKEN="eyJhbGciOiJIUzI1NiJ9..."

# 4. Use the token to access protected endpoints
curl -X GET http://localhost:8080/api/listings/my-listings \
  -H "Authorization: Bearer $TOKEN"
```

### Running Postman Tests

#### Automated Testing Script
```bash
# Run all API tests automatically
./src/test/scripts/run_postman_tests.sh
```
This script will start the application, run all tests, and shut down when complete.
The HTML report will be available at `build/test-reports/postman/report.html`.

#### Manual Testing with Postman
1. Start the application with `./gradlew bootRun`
2. Import the collection and environment into Postman:
   - Collection: `src/test/resources/postman/autotrader-api-tests.json`
   - Environment: `src/test/resources/postman/environment.json`
3. Run the collection in Postman

## Development Users & Tokens

For easier development and testing, the application automatically creates two users when it starts up in the `dev` profile:

1.  **Regular User**
    *   Username: `user`
    *   Password: `Password123!`
    *   Role: `ROLE_USER`

2.  **Admin User**
    *   Username: `admin`
    *   Password: `Admin123!`
    *   Roles: `ROLE_USER`, `ROLE_ADMIN`

**JWT tokens** for both of these users are generated and printed directly to the application logs upon startup. You can find them by looking for the following output:

```log
====== DEVELOPMENT AUTHENTICATION TOKENS ======
These tokens can be used for testing without login:

REGULAR USER TOKEN (user)
--------------------------------------------
eyJhbGciOiJIUzI1NiJ9... (example token)

ADMIN USER TOKEN (admin)
--------------------------------------------
eyJhbGciOiJIUzI1NiJ9... (example token)

To use: Add the following header to your HTTP requests:
Authorization: Bearer <token>
==============================================
```

Copy the desired token string (starting with `eyJ...`) and use it in the `Authorization: Bearer <token>` header for your API requests.

You can view the application logs using `./dev-env.sh logs` or by checking the `logs/application.log` file.

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

- **Endpoint**: `POST /auth/signup`
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

- **Endpoint**: `POST /auth/signin`
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

#### Create Car Listing (JSON only)

- **Endpoint**: `POST /api/listings`
- **Content-Type**: `application/json`
- **Access**: Authenticated users
- **Description**: Creates a new car listing without an image. The `locationId` must correspond to an existing `Location` entity.
- **Authentication**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "title": "2023 Toyota Camry",
    "brand": "Toyota",
    "model": "Camry",
    "modelYear": 2023,
    "price": 28500,
    "mileage": 15000,
    "locationId": 123, // ID of an existing Location entity
    "description": "Excellent condition, one owner, no accidents",
    "transmission": "AUTOMATIC" // Example: include other relevant fields
  }
  ```

#### Create Car Listing with Image

- **Endpoint**: `POST /api/listings/with-image`
- **Content-Type**: `multipart/form-data`
- **Access**: Authenticated users
- **Description**: Creates a new car listing with an image attachment. The `locationId` in the `listing` JSON part must correspond to an existing `Location` entity.
- **Authentication**: Required (JWT token)
- **Request Parts**:
  - `listing`: JSON object containing listing details (similar to the JSON-only endpoint, including `locationId`).
  - `image`: File upload (JPEG, PNG, GIF, or WebP format, max size 5MB).
  
- **Example curl request**:
  ```bash
  curl -X POST http://localhost:8080/api/listings/with-image \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -F "listing={\"title\":\"2023 Toyota Camry\",\"brand\":\"Toyota\",\"model\":\"Camry\",\"modelYear\":2023,\"price\":28500,\"mileage\":15000,\"locationId\":123,\"description\":\"Excellent condition\", \"transmission\":\"AUTOMATIC\"}" \
    -F "image=@/path/to/your/image.jpg"
  ```
- **Validation Rules**:
  - `title`: Required
  - `brand`: Required
  - `model`: Required
  - `modelYear`: Required, must be between 1920 and current year, must be a 4-digit number
  - `price`: Required, must be positive
  - `mileage`: Required, must be zero or positive
  - `locationId`: Required, must be a valid ID of an existing `Location`.
  - `image` (when using `/with-image` endpoint):
     - File must not be empty
     - File must be a valid image format (JPEG, PNG, GIF, or WebP)
     - File size must not exceed 5MB (configurable)
- **Response (201 Created)** (Example, `locationDetails` will be populated based on `locationId`):
  ```json
  {
    "id": 1,
    "title": "2023 Toyota Camry",
    "brand": "Toyota",
    "model": "Camry",
    "modelYear": 2023,
    "price": 28500,
    "mileage": 15000,
    "description": "Excellent condition, one owner, no accidents",
    "imageUrl": "https://example.com/camry.jpg", // if image was uploaded
    "approved": false,
    "sellerUsername": "yourUsername",
    "locationDetails": {
        "id": 123,
        "displayNameEn": "Example City",
        "displayNameAr": "مدينة مثال",
        "slug": "example-city",
        "countryCode": "EC",
        "region": "Example Region",
        "latitude": 34.0522,
        "longitude": -118.2437
    },
    "transmission": "AUTOMATIC",
    "createdAt": "2025-05-06T10:15:30Z",
    "updatedAt": "2025-05-06T10:15:30Z"
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

#### Get All Approved Listings

- **Endpoint**: `GET /api/listings`
- **Access**: Public
- **Description**: Retrieves a paginated list of all *approved* car listings.
- **Authentication**: None required.
- **Query Parameters**:
  - `page` (Integer, optional, default: 0): Page number for pagination.
  - `size` (Integer, optional, default: 20): Number of items per page.
  - `sort` (String, optional, e.g., `price,asc` or `createdAt,desc`): Sorting criteria.
- **Response (200 OK)**: Paginated list of `CarListingResponse` objects. Example structure:
  ```json
  {
    "content": [
      {
        "id": 1,
        "title": "2021 Toyota Camry",
        // ... other fields as in CarListingResponse ...
        "locationDetails": {
          "id": 123,
          "displayNameEn": "Test City Lifecycle",
          "displayNameAr": "مدينة اختبار دورة الحياة",
          "slug": "test-city-lifecycle",
          // ... other location fields ...
        }
      }
    ],
    "pageable": { /* ... pagination details ... */ },
    "totalPages": 1,
    "totalElements": 1,
    // ... other pagination fields ...
  }
  ```

#### Filter Car Listings

- **Endpoint**: `GET /api/listings/filter`
- **Access**: Public
- **Description**: Retrieves a paginated list of approved car listings based on specified filter criteria.
- **Authentication**: None required.
- **Query Parameters**:
  - `brand` (String, optional): Filter by car brand (case-insensitive, partial match).
  - `model` (String, optional): Filter by car model (case-insensitive, partial match).
  - `minYear` (Integer, optional): Minimum manufacturing year (e.g., 2015).
  - `maxYear` (Integer, optional): Maximum manufacturing year (e.g., 2023).
  - `minPrice` (BigDecimal, optional): Minimum price (e.g., 10000.00).
  - `maxPrice` (BigDecimal, optional): Maximum price (e.g., 50000.00).
  - `minMileage` (Integer, optional): Minimum mileage (e.g., 10000).
  - `maxMileage` (Integer, optional): Maximum mileage (e.g., 150000).
  - `locationId` (Long, optional): **Location ID**. Filters listings by an exact match to a `Location` entity's ID (e.g., `1`, `123`).
  - `location` (String, optional): **Location Slug**. Filters listings by an exact match to a `Location` entity's slug (e.g., `damascus`, `new-york-city`, `test-city-lifecycle`).
  - `page` (Integer, optional, default: 0): Page number for pagination.
  - `size` (Integer, optional, default: 20): Number of items per page.
  - `sort` (String, optional, e.g., `price,asc` or `createdAt,desc`): Sorting criteria.
- **Response (200 OK)**: Paginated list of `CarListingResponse` objects (same structure as `GET /api/listings`).
- **Important Note on Location Filtering**:
    - You can filter by EITHER `locationId` (the ID of a `Location` entity) OR `location` (the slug of a `Location` entity).
    - If both `locationId` and `location` (slug) are provided in the same request, `locationId` will take precedence, and the `location` (slug) parameter will be ignored.
    - If a `locationId` or `location` slug is provided and it does not match any existing `Location` entity, the filter will result in an empty list for that specific criteria (other filters might still apply if combined, but no listings will match the non-existent location).
    - The previous behavior where `location` might have been a general text search against location names has been **removed**.
    - For creating or updating listings, continue to use `locationId` in the request body, referring to the ID of a `Location` entity.

#### Get Car Listing by ID

- **Endpoint**: `GET /api/listings/{id}`
- **Access**: Public (for approved listings)
- **Description**: Retrieves details of a specific car listing. Only approved listings are publicly accessible. If the listing is not approved, it will return 404 unless the requester is the owner or an admin (future enhancement - currently returns 404 for unapproved regardless of user).
- **Authentication**: None required for approved listings.
- **Path Parameters**:
  - `id` (Long): The ID of the car listing.
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "title": "2023 Toyota Camry",
    // ... all fields from CarListingResponse, including locationDetails
  }
  ```
- **Response (404 Not Found)**: If the listing does not exist or is not approved.

#### Update Car Listing

- **Endpoint**: `PUT /api/listings/{id}`
- **Access**: Authenticated owner of the listing.
- **Description**: Updates an existing car listing. Only the owner can update their listing. Fields not provided in the request body will retain their current values. To remove/clear a location, `locationId` should be explicitly handled (e.g., by sending `null` if supported, or a specific endpoint/flag - current behavior is it keeps existing if `locationId` is not sent).
- **Authentication**: Required (JWT token).
- **Path Parameters**:
  - `id` (Long): The ID of the car listing to update.
- **Request Body** (Fields are optional; only provided fields will be updated):
  ```json
  {
    "title": "Updated 2023 Toyota Camry SE",
    "brand": "Toyota", // Cannot change brand typically, depends on business rules
    "model": "Camry SE", // Cannot change model typically
    "modelYear": 2023,
    "price": 28000,
    "mileage": 16500,
    "locationId": 124, // ID of a new or existing Location entity
    "description": "Updated description: Excellent condition, one owner, no accidents, SE trim.",
    "transmission": "AUTOMATIC"
  }
  ```
- **Response (200 OK)**: The updated `CarListingResponse`.
- **Response (403 Forbidden)**: If the authenticated user is not the owner.
- **Response (404 Not Found)**: If the listing does not exist.

#### Delete Car Listing

- **Endpoint**: `DELETE /api/listings/{id}`
- **Access**: Authenticated owner of the listing or Admin.
- **Description**: Deletes a car listing. Only the owner or an admin can delete a listing.
- **Authentication**: Required (JWT token).
- **Path Parameters**:
  - `id` (Long): The ID of the car listing to delete.
- **Response (204 No Content)**: Successfully deleted.
- **Response (403 Forbidden)**: If the authenticated user is not the owner (and not an admin).
- **Response (404 Not Found)**: If the listing does not exist.

#### Approve Car Listing (Admin)

- **Endpoint**: `POST /api/admin/listings/{id}/approve`
- **Access**: Authenticated Admin users.
- **Description**: Approves a pending car listing, making it publicly visible.
- **Authentication**: Required (JWT token with Admin role).
- **Path Parameters**:
  - `id` (Long): The ID of the car listing to approve.
- **Response (200 OK)**: The approved `CarListingResponse`.
- **Response (403 Forbidden)**: If the authenticated user is not an admin.
- **Response (404 Not Found)**: If the listing does not exist.
- **Response (409 Conflict)**: If the listing is already approved.

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
      "updatedAt": null
    }
  ]
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
  "timestamp": "2025-04-30T12:34:56Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Error message details",
  "path": "/api/endpoint"
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

# Then create a listing without image
curl -X POST http://localhost:8080/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"2023 Toyota Camry","brand":"Toyota","model":"Camry","modelYear":2023,"price":28500,"mileage":15000,"locationId":1,"description":"Excellent condition, one owner, no accidents","transmission":"AUTOMATIC"}' # Replaced location with locationId
```

#### Create a Car Listing with Image (after login)
```bash
# Using the token from previous step
# Create a temporary JSON file for the listing data
cat > listing.json << EOF
{
  "title": "2023 Toyota Camry",
  "brand": "Toyota",
  "model": "Camry",
  "modelYear": 2023,
  "price": 28500,
  "mileage": 15000,
  "locationId": 1, 
  "description": "Excellent condition, one owner, no accidents",
  "transmission": "AUTOMATIC"
}
EOF

# Upload the listing with image
curl -X POST http://localhost:8080/api/listings/with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "listing=@listing.json;type=application/json" \
  -F "image=@/path/to/your/image.jpg"

# Clean up the temporary file
rm listing.json
```

#### Get Your Listings
```bash
# Using the token from previous step
curl -X GET http://localhost:8080/api/listings/my-listings \
  -H "Authorization: Bearer $TOKEN"
```

#### Upload a File to Storage
```bash
# Using the token from previous step
curl -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/document.pdf" \
  -F "listingId=123"
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

## Future Endpoints (Coming Soon)

- `GET /api/users/me/profile` - Get current user's profile
- `PUT /api/users/me/profile` - Update current user's profile
- `GET /api/locations` - Get all available locations (with filtering/search for UI dropdowns)
- `GET /api/locations/{idOrSlug}` - Get details for a specific location.

## File Management APIs

### File Operations

#### Upload File

- **Endpoint**: `POST /api/files/upload`
- **Content-Type**: `multipart/form-data`
- **Access**: Authenticated users with USER role
- **Description**: Uploads a file to the storage service (S3 or local storage)
- **Authentication**: Required (JWT token)
- **Request Parameters**:
  - `file`: The file to upload (multipart/form-data)
  - `listingId` (optional): The ID of the car listing associated with this file
  
- **Validation Rules**:
  - File must not be empty
  - File type must be allowed (image/jpeg, image/png, image/gif, image/webp, application/pdf, etc.)
  - File size must not exceed the configured maximum limit
  
- **Example curl request**:
  ```bash
  curl -X POST http://localhost:8080/api/files/upload \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -F "file=@/path/to/your/image.jpg" \
    -F "listingId=123"
  ```
  
- **Response (200 OK)**:
  ```json
  {
    "url": "https://your-s3-bucket.s3.amazonaws.com/listings/123/abc123.jpg",
    "key": "listings/123/abc123.jpg"
  }
  ```
  
- **Response (400 Bad Request)** - Invalid file:
  ```json
  {
    "message": "Failed to store empty file",
    "status": "BAD_REQUEST"
  }
  ```
  or
  ```json
  {
    "message": "Unsupported file type: application/octet-stream",
    "status": "BAD_REQUEST"
  }
  ```

#### Download File

- **Endpoint**: `GET /api/files/{key}`
- **Access**: Public
- **Description**: Downloads a file by its key
- **Parameters**:
  - `key`: The unique key of the file (path within storage)
  
- **Response**: The file content with appropriate Content-Type header

#### Get Signed URL

- **Endpoint**: `GET /api/files/signed`
- **Access**: Authenticated users with USER role
- **Description**: Generates a time-limited signed URL for a file (useful for private files)
- **Authentication**: Required (JWT token)
- **Request Parameters**:
  - `key`: The unique key of the file
  - `expiration` (optional): The expiration time in seconds (default: 3600)
  
- **Response (200 OK)**:
  ```json
  {
    "url": "https://your-s3-bucket.s3.amazonaws.com/path/file.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
  }
  ```

#### Delete File

- **Endpoint**: `DELETE /api/files/{key}`
- **Access**: Authenticated users with ADMIN role
- **Description**: Deletes a file from storage
- **Authentication**: Required (JWT token)
- **Parameters**:
  - `key`: The unique key of the file
  
- **Response (200 OK)**:
  ```json
  {
    "message": "File deleted successfully"
  }
  ```
  or
  ```json
  {
    "message": "File not found or could not be deleted"
  }
  ```

### Direct Image Operations

#### Upload Image (Simple)

- **Endpoint**: `POST /api/images/upload`
- **Content-Type**: `multipart/form-data`
- **Access**: Public
- **Description**: Uploads an image to the local file system (simpler than the S3 version)
- **Request Parameters**:
  - `file`: The image file to upload (multipart/form-data)
  
- **Example curl request**:
  ```bash
  curl -X POST http://localhost:8080/api/images/upload \
    -F "file=@/path/to/your/image.jpg"
  ```
  
- **Response (200 OK)**:
  ```json
  {
    "fileName": "20250502123045-abc123-def456.jpg",
    "fileDownloadUri": "http://localhost:8080/api/images/20250502123045-abc123-def456.jpg"
  }
  ```

#### View Image

- **Endpoint**: `GET /api/images/{fileName}`
- **Access**: Public
- **Description**: Retrieves an image by its file name
- **Parameters**:
  - `fileName`: The name of the image file
  
- **Response**: The image content with appropriate Content-Type header
