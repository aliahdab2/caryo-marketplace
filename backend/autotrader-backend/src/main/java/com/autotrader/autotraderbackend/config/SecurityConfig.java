package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.exception.AuthenticationExceptionFilter;
import com.autotrader.autotraderbackend.security.jwt.AuthTokenFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, AuthTokenFilter authTokenFilter, AuthenticationExceptionFilter authExceptionFilter, ObjectMapper objectMapper) throws Exception {
        // Disable CSRF, we're using JWT
        http.csrf(AbstractHttpConfigurer::disable)
            // Don't authenticate these specific requests
            .authorizeHttpRequests(auth -> auth
                // Admin role enforcement should come before permitAll for overlapping patterns
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/locations").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/locations/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/locations/**").hasRole("ADMIN")
                // Test endpoint security configuration
                .requestMatchers("/api/test/admin").hasRole("ADMIN")
                .requestMatchers("/api/test/user").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/test/public").permitAll()
                // Publicly accessible GET requests
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/locations/**").permitAll()
                // Other permitAll rules
                .requestMatchers("/").permitAll()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/service-status").permitAll()
                .requestMatchers("/actuator/health/**").permitAll()
                .requestMatchers("/actuator/info").permitAll()
                .requestMatchers("/api-docs").permitAll()
                .requestMatchers("/v3/api-docs").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                .requestMatchers("/swagger-ui.html").permitAll()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/swagger-resources/**").permitAll()
                .requestMatchers("/webjars/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/files/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/listings/**").permitAll()
                .anyRequest().authenticated()
            )
            // Handle access denied exceptions properly
            .exceptionHandling(exceptions -> exceptions
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType("application/json;charset=UTF-8"); // Changed to application/json
                    Map<String, String> body = new HashMap<>();
                    body.put("message", "Forbidden: " + accessDeniedException.getMessage());
                    objectMapper.writeValue(response.getWriter(), body); // Write JSON response
                })
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType("application/json;charset=UTF-8"); // Changed to application/json
                    Map<String, String> body = new HashMap<>();
                    // Customize message for BadCredentialsException for Postman tests
                    if (authException instanceof org.springframework.security.authentication.BadCredentialsException) {
                        body.put("message", "Unauthorized: Bad credentials");
                    } else {
                        body.put("message", "Unauthorized: " + authException.getMessage());
                    }
                    objectMapper.writeValue(response.getWriter(), body); // Write JSON response
                })
            )
            // Use stateless session management
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
            
        // For H2 Console access
        http.headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin));
        
        // Add JWT token filter using the injected parameter
        http.addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);
        
        // Add authentication exception filter
        http.addFilterBefore(authExceptionFilter, AuthTokenFilter.class);

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
