# Reference Data API Documentation

This document outlines the API endpoints for accessing and managing reference data in the AutoTrader marketplace application. Reference data includes standard values for car attributes such as conditions, body styles, fuel types, etc.

## Combined Reference Data Endpoint

### Get All Reference Data

Retrieve all reference data in a single request.

```
GET /api/reference-data
```

**Response:**
```json
{
  "carConditions": [
    {
      "id": 1,
      "name": "new",
      "displayNameEn": "New",
      "displayNameAr": "جديد",
      "slug": "new"
    }
  ],
  "driveTypes": [
    {
      "id": 1,
      "name": "fwd",
      "displayNameEn": "Front-Wheel Drive",
      "displayNameAr": "دفع أمامي",
      "slug": "fwd"
    }
  ],
  "bodyStyles": [
    {
      "id": 1,
      "name": "sedan",
      "displayNameEn": "Sedan",
      "displayNameAr": "سيدان",
      "slug": "sedan"
    }
  ],
  "fuelTypes": [
    {
      "id": 1,
      "name": "gasoline",
      "displayNameEn": "Gasoline",
      "displayNameAr": "بنزين",
      "slug": "gasoline"
    }
  ],
  "transmissions": [
    {
      "id": 1,
      "name": "automatic",
      "displayNameEn": "Automatic",
      "displayNameAr": "أوتوماتيك",
      "slug": "automatic"
    }
  ],
  "sellerTypes": [
    {
      "id": 1,
      "name": "PRIVATE",
      "displayNameEn": "Private",
      "displayNameAr": "خاص"
    }
  ]
}
```

## Car Conditions

### Get All Car Conditions

```
GET /api/car-conditions
```

### Get Car Condition by ID

```
GET /api/car-conditions/{id}
```

### Get Car Condition by Name

```
GET /api/car-conditions/name/{name}
```

### Search Car Conditions

```
GET /api/car-conditions/search?q={query}
```

### Create Car Condition (Admin Only)

```
POST /api/car-conditions
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Update Car Condition (Admin Only)

```
PUT /api/car-conditions/{id}
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Delete Car Condition (Admin Only)

```
DELETE /api/car-conditions/{id}
```

## Drive Types

### Get All Drive Types

```
GET /api/drive-types
```

### Get Drive Type by ID

```
GET /api/drive-types/{id}
```

### Get Drive Type by Name

```
GET /api/drive-types/name/{name}
```

### Search Drive Types

```
GET /api/drive-types/search?q={query}
```

### Create Drive Type (Admin Only)

```
POST /api/drive-types
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Update Drive Type (Admin Only)

```
PUT /api/drive-types/{id}
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Delete Drive Type (Admin Only)

```
DELETE /api/drive-types/{id}
```

## Body Styles

### Get All Body Styles

```
GET /api/body-styles
```

### Get Body Style by ID

```
GET /api/body-styles/{id}
```

### Get Body Style by Name

```
GET /api/body-styles/name/{name}
```

### Search Body Styles

```
GET /api/body-styles/search?q={query}
```

### Create Body Style (Admin Only)

```
POST /api/body-styles
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Update Body Style (Admin Only)

```
PUT /api/body-styles/{id}
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Delete Body Style (Admin Only)

```
DELETE /api/body-styles/{id}
```

## Fuel Types

### Get All Fuel Types

```
GET /api/fuel-types
```

### Get Fuel Type by ID

```
GET /api/fuel-types/{id}
```

### Get Fuel Type by Name

```
GET /api/fuel-types/name/{name}
```

### Search Fuel Types

```
GET /api/fuel-types/search?q={query}
```

### Create Fuel Type (Admin Only)

```
POST /api/fuel-types
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Update Fuel Type (Admin Only)

```
PUT /api/fuel-types/{id}
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Delete Fuel Type (Admin Only)

```
DELETE /api/fuel-types/{id}
```

## Transmissions

### Get All Transmissions

```
GET /api/transmissions
```

### Get Transmission by ID

```
GET /api/transmissions/{id}
```

### Get Transmission by Name

```
GET /api/transmissions/name/{name}
```

### Search Transmissions

```
GET /api/transmissions/search?q={query}
```

### Create Transmission (Admin Only)

```
POST /api/transmissions
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Update Transmission (Admin Only)

```
PUT /api/transmissions/{id}
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Delete Transmission (Admin Only)

```
DELETE /api/transmissions/{id}
```

## Seller Types

### Get All Seller Types

```
GET /api/seller-types
```

### Get Seller Type by ID

```
GET /api/seller-types/{id}
```

### Get Seller Type by Name

```
GET /api/seller-types/name/{name}
```

### Search Seller Types

```
GET /api/seller-types/search?q={query}
```

### Create Seller Type (Admin Only)

```
POST /api/seller-types
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Update Seller Type (Admin Only)

```
PUT /api/seller-types/{id}
```

**Request Body:**
```json
{
  "name": "string",
  "displayNameEn": "string",
  "displayNameAr": "string"
}
```

### Delete Seller Type (Admin Only)

```
DELETE /api/seller-types/{id}
```

## Authentication

All admin endpoints require authentication with a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

To access admin endpoints, the authenticated user must have the ADMIN role.
