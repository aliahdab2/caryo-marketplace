# Database Schema

This document outlines the database schema for the AutoTrader Marketplace backend.

## Core Tables

### Table: users
- **id**: BIGINT PRIMARY KEY
- **username**: VARCHAR(50) UNIQUE NOT NULL
- **email**: VARCHAR(50) UNIQUE NOT NULL
- **password**: VARCHAR(120) NOT NULL
- **created_at**: TIMESTAMP NOT NULL
- **updated_at**: TIMESTAMP NOT NULL

### Table: roles
- **id**: INTEGER PRIMARY KEY
- **name**: VARCHAR(20) UNIQUE NOT NULL (e.g., ROLE_USER, ROLE_ADMIN)

### Table: user_roles
- **user_id**: BIGINT (Foreign Key to users.id)
- **role_id**: INTEGER (Foreign Key to roles.id)
- PRIMARY KEY (user_id, role_id)

## Location Tables

### Table: locations
- **id**: BIGINT PRIMARY KEY 
- **display_name_en**: VARCHAR(100) NOT NULL
- **display_name_ar**: VARCHAR(100) NOT NULL
- **slug**: VARCHAR(100) UNIQUE NOT NULL
- **country_code**: VARCHAR(2) NOT NULL
- **region**: VARCHAR(100)
- **latitude**: DECIMAL(10, 8)
- **longitude**: DECIMAL(11, 8)
- **is_active**: BOOLEAN DEFAULT TRUE
- **created_at**: TIMESTAMP NOT NULL
- **updated_at**: TIMESTAMP NOT NULL

## Listing Tables

### Table: car_listings
- **id**: BIGINT PRIMARY KEY
- **title**: VARCHAR(100) NOT NULL
- **description**: TEXT NOT NULL
- **price**: DECIMAL(10, 2) NOT NULL
- **mileage**: INTEGER NOT NULL
- **model_year**: INTEGER NOT NULL
- **brand**: VARCHAR(50) NOT NULL
- **model**: VARCHAR(50) NOT NULL
- **vin**: VARCHAR(17)
- **stock_number**: VARCHAR(50)
- **exterior_color**: VARCHAR(50)
- **interior_color**: VARCHAR(50)
- **doors**: INTEGER
- **cylinders**: INTEGER
- **seller_id**: BIGINT NOT NULL (Foreign Key to users.id)
- **location_id**: BIGINT (Foreign Key to locations.id)
- **condition_id**: BIGINT (Foreign Key to car_conditions.id)
- **body_style_id**: BIGINT (Foreign Key to body_styles.id)
- **transmission_id**: BIGINT (Foreign Key to transmissions.id)
- **fuel_type_id**: BIGINT (Foreign Key to fuel_types.id)
- **drive_type_id**: BIGINT (Foreign Key to drive_types.id)
- **transmission**: VARCHAR(50)
- **approved**: BOOLEAN DEFAULT FALSE
- **sold**: BOOLEAN DEFAULT FALSE
- **archived**: BOOLEAN DEFAULT FALSE
- **expired**: BOOLEAN DEFAULT FALSE
- **is_user_active**: BOOLEAN DEFAULT TRUE
- **expiration_date**: TIMESTAMP
- **created_at**: TIMESTAMP NOT NULL
- **updated_at**: TIMESTAMP NOT NULL

### Table: listing_media
- **id**: BIGINT PRIMARY KEY
- **listing_id**: BIGINT NOT NULL (Foreign Key to car_listings.id)
- **file_key**: VARCHAR(255) NOT NULL
- **file_name**: VARCHAR(255) NOT NULL
- **content_type**: VARCHAR(100) NOT NULL
- **size**: BIGINT NOT NULL
- **sort_order**: INTEGER DEFAULT 0
- **is_primary**: BOOLEAN DEFAULT FALSE
- **media_type**: VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video'))
- **created_at**: TIMESTAMP NOT NULL

## Car Attributes Reference Tables

### Table: car_brands
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(50) NOT NULL
- **slug**: VARCHAR(100) UNIQUE NOT NULL
- **display_name_en**: VARCHAR(100) NOT NULL
- **display_name_ar**: VARCHAR(100) NOT NULL
- **is_active**: BOOLEAN DEFAULT TRUE

### Table: car_models
- **id**: BIGINT PRIMARY KEY
- **brand_id**: BIGINT NOT NULL (Foreign Key to car_brands.id)
- **name**: VARCHAR(50) NOT NULL
- **slug**: VARCHAR(100) UNIQUE NOT NULL
- **display_name_en**: VARCHAR(100) NOT NULL
- **display_name_ar**: VARCHAR(100) NOT NULL
- **is_active**: BOOLEAN DEFAULT TRUE

### Table: car_trims
- **id**: BIGINT PRIMARY KEY
- **model_id**: BIGINT NOT NULL (Foreign Key to car_models.id)
- **name**: VARCHAR(50) NOT NULL
- **display_name_en**: VARCHAR(100) NOT NULL
- **display_name_ar**: VARCHAR(100) NOT NULL
- **is_active**: BOOLEAN DEFAULT TRUE

### Table: car_conditions
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(20) NOT NULL
- **display_name_en**: VARCHAR(50) NOT NULL
- **display_name_ar**: VARCHAR(50) NOT NULL

### Table: drive_types
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(20) NOT NULL
- **display_name_en**: VARCHAR(50) NOT NULL
- **display_name_ar**: VARCHAR(50) NOT NULL

