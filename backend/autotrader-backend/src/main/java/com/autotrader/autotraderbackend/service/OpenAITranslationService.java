package com.autotrader.autotraderbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Map;
import java.util.HashMap;

/**
 * Translation service using OpenAI API for car-related terms from English to Arabic
 * Falls back to local translations when API is unavailable
 */
@Service
@Slf4j
public class OpenAITranslationService {

    private final String apiKey;
    private final String model;
    private final RestTemplate restTemplate;
    private final boolean isEnabled;

    public OpenAITranslationService(
            @Value("${openai.api.key:${OPENAI_API_KEY:}}") String apiKey,
            @Value("${openai.model:gpt-4o}") String model,
            RestTemplate restTemplate) {

        this.apiKey = apiKey;
        this.model = model;
        this.restTemplate = restTemplate;
        this.isEnabled = apiKey != null && !apiKey.trim().isEmpty();

        if (this.isEnabled) {
            log.info("OpenAI Translation Service initialized with model: {}", model);
        } else {
            log.warn("OpenAI API key not configured. Translation service will use fallback methods.");
        }
    }

    /**
     * Translates text from English to Arabic using OpenAI API
     */
    public String translateToArabic(String englishText) {
        if (englishText == null || englishText.trim().isEmpty()) {
            return null;
        }

        // Try OpenAI first if available
        if (isEnabled) {
            try {
                String openAiTranslation = translateWithOpenAI(englishText);
                if (openAiTranslation != null && !openAiTranslation.trim().isEmpty() && !openAiTranslation.equals(englishText)) {
                    log.debug("OpenAI translated '{}' -> '{}'", englishText, openAiTranslation);
                    return openAiTranslation;
                }
            } catch (Exception e) {
                log.warn("OpenAI translation failed for '{}': {}", englishText, e.getMessage());
            }
        }

        // Return null if translation fails - no fallback
        log.debug("No translation found for '{}', returning null", englishText);
        return null;
    }

    /**
     * Translates text using OpenAI API via REST
     */
    private String translateWithOpenAI(String englishText) {
        if (!isEnabled) {
            return null;
        }

        try {
            String url = "https://api.openai.com/v1/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String prompt = String.format(
                "Translate this car name to Arabic. Use proper Arabic transliteration. " +
                "Return ONLY the Arabic translation, no explanations or descriptions.\n\n\"%s\"",
                englishText.trim()
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", java.util.List.of(
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("max_tokens", 100);
            requestBody.put("temperature", 0.3);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("choices")) {
                java.util.List choices = (java.util.List) response.getBody().get("choices");
                if (!choices.isEmpty()) {
                    Map choice = (Map) choices.get(0);
                    Map message = (Map) choice.get("message");
                    String translation = (String) message.get("content");

                    if (translation != null) {
                        translation = translation.trim();
                        // Clean up the response (remove quotes if present)
                        if (translation.startsWith("\"") && translation.endsWith("\"")) {
                            translation = translation.substring(1, translation.length() - 1);
                        }
                        return translation;
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error calling OpenAI API: {}", e.getMessage());
        }

        return null;
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
        // Translate only the model name, not the full context
        return translateToArabic(modelName);
    }

    /**
     * Check if OpenAI service is available
     */
    public boolean isAvailable() {
        return isEnabled;
    }
}