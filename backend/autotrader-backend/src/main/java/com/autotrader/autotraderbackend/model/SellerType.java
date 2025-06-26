package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Entity
@Table(name = "seller_types", indexes = {
    @Index(name = "idx_seller_type_name", columnList = "name", unique = true)
})
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Seller type name is required")
    @Size(min = 2, max = 20, message = "Seller type name must be between 2 and 20 characters")
    @Column(nullable = false, length = 20, unique = true)
    private String name;

    @NotBlank(message = "English display name is required")
    @Size(min = 2, max = 50, message = "English display name must be between 2 and 50 characters")
    @Column(name = "display_name_en", nullable = false, length = 50)
    private String displayNameEn;

    @NotBlank(message = "Arabic display name is required")
    @Size(min = 2, max = 50, message = "Arabic display name must be between 2 and 50 characters")
    @Column(name = "display_name_ar", nullable = false, length = 50)
    private String displayNameAr;
}
