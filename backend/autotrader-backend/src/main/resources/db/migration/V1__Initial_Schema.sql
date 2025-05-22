-- V1__Initial_Schema.sql

-- Core Tables
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- Location Tables
CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    display_name_en VARCHAR(100) NOT NULL,
    display_name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Listing Tables
CREATE TABLE car_listings (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    mileage INTEGER NOT NULL,
    model_year INTEGER NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    vin VARCHAR(17),
    stock_number VARCHAR(50),
    exterior_color VARCHAR(50),
    interior_color VARCHAR(50),
    doors INTEGER,
    cylinders INTEGER,
    seller_id BIGINT NOT NULL,
    location_id BIGINT,
    approved BOOLEAN DEFAULT FALSE,
    sold BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    expiration_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL
);

CREATE TABLE listing_media (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    file_key VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES car_listings (id) ON DELETE CASCADE
);

-- Car Attributes Reference Tables
CREATE TABLE car_brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    display_name_en VARCHAR(100) NOT NULL,
    display_name_ar VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE car_models (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    display_name_en VARCHAR(100) NOT NULL,
    display_name_ar VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (brand_id) REFERENCES car_brands (id) ON DELETE CASCADE
);

CREATE TABLE car_trims (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_name_en VARCHAR(100) NOT NULL,
    display_name_ar VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (model_id) REFERENCES car_models (id) ON DELETE CASCADE
);

CREATE TABLE car_conditions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE drive_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE body_styles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE fuel_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE transmissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE seller_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

-- Pricing & Ad Services Tables
CREATE TABLE ad_packages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    max_photos INTEGER NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ad_services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listing_packages (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    purchase_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    price_paid DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES car_listings (id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES ad_packages (id) ON DELETE RESTRICT
);

CREATE TABLE listing_services (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    purchase_date TIMESTAMP NOT NULL,
    price_paid DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES car_listings (id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES ad_services (id) ON DELETE RESTRICT
);

-- Audit & System Tables
CREATE TABLE user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Default roles
INSERT INTO roles (name) VALUES ('ROLE_USER');
INSERT INTO roles (name) VALUES ('ROLE_ADMIN');
