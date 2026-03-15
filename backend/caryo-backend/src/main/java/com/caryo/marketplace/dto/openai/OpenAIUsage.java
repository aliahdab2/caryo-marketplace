package com.caryo.marketplace.dto.openai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * OpenAI API Usage statistics DTO
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenAIUsage {
    @JsonProperty("prompt_tokens")
    private int promptTokens;

    @JsonProperty("completion_tokens")
    private int completionTokens;

    @JsonProperty("total_tokens")
    private int totalTokens;

    /**
     * Calculates the cost based on token usage (simplified example)
     * In reality, you'd want more sophisticated pricing logic
     */
    public double calculateEstimatedCost() {
        // GPT-4o-mini pricing (as of 2025)
        // $0.00015 per 1K input tokens, $0.0006 per 1K output tokens
        double inputCost = (promptTokens / 1000.0) * 0.00015;
        double outputCost = (completionTokens / 1000.0) * 0.0006;
        return inputCost + outputCost;
    }

    /**
     * Validates that usage data is present and reasonable
     */
    public boolean hasValidUsageData() {
        return totalTokens >= 0 &&
               promptTokens >= 0 &&
               completionTokens >= 0 &&
               (promptTokens + completionTokens) == totalTokens;
    }
}
