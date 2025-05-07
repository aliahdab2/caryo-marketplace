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
- **Description**: Creates a new car listing with an initial image attachment. This image will be added to the `listing_media` table and typically set as the primary image. Additional images/videos can be uploaded via the `/api/files/upload` endpoint after the listing is created. The `locationId` in the `listing` JSON part must correspond to an existing `Location` entity.
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
    "media": [
      {
        "id": 101, // listing_media.id
        "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/image.jpg",
        "fileKey": "listings/1/image.jpg",
        "fileName": "image.jpg",
        "contentType": "image/jpeg",
        "size": 512000,
        "sortOrder": 0,
        "isPrimary": true,
        "mediaType": "image"
      }
    ],
    "approved": false,
    "isSold": false,
    "isArchived": false,
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
- **Description**: Retrieves a paginated list of all *approved*, *not sold*, and *not archived* car listings.
- **Authentication**: None required.
- **Query Parameters**:
  - `page` (Integer, optional, default: 0): Page number for pagination.
  - `size` (Integer, optional, default: 20): Number of items per page.
  - `sort` (String, optional, e.g., `price,asc` or `createdAt,desc`): Sorting criteria.
- **Response (200 OK)**: Paginated list of `CarListingResponse` objects. The `media` array will contain all associated media items for each listing. Example structure:
  ```json
  {
    "content": [
      {
        "id": 1,
        "title": "2021 Toyota Camry",
        "brand": "Toyota",
        "model": "Camry",
        "modelYear": 2021,
        "price": 22000,
        "mileage": 40000,
        "description": "Well-maintained sedan.",
        "media": [
          {
            "id": 101,
            "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/main.jpg",
            "fileKey": "listings/1/main.jpg",
            "fileName": "main.jpg",
            "contentType": "image/jpeg",
            "size": 450000,
            "sortOrder": 0,
            "isPrimary": true,
            "mediaType": "image"
          },
          {
            "id": 102,
            "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/interior.jpg",
            "fileKey": "listings/1/interior.jpg",
            "fileName": "interior.jpg",
            "contentType": "image/jpeg",
            "size": 300000,
            "sortOrder": 1,
            "isPrimary": false,
            "mediaType": "image"
          }
        ],
        "approved": true,
        "isSold": false,
        "isArchived": false,
        "sellerUsername": "testuser",
        "locationDetails": {
          "id": 123,
          "displayNameEn": "Test City Lifecycle",
          "displayNameAr": "مدينة اختبار دورة الحياة",
          "slug": "test-city-lifecycle",
          "countryCode": "TC",
          "region": "Test Region",
          "latitude": 12.3456,
          "longitude": -78.9101
        },
        "transmission": "AUTOMATIC",
        "createdAt": "2025-05-01T10:00:00Z",
        "updatedAt": "2025-05-01T10:00:00Z"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 20, /* ... */ },
    "totalPages": 1,
    "totalElements": 1,
    "last": true,
    "first": true,
    "numberOfElements": 1,
    "size": 20,
    "number": 0,
    "empty": false
  }
  ```

#### Filter Car Listings

- **Endpoint**: `GET /api/listings/filter`
- **Access**: Public
- **Description**: Retrieves a paginated list of car listings based on various filter criteria.
- **Authentication**: None required.
- **Query Parameters** (all optional):
  - `brand` (String)
  - `model` (String)
  - `minModelYear` (Integer)
  - `maxModelYear` (Integer)
  - `minPrice` (Double)
  - `maxPrice` (Double)
  - `minMileage` (Integer)
  - `maxMileage` (Integer)
  - `transmission` (String, e.g., `AUTOMATIC`, `MANUAL`)
  - `locationId` (Long)
  - `isSold` (Boolean, default: `false` if not provided, meaning only not-sold listings are returned unless `true` is specified)
  - `isArchived` (Boolean, default: `false` if not provided, meaning only not-archived listings are returned unless `true` is specified)
  - `page` (Integer, default: 0)
  - `size` (Integer, default: 20)
  - `sort` (String, e.g., `price,asc` or `createdAt,desc`)
