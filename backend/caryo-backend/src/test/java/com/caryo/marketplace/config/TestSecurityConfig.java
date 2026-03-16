package com.caryo.marketplace.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpStatus;

/**
 * Security configuration for testing.
 * This configuration ensures that security exceptions are properly handled in test contexts.
 */
@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class TestSecurityConfig {

    @Bean
    @Primary
    public SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
        // Configure security similar to the main app but for test environment
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll() // Ensure this covers /api/auth/signup and /api/auth/signin
                .requestMatchers("/api/v1/test/public").permitAll()
                .requestMatchers("/api/v1/test/user").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/v1/test/admin").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/locations").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/v1/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/v1/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/locations/**").permitAll()
                .anyRequest().authenticated()
            )
            // Handle security exceptions properly in tests
            .exceptionHandling(exceptions -> exceptions
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                })
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                })
            );
        return http.build();
    }
}