### Table: body_styles
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(20) NOT NULL
- **display_name_en**: VARCHAR(50) NOT NULL
- **display_name_ar**: VARCHAR(50) NOT NULL

### Table: fuel_types
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(20) NOT NULL
- **display_name_en**: VARCHAR(50) NOT NULL
- **display_name_ar**: VARCHAR(50) NOT NULL

### Table: transmissions
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(20) NOT NULL
- **display_name_en**: VARCHAR(50) NOT NULL
- **display_name_ar**: VARCHAR(50) NOT NULL

### Table: seller_types
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(20) NOT NULL
- **display_name_en**: VARCHAR(50) NOT NULL
- **display_name_ar**: VARCHAR(50) NOT NULL

## Pricing & Ad Services Tables

### Table: ad_packages
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(50) NOT NULL
- **description**: TEXT
- **price**: DECIMAL(10, 2) NOT NULL
- **duration_days**: INTEGER NOT NULL
- **max_photos**: INTEGER NOT NULL
- **is_featured**: BOOLEAN DEFAULT FALSE
- **is_active**: BOOLEAN DEFAULT TRUE
- **created_at**: TIMESTAMP NOT NULL
- **updated_at**: TIMESTAMP NOT NULL

### Table: ad_services
- **id**: BIGINT PRIMARY KEY
- **name**: VARCHAR(50) NOT NULL
- **description**: TEXT
- **price**: DECIMAL(10, 2) NOT NULL
- **is_active**: BOOLEAN DEFAULT TRUE
- **created_at**: TIMESTAMP NOT NULL
- **updated_at**: TIMESTAMP NOT NULL

### Table: listing_packages
- **id**: BIGINT PRIMARY KEY
- **listing_id**: BIGINT NOT NULL (Foreign Key to car_listings.id)
- **package_id**: BIGINT NOT NULL (Foreign Key to ad_packages.id)
- **purchase_date**: TIMESTAMP NOT NULL
- **expiry_date**: TIMESTAMP NOT NULL
- **price_paid**: DECIMAL(10, 2) NOT NULL
- **created_at**: TIMESTAMP NOT NULL
- **updated_at**: TIMESTAMP NOT NULL

### Table: listing_services
- **id**: BIGINT PRIMARY KEY
- **listing_id**: BIGINT NOT NULL (Foreign Key to car_listings.id)
- **service_id**: BIGINT NOT NULL (Foreign Key to ad_services.id)
- **purchase_date**: TIMESTAMP NOT NULL
- **price_paid**: DECIMAL(10, 2) NOT NULL
- **created_at**: TIMESTAMP NOT NULL

## Audit & System Tables

### Table: user_activity_logs
- **id**: BIGINT PRIMARY KEY
- **user_id**: BIGINT (Foreign Key to users.id)
- **action**: VARCHAR(50) NOT NULL
- **entity_type**: VARCHAR(50) NOT NULL
- **entity_id**: BIGINT
- **details**: TEXT
- **ip_address**: VARCHAR(45)
- **user_agent**: VARCHAR(255)
- **created_at**: TIMESTAMP NOT NULL

## Relationships

- **users** has many **car_listings**
- **users** has many **roles** through **user_roles**
- **car_listings** belongs to **users** (seller)
- **car_listings** belongs to **locations**
- **car_listings** belongs to **car_conditions**
- **car_listings** belongs to **body_styles**
- **car_listings** belongs to **transmissions**
- **car_listings** belongs to **fuel_types**
- **car_listings** belongs to **drive_types**
- **car_listings** has many **listing_media**
- **car_listings** has many **ad_packages** through **listing_packages**
- **car_listings** has many **ad_services** through **listing_services**
- **car_brands** has many **car_models**
- **car_models** has many **car_trims**
- **car_models** belongs to **car_brands**
- **car_trims** belongs to **car_models**

## Entity Relationship Diagram (ERD)

```
[users] 1——* [car_listings] *——1 [locations]
   |                |                
   |                |——————*——1 [car_conditions]
   |                |——————*——1 [body_styles]
   |                |——————*——1 [transmissions]
   |                |——————*——1 [fuel_types]
   |                |——————*——1 [drive_types]
   |                |
   |                *
   |         [listing_media]
   |                |
   |                |
[user_roles]        |
   |                |
   |                |
[roles]      [listing_packages]
                    |
                    |
              [ad_packages]
                    
[car_brands] 1——* [car_models] 1——* [car_trims]
```

## Notes

1. **Indexing Strategy**:
   - Indexes on foreign keys (e.g., `seller_id`, `location_id` in `car_listings`)
   - Indexes on commonly filtered fields (e.g., `brand`, `model`, `price` in `car_listings`)
   - Full-text search indexes on description fields

2. **Data Migrations**:
   - Flyway will be used to manage database schema versioning
   - Migration scripts will be stored in `src/main/resources/db/migration`

3. **Data Integrity**:
   - Foreign key constraints ensure referential integrity
   - Cascade delete for certain relationships (e.g., listing images when a listing is deleted)

## Database Triggers

### Timestamp Auto-Update Triggers

The following tables have triggers to automatically update their `updated_at` timestamp whenever a row is updated:

- **users** - `update_users_modtime`
- **locations** - `update_locations_modtime`
- **car_listings** - `update_car_listings_modtime`
- **listing_packages** - `update_listing_packages_modtime`
- **ad_packages** - `update_ad_packages_modtime`
- **ad_services** - `update_ad_services_modtime`

All these triggers use the `update_modified_column()` function which sets `NEW.updated_at = now()`.
