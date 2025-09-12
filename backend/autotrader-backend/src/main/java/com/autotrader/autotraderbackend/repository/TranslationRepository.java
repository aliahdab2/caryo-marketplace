package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.Translation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Translation entity
 */
@Repository
public interface TranslationRepository extends JpaRepository<Translation, Long> {

    /**
     * Find translation by entity details
     */
    Optional<Translation> findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
        String entityType, Long entityId, String languageCode, String fieldName);

    /**
     * Find all translations for an entity
     */
    List<Translation> findByEntityTypeAndEntityId(String entityType, Long entityId);

    /**
     * Find all translations for an entity type and language
     */
    List<Translation> findByEntityTypeAndLanguageCode(String entityType, String languageCode);

    /**
     * Find translations by confidence score range
     */
    List<Translation> findByConfidenceScoreBetween(double minScore, double maxScore);

    /**
     * Find unverified translations
     */
    List<Translation> findByIsVerifiedFalse();

    /**
     * Find translations by source
     */
    List<Translation> findByTranslationSource(String translationSource);

    /**
     * Find translations needing verification (low confidence + unverified)
     */
    @Query("SELECT t FROM Translation t WHERE t.confidenceScore < :threshold AND t.isVerified = false AND t.isActive = true")
    List<Translation> findTranslationsNeedingVerification(@Param("threshold") double threshold);

    /**
     * Count translations by language
     */
    @Query("SELECT COUNT(t) FROM Translation t WHERE t.languageCode = :languageCode AND t.isActive = true")
    long countByLanguageCode(@Param("languageCode") String languageCode);

    /**
     * Count translations by entity type
     */
    @Query("SELECT COUNT(t) FROM Translation t WHERE t.entityType = :entityType AND t.isActive = true")
    long countByEntityType(@Param("entityType") String entityType);

    /**
     * Get translation statistics
     */
    @Query("SELECT t.languageCode, COUNT(t) FROM Translation t WHERE t.isActive = true GROUP BY t.languageCode")
    List<Object[]> getTranslationStatisticsByLanguage();

    /**
     * Find translations by source text (for bulk operations)
     */
    List<Translation> findBySourceText(String sourceText);
}
