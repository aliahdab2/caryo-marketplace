package com.autotrader.autotraderbackend.dto.openai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * OpenAI API Message DTO
 */
@Data
public class OpenAIMessage {
    private String role;

    @JsonProperty("content")
    private String content;
}
