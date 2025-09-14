package com.autotrader.autotraderbackend.dto.openai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * OpenAI API Response DTO
 */
@Data
public class OpenAIResponse {
    private String id;

    @JsonProperty("object")
    private String object;

    private long created;

    private String model;

    private List<OpenAIChoice> choices;

    @JsonProperty("usage")
    private OpenAIUsage usage;

    @Data
    public static class OpenAIUsage {
        @JsonProperty("prompt_tokens")
        private int promptTokens;

        @JsonProperty("completion_tokens")
        private int completionTokens;

        @JsonProperty("total_tokens")
        private int totalTokens;
    }
}
