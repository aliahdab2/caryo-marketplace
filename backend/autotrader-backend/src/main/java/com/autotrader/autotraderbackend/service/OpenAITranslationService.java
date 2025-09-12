package com.autotrader.autotraderbackend.service;

import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatCompletionResult;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * OpenAI-powered translation service for high-quality translations
 * Integrates with existing OpenAI setup for consistent translations
 */
@Service
@Slf4j
public class OpenAITranslationService {

    private final OpenAiService openAiService;
    private final String model;

    public OpenAITranslationService(
            @Value("${openai.api.key:${OPENAI_API_KEY:}}") String apiKey,
            @Value("${openai.model:gpt-4}") String model,
            @Value("${openai.timeout:30}") int timeoutSeconds) {

        this.model = model;

        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("OpenAI API key not configured. Translations will fallback to default mappings.");
            this.openAiService = null;
        } else {
            this.openAiService = new OpenAiService(apiKey, Duration.ofSeconds(timeoutSeconds));
            log.info("OpenAI Translation Service initialized with model: {}", model);
        }
    }

    /**
     * Check if OpenAI service is available
     */
    public boolean isAvailable() {
        return openAiService != null;
    }

    /**
     * Translate car brand name to Arabic
     */
    public String translateBrandToArabic(String englishBrand) {
        if (!isAvailable()) {
            return englishBrand; // Fallback to original
        }

        try {
            String prompt = buildBrandTranslationPrompt(englishBrand);
            return translateText(prompt, englishBrand);
        } catch (Exception e) {
            log.warn("Failed to translate brand '{}' using OpenAI: {}", englishBrand, e.getMessage());
            return englishBrand; // Fallback to original
        }
    }

    /**
     * Translate car model name to Arabic
     */
    public String translateModelToArabic(String brandName, String englishModel) {
        if (!isAvailable()) {
            return englishModel; // Fallback to original
        }

        try {
            String prompt = buildModelTranslationPrompt(brandName, englishModel);
            return translateText(prompt, englishModel);
        } catch (Exception e) {
            log.warn("Failed to translate model '{}' for brand '{}' using OpenAI: {}",
                    englishModel, brandName, e.getMessage());
            return englishModel; // Fallback to original
        }
    }

    /**
     * Translate general car-related text to Arabic
     */
    public String translateCarTextToArabic(String englishText) {
        if (!isAvailable()) {
            return englishText; // Fallback to original
        }

        try {
            String prompt = buildGeneralCarTranslationPrompt(englishText);
            return translateText(prompt, englishText);
        } catch (Exception e) {
            log.warn("Failed to translate car text '{}' using OpenAI: {}", englishText, e.getMessage());
            return englishText; // Fallback to original
        }
    }

    /**
     * Core translation method using OpenAI
     */
    private String translateText(String prompt, String originalText) throws Exception {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(),
            "You are an expert translator specializing in automotive terminology. " +
            "Provide only the Arabic translation without any additional text or explanations."));
        messages.add(new ChatMessage(ChatMessageRole.USER.value(), prompt));

        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model(model)
            .messages(messages)
            .maxTokens(100)
            .temperature(0.1) // Low temperature for consistent translations
            .build();

        ChatCompletionResult result = openAiService.createChatCompletion(request);

        if (result.getChoices().isEmpty()) {
            throw new RuntimeException("No translation response from OpenAI");
        }

        String translation = result.getChoices().get(0).getMessage().getContent().trim();

        // Clean up the response (remove quotes, extra spaces)
        translation = translation.replaceAll("^[\"']|[\"']$", "").trim();

        if (translation.isEmpty()) {
            throw new RuntimeException("Empty translation response from OpenAI");
        }

        log.debug("OpenAI translated '{}' -> '{}'", originalText, translation);
        return translation;
    }

    /**
     * Build prompt for brand translation
     */
    private String buildBrandTranslationPrompt(String brandName) {
        return String.format(
            "Translate the following car brand name to Arabic, maintaining the brand identity and pronunciation:\n\n" +
            "Brand: %s\n\n" +
            "Provide only the Arabic translation. Common examples:\n" +
            "- Toyota → تويوتا\n" +
            "- BMW → بي إم دبليو\n" +
            "- Mercedes-Benz → مرسيدس بنز\n" +
            "- Hyundai → هيونداي",
            brandName
        );
    }

    /**
     * Build prompt for model translation
     */
    private String buildModelTranslationPrompt(String brandName, String modelName) {
        return String.format(
            "Translate the following car model name to Arabic:\n\n" +
            "Brand: %s\n" +
            "Model: %s\n\n" +
            "Provide only the Arabic translation. Consider:\n" +
            "- Keep numbers and special characters\n" +
            "- Use appropriate Arabic automotive terminology\n" +
            "- Maintain brand consistency\n\n" +
            "Examples:\n" +
            "- Toyota Corolla → تويوتا كورولا\n" +
            "- BMW 3 Series → بي إم دبليو سلسلة 3\n" +
            "- Mercedes-Benz C-Class → مرسيدس بنز سي كلاس",
            brandName, modelName
        );
    }

    /**
     * Build prompt for general car text translation
     */
    private String buildGeneralCarTranslationPrompt(String text) {
        return String.format(
            "Translate the following automotive text to Arabic:\n\n" +
            "Text: %s\n\n" +
            "Provide only the Arabic translation. Use appropriate automotive terminology and maintain technical accuracy.",
            text
        );
    }

    /**
     * Get translation statistics (for monitoring)
     */
    public String getServiceStatus() {
        return String.format("OpenAI Translation Service - Model: %s, Available: %s",
            model, isAvailable());
    }
}
