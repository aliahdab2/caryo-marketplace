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

#### Car Conditions
- **Endpoint**: `GET /api/car-conditions`
- **Access**: Public
- **Description**: Returns all car condition options
- **Response**: List of car conditions

#### Drive Types
- **Endpoint**: `GET /api/drive-types`
- **Access**: Public
- **Description**: Returns all drive type options
- **Response**: List of drive types

#### Body Styles
- **Endpoint**: `GET /api/body-styles`
- **Access**: Public
- **Description**: Returns all body style options
- **Response**: List of body styles

#### Transmissions
- **Endpoint**: `GET /api/transmissions`
- **Access**: Public
- **Description**: Returns all transmission options
- **Response**: List of transmissions

#### Commonly Used Values

- **Car Brands**: Toyota, Ford, Honda, BMW, Tesla
- **Car Models**: Camry, Mustang, Civic, 3 Series, Model S
- **Locations**: New York, NY; Los Angeles, CA; Chicago, IL; Houston, TX; Phoenix, AZ

### Car Brand and Model Data

#### Get All Car Brands

- **Endpoint**: `GET /api/reference-data/brands`
- **Access**: Public
- **Description**: Retrieves a list of all active car brands.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Toyota",
      "active": true
    },
    {
      "id": 2,
      "name": "Ford",
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
      "name": "Camry",
      "active": true,
      "brandId": 1 
    },
    {
      "id": 102,
      "name": "Corolla",
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
