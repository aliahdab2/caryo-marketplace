package com.autotrader.autotraderbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for translating English car brand and model names to Arabic
 * Uses OpenAI for high-quality translations with fallback mappings
 */
@Service
@Slf4j
public class ArabicTranslationService {

    private final OpenAITranslationService openAiTranslationService;

    // Fallback brand translations (for when OpenAI is unavailable)
    private final Map<String, String> fallbackBrandTranslations = new HashMap<>();

    // Fallback model translations
    private final Map<String, Map<String, String>> fallbackModelTranslations = new HashMap<>();

    public ArabicTranslationService(OpenAITranslationService openAiTranslationService) {
        this.openAiTranslationService = openAiTranslationService;
        initializeFallbackTranslations();
    }

    /**
     * Initialize fallback translations (used when OpenAI is unavailable)
     */
    private void initializeFallbackTranslations() {
        // Common brand translations as fallback
        fallbackBrandTranslations.put("Toyota", "تويوتا");
        fallbackBrandTranslations.put("Honda", "هوندا");
        fallbackBrandTranslations.put("Nissan", "نيسان");
        fallbackBrandTranslations.put("BMW", "بي إم دبليو");
        fallbackBrandTranslations.put("Mercedes-Benz", "مرسيدس بنز");
        fallbackBrandTranslations.put("Hyundai", "هيونداي");
        fallbackBrandTranslations.put("Kia", "كيا");
        fallbackBrandTranslations.put("Ford", "فورد");
        fallbackBrandTranslations.put("Chevrolet", "شفروليه");
        fallbackBrandTranslations.put("Mazda", "مازدا");
        fallbackBrandTranslations.put("Subaru", "سوبارو");
        fallbackBrandTranslations.put("Peugeot", "بيجو");
        fallbackBrandTranslations.put("Renault", "رينو");

        // Some model translations
        Map<String, String> toyotaModels = new HashMap<>();
        toyotaModels.put("Corolla", "كورولا");
        toyotaModels.put("Camry", "كامري");
        toyotaModels.put("RAV4", "راف 4");
        toyotaModels.put("Land Cruiser", "لاند كروزر");
        fallbackModelTranslations.put("Toyota", toyotaModels);

        Map<String, String> bmwModels = new HashMap<>();
        bmwModels.put("3 Series", "سلسلة 3");
        bmwModels.put("5 Series", "سلسلة 5");
        bmwModels.put("X3", "إكس 3");
        bmwModels.put("X5", "إكس 5");
        fallbackModelTranslations.put("BMW", bmwModels);

        log.info("Initialized fallback translations - Brands: {}, Models: {}",
                fallbackBrandTranslations.size(), fallbackModelTranslations.size());
    }


    /**
     * Translate brand name to Arabic using OpenAI with fallback
     * @param englishBrand English brand name
     * @return Arabic translation or English name if translation fails
     */
    public String translateBrandToArabic(String englishBrand) {
        if (englishBrand == null || englishBrand.trim().isEmpty()) {
            return englishBrand;
        }

        String trimmedBrand = englishBrand.trim();

        // Try OpenAI translation first
        if (openAiTranslationService.isAvailable()) {
            try {
                String openAiTranslation = openAiTranslationService.translateBrandToArabic(trimmedBrand);
                if (!openAiTranslation.equals(trimmedBrand)) {
                    log.debug("OpenAI translated brand '{}' to '{}'", trimmedBrand, openAiTranslation);
                    return openAiTranslation;
                }
            } catch (Exception e) {
                log.warn("OpenAI translation failed for brand '{}': {}", trimmedBrand, e.getMessage());
            }
        }

        // Fallback to local mappings
        String fallbackTranslation = fallbackBrandTranslations.get(trimmedBrand);
        if (fallbackTranslation != null) {
            log.debug("Using fallback translation for brand '{}' -> '{}'", trimmedBrand, fallbackTranslation);
            return fallbackTranslation;
        }

        // Try case-insensitive match
        for (Map.Entry<String, String> entry : fallbackBrandTranslations.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(trimmedBrand)) {
                log.debug("Using fallback translation for brand '{}' -> '{}' (case-insensitive)",
                         trimmedBrand, entry.getValue());
                return entry.getValue();
            }
        }

        // Return original if no translation found
        log.debug("No Arabic translation found for brand '{}', using original", trimmedBrand);
        return trimmedBrand;
    }

    /**
     * Translate model name to Arabic using OpenAI with fallback
     * @param englishBrand Brand name (English)
     * @param englishModel Model name (English)
     * @return Arabic translation or English name if translation fails
     */
    public String translateModelToArabic(String englishBrand, String englishModel) {
        if (englishModel == null || englishModel.trim().isEmpty()) {
            return englishModel;
        }

        String trimmedModel = englishModel.trim();

        // Try OpenAI translation first
        if (openAiTranslationService.isAvailable()) {
            try {
                String openAiTranslation = openAiTranslationService.translateModelToArabic(englishBrand, trimmedModel);
                if (!openAiTranslation.equals(trimmedModel)) {
                    log.debug("OpenAI translated model '{}' for brand '{}' to '{}'",
                             trimmedModel, englishBrand, openAiTranslation);
                    return openAiTranslation;
                }
            } catch (Exception e) {
                log.warn("OpenAI translation failed for model '{}' of brand '{}': {}",
                        trimmedModel, englishBrand, e.getMessage());
            }
        }

        // Fallback to local model mappings
        Map<String, String> brandModels = fallbackModelTranslations.get(englishBrand);
        if (brandModels != null) {
            String fallbackModel = brandModels.get(trimmedModel);
            if (fallbackModel != null) {
                log.debug("Using fallback translation for model '{}' of brand '{}' -> '{}'",
                         trimmedModel, englishBrand, fallbackModel);
                return fallbackModel;
            }

            // Try case-insensitive match
            for (Map.Entry<String, String> entry : brandModels.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(trimmedModel)) {
                    log.debug("Using fallback translation for model '{}' of brand '{}' -> '{}' (case-insensitive)",
                             trimmedModel, englishBrand, entry.getValue());
                    return entry.getValue();
                }
            }
        }

        // Fallback: try to translate as a brand (some models might be standalone brands)
        String brandTranslation = translateBrandToArabic(trimmedModel);
        if (!brandTranslation.equals(trimmedModel)) {
            return brandTranslation;
        }

        // Return original if no translation found
        log.debug("No Arabic translation found for model '{}' of brand '{}', using original",
                 trimmedModel, englishBrand);
        return trimmedModel;
    }

    /**
     * Get translation service status
     * @return Status information about the translation service
     */
    public String getServiceStatus() {
        return String.format("Arabic Translation Service - OpenAI: %s, Fallback Brands: %d, Fallback Models: %d",
            openAiTranslationService.isAvailable() ? "Available" : "Unavailable",
            fallbackBrandTranslations.size(),
            fallbackModelTranslations.size());
    }
}
