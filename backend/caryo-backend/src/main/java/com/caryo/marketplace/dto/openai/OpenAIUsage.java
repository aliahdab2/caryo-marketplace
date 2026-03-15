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
        // GPT-4 pricing (approximate as of 2024)
        // $0.03 per 1K input tokens, $0.06 per 1K output tokens
        double inputCost = (promptTokens / 1000.0) * 0.03;
        double outputCost = (completionTokens / 1000.0) * 0.06;
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