- **Response (200 OK)**: Paginated list of `CarListingResponse` objects matching the filter criteria.
  ```json
  {
    "content": [
      {
        "id": 1,
        "title": "2021 Toyota Camry",
        "brand": "Toyota",
        "model": "Camry",
        "modelYear": 2021,
        "price": 22000,
        "mileage": 40000,
        "description": "Well-maintained sedan.",
        "media": [
          {
            "id": 101,
            "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/main.jpg",
            "fileKey": "listings/1/main.jpg",
            "fileName": "main.jpg",
            "contentType": "image/jpeg",
            "size": 450000,
            "sortOrder": 0,
            "isPrimary": true,
            "mediaType": "image"
          },
          {
            "id": 102,
            "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/interior.jpg",
            "fileKey": "listings/1/interior.jpg",
            "fileName": "interior.jpg",
            "contentType": "image/jpeg",
            "size": 300000,
            "sortOrder": 1,
            "isPrimary": false,
            "mediaType": "image"
          }
        ],
        "approved": true,
        "isSold": false,
        "isArchived": false,
        "sellerUsername": "testuser",
        "locationDetails": {
          "id": 123,
          "displayNameEn": "Test City Lifecycle",
          "displayNameAr": "مدينة اختبار دورة الحياة",
          "slug": "test-city-lifecycle",
          "countryCode": "TC",
          "region": "Test Region",
          "latitude": 12.3456,
          "longitude": -78.9101
        },
        "transmission": "AUTOMATIC",
        "createdAt": "2025-05-01T10:00:00Z",
        "updatedAt": "2025-05-01T10:00:00Z"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 20, /* ... */ },
    "totalPages": 1,
    "totalElements": 1,
    "last": true,
    "first": true,
    "numberOfElements": 1,
    "size": 20,
    "number": 0,
    "empty": false
  }
  ```

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
    "brand": "Toyota",
    "model": "Camry",
    "modelYear": 2023,
    "price": 28500,
    "mileage": 15000,
    "description": "Excellent condition, one owner, no accidents",
    "media": [
      {
        "id": 101,
        "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/main_camry.jpg",
        "fileKey": "listings/1/main_camry.jpg",
        "fileName": "main_camry.jpg",
        "contentType": "image/jpeg",
        "size": 550000,
        "sortOrder": 0,
        "isPrimary": true,
        "mediaType": "image"
      }
      // ... other media items if present ...
    ],
    "approved": true,
    "isSold": false,
    "isArchived": false,
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
    "transmission": "AUTOMATIC",
    "isSold": false,
    "isArchived": false
  }
  ```
- **Response (200 OK)**: The updated `CarListingResponse`.
- **Response (200 OK)**: The updated `CarListingResponse`, including any changes to the `media` array. For managing media items themselves (adding, removing, reordering, setting primary), see the "File Management APIs" and the "Managing Listing Media (Suggested)" sections.
- **Response (403 Forbidden)**: If the authenticated user is not the owner.
- **Response (404 Not Found)**: If the listing does not exist.

#### Mark Listing as Sold

- **Endpoint**: `POST /api/listings/{id}/mark-sold`
- **Access**: Authenticated owner of the listing.
- **Description**: Marks the specified car listing as sold. Cannot be performed on an archived listing. This action is idempotent if the listing is already sold (and not archived).
- **Authentication**: Required (JWT token).
- **Path Parameters**:
  - `id` (Long): The ID of the car listing.
- **Response (200 OK)**: The updated `CarListingResponse` with `isSold: true`.
  ```json
  {
    "id": 1,
    "title": "2023 Toyota Camry",
    // ... other fields ...
    "isSold": true,
    "isArchived": false,
    "sellerUsername": "yourUsername",
    // ...
  }
  ```
- **Response (403 Forbidden)**: If the authenticated user is not the owner.
- **Response (404 Not Found)**: If the listing does not exist.
- **Response (409 Conflict)**: If the listing is archived.

#### Archive Listing

- **Endpoint**: `POST /api/listings/{id}/archive`
- **Access**: Authenticated owner of the listing.
- **Description**: Archives the specified car listing. This action is idempotent if the listing is already archived.
- **Authentication**: Required (JWT token).
- **Path Parameters**:
  - `id` (Long): The ID of the car listing.
- **Response (200 OK)**: The updated `CarListingResponse` with `isArchived: true`.
  ```json
  {
    "id": 1,
    "title": "2023 Toyota Camry",
    // ... other fields ...
    "isSold": false, // Or true, depending on its state before archiving
    "isArchived": true,
    "sellerUsername": "yourUsername",
    // ...
  }
  ```
- **Response (403 Forbidden)**: If the authenticated user is not the owner.
- **Response (404 Not Found)**: If the listing does not exist.

#### Unarchive Listing

- **Endpoint**: `POST /api/listings/{id}/unarchive`
- **Access**: Authenticated owner of the listing.
- **Description**: Unarchives the specified car listing.
- **Authentication**: Required (JWT token).
- **Path Parameters**:
  - `id` (Long): The ID of the car listing.
- **Response (200 OK)**: The updated `CarListingResponse` with `isArchived: false`.
  ```json
  {
    "id": 1,
    "title": "2023 Toyota Camry",
    // ... other fields ...
    "isSold": false, // Or true, depending on its state before unarchiving
    "isArchived": false,
    "sellerUsername": "yourUsername",
    // ...
  }
  ```
- **Response (403 Forbidden)**: If the authenticated user is not the owner.
- **Response (404 Not Found)**: If the listing does not exist.
- **Response (409 Conflict)**: If the listing is not currently archived.

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
      "approved": false,
      "userId": 1,
      "createdAt": "2025-04-30T10:15:30Z",
      "updatedAt": null
    }
  ]
  ```
