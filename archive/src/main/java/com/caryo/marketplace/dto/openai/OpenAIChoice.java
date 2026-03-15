package com.caryo.marketplace.dto.openai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * OpenAI API Choice DTO
 */
@Data
public class OpenAIChoice {
    private int index;

    @JsonProperty("message")
    private OpenAIMessage message;

    @JsonProperty("finish_reason")
    private String finishReason;
}
