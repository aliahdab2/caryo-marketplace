package com.caryo.marketplace.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for translating English car brand and model names to Arabic
 * Uses OpenAI for high-quality translations
 */
@Service
@Slf4j
public class ArabicTranslationService {

    private final OpenAITranslationService openAiTranslationService;

    public ArabicTranslationService(OpenAITranslationService openAiTranslationService) {
        this.openAiTranslationService = openAiTranslationService;
    }


    /**
     * Translate brand name to Arabic using OpenAI
     * @param englishBrand English brand name
     * @return Arabic translation or null if translation fails
     */
    public String translateBrandToArabic(String englishBrand) {
        if (englishBrand == null || englishBrand.trim().isEmpty()) {
            return null;
        }

        try {
            String translation = openAiTranslationService.translateBrandToArabic(englishBrand.trim());
            if (translation != null && !translation.trim().isEmpty() && !translation.equals(englishBrand)) {
                log.debug("Translated brand '{}' to '{}'", englishBrand, translation);
                return translation;
            }
        } catch (Exception e) {
            log.warn("Translation failed for brand '{}': {}", englishBrand, e.getMessage());
        }

        // Return null if translation fails - no fallback
        log.debug("No translation found for brand '{}', returning null", englishBrand);
        return null;
    }

    /**
     * Translate model name to Arabic using OpenAI
     * @param englishBrand Brand name (English)
     * @param englishModel Model name (English)
     * @return Arabic translation or null if translation fails
     */
    public String translateModelToArabic(String englishBrand, String englishModel) {
        if (englishModel == null || englishModel.trim().isEmpty()) {
            return null;
        }

        try {
            String translation = openAiTranslationService.translateModelToArabic(englishBrand, englishModel.trim());
            if (translation != null && !translation.trim().isEmpty() && !translation.equals(englishModel)) {
                log.debug("Translated model '{}' for brand '{}' to '{}'", englishModel, englishBrand, translation);
                return translation;
            }
        } catch (Exception e) {
            log.warn("Translation failed for model '{}' of brand '{}': {}", englishModel, englishBrand, e.getMessage());
        }

        // Return null if translation fails - no fallback
        log.debug("No translation found for model '{}' of brand '{}', returning null", englishModel, englishBrand);
        return null;
    }

    /**
     * Get translation service status
     * @return Status information about the translation service
     */
    public String getServiceStatus() {
        return String.format("Arabic Translation Service - OpenAI: %s",
            openAiTranslationService.isAvailable() ? "Available" : "Unavailable");
    }
}
