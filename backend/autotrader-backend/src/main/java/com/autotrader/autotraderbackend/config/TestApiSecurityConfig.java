package com.autotrader.autotraderbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;

/**
 * Security configuration for the test profile.
 * This configuration disables authentication when the property autotrader.security.auth.disabled=true
 */
@Configuration
@EnableWebSecurity
@Profile("test")
@Order(Ordered.HIGHEST_PRECEDENCE)
@EnableMethodSecurity(prePostEnabled = true)
public class TestApiSecurityConfig {

    @Bean
    @Primary
    public SecurityFilterChain testApiFilterChain(HttpSecurity http, 
                                              org.springframework.core.env.Environment env) throws Exception {
        
        // Check if auth is disabled (for API tests)
        String authDisabled = env.getProperty("autotrader.security.auth.disabled");
        boolean isAuthDisabled = "true".equalsIgnoreCase(authDisabled);
        
        System.out.println("🔐 TEST API Security Configuration loaded");
        
        // Basic security setup
        http.csrf(csrf -> csrf.disable());
        
        // Configure authorization based on test mode
        if (isAuthDisabled) {
            // For Postman/API tests, permit all requests
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            System.out.println("⚠️ TEST MODE: Security authentication is DISABLED - all endpoints are publicly accessible");
        } else {
            // For regular tests, use normal security rules
            http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/test/public").permitAll()
                .requestMatchers("/api/test/user").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/test/admin").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/locations").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/locations/**").permitAll()
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
}
