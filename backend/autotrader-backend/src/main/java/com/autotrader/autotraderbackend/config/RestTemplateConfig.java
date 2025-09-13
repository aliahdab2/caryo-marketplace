package com.autotrader.autotraderbackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.*;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.security.cert.X509Certificate;

/**
 * Configuration for REST template beans used for external API calls
 * Provides single, properly configured RestTemplate for all external API communication
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class RestTemplateConfig {

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    /**
     * General-purpose RestTemplate bean with default configuration
     */
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();

        // Configure with reasonable defaults for general API calls
        SimpleClientHttpRequestFactory requestFactory = createRequestFactory(30000); // 30 seconds

        restTemplate.setRequestFactory(requestFactory);

        log.debug("Created general-purpose RestTemplate with 30s timeouts (SSL bypass enabled for dev environments)");
        return restTemplate;
    }

    /**
     * Create SSL-bypassing request factory for development environments
     * This is needed because CarQuery API has certificate issues
     */
    private SimpleClientHttpRequestFactory createRequestFactory(int timeout) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory() {
            @Override
            protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
                super.prepareConnection(connection, httpMethod);
                // Enable redirect following for CarQuery API
                connection.setInstanceFollowRedirects(true);
            }
        };
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);

        // For development environments, bypass SSL certificate validation
        // This is necessary because CarQuery API currently has certificate issues
        if ("dev".equals(activeProfile) || "development".equals(activeProfile) ||
            "test".equals(activeProfile) || "integration".equals(activeProfile)) {

            try {
                log.warn("⚠️ SSL certificate validation disabled for CarQuery API in {} environment", activeProfile);

                // Create a trust manager that does not validate certificate chains
                TrustManager[] trustAllCerts = new TrustManager[] {
                    new X509TrustManager() {
                        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                        public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                        public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                    }
                };

                // Install the all-trusting trust manager
                SSLContext sslContext = SSLContext.getInstance("SSL");
                sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

                // Create an ssl socket factory with our all-trusting manager
                SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();

                // Set up the request factory to use our SSL socket factory
                HttpsURLConnection.setDefaultSSLSocketFactory(sslSocketFactory);
                HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> true);

            } catch (Exception e) {
                log.error("Failed to configure SSL bypass for CarQuery API: {}", e.getMessage());
            }
        }

        return requestFactory;
    }

    /**
     * Specialized RestTemplate for CarQuery API with custom configuration
     * Only created when CarQuery API is enabled
     */
    @Bean("carQueryRestTemplate")
    @ConditionalOnProperty(name = "carquery.api.enabled", havingValue = "true", matchIfMissing = true)
    public RestTemplate carQueryRestTemplate(CarQueryConfiguration config) {
        RestTemplate restTemplate = new RestTemplate();

        // Configure with CarQuery-specific settings and SSL handling
        SimpleClientHttpRequestFactory requestFactory = createRequestFactory(config.getTimeout());
        restTemplate.setRequestFactory(requestFactory);

        // Add interceptors for logging and monitoring
        restTemplate.getInterceptors().add(new CarQueryLoggingInterceptor());

        log.info("Created CarQuery RestTemplate with {}ms timeout (SSL bypass enabled for dev environments)", config.getTimeout());
        return restTemplate;
    }

    /**
     * Custom interceptor for CarQuery API logging and headers
     */
    private static class CarQueryLoggingInterceptor implements org.springframework.http.client.ClientHttpRequestInterceptor {
        @Override
        public org.springframework.http.client.ClientHttpResponse intercept(
                org.springframework.http.HttpRequest request,
                byte[] body,
                org.springframework.http.client.ClientHttpRequestExecution execution) throws java.io.IOException {

            long startTime = System.currentTimeMillis();

            // Add User-Agent header to avoid 403 Forbidden responses
            request.getHeaders().set("User-Agent",
                "CaryoMarketplace/1.0 (https://caryo.sy)");
            // Add additional headers that might help
            request.getHeaders().set("Accept", "application/json, text/plain, */*");
            request.getHeaders().set("Accept-Language", "en-US,en;q=0.9");

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
