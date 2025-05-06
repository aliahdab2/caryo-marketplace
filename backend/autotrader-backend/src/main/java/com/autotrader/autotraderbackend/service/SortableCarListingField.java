package com.autotrader.autotraderbackend.service;

/**
 * Enum representing the allowed sortable fields for CarListing.
 */
public enum SortableCarListingField {
    LOCATION_ID("locationId"), // Reverted from "locationEntity.id"
    PRICE("price"),
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
