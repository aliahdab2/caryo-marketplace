package com.autotrader.autotraderbackend.security.jwt;

import com.autotrader.autotraderbackend.exception.jwt.CustomJwtException;
import com.autotrader.autotraderbackend.exception.jwt.ExpiredJwtTokenException;
import com.autotrader.autotraderbackend.exception.jwt.InvalidJwtSignatureException;
import com.autotrader.autotraderbackend.exception.jwt.MalformedJwtTokenException;
import com.autotrader.autotraderbackend.exception.jwt.UnsupportedJwtTokenException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.Objects;

@Slf4j
@Component
public class JwtUtils {

    @Value("${autotrader.app.jwtSecret}")
    private String jwtSecret;

    @Value("${autotrader.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    public String generateJwtToken(Authentication authentication) {
        Objects.requireNonNull(authentication, "Authentication cannot be null");
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Objects.requireNonNull(userPrincipal, "UserPrincipal cannot be null");
        Objects.requireNonNull(userPrincipal.getUsername(), "Username cannot be null");
        if (StringUtils.isBlank(userPrincipal.getUsername())) {
            throw new IllegalArgumentException("Username cannot be blank");
        }

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    public String generateJwtTokenForUser(com.autotrader.autotraderbackend.model.User user) {
        Objects.requireNonNull(user, "User cannot be null");
        Objects.requireNonNull(user.getUsername(), "Username cannot be null");
        if (StringUtils.isBlank(user.getUsername())) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key key() {
        if (StringUtils.isBlank(jwtSecret)) {
            throw new CustomJwtException("JWT secret is not configured");
        }
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String getUserNameFromJwtToken(String token) {
        if (StringUtils.isBlank(token)) {
            throw new MalformedJwtTokenException("JWT token is null or empty");
        }
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        // Check for null, empty, or whitespace tokens
        if (StringUtils.isBlank(authToken)) {
            log.error("JWT token is null or empty");
            throw new MalformedJwtTokenException("JWT token is null or empty");
        }
        
        // Additional check for null characters which StringUtils.isBlank doesn't catch
        if (authToken.indexOf('\u0000') >= 0) {
            log.error("JWT token contains null characters");
            throw new MalformedJwtTokenException("JWT token contains null characters");
        }

        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
            throw new InvalidJwtSignatureException("Invalid JWT signature: " + e.getMessage(), e);
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            throw new MalformedJwtTokenException("Invalid JWT token: " + e.getMessage(), e);
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
            throw new ExpiredJwtTokenException("JWT token is expired: " + e.getMessage(), e);
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
            throw new UnsupportedJwtTokenException("JWT token is unsupported: " + e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
            throw new CustomJwtException("JWT claims string is empty: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected JWT validation error: {}", e.getMessage());
            throw new CustomJwtException("Unexpected JWT validation error: " + e.getMessage(), e);
        }
    }
}