- **Response (200 OK)**: A list of `CarListingResponse` objects, each including a `media` array.
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
      "description": "Excellent condition, one owner, no accidents",
      "media": [
        {
          "id": 201,
          "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/my_camry.jpg",
          "fileKey": "listings/1/my_camry.jpg",
          "fileName": "my_camry.jpg",
          "contentType": "image/jpeg",
          "size": 600000,
          "sortOrder": 0,
          "isPrimary": true,
          "mediaType": "image"
        }
      ],
      "approved": false,
      "sellerUsername": "currentUser", // Assuming this field is available
      "locationDetails": { /* ... location details ... */ },
      "transmission": "AUTOMATIC",
      "createdAt": "2025-04-30T10:15:30Z",
      "updatedAt": null
    }
    // ... other listings by the user ...
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
- **Description**: Uploads a file to the storage service (e.g., S3). If `listingId` is provided, this endpoint will also create a corresponding entry in the `listing_media` table, associating the uploaded file with the specified car listing. The `key` returned in the response is the `file_key` that will be stored in `listing_media`.
- **Authentication**: Required (JWT token)
- **Request Parameters**:
  - `file`: The file to upload (multipart/form-data)
  - `listingId` (Long, optional): The ID of the car listing to associate this file with. If provided, a `listing_media` record will be created.
  
- **Validation Rules**:
  - File must not be empty
  - File type must be allowed (e.g., image/jpeg, image/png, image/gif, image/webp, video/mp4, etc. - consult `media_type` in `listing_media` and application config for supported types)
  - File size must not exceed the configured maximum limit
  
- **Example curl request** (associating with a listing):
  ```bash
  curl -X POST http://localhost:8080/api/files/upload \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -F "file=@/path/to/your/image.jpg" \
    -F "listingId=123"
  ```
  
