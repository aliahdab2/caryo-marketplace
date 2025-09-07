package com.autotrader.autotraderbackend.model;

/**
 * Enum representing the method used to verify a user's email.
 * This ensures data integrity and prevents invalid verification method values.
 */
public enum VerificationMethod {
    /**
     * Email verification performed manually by sending verification email and token
     */
    MANUAL,

    /**
     * Email verification performed through OAuth provider (Google, GitHub, etc.)
     * This is more secure as OAuth providers perform strong email verification
     */
    OAUTH
}
