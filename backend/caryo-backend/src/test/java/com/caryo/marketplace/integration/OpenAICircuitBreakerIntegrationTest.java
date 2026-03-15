package com.caryo.marketplace.integration;

import com.caryo.marketplace.service.OpenAITranslationService;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

@SpringBootTest(properties = {
        "openai.api.key=test-key", // Enable the service
        "resilience4j.circuitbreaker.instances.openai.sliding-window-size=5", // Small window for faster testing
        "resilience4j.circuitbreaker.instances.openai.failure-rate-threshold=50",
        "resilience4j.circuitbreaker.instances.openai.wait-duration-in-open-state=10s"
})
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
public class OpenAICircuitBreakerIntegrationTest {

    @Autowired
    private OpenAITranslationService translationService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    private MockRestServiceServer mockServer;

    @BeforeEach
    public void setUp() {
        mockServer = MockRestServiceServer.bindTo(restTemplate).build();

        // Reset circuit breaker state before each test
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("openai");
        circuitBreaker.reset();
    }

    @Test
    public void testCircuitBreakerOpensOnFailures() {
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("openai");

        // 1. Verify initial state is CLOSED
        assertEquals(CircuitBreaker.State.CLOSED, circuitBreaker.getState());

        // 2. Simulate failures to trip the breaker
        // Properties set sliding window to 5 with 50% failure threshold
        // So 3 failures out of 5 should trip it

        // Mock 5 consecutive 500 errors
        for (int i = 0; i < 5; i++) {
            mockServer.expect(requestTo("https://api.openai.com/v1/chat/completions"))
                    .andExpect(method(HttpMethod.POST))
                    .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));
        }

        // Execute calls that will fail
        for (int i = 0; i < 5; i++) {
            String result = translationService.translateToArabic("Toyota Camry");
            assertNull(result, "Fallback should return null on failure");
        }

        // 3. Verify Circuit Breaker is now OPEN
        assertEquals(CircuitBreaker.State.OPEN, circuitBreaker.getState());

        // 4. Verify subsequent call calls fallback DIRECTLY without hitting API
        // We do NOT add a mock expectation here. If it calls API, test fails with "no
        // further requests expected"
        String fallbackResult = translationService.translateToArabic("Honda Civic");
        assertNull(fallbackResult);
    }

    @Test
    public void testCircuitBreakerRemainsClosedOnSuccess() {
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("openai");

        String successJson = """
                {
                  "id": "chatcmpl-123",
                  "choices": [{
                    "message": {
                      "content": "كامري"
                    },
                    "finish_reason": "stop"
                  }]
                }
                """;

        // Mock 5 successful responses
        for (int i = 0; i < 5; i++) {
            mockServer.expect(requestTo("https://api.openai.com/v1/chat/completions"))
                    .andExpect(method(HttpMethod.POST))
                    .andRespond(withStatus(HttpStatus.OK)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(successJson));
        }

        // Execute calls
        for (int i = 0; i < 5; i++) {
            String result = translationService.translateToArabic("Camry");
            assertEquals("كامري", result);
        }

        // Verify state is still CLOSED
        assertEquals(CircuitBreaker.State.CLOSED, circuitBreaker.getState());
        mockServer.verify();
    }
}
