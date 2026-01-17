package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.dto.openai.OpenAIResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Map;
import java.util.HashMap;

/**
 * Translation service using OpenAI API for car-related terms from English to
 * Arabic
 * Falls back to local translations when API is unavailable
 */
@Service
@Slf4j
public class OpenAITranslationService {

    private final String apiKey;
    private final String model;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final boolean isEnabled;

    public OpenAITranslationService(
            @Value("${openai.api.key:${OPENAI_API_KEY:}}") String apiKey,
            @Value("${openai.model:gpt-4o}") String model,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {

        this.apiKey = apiKey;
        this.model = model;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.isEnabled = apiKey != null && !apiKey.trim().isEmpty();

        if (this.isEnabled) {
            log.info("OpenAI Translation Service initialized with model: {}", model);
        } else {
            log.warn("OpenAI API key not configured. Translation service will use fallback methods.");
        }
    }

    /**
     * Translates text from English to Arabic using OpenAI API
     * Protected by circuit breaker to prevent cascading failures
     */
    @CircuitBreaker(name = "openai", fallbackMethod = "translateToArabicFallback")
    public String translateToArabic(String englishText) {
        if (englishText == null || englishText.trim().isEmpty()) {
            return null;
        }

        // Try OpenAI first if available
        if (isEnabled) {
            // Exceptions will be caught by Circuit Breaker aspect
            String openAiTranslation = translateWithOpenAI(englishText);

            if (openAiTranslation != null && !openAiTranslation.trim().isEmpty()
                    && !openAiTranslation.equals(englishText)) {
                log.debug("OpenAI translated '{}' -> '{}'", englishText, openAiTranslation);
                return openAiTranslation;
            }
        }

        // Return null if translation fails (and CB didn't trigger exception, e.g.
        // disabled)
        log.debug("No translation found for '{}', returning null", englishText);
        return null;
    }

    /**
     * Translates text using OpenAI API via REST
     */
    /**
     * Translates text using OpenAI API via REST
     */
    private String translateWithOpenAI(String englishText) {
        if (!isEnabled) {
            return null;
        }

        String url = "https://api.openai.com/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String prompt = String.format(
                "Translate this car model name to Arabic. Rules:\n" +
                        "- For alphanumeric models (like A1, 3, X5): transliterate to Arabic letters/numbers\n" +
                        "- For word models: translate meaning to Arabic\n" +
                        "- Use proper Arabic automotive terminology\n" +
                        "- Return ONLY the Arabic translation, no explanations.\n\n\"%s\"",
                englishText.trim());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", java.util.List.of(
                Map.of("role", "user", "content", prompt)));
        requestBody.put("max_tokens", 100);
        requestBody.put("temperature", 0.3);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        // This call will throw exception on failure, triggering Circuit Breaker
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (response.getBody() != null) {
            try {
                OpenAIResponse openAIResponse = objectMapper.readValue(response.getBody(), OpenAIResponse.class);

                if (openAIResponse.isSuccessful()) {
                    String rawTranslation = openAIResponse.getTranslationContent();
                    if (rawTranslation != null) {
                        String cleanedTranslation = cleanTranslationResponse(rawTranslation);

                        // Log successful translation with usage info
                        if (openAIResponse.getUsage() != null) {
                            log.debug("OpenAI translation successful. Tokens used: {}, Cost: ${:.4f}",
                                    openAIResponse.getUsage().getTotalTokens(),
                                    openAIResponse.getUsage().calculateEstimatedCost());
                        }

                        return cleanedTranslation;
                    } else {
                        log.warn("OpenAI returned successful response but no translation content");
                    }
                } else {
                    log.warn("OpenAI response validation failed. Finish reason: {}", openAIResponse.getFinishReason());
                }
            } catch (Exception e) {
                log.error("Error parsing OpenAI API response: {}", e.getMessage(), e);
                // We might want to throw here too if parsing fails, but for now we log error.
                // If parsing fails, it returns null, which is handled by cleanup.
            }
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

    /**
     * Cleans and normalizes the translation response from OpenAI
     * Handles common formatting issues like extra quotes
     */
    private String cleanTranslationResponse(String rawTranslation) {
        if (rawTranslation == null) {
            return null;
        }

        String cleaned = rawTranslation.trim();

        // Remove surrounding quotes if present (OpenAI sometimes adds them)
        if (cleaned.startsWith("\"") && cleaned.endsWith("\"") && cleaned.length() > 1) {
            cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
        }

        // Remove surrounding single quotes if present
        if (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length() > 1) {
            cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
        }

        // Basic validation - ensure it's not just whitespace or empty
        if (cleaned.isEmpty()) {
            log.warn("OpenAI returned empty translation after cleaning");
            return null;
        }

        return cleaned;
    }

    /**
     * Fallback method when circuit breaker is open for translateToArabic
     * Returns null to allow the application to continue without translation
     */
    private String translateToArabicFallback(String englishText, Exception e) {
        log.warn("⚡ Circuit breaker OPEN for OpenAI translation - API unavailable. Text: '{}', Error: {}",
                englishText, e.getMessage());
        log.info("Returning null - application should use original text or cached translation");
        return null;
    }
}