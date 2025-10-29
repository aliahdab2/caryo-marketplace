package com.autotrader.autotraderbackend.model;

/**
 * Enum representing the status of a user account.
 * This is used to control access to various features based on account verification and approval status.
 */
public enum AccountStatus {
    /**
     * Account is newly created and pending email verification.
     * Users in this state cannot create listings or perform sensitive actions.
     */
    PENDING_VERIFICATION,

    /**
     * Email has been verified and account is active.
     * Users can create listings and use all features.
     */
    VERIFIED,

    /**
     * Account has been suspended by admin (e.g., for policy violations).
     * Users cannot login or perform any actions.
     */
    SUSPENDED,

    /**
     * Account has been permanently banned.
     * Users cannot login and account cannot be reactivated.
     */
    BANNED,

    /**
     * Account is pending manual review by admin (optional for high-risk users).
     * Users can login but cannot create listings until approved.
     */
    PENDING_APPROVAL
}
