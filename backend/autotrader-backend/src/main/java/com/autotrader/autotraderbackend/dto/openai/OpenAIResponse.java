package com.autotrader.autotraderbackend.dto.openai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * OpenAI API Response DTO
 * Uses @JsonIgnoreProperties to handle API changes gracefully
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true) // 🛡️ Ignores new fields OpenAI might add
public class OpenAIResponse {
    private String id;

    @JsonProperty("object")
    private String object;

    private long created;

    private String model;

    private List<OpenAIChoice> choices;

    @JsonProperty("usage")
    private OpenAIUsage usage;

    /**
     * Validates that we got the essential data we need for translation
     * More defensive than the basic null checks
     */
    public boolean hasValidTranslation() {
        if (choices == null || choices.isEmpty()) {
            return false;
        }

        OpenAIChoice firstChoice = choices.get(0);
        if (firstChoice == null || firstChoice.getMessage() == null) {
            return false;
        }

        String content = firstChoice.getMessage().getContent();
        return content != null && !content.trim().isEmpty();
    }

    /**
     * Safely extracts the translated content with defensive programming
     */
    public String getTranslationContent() {
        if (!hasValidTranslation()) {
            return null;
        }
        return choices.get(0).getMessage().getContent();
    }

    /**
     * Checks if the response indicates an error or incomplete data
     */
    public boolean isSuccessful() {
        return hasValidTranslation() &&
               (usage == null || usage.hasValidUsageData()); // Usage is optional
    }

    /**
     * Gets the finish reason for the first choice (useful for debugging)
     */
    public String getFinishReason() {
        if (choices != null && !choices.isEmpty()) {
            return choices.get(0).getFinishReason();
        }
        return null;
    }
}
