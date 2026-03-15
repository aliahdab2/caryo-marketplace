package com.caryo.marketplace.service;

import com.caryo.marketplace.dto.openai.OpenAIResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests demonstrating the robustness of our DTO approach against API changes
 */
class OpenAITranslationServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Test data constants for better maintainability
    private static final String VALID_RESPONSE_JSON = """
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
              }
            }
            """;

    private static final String RESPONSE_WITH_EXTRA_FIELDS = """
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
                "total_tokens": 15,
                "estimated_cost": 0.002
              },
              "system_fingerprint": "fp_1234567890",
              "experimental_feature": true
            }
            """;

    // Helper method to create valid OpenAI response
    private OpenAIResponse createValidResponse() throws Exception {
        return objectMapper.readValue(VALID_RESPONSE_JSON, OpenAIResponse.class);
    }

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
              "newField": "OpenAI added this",
              "metadata": {"version": "2.0"},
              "experimental_features": ["feature1", "feature2"]
            }
            """;

        // When: We parse with our DTOs
        OpenAIResponse response = objectMapper.readValue(jsonWithExtraFields, OpenAIResponse.class);

        // Then: Parsing succeeds, extra fields are ignored
        assertTrue(response.hasValidTranslation());
        assertEquals("سيارة", response.getChoices().get(0).getMessage().getContent());
        assertEquals("gpt-4", response.getModel());
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
              "results": [{
                "output": {
                  "role": "assistant",
                  "text": "سيارة"
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

        assertNotNull(exception.getMessage(), "Error message is provided");
        assertTrue(exception.getMessage().length() > 0, "Error message is not empty");
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
    }

    @Test
    void demonstratesWhyIgnoringUnknownFieldsIsBestPractice() throws Exception {
        // This test demonstrates real-world scenarios with OpenAI API evolution

        // Scenario 1: OpenAI adds usage statistics (very common)
        String jsonWithUsageStats = """
            {
              "id": "chatcmpl-123",
              "object": "chat.completion",
              "created": 1677652288,
              "model": "gpt-4",
              "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": "سيارة"},
                "finish_reason": "stop"
              }],
              "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
                "estimated_cost": 0.002
              },
              "system_fingerprint": "fp_1234567890"
            }
            """;

        // ✅ With @JsonIgnoreProperties(ignoreUnknown = true) - WORKS
        OpenAIResponse response = objectMapper.readValue(jsonWithUsageStats, OpenAIResponse.class);
        assertTrue(response.hasValidTranslation());
        assertEquals("سيارة", response.getChoices().get(0).getMessage().getContent());

        // Our code continues working despite new fields we don't care about yet
        // Later we can add these fields to our DTOs if we want to use the data
    }

    @Test
    void whenCriticalFieldsChange_FailFastIsBetter() throws Exception {
        // Scenario: OpenAI changes the core structure (rare but serious)

        String jsonWithChangedStructure = """
            {
              "results": [{
                "text": "سيارة"
              }]
            }
            """;

        // When: We try to parse the changed structure
        OpenAIResponse response = objectMapper.readValue(jsonWithChangedStructure, OpenAIResponse.class);

        // Then: Our validation catches it - better than silent wrong behavior
        assertFalse(response.hasValidTranslation(), "Should detect when critical structure changes");

        // This gives us clear feedback that we need to update our DTOs
        // Much better than using wrong data!
    }

    // NOTE: Without @JsonIgnoreProperties(ignoreUnknown = true), your app would break
    // every time OpenAI adds new fields to their API response. This is demonstrated
    // by the fact that we HAD to add @JsonIgnoreProperties to make our DTOs work
    // with OpenAI's evolving API. Without it, the JSON parsing would fail with:
    // "Unrecognized field" exceptions, breaking your entire translation service!

    @Test
    void realWorldScenario_OpenAICouldBreakYourApp() {
        // Real scenario: OpenAI adds usage tracking (happened in 2023)

        String openAIResponseAfterAddingUsage = """
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
                "prompt_tokens": 13,
                "completion_tokens": 7,
                "total_tokens": 20
              }
            }
            """;

        // With @JsonIgnoreProperties(ignoreUnknown = true): ✅ WORKS
        assertDoesNotThrow(() -> {
            OpenAIResponse response = objectMapper.readValue(openAIResponseAfterAddingUsage, OpenAIResponse.class);
            assertTrue(response.hasValidTranslation());
            assertEquals("سيارة", response.getChoices().get(0).getMessage().getContent());
        });

        // Without it: Would throw exception and BREAK YOUR APP! 💥
        // Every time OpenAI makes an additive change, your translation service stops working
    }
}
