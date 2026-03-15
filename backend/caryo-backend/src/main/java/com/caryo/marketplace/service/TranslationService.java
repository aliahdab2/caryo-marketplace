package com.caryo.marketplace.service;

import com.caryo.marketplace.model.Translation;
import com.caryo.marketplace.repository.TranslationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing translations with database persistence
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationService {

    private final TranslationRepository translationRepository;
    private final ArabicTranslationService fallbackTranslationService; // Keep for initial seeding

    /**
     * Get translation for specific entity field
     */
    @Cacheable(value = "translations", key = "#entityType + '_' + #entityId + '_' + #languageCode + '_' + #fieldName")
    public Optional<String> getTranslation(String entityType, Long entityId, String languageCode, String fieldName) {
        return translationRepository
            .findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(entityType, entityId, languageCode, fieldName)
            .filter(Translation::getIsActive)
            .map(Translation::getTranslatedText);
    }

    /**
     * Get translation or fallback to auto-generated
     */
    public String getTranslationOrFallback(String entityType, Long entityId, String languageCode,
                                          String fieldName, String sourceText) {
        // Try database first
        Optional<String> dbTranslation = getTranslation(entityType, entityId, languageCode, fieldName);
        if (dbTranslation.isPresent()) {
            return dbTranslation.get();
        }

        // Fallback to auto-generated translation
        String autoTranslation = generateAutoTranslation(entityType, sourceText, languageCode);
        if (!autoTranslation.equals(sourceText)) {
            // Save auto-generated translation for future use
            saveAutoTranslation(entityType, entityId, languageCode, fieldName, sourceText, autoTranslation);
        }

        return autoTranslation;
    }

    /**
     * Generate automatic translation using fallback service
     */
    private String generateAutoTranslation(String entityType, String sourceText, String languageCode) {
        if ("ar".equals(languageCode)) {
            if (Translation.ENTITY_TYPE_BRAND.equals(entityType)) {
                return fallbackTranslationService.translateBrandToArabic(sourceText);
            } else if (Translation.ENTITY_TYPE_MODEL.equals(entityType)) {
                // For models, we need brand context - fallback to basic translation
                return fallbackTranslationService.translateBrandToArabic(sourceText);
            }
        }
        return sourceText; // Return original if no translation available
    }

    /**
     * Save auto-generated translation
     */
    @Transactional
    public void saveAutoTranslation(String entityType, Long entityId, String languageCode,
                                   String fieldName, String sourceText, String translatedText) {
        if (sourceText.equals(translatedText)) {
            return; // Don't save if no actual translation
        }

        Translation translation = new Translation();
        translation.setEntityType(entityType);
        translation.setEntityId(entityId);
        translation.setLanguageCode(languageCode);
        translation.setFieldName(fieldName);
        translation.setSourceText(sourceText);
        translation.setTranslatedText(translatedText);
        translation.setConfidenceScore(0.5); // Auto-generated, medium confidence
        translation.setTranslationSource(Translation.SOURCE_AUTO);
        translation.setIsVerified(false);
        translation.setIsActive(true);
        translation.setLastModifiedBy("SYSTEM");

        try {
            translationRepository.save(translation);
            log.debug("Saved auto-translation: {} -> {}", sourceText, translatedText);
        } catch (Exception e) {
            log.warn("Failed to save auto-translation: {}", e.getMessage());
        }
    }

    /**
     * Save or update manual translation
     */
    @Transactional
    @CacheEvict(value = "translations", key = "#entityType + '_' + #entityId + '_' + #languageCode + '_' + #fieldName")
    public Translation saveManualTranslation(String entityType, Long entityId, String languageCode,
                                           String fieldName, String sourceText, String translatedText,
                                           String userId) {
        Optional<Translation> existing = translationRepository
            .findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(entityType, entityId, languageCode, fieldName);

        Translation translation;
        if (existing.isPresent()) {
            translation = existing.get();
            translation.setTranslatedText(translatedText);
            translation.setConfidenceScore(1.0); // Manual translation = high confidence
            translation.setIsVerified(true);
        } else {
            translation = new Translation();
            translation.setEntityType(entityType);
            translation.setEntityId(entityId);
            translation.setLanguageCode(languageCode);
            translation.setFieldName(fieldName);
            translation.setSourceText(sourceText);
            translation.setTranslatedText(translatedText);
            translation.setConfidenceScore(1.0);
            translation.setTranslationSource(Translation.SOURCE_HUMAN);
            translation.setIsVerified(true);
        }

        translation.setIsActive(true);
        translation.setLastModifiedBy(userId);

        return translationRepository.save(translation);
    }

    /**
     * Get all translations for an entity
     */
    public List<Translation> getEntityTranslations(String entityType, Long entityId) {
        return translationRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    /**
     * Get translations needing verification
     */
    public List<Translation> getTranslationsNeedingVerification() {
        return translationRepository.findTranslationsNeedingVerification(0.7);
    }

    /**
     * Verify translation
     */
    @Transactional
    @CacheEvict(value = "translations", allEntries = true)
    public void verifyTranslation(Long translationId, String userId) {
        Optional<Translation> translation = translationRepository.findById(translationId);
        if (translation.isPresent()) {
            Translation t = translation.get();
            t.setIsVerified(true);
            t.setConfidenceScore(1.0);
            t.setLastModifiedBy(userId);
            translationRepository.save(t);
        }
    }

    /**
     * Get translation statistics
     */
    public Map<String, Object> getTranslationStatistics() {
        List<Object[]> stats = translationRepository.getTranslationStatisticsByLanguage();

        return Map.of(
            "totalTranslations", translationRepository.count(),
            "activeTranslations", translationRepository.findAll().stream()
                .filter(Translation::getIsActive).count(),
            "verifiedTranslations", translationRepository.findAll().stream()
                .filter(Translation::getIsVerified).count(),
            "byLanguage", stats.stream()
                .collect(Collectors.toMap(
                    arr -> (String) arr[0],
                    arr -> (Long) arr[1]
                )),
            "needingVerification", getTranslationsNeedingVerification().size()
        );
    }

    /**
     * Bulk import translations from CSV or similar format
     */
    @Transactional
    public int bulkImportTranslations(List<Translation> translations, String userId) {
        int imported = 0;
        for (Translation translation : translations) {
            try {
                translation.setLastModifiedBy(userId);
                translationRepository.save(translation);
                imported++;
            } catch (Exception e) {
                log.warn("Failed to import translation: {}", e.getMessage());
            }
        }
        return imported;
    }

    /**
     * Deactivate translation
     */
    @Transactional
    @CacheEvict(value = "translations", allEntries = true)
    public void deactivateTranslation(Long translationId, String userId) {
        Optional<Translation> translation = translationRepository.findById(translationId);
        if (translation.isPresent()) {
            Translation t = translation.get();
            t.setIsActive(false);
            t.setLastModifiedBy(userId);
            translationRepository.save(t);
        }
    }
}
