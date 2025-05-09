package com.autotrader.autotraderbackend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.AuthenticationException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;

/**
 * Filter to handle AuthenticationExceptions thrown during the filter chain,
 * ensuring a consistent JSON error response.
 */
@Component
public class AuthenticationExceptionFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationExceptionFilter.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuthenticationExceptionFilter() {
        // Constructor for Spring to instantiate
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (AuthenticationException ex) {
            logger.warn("AuthenticationException caught in AuthenticationExceptionFilter for {}: {} - {}. Responding with 401.", request.getMethod(), request.getRequestURI(), ex.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8"); // Changed to application/json

            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("status", HttpServletResponse.SC_UNAUTHORIZED);
            errorDetails.put("error", "Unauthorized");
            // Use a generic message for 401s from this filter, specific messages (like bad credentials) are handled by AuthenticationEntryPoint
            errorDetails.put("message", "Authentication failed: " + ex.getMessage());
            errorDetails.put("path", request.getRequestURI());

            response.getWriter().write(objectMapper.writeValueAsString(errorDetails)); // Changed to JSON
        }
        // Removed AccessDeniedException handling from here
        // AccessDeniedException should be handled by the AccessDeniedHandler configured in SecurityConfig
    }
}