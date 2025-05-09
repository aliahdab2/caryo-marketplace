# AutoTrader Marketplace API Documentation

This documentation is automatically generated from the Postman collections.

Last updated: Fri May  9 10:20:16 CEST 2025

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Reference Data](#reference-data)
4. [Listings](#listings)
5. [User Management](#user-management)

## Overview

The AutoTrader Marketplace API provides endpoints for managing car listings, user accounts, and reference data.

## Authentication

Authentication is handled using JWT tokens. To authenticate:

1. Register a new user via POST /auth/signup
2. Login via POST /auth/signin to obtain a token
3. Include the token in subsequent requests in the Authorization header: `Bearer <token>`


## AutoTrader Authentication Tests

No description provided

### Register User

#### Register User

**Method:** `POST`

**URL:** `{{baseUrl}}/auth/signup`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "username": "{{test_username}}",
    "email": "{{test_email}}",
    "password": "{{test_password}}",
    "role": ["user"]
}
```

### Login User

#### Login User

**Method:** `POST`

**URL:** `{{baseUrl}}/auth/signin`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "username": "{{test_username}}",
    "password": "{{test_password}}"
}
```

### Login Admin

#### Login Admin

**Method:** `POST`

**URL:** `{{baseUrl}}/auth/signin`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "username": "{{admin_username}}",
    "password": "{{admin_password}}"
}
```

### Access Protected User Endpoint (Successful)

#### Access Protected User Endpoint (Successful)

**Method:** `GET`

**URL:** `{{baseUrl}}/api/test/user`

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | Bearer {{auth_token}} |


### Access Protected User Endpoint with NO Token

#### Access Protected User Endpoint with NO Token

**Method:** `GET`

**URL:** `{{baseUrl}}/api/test/user`

**Headers:**

| Header | Value |
|--------|-------|


### Access Protected User Endpoint with MALFORMED Token

#### Access Protected User Endpoint with MALFORMED Token

**Method:** `GET`

**URL:** `{{baseUrl}}/api/test/user`

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | Bearer MALFORMEDTOKEN12345 |


### Access Protected Admin Endpoint with User Token (Expect 403)

#### Access Protected Admin Endpoint with User Token (Expect 403)

**Method:** `GET`

**URL:** `{{baseUrl}}/api/test/admin`

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | Bearer {{auth_token}} |


### Access Protected Admin Endpoint with Admin Token (Successful)

#### Access Protected Admin Endpoint with Admin Token (Successful)

**Method:** `GET`

**URL:** `{{baseUrl}}/api/test/admin`

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | Bearer {{admin_auth_token}} |



## AutoTrader Body Styles Tests

No description provided

### Get All Body Styles

#### Get All Body Styles

**Method:** `GET`

**URL:** `{{baseUrl}}/api/body-styles`

**Headers:**

| Header | Value |
|--------|-------|


### Get Body Style by ID

#### Get Body Style by ID

**Method:** `GET`

**URL:** `{{baseUrl}}/api/body-styles/1`

**Headers:**

| Header | Value |
|--------|-------|


### Get Body Style by Name

#### Get Body Style by Name

**Method:** `GET`

**URL:** `{{baseUrl}}/api/body-styles/name/sedan`

**Headers:**

| Header | Value |
|--------|-------|


### Search Body Styles

#### Search Body Styles

**Method:** `GET`

**URL:** `{{baseUrl}}/api/body-styles/search?q=sedan`

**Headers:**

| Header | Value |
|--------|-------|


### Create Body Style (Admin)

#### Create Body Style (Admin)

**Method:** `POST`

**URL:** `{{baseUrl}}/api/body-styles`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "test-body-style",
    "displayNameEn": "Test Body Style",
    "displayNameAr": "اختبار نوع الهيكل"
}
```

### Update Body Style (Admin)

#### Update Body Style (Admin)

**Method:** `PUT`

**URL:** `{{baseUrl}}/api/body-styles/{{body_style_id}}`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "test-body-style",
    "displayNameEn": "Updated Body Style",
    "displayNameAr": "اختبار نوع الهيكل محدث"
}
```

### Delete Body Style (Admin)

#### Delete Body Style (Admin)

**Method:** `DELETE`

**URL:** `{{baseUrl}}/api/body-styles/{{body_style_id}}`

**Headers:**

| Header | Value |
|--------|-------|



## AutoTrader Car Conditions Tests

No description provided

### Get All Car Conditions

#### Get All Car Conditions

**Method:** `GET`

**URL:** `{{baseUrl}}/api/car-conditions`

**Headers:**

| Header | Value |
|--------|-------|


### Get Car Condition by ID

#### Get Car Condition by ID

**Method:** `GET`

**URL:** `{{baseUrl}}/api/car-conditions/1`

**Headers:**

| Header | Value |
|--------|-------|


### Get Car Condition by Name

#### Get Car Condition by Name

**Method:** `GET`

**URL:** `{{baseUrl}}/api/car-conditions/name/new`

**Headers:**

| Header | Value |
|--------|-------|


### Search Car Conditions

#### Search Car Conditions

**Method:** `GET`

**URL:** `{{baseUrl}}/api/car-conditions/search?q=new`

**Headers:**

| Header | Value |
|--------|-------|


### Create Car Condition (Admin)

#### Create Car Condition (Admin)

**Method:** `POST`

**URL:** `{{baseUrl}}/api/car-conditions`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-condition",
    "displayNameEn": "Custom Condition",
    "displayNameAr": "حالة مخصصة"
}
```

### Update Car Condition (Admin)

#### Update Car Condition (Admin)

**Method:** `PUT`

**URL:** `{{baseUrl}}/api/car-conditions/{{condition_id}}`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-condition",
    "displayNameEn": "Updated Condition",
    "displayNameAr": "حالة مخصصة محدثة"
}
```

### Delete Car Condition (Admin)

#### Delete Car Condition (Admin)

**Method:** `DELETE`

**URL:** `{{baseUrl}}/api/car-conditions/{{condition_id}}`

**Headers:**

| Header | Value |
|--------|-------|



## AutoTrader Drive Types Tests

No description provided

### Get All Drive Types

#### Get All Drive Types

**Method:** `GET`

**URL:** `{{baseUrl}}/api/drive-types`

**Headers:**

| Header | Value |
|--------|-------|


### Get Drive Type by ID

#### Get Drive Type by ID

**Method:** `GET`

**URL:** `{{baseUrl}}/api/drive-types/1`

**Headers:**

| Header | Value |
|--------|-------|


### Get Drive Type by Name

#### Get Drive Type by Name

**Method:** `GET`

**URL:** `{{baseUrl}}/api/drive-types/name/awd`

**Headers:**

| Header | Value |
|--------|-------|


### Search Drive Types

#### Search Drive Types

**Method:** `GET`

**URL:** `{{baseUrl}}/api/drive-types/search?q=wheel`

**Headers:**

| Header | Value |
|--------|-------|


### Create Drive Type (Admin)

#### Create Drive Type (Admin)

**Method:** `POST`

**URL:** `{{baseUrl}}/api/drive-types`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-drive-type",
    "displayNameEn": "Custom Drive Type",
    "displayNameAr": "نظام دفع مخصص"
}
```

### Update Drive Type (Admin)

#### Update Drive Type (Admin)

**Method:** `PUT`

**URL:** `{{baseUrl}}/api/drive-types/{{drive_type_id}}`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-drive-type",
    "displayNameEn": "Updated Drive Type",
    "displayNameAr": "نظام دفع محدث"
}
```

### Delete Drive Type (Admin)

#### Delete Drive Type (Admin)

**Method:** `DELETE`

**URL:** `{{baseUrl}}/api/drive-types/{{drive_type_id}}`

**Headers:**

| Header | Value |
|--------|-------|



## AutoTrader Fuel Types Tests

No description provided

### Get All Fuel Types

#### Get All Fuel Types

**Method:** `GET`

**URL:** `{{baseUrl}}/api/fuel-types`

**Headers:**

| Header | Value |
|--------|-------|


### Get Fuel Type by ID

#### Get Fuel Type by ID

**Method:** `GET`

**URL:** `{{baseUrl}}/api/fuel-types/1`

**Headers:**

| Header | Value |
|--------|-------|


### Get Fuel Type by Name

#### Get Fuel Type by Name

**Method:** `GET`

**URL:** `{{baseUrl}}/api/fuel-types/name/gasoline`

**Headers:**

| Header | Value |
|--------|-------|


### Search Fuel Types

#### Search Fuel Types

**Method:** `GET`

**URL:** `{{baseUrl}}/api/fuel-types/search?q=gas`

**Headers:**

| Header | Value |
|--------|-------|


### Create Fuel Type (Admin)

#### Create Fuel Type (Admin)

**Method:** `POST`

**URL:** `{{baseUrl}}/api/fuel-types`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-fuel-type",
    "displayNameEn": "Custom Fuel Type",
    "displayNameAr": "نوع وقود مخصص"
}
```

### Update Fuel Type (Admin)

#### Update Fuel Type (Admin)

**Method:** `PUT`

**URL:** `{{baseUrl}}/api/fuel-types/{{fuel_type_id}}`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-fuel-type",
    "displayNameEn": "Updated Fuel Type",
    "displayNameAr": "نوع وقود محدث"
}
```

### Delete Fuel Type (Admin)

#### Delete Fuel Type (Admin)

**Method:** `DELETE`

**URL:** `{{baseUrl}}/api/fuel-types/{{fuel_type_id}}`

**Headers:**

| Header | Value |
|--------|-------|



## Listings and Media Tests

Tests for creating listings, uploading media, and retrieving them.

### 0. Login as Admin

#### 0. Login as Admin

**Method:** `POST`

**URL:** `{{baseUrl}}/auth/signin`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "username": "admin",
    "password": "Admin123!"
}
```

### 1. Create Simple Listing (No Initial Media)

#### 1. Create Simple Listing (No Initial Media)

**Method:** `POST`

**URL:** `{{baseUrl}}/api/listings`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "title": "Test Listing - No Media",
    "description": "A test listing created without any initial media files.",
    "price": 25000,
    "mileage": 50000,
    "modelYear": 2020,
    "vin": "VINNOLIST001",
    "brand": "TestMake",
    "model": "TestModel",
    "locationId": 1
}
```

### 1.1. Approve Listing 1

#### 1.1. Approve Listing 1

**Method:** `POST`

**URL:** `{{baseUrl}}/api/listings/{{listing_id_1}}/approve`

**Headers:**

| Header | Value |
|--------|-------|


### 2. Upload Image to Existing Listing

#### 2. Upload Image to Existing Listing

**Method:** `POST`

**URL:** `{{baseUrl}}/api/listings/{{listing_id_1}}/upload-image`

**Headers:**

| Header | Value |
|--------|-------|


### 3. Get Listing by ID (with Media)

#### 3. Get Listing by ID (with Media)

**Method:** `GET`

**URL:** `{{baseUrl}}/api/listings/{{listing_id_1}}`

**Headers:**

| Header | Value |
|--------|-------|


### 4. Create Listing with Initial Image

#### 4. Create Listing with Initial Image

**Method:** `POST`

**URL:** `{{baseUrl}}/api/listings/with-image`

**Headers:**

| Header | Value |
|--------|-------|


### 4.1. Approve Listing 2

#### 4.1. Approve Listing 2

**Method:** `POST`

**URL:** `{{baseUrl}}/api/listings/{{listing_id_2}}/approve`

**Headers:**

| Header | Value |
|--------|-------|


### 5. Get All Listings (Verify Both Created)

#### 5. Get All Listings (Verify Both Created)

**Method:** `GET`

**URL:** `{{baseUrl}}/api/listings`

**Headers:**

| Header | Value |
|--------|-------|


### 6. Delete Listing 1

#### 6. Delete Listing 1

**Method:** `DELETE`

**URL:** `{{baseUrl}}/api/listings/{{listing_id_1}}`

**Headers:**

| Header | Value |
|--------|-------|


### 7. Delete Listing 2

#### 7. Delete Listing 2

**Method:** `DELETE`

**URL:** `{{baseUrl}}/api/listings/{{listing_id_2}}`

**Headers:**

| Header | Value |
|--------|-------|



## AutoTrader Reference Data Tests

No description provided

### Get All Reference Data

#### Get All Reference Data

**Method:** `GET`

**URL:** `{{baseUrl}}/api/reference-data`

**Headers:**

| Header | Value |
|--------|-------|



## AutoTrader Seller Types Tests

No description provided

### Get All Seller Types

#### Get All Seller Types

**Method:** `GET`

**URL:** `{{baseUrl}}/api/seller-types`

**Headers:**

| Header | Value |
|--------|-------|


### Get Seller Type by ID

#### Get Seller Type by ID

**Method:** `GET`

**URL:** `{{baseUrl}}/api/seller-types/1`

**Headers:**

| Header | Value |
|--------|-------|


### Get Seller Type by Name

#### Get Seller Type by Name

**Method:** `GET`

**URL:** `{{baseUrl}}/api/seller-types/name/dealer`

**Headers:**

| Header | Value |
|--------|-------|


### Search Seller Types

#### Search Seller Types

**Method:** `GET`

**URL:** `{{baseUrl}}/api/seller-types/search?q=private`

**Headers:**

| Header | Value |
|--------|-------|


### Create Seller Type (Admin)

#### Create Seller Type (Admin)

**Method:** `POST`

**URL:** `{{baseUrl}}/api/seller-types`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-seller-type",
    "displayNameEn": "Custom Seller Type",
    "displayNameAr": "نوع بائع مخصص"
}
```

### Update Seller Type (Admin)

#### Update Seller Type (Admin)

**Method:** `PUT`

**URL:** `{{baseUrl}}/api/seller-types/{{seller_type_id}}`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-seller-type",
    "displayNameEn": "Updated Seller Type",
    "displayNameAr": "نوع بائع محدث"
}
```

### Delete Seller Type (Admin)

#### Delete Seller Type (Admin)

**Method:** `DELETE`

**URL:** `{{baseUrl}}/api/seller-types/{{seller_type_id}}`

**Headers:**

| Header | Value |
|--------|-------|



## AutoTrader Transmissions Tests

No description provided

### Get All Transmissions

#### Get All Transmissions

**Method:** `GET`

**URL:** `{{baseUrl}}/api/transmissions`

**Headers:**

| Header | Value |
|--------|-------|


### Get Transmission by ID

#### Get Transmission by ID

**Method:** `GET`

**URL:** `{{baseUrl}}/api/transmissions/1`

**Headers:**

| Header | Value |
|--------|-------|


### Get Transmission by Name

#### Get Transmission by Name

**Method:** `GET`

**URL:** `{{baseUrl}}/api/transmissions/name/automatic`

**Headers:**

| Header | Value |
|--------|-------|


### Search Transmissions

#### Search Transmissions

**Method:** `GET`

**URL:** `{{baseUrl}}/api/transmissions/search?q=auto`

**Headers:**

| Header | Value |
|--------|-------|


### Create Transmission (Admin)

#### Create Transmission (Admin)

**Method:** `POST`

**URL:** `{{baseUrl}}/api/transmissions`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-transmission",
    "displayNameEn": "Custom Transmission",
    "displayNameAr": "ناقل حركة مخصص"
}
```

### Update Transmission (Admin)

#### Update Transmission (Admin)

**Method:** `PUT`

**URL:** `{{baseUrl}}/api/transmissions/{{transmission_id}}`

**Headers:**

| Header | Value |
|--------|-------|
| Content-Type | application/json |


**Request Body Example:**

```json
{
    "name": "custom-transmission",
    "displayNameEn": "Updated Transmission",
    "displayNameAr": "ناقل حركة محدث"
}
```

### Delete Transmission (Admin)

#### Delete Transmission (Admin)

**Method:** `DELETE`

**URL:** `{{baseUrl}}/api/transmissions/{{transmission_id}}`

**Headers:**

| Header | Value |
|--------|-------|


