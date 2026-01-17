package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.service.CarQueryApiClient;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
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
        "carquery.api.enabled=true",
        "resilience4j.circuitbreaker.instances.carquery.sliding-window-size=5",
        "resilience4j.circuitbreaker.instances.carquery.failure-rate-threshold=50",
        "resilience4j.circuitbreaker.instances.carquery.wait-duration-in-open-state=10s"
})
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
public class CarQueryCircuitBreakerIntegrationTest {

    @Autowired
    private CarQueryApiClient carQueryApiClient;

    @Autowired
    @Qualifier("carQueryRestTemplate")
    private RestTemplate carQueryRestTemplate;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @Autowired
    private org.springframework.cache.CacheManager cacheManager;

    private MockRestServiceServer mockServer;

    @BeforeEach
    public void setUp() {
        // Important: Bind to the SPECIFIC RestTemplate used by CarQueryApiClient
        mockServer = MockRestServiceServer.bindTo(carQueryRestTemplate).build();

        // Reset circuit breaker state before each test
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("carquery");
        circuitBreaker.reset();

        // Clear cache to force API calls
        if (cacheManager.getCache("carqueryMakes") != null) {
            cacheManager.getCache("carqueryMakes").clear();
        }
    }

    @Test
    public void testCircuitBreakerOpensOnFailures() {
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("carquery");

        assertEquals(CircuitBreaker.State.CLOSED, circuitBreaker.getState());

        // Mock 5 consecutive 500 errors
        for (int i = 0; i < 5; i++) {
            mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("cmd=getMakes")))
                    .andExpect(method(HttpMethod.GET))
                    .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));
        }

        // Execute calls that will fail
        for (int i = 0; i < 5; i++) {
            var result = carQueryApiClient.getAllMakes();
            assertNull(result, "Fallback should return null on failure");
        }

        // Verify Circuit Breaker is now OPEN
        assertEquals(CircuitBreaker.State.OPEN, circuitBreaker.getState());

        // Call again - should go straight to fallback
        // No mock expectation needed as it shouldn't hit the API
        var fallbackResult = carQueryApiClient.getAllMakes();
        assertNull(fallbackResult);
    }

    @Test
    public void testCircuitBreakerRemainsClosedOnSuccess() {
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("carquery");

        String successJson = """
                {
                  "Makes": [
                    {"make_id": "toyota", "make_display": "Toyota", "make_is_common": "1", "make_country": "Japan"},
                    {"make_id": "honda", "make_display": "Honda", "make_is_common": "1", "make_country": "Japan"}
                  ]
                }
                """;

        // Mock successful responses
        // Note: CarQueryApiClient filters the response, so we need valid data
        for (int i = 0; i < 5; i++) {
            mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("cmd=getMakes")))
                    .andExpect(method(HttpMethod.GET))
                    .andRespond(withStatus(HttpStatus.OK)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(successJson));
        }

        // Execute calls
        for (int i = 0; i < 5; i++) {
            // Clear cache to ensure each call hits the API (and thus the Circuit Breaker)
            if (cacheManager.getCache("carqueryMakes") != null) {
                cacheManager.getCache("carqueryMakes").clear();
            }

            var result = carQueryApiClient.getAllMakes();
            assertNotNull(result);
            assertEquals(2, result.getMakes().size());
        }

        assertEquals(CircuitBreaker.State.CLOSED, circuitBreaker.getState());
        mockServer.verify();
    }
}
