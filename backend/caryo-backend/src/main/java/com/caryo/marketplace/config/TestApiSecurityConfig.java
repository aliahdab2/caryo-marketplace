package com.caryo.marketplace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Security configuration for the test profile.
 * This configuration disables authentication when the property caryo.security.auth.disabled=true
 */
@Configuration
@EnableWebSecurity
@Profile("test")
@Order(Ordered.HIGHEST_PRECEDENCE)
@EnableMethodSecurity(prePostEnabled = true)
public class TestApiSecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(TestApiSecurityConfig.class);

    @Bean
    @Primary
    public SecurityFilterChain testApiFilterChain(HttpSecurity http,
                                              org.springframework.core.env.Environment env) throws Exception {

        // Check if auth is disabled (for API tests)
        String authDisabled = env.getProperty("caryo.security.auth.disabled");
        boolean isAuthDisabled = "true".equalsIgnoreCase(authDisabled);

        log.info("TEST API Security Configuration loaded");

        // Basic security setup
        http.csrf(csrf -> csrf.disable());

        // Configure authorization based on test mode
        if (isAuthDisabled) {
            // For Postman/API tests, permit all requests
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            log.warn("TEST MODE: Security authentication is DISABLED - all endpoints are publicly accessible");
        } else {
            // For regular tests, use normal security rules
            http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/v1/test/public").permitAll()
                .requestMatchers("/api/v1/test/user").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/v1/test/admin").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/locations").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/v1/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/v1/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/locations/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/pricing/**").permitAll()  // Allow public access to pricing tiers
                .anyRequest().authenticated()
            );
        }

        // Handle security exceptions properly in tests
        http.exceptionHandling(exceptions -> exceptions
            .accessDeniedHandler((request, response, accessDeniedException) -> {
                response.setStatus(HttpStatus.FORBIDDEN.value());
            })
            .authenticationEntryPoint((request, response, authException) -> {
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
            })
        );
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
