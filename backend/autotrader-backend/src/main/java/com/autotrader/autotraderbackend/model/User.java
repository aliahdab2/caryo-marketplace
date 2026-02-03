package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String email;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String password;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_type_id")
    private SellerType sellerType;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Dealer dealer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Email verification fields
    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(name = "email_verification_token")
    private String emailVerificationToken;

    @Column(name = "email_verification_sent_at")
    private LocalDateTime emailVerificationSentAt;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    // OAuth tracking fields for better security and audit trails
    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_provider_id")
    private String oauthProviderId;

    @Column(name = "oauth_verified_at")
    private LocalDateTime oauthVerifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method", nullable = false)
    private VerificationMethod verificationMethod = VerificationMethod.MANUAL;

    // User preferences
    @Column(name = "preferred_language", length = 10)
    private String preferredLanguage;

    // Token version for JWT revocation (incremented on logout, password change, etc.)
    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion = 0;

    // Account status
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false)
    private AccountStatus accountStatus = AccountStatus.PENDING_VERIFICATION;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.verificationMethod = VerificationMethod.MANUAL; // Default for manually created users
    }

    // Helper methods for account status and verification
    public boolean isEmailVerified() {
        return Boolean.TRUE.equals(emailVerified);
    }

    public boolean canCreateListings() {
        return isEmailVerified() && (accountStatus == AccountStatus.VERIFIED);
    }

    public boolean canLogin() {
        return accountStatus != AccountStatus.SUSPENDED && accountStatus != AccountStatus.BANNED;
    }

    public boolean isActive() {
        return accountStatus == AccountStatus.VERIFIED;
    }

    /**
     * Increment token version to invalidate all existing JWT tokens for this user.
     * Called on logout, password change, password reset, and account suspension.
     */
    public void incrementTokenVersion() {
        this.tokenVersion = (this.tokenVersion == null ? 0 : this.tokenVersion) + 1;
    }

    public boolean isDealer() {
        return dealer != null || (sellerType != null && "dealer".equalsIgnoreCase(sellerType.getName()));
    }

    public void markEmailAsVerified() {
        this.emailVerified = true;
        this.emailVerifiedAt = LocalDateTime.now();
        this.emailVerificationToken = null; // Clear the token
        if (this.accountStatus == AccountStatus.PENDING_VERIFICATION ||
            this.accountStatus == AccountStatus.PENDING_APPROVAL) {
            this.accountStatus = AccountStatus.VERIFIED;
        }
    }

    /**
     * Mark email as verified by OAuth provider (Google, etc.)
     * This is more secure than manual verification as OAuth providers perform strong verification
     *
     * @param provider The OAuth provider (e.g., "google", "github")
     */
    public void markEmailVerifiedByOAuth(String provider) {
        this.emailVerified = true;
        this.emailVerifiedAt = LocalDateTime.now();
        this.emailVerificationToken = null; // Clear the token

        // Set OAuth-specific tracking fields
        this.oauthProvider = provider;
        this.oauthVerifiedAt = LocalDateTime.now();
        this.verificationMethod = VerificationMethod.OAUTH;

        // OAuth-verified users get VERIFIED status immediately
        if (this.accountStatus == AccountStatus.PENDING_VERIFICATION ||
            this.accountStatus == AccountStatus.PENDING_APPROVAL) {
            this.accountStatus = AccountStatus.VERIFIED;
        }
    }

    /**
     * Mark email as verified by OAuth provider with provider ID
     * This provides the most complete audit trail
     *
     * @param provider The OAuth provider (e.g., "google", "github")
     * @param providerId The unique ID from the OAuth provider
     */
    public void markEmailVerifiedByOAuth(String provider, String providerId) {
        this.emailVerified = true;
        this.emailVerifiedAt = LocalDateTime.now();
        this.emailVerificationToken = null; // Clear the token

        // Set OAuth-specific tracking fields
        this.oauthProvider = provider;
        this.oauthProviderId = providerId;
        this.oauthVerifiedAt = LocalDateTime.now();
        this.verificationMethod = VerificationMethod.OAUTH;

        // OAuth-verified users get VERIFIED status immediately
        if (this.accountStatus == AccountStatus.PENDING_VERIFICATION ||
            this.accountStatus == AccountStatus.PENDING_APPROVAL) {
            this.accountStatus = AccountStatus.VERIFIED;
        }
    }

    /**
     * Clear email verification token for security purposes.
     * This prevents token reuse attacks.
     */
    public void clearEmailVerificationToken() {
        this.emailVerificationToken = null;
        this.emailVerificationSentAt = null;
    }
}
