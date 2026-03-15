package com.caryo.marketplace.dto.openai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * OpenAI API Message DTO
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true) // 🛡️ Handles API changes
public class OpenAIMessage {
    private String role;

    @JsonProperty("content")
    private String content;
}
