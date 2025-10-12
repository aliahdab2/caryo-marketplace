-- V43__Add_Contact_Fields_To_Car_Listings.sql
-- Add contact information fields to car_listings table for AutoTrader pattern

ALTER TABLE car_listings
ADD COLUMN contact_name VARCHAR(100),
ADD COLUMN contact_email VARCHAR(255),
ADD COLUMN contact_phone VARCHAR(50),
ADD COLUMN contact_preference VARCHAR(20) DEFAULT 'email';

-- Add comments for documentation
COMMENT ON COLUMN car_listings.contact_name IS 'Name of person to contact for this listing';
COMMENT ON COLUMN car_listings.contact_email IS 'Email address for contacting about this listing';
COMMENT ON COLUMN car_listings.contact_phone IS 'Phone number for contacting about this listing';
COMMENT ON COLUMN car_listings.contact_preference IS 'Preferred contact method: email, phone, or both';

-- Add indexes for potential query optimization
CREATE INDEX idx_car_listings_contact_email ON car_listings(contact_email);
CREATE INDEX idx_car_listings_contact_phone ON car_listings(contact_phone);
