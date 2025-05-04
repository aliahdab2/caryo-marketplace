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
- **Description**: Creates a new car listing without an image
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
    "location": "New York, NY",
    "description": "Excellent condition, one owner, no accidents"
  }
  ```

#### Create Car Listing with Image

- **Endpoint**: `POST /api/listings/with-image`
- **Content-Type**: `multipart/form-data`
- **Access**: Authenticated users
- **Description**: Creates a new car listing with an image attachment
- **Authentication**: Required (JWT token)
- **Request Parts**:
  - `listing`: JSON object containing listing details (as shown in the JSON-only endpoint)
  - `image`: File upload (JPEG, PNG, GIF, or WebP format, max size 5MB)
  
- **Example curl request**:
  ```bash
  curl -X POST http://localhost:8080/api/listings/with-image \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -F "listing={\"title\":\"2023 Toyota Camry\",\"brand\":\"Toyota\",\"model\":\"Camry\",\"modelYear\":2023,\"price\":28500,\"mileage\":15000,\"location\":\"New York, NY\",\"description\":\"Excellent condition\"}" \
    -F "image=@/path/to/your/image.jpg"
  ```
- **Validation Rules**:
  - `title`: Required
  - `brand`: Required
  - `model`: Required
  - `modelYear`: Required, must be between 1920 and current year, must be a 4-digit number
  - `price`: Required, must be positive
  - `mileage`: Required, must be zero or positive
  - `location`: Required
  - `image` (when using `/with-image` endpoint):
     - File must not be empty
     - File must be a valid image format (JPEG, PNG, GIF, or WebP)
     - File size must not exceed 5MB (configurable)
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "title": "2023 Toyota Camry",
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
  -d '{"title":"2023 Toyota Camry","brand":"Toyota","model":"Camry","modelYear":2023,"price":28500,"mileage":15000,"location":"New York, NY","description":"Excellent condition, one owner, no accidents"}'
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
  "location": "New York, NY",
  "description": "Excellent condition, one owner, no accidents"
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

- `GET /api/listings` - Get all approved car listings (public)
- `GET /api/listings/{id}` - Get details of a specific car listing (public)
- `PUT /api/listings/{id}` - Update a listing (authenticated owner only)
- `DELETE /api/listings/{id}` - Delete a listing (authenticated owner only)
- `POST /api/admin/listings/{id}/approve` - Approve a listing (admin only)

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
