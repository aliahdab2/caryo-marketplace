package com.autotrader.autotraderbackend.security.jwt;

import com.autotrader.autotraderbackend.exception.jwt.CustomJwtException;
import com.autotrader.autotraderbackend.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
public class AuthTokenFilter extends OncePerRequestFilter {
    
    private JwtUtils jwtUtils;
    private UserDetailsServiceImpl userDetailsService;
    
    // Constructor injection to allow proper mocking in tests
    @Autowired
    public AuthTokenFilter(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }
    
    // Default constructor for Spring
    public AuthTokenFilter() {
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                    @NonNull HttpServletResponse response, 
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null) {
                try {
                    // jwtUtils.validateJwtToken now throws CustomJwtException or its subclasses on failure
                    jwtUtils.validateJwtToken(jwt); 
                    
                    // If validateJwtToken does not throw, the token is valid. Proceed to authenticate.
                    String username = jwtUtils.getUserNameFromJwtToken(jwt);
                    
                    try {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } catch (Exception userException) {
                        // Log errors related to user loading or setting authentication context
                        log.error("AuthTokenFilter: Error loading user details or setting authentication for username '{}': {}", username, userException.getMessage());
                        // Authentication not set, AuthEntryPointJwt will handle it
                    }
                } catch (CustomJwtException e) {
                    // Log specific JWT validation errors
                    String tokenPrefix = jwt.length() > 10 ? jwt.substring(0, 10) + "..." : jwt;
                    log.error("AuthTokenFilter: JWT validation failed for token starting with '{}': {}. Type: {}", 
                              tokenPrefix,
                              e.getMessage(), 
                              e.getClass().getSimpleName());
                    // Authentication not set, AuthEntryPointJwt will handle it
                }
            }
        } catch (Exception e) {
            // This catch block is for unexpected errors during JWT parsing or filter processing itself,
            // not for JWT validation failures (handled by CustomJwtException) or user loading issues.
            log.error("AuthTokenFilter: Unexpected error processing JWT or filter chain: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7);
            // Return null for empty tokens to avoid validation attempts on empty strings
            return StringUtils.hasText(token) ? token : null;
        }

        return null;
    }
}
