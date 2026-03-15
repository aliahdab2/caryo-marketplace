package com.caryo.marketplace.service;

import com.caryo.marketplace.dto.openai.OpenAIResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests demonstrating the robustness of our DTO approach against API changes
 */
@ExtendWith(MockitoExtension.class)
class OpenAITranslationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void dtoApproach_HandlesExtraFieldsGracefully() throws Exception {
        // Given: OpenAI adds new fields (common scenario)
        String jsonWithExtraFields = """
            {
              "id": "chatcmpl-123",
              "object": "chat.completion",
              "created": 1677652288,
              "model": "gpt-4",
              "choices": [{
                "index": 0,
                "message": {
                  "role": "assistant",
                  "content": "سيارة"
                },
                "finish_reason": "stop"
              }],
              "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15
              },
              "newField": "OpenAI added this",           // 🆕 New field
              "metadata": {"version": "2.0"},            // 🆕 New object
              "experimental_features": ["feature1", "feature2"]  // 🆕 New array
            }
            """;

        // When: We parse with our DTOs
        OpenAIResponse response = objectMapper.readValue(jsonWithExtraFields, OpenAIResponse.class);

        // Then: Parsing succeeds, extra fields are ignored
        assertTrue(response.hasValidTranslation());
        assertEquals("سيارة", response.getChoices().get(0).getMessage().getContent());
        assertEquals("gpt-4", response.getModel());

        // Extra fields don't break anything
        assertNull(response.getId()); // We don't define this field in DTO
    }

    @Test
    void dtoApproach_FailsClearlyWhenRequiredFieldsMissing() throws Exception {
        // Given: OpenAI changes structure (breaks our integration)
        String jsonWithMissingFields = """
            {
              "id": "chatcmpl-123",
              "object": "chat.completion",
              "created": 1677652288,
              "model": "gpt-4",
              "results": [{                                    // 🆕 Changed from "choices"
                "output": {                                   // 🆕 Changed from "message"
                  "role": "assistant",
                  "text": "سيارة"                              // 🆕 Changed from "content"
                }
              }]
            }
            """;

        // When: We try to parse
        OpenAIResponse response = objectMapper.readValue(jsonWithMissingFields, OpenAIResponse.class);

        // Then: Validation clearly shows the problem
        assertFalse(response.hasValidTranslation(), "Should detect missing required fields");
        assertNull(response.getChoices(), "Choices field is missing");
    }

    @Test
    void dtoApproach_ProvidesClearErrorMessages() {
        // Given: Malformed JSON
        String malformedJson = """
            {
              "choices": [{
                "message": {
                  "content": "سيارة"
                }
              }
            """; // Missing closing brace

        // When & Then: Parsing fails with clear error
        Exception exception = assertThrows(Exception.class, () -> {
            objectMapper.readValue(malformedJson, OpenAIResponse.class);
        });

        assertTrue(exception.getMessage().contains("JSON"), "Error message mentions JSON parsing");
    }

    @Test
    void dtoApproach_IsTypeSafe() throws Exception {
        // Given: Valid JSON with correct types
        String validJson = """
            {
              "choices": [{
                "index": 0,
                "message": {
                  "role": "assistant",
                  "content": "سيارة"
                },
                "finish_reason": "stop"
              }]
            }
            """;

        // When: We parse
        OpenAIResponse response = objectMapper.readValue(validJson, OpenAIResponse.class);

        // Then: We get strongly-typed objects, no casting needed
        assertNotNull(response.getChoices());
        assertNotNull(response.getChoices().get(0).getMessage());
        assertEquals("سيارة", response.getChoices().get(0).getMessage().getContent());

        // Type safety: compiler prevents wrong field access
        // response.getChoices().get(0).getMessage().getWrongField(); // ❌ Compile error
    }
}