- **Response (200 OK)**:
  ```json
  {
    "url": "https://your-s3-bucket.s3.amazonaws.com/listings/123/generated-file-key.jpg",
    "key": "listings/123/generated-file-key.jpg", // This key is used in listing_media.file_key
    "fileName": "image.jpg", // Original file name
    "contentType": "image/jpeg",
    "size": 512000
    // Optionally, if listingId was provided, the created listing_media record ID could be returned:
    // "listingMediaId": 456 
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
- **Access**: Authenticated users (Permissions might depend on whether the file is associated with a listing and who owns the listing, or if it requires ADMIN role).
- **Description**: Deletes a file from storage using its `key`. If this `key` corresponds to a `file_key` in a `listing_media` record, the associated `listing_media` record should also be deleted to maintain data integrity.
- **Authentication**: Required (JWT token)
- **Path Parameters**:
  - `key`: The unique key of the file (e.g., `listings/123/generated-file-key.jpg`). Note: URL encoding for the key might be necessary if it contains special characters like '/'.\n  \n- **Response (200 OK or 204 No Content)**:\n  ```json\n  {\n    \"message\": \"File and associated listing media record deleted successfully\"\n  }\n  ```\n  or (if file not found or deletion failed)\n  ```json\n  {\n    \"message\": \"File not found or could not be deleted\"\n  }\n  ```\n\n### Managing Listing Media\n\nWith the introduction of the `listing_media` table to support multiple images and videos per listing, specific operations for managing these media items are crucial. The `CarListingResponse` (returned by `GET /api/listings`, `GET /api/listings/{id}`, `POST /api/listings/with-image`, etc.) now includes a `media` array, which lists all associated media for a listing.\n\nKey operations for managing media include:\n\n- **Uploading Initial Image**: Use `POST /api/listings/with-image` when creating a listing.\n- **Uploading Additional Media**: Use `POST /api/files/upload` with the `listingId` parameter to upload more images or videos to an existing listing. This will create a new `listing_media` record and associate it with the listing.\n- **Listing Media for a Listing**:\n  - The `media` array in `CarListingResponse` (e.g., from `GET /api/listings/{listingId}`) provides the list of all media items, including their URLs, file keys, types, and primary status.\n\n- **Deleting a Media Item from a Listing**:\n  - To delete a specific media item (e.g., an image or video) associated with a listing:\n    1. Identify the `fileKey` of the media item you want to delete from the `media` array in the listing's details.\n    2. Use the `DELETE /api/files/{key}` endpoint, providing the URL-encoded `fileKey`. This will delete the file from storage and the corresponding `listing_media` record.\n    - **Example**: `DELETE /api/files/listings%2F123%2Fimage-to-delete.jpg` (assuming `listings/123/image-to-delete.jpg` is the `fileKey`).\n\n- **Set Primary Media Item**:\n  - **Endpoint**: `PUT /api/listings/{listingId}/media/set-primary`\n  - **Access**: Authenticated owner of the listing or Admin.\n  - **Description**: Sets a specific media item (identified by its `listing_media.id` or `file_key`) as the primary one for the listing (i.e., sets `is_primary = true` for this item and `false` for others).\n  - **Path Parameters**:\n    - `listingId` (Long): The ID of the car listing.\n  - **Request Body**:\n    ```json\n    {\n      \"mediaFileKey\": \"listings/123/new-primary-image.jpg\" \n      // or \"listingMediaId\": 457 (if identifying by listing_media.id)\n    }\n    ```\n  - **Response (200 OK)**: The updated `CarListingResponse` or a success message.\n\n- **Reorder Media Items**:\n  - **Endpoint**: `PUT /api/listings/{listingId}/media/order`\n  - **Access**: Authenticated owner of the listing or Admin.\n  - **Description**: Updates the `sort_order` for multiple media items of a listing.\n  - **Path Parameters**:\n    - `listingId` (Long): The ID of the car listing.\n  - **Request Body**: An array of objects, each specifying a media item (by `mediaFileKey` or `listingMediaId`) and its new `sortOrder`.\n    ```json\n    [\n      { \"mediaFileKey\": \"listings/123/image1.jpg\", \"sortOrder\": 0 }, \n      { \"mediaFileKey\": \"listings/123/video1.mp4\", \"sortOrder\": 1 }, \n      { \"mediaFileKey\": \"listings/123/image2.jpg\", \"sortOrder\": 2 } \n      // Alternatively, using listingMediaId:\n      // { \"listingMediaId\": 457, \"sortOrder\": 0 },\n      // { \"listingMediaId\": 458, \"sortOrder\": 1 },\n      // { \"listingMediaId\": 459, \"sortOrder\": 2 }\n    ]\n    ```\n  - **Response (200 OK)**: The updated `CarListingResponse` or a success message.\n\nThese operations provide comprehensive management of listing media. The `set-primary` and `order` endpoints are suggestions based on common needs; ensure to verify their exact implementation or alternative mechanisms if they exist.\n\n### Direct Image Operations\n\n**Note**: This section describes a simpler, local file system-based image upload. For managing images and videos associated with car listings (which are likely stored in a cloud service like S3 and tracked via the `listing_media` table), please refer to the "File Management APIs" and "Managing Listing Media (Suggested)" sections above. The endpoints below might be for other purposes (e.g., temporary uploads, user profile pictures not on S3) or could be deprecated for listing media.\n
