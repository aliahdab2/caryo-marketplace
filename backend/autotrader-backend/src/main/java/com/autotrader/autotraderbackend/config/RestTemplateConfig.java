package com.autotrader.autotraderbackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration for REST template beans used for external API calls
 * Provides single, properly configured RestTemplate for all external API communication
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class RestTemplateConfig {

    /**
     * General-purpose RestTemplate bean with default configuration
     */
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();

        // Configure with reasonable defaults for general API calls
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(30000); // 30 seconds
        requestFactory.setReadTimeout(30000);

        restTemplate.setRequestFactory(requestFactory);

        log.debug("Created general-purpose RestTemplate with 30s timeouts");
        return restTemplate;
    }

    /**
     * Specialized RestTemplate for CarQuery API with custom configuration
     * Only created when CarQuery API is enabled
     */
    @Bean("carQueryRestTemplate")
    @ConditionalOnProperty(name = "carquery.api.enabled", havingValue = "true", matchIfMissing = true)
    public RestTemplate carQueryRestTemplate(CarQueryConfiguration config) {
        RestTemplate restTemplate = new RestTemplate();

        // Configure with CarQuery-specific settings
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(config.getTimeout());
        requestFactory.setReadTimeout(config.getTimeout());

        restTemplate.setRequestFactory(requestFactory);

        // Add interceptors for logging and monitoring
        restTemplate.getInterceptors().add(new CarQueryLoggingInterceptor());

        log.info("Created CarQuery RestTemplate with {}ms timeout", config.getTimeout());
        return restTemplate;
    }

    /**
     * Custom interceptor for CarQuery API logging
     */
    private static class CarQueryLoggingInterceptor implements org.springframework.http.client.ClientHttpRequestInterceptor {
        @Override
        public org.springframework.http.client.ClientHttpResponse intercept(
                org.springframework.http.HttpRequest request,
                byte[] body,
                org.springframework.http.client.ClientHttpRequestExecution execution) throws java.io.IOException {

            long startTime = System.currentTimeMillis();
            log.debug("CarQuery API request: {} {}", request.getMethod(), request.getURI());

            try {
                org.springframework.http.client.ClientHttpResponse response = execution.execute(request, body);
                long duration = System.currentTimeMillis() - startTime;

                log.debug("CarQuery API response: {} in {}ms", response.getStatusCode(), duration);
                return response;
            } catch (Exception e) {
                long duration = System.currentTimeMillis() - startTime;
                log.warn("CarQuery API error after {}ms: {}", duration, e.getMessage());
                throw e;
            }
        }
    }
}
