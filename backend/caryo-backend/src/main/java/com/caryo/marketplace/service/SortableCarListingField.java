package com.caryo.marketplace.service;

/**
 * Enum representing the allowed sortable fields for CarListing.
 */
public enum SortableCarListingField {
    LOCATION_ID("location.id"), // For sorting by location ID (city/town level)
    GOVERNORATE_ID("governorate.id"), // For sorting by governorate ID (state/region level)
    PRICE("price"),
    MODEL_YEAR("modelYear"), // For sorting by car model year
    CREATED_AT("createdAt");

    private final String fieldName;

    SortableCarListingField(String fieldName) {
        this.fieldName = fieldName;
    }

    public String getFieldName() {
        return fieldName;
    }

    public static boolean isAllowed(String field) {
        for (SortableCarListingField allowed : values()) {
            if (allowed.getFieldName().equals(field)) {
                return true;
            }
        }
        return false;
    }
}
