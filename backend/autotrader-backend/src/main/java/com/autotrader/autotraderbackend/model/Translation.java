package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Translation entity for managing multilingual content
 * Supports brands, models, and other translatable content
 */
@Entity
@Table(name = "translations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entity_type", "entity_id", "language_code", "field_name"}))
@Getter
@Setter
@NoArgsConstructor
public class Translation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Type of entity being translated (BRAND, MODEL, FEATURE, etc.)
     */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /**
     * ID of the entity being translated
     */
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    /**
     * Language code (ar, en, fr, etc.)
     */
    @Column(name = "language_code", nullable = false, length = 5)
    private String languageCode;

    /**
     * Field name being translated (name, description, etc.)
     */
    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    /**
     * Original text in source language
     */
    @Column(name = "source_text", nullable = false, columnDefinition = "TEXT")
    private String sourceText;

    /**
     * Translated text
     */
    @Column(name = "translated_text", nullable = false, columnDefinition = "TEXT")
    private String translatedText;

    /**
     * Translation confidence score (0.0 to 1.0)
     * 1.0 = Human verified
     * 0.8-0.9 = Machine translation verified
     * 0.5-0.7 = Machine translation unverified
     * 0.0-0.4 = Low confidence
     */
    @Column(name = "confidence_score", nullable = false)
    private Double confidenceScore = 0.5;

    /**
     * Translation source (AUTO, HUMAN, API, MANUAL)
     */
    @Column(name = "translation_source", nullable = false, length = 20)
    private String translationSource = "AUTO";

    /**
     * Whether this translation is verified by human
     */
    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    /**
     * Whether this translation is active/approved
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Last modified timestamp
     */
    @Column(name = "last_modified")
    private java.time.LocalDateTime lastModified;

    /**
     * User who last modified this translation
     */
    @Column(name = "last_modified_by")
    private String lastModifiedBy;

    // Predefined entity types
    public static final String ENTITY_TYPE_BRAND = "BRAND";
    public static final String ENTITY_TYPE_MODEL = "MODEL";
    public static final String ENTITY_TYPE_FEATURE = "FEATURE";
    public static final String ENTITY_TYPE_CATEGORY = "CATEGORY";

    // Predefined translation sources
    public static final String SOURCE_AUTO = "AUTO";
    public static final String SOURCE_HUMAN = "HUMAN";
    public static final String SOURCE_API = "API";
    public static final String SOURCE_MANUAL = "MANUAL";

    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        this.lastModified = java.time.LocalDateTime.now();
    }
}
