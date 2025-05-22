-- Migration V2: reference_data
-- Created: 2025-05-22

-- Reference data for core tables

-- Create reference tables if they don't exist
CREATE TABLE IF NOT EXISTS car_conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS drive_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS body_styles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS fuel_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS transmissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);
