package com.autotrader.autotraderbackend.dto.openai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * OpenAI API Choice DTO
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true) // 🛡️ Handles API changes
public class OpenAIChoice {
    private int index;

    @JsonProperty("message")
    private OpenAIMessage message;

    @JsonProperty("finish_reason")
    private String finishReason;
}
