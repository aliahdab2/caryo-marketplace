package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "dealers", indexes = {
    @Index(name = "idx_dealer_user_id", columnList = "user_id", unique = true),
    @Index(name = "idx_dealer_business_name", columnList = "business_name"),
    @Index(name = "idx_dealer_vat_number", columnList = "vat_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dealer {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "dealer_seq")
    @SequenceGenerator(name = "dealer_seq", sequenceName = "dealer_id_seq", allocationSize = 1)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @NotBlank(message = "Business name is required")
    @Size(min = 2, max = 100, message = "Business name must be between 2 and 100 characters")
    @Column(name = "business_name", nullable = false, length = 100)
    private String businessName;

    @Size(max = 50, message = "VAT number must not exceed 50 characters")
    @Column(name = "vat_number", length = 50, unique = true)
    private String vatNumber;

    @Size(max = 255, message = "Trading address must not exceed 255 characters")
    @Column(name = "trading_address", length = 255)
    private String tradingAddress;

    @Email(message = "Business email must be valid")
    @Size(max = 50, message = "Business email must not exceed 50 characters")
    @Column(name = "business_email", length = 50, unique = true)
    private String businessEmail;

    @Size(max = 20, message = "Business phone must not exceed 20 characters")
    @Column(name = "business_phone", length = 20)
    private String businessPhone;

    @Size(max = 255, message = "Logo URL must not exceed 255 characters")
    @Column(name = "logo_url", length = 255)
    private String logoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Audit fields
    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    // Helper methods
    public boolean hasCompleteBusinessInfo() {
        return businessName != null && !businessName.trim().isEmpty();
    }

    public boolean hasContactInfo() {
        return (businessEmail != null && !businessEmail.trim().isEmpty()) ||
               (businessPhone != null && !businessPhone.trim().isEmpty());
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
