package com.autotrader.autotraderbackend.model;

/**
 * Enum representing the type/category of a user report.
 * Used to classify reports for better organization and handling.
 */
public enum ReportType {
    /**
     * Unsolicited or repetitive messages (spam)
     */
    SPAM("Spam", "رسائل مزعجة"),

    /**
     * Abusive, threatening, or harassing behavior
     */
    HARASSMENT("Harassment", "مضايقة"),

    /**
     * Fraudulent or deceptive behavior
     */
    SCAM("Scam", "احتيال"),

    /**
     * Attempting to defraud or steal
     */
    FRAUD("Fraud", "نصب"),

    /**
     * Offensive, explicit, or inappropriate content
     */
    INAPPROPRIATE_CONTENT("Inappropriate Content", "محتوى غير لائق"),

    /**
     * Fake or misleading listing information
     */
    FAKE_LISTING("Fake Listing", "إعلان وهمي"),

    /**
     * User pretending to be someone else
     */
    IMPERSONATION("Impersonation", "انتحال شخصية"),

    /**
     * Other violations not covered by the above categories
     */
    OTHER("Other", "أخرى");

    private final String displayName;
    private final String displayNameAr;

    ReportType(String displayName, String displayNameAr) {
        this.displayName = displayName;
        this.displayNameAr = displayNameAr;
    }

    /**
     * Get the English display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get the Arabic display name
     */
    public String getDisplayNameAr() {
        return displayNameAr;
    }

    /**
     * Get display name based on language
     */
    public String getDisplayName(String language) {
        return language != null && language.startsWith("ar") ? displayNameAr : displayName;
    }

    /**
     * Parse ReportType from string (case-insensitive)
     */
    public static ReportType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return OTHER;
        }
        try {
            return ReportType.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return OTHER;
        }
    }

    /**
     * Check if a string is a valid ReportType
     */
    public static boolean isValid(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        try {
            ReportType.valueOf(value.toUpperCase().trim());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}

