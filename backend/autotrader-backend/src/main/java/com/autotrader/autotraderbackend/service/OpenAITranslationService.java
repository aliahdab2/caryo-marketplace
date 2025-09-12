package com.autotrader.autotraderbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Translation service for car-related terms from English to Arabic
 * Uses fallback translations for common terms
 */
@Service
@Slf4j
public class OpenAITranslationService {

    private final String apiKey;
    private final String model;

    public OpenAITranslationService(
            @Value("${openai.api.key:${OPENAI_API_KEY:}}") String apiKey,
            @Value("${openai.model:gpt-4o}") String model) {
        
        this.apiKey = apiKey;
        this.model = model;
        
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("OpenAI API key not configured. Translation service will use fallback methods.");
        } else {
            log.info("OpenAI Translation Service initialized with model: {} (using fallback translations)", model);
        }
    }

    /**
     * Translates text from English to Arabic using fallback translations
     */
    public String translateToArabic(String englishText) {
        if (englishText == null || englishText.trim().isEmpty()) {
            return englishText;
        }

        log.debug("Translating '{}' using fallback method", englishText);
        return getArabicFallback(englishText);
    }

    /**
     * Simple fallback translations for common car terms
     */
    private String getArabicFallback(String englishText) {
        if (englishText == null) return null;
        
        String lower = englishText.toLowerCase().trim();
        
        // Common car brand translations
        switch (lower) {
            case "toyota": return "تويوتا";
            case "honda": return "هوندا";
            case "nissan": return "نيسان";
            case "hyundai": return "هيونداي";
            case "kia": return "كيا";
            case "mercedes": case "mercedes-benz": return "مرسيدس";
            case "bmw": return "بي إم دبليو";
            case "audi": return "أودي";
            case "volkswagen": return "فولكس فاجن";
            case "ford": return "فورد";
            case "chevrolet": return "شيفروليه";
            case "peugeot": return "بيجو";
            case "renault": return "رينو";
            case "mitsubishi": return "ميتسوبيشي";
            case "mazda": return "مازدا";
            case "subaru": return "سوبارو";
            case "suzuki": return "سوزوكي";
            case "lexus": return "لكزس";
            case "infiniti": return "إنفينيتي";
            case "acura": return "أكورا";
            
            // Common model terms
            case "sedan": return "سيدان";
            case "suv": return "دفع رباعي";
            case "hatchback": return "هاتشباك";
            case "coupe": return "كوبيه";
            case "convertible": return "قابل للتحويل";
            case "wagon": return "عربة";
            case "pickup": return "بيك أب";
            case "truck": return "شاحنة";
            case "van": return "فان";
            case "crossover": return "كروس أوفر";
            
            default:
                // If no specific translation found, return original text
                return englishText;
        }
    }

    /**
     * Translates a car brand name from English to Arabic
     */
    public String translateBrandToArabic(String brandName) {
        return translateToArabic(brandName);
    }

    /**
     * Translates a car model name from English to Arabic
     */
    public String translateModelToArabic(String brandName, String modelName) {
        // For models, we can include brand context for better translation
        String contextualPrompt = String.format("Car brand: %s, Model: %s", brandName, modelName);
        return translateToArabic(contextualPrompt);
    }

    /**
     * Check if OpenAI service is available
     */
    public boolean isAvailable() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }
}