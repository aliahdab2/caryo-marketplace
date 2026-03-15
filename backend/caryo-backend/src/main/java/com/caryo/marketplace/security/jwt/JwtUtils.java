package com.caryo.marketplace.security.jwt;

import com.caryo.marketplace.exception.jwt.CustomJwtException;
import com.caryo.marketplace.exception.jwt.ExpiredJwtTokenException;
import com.caryo.marketplace.exception.jwt.InvalidJwtSignatureException;
import com.caryo.marketplace.exception.jwt.MalformedJwtTokenException;
import com.caryo.marketplace.exception.jwt.UnsupportedJwtTokenException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Objects;

@Slf4j
@Component
public class JwtUtils {

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationInMs}")
    private int jwtExpirationMs;

    public String generateJwtToken(Authentication authentication) {
        Objects.requireNonNull(authentication, "Authentication cannot be null");
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Objects.requireNonNull(userPrincipal, "UserPrincipal cannot be null");
        Objects.requireNonNull(userPrincipal.getUsername(), "Username cannot be null");
        if (StringUtils.isBlank(userPrincipal.getUsername())) {
            throw new IllegalArgumentException("Username cannot be blank");
        }

        int tokenVersion = 0;
        if (userPrincipal instanceof UserDetailsImpl) {
            tokenVersion = ((UserDetailsImpl) userPrincipal).getTokenVersion();
        }

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("tv", tokenVersion)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key())
                .compact();
    }

    public String generateJwtTokenForUser(com.caryo.marketplace.model.User user) {
        Objects.requireNonNull(user, "User cannot be null");
        Objects.requireNonNull(user.getUsername(), "Username cannot be null");
        if (StringUtils.isBlank(user.getUsername())) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("tv", user.getTokenVersion() != null ? user.getTokenVersion() : 0)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key())
                .compact();
    }

    private SecretKey key() {
        if (StringUtils.isBlank(jwtSecret)) {
            throw new CustomJwtException("JWT secret is not configured");
        }
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String getUserNameFromJwtToken(String token) {
        if (StringUtils.isBlank(token)) {
            throw new MalformedJwtTokenException("JWT token is null or empty");
        }
        return Jwts.parser().verifyWith(key()).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }

    public int getTokenVersionFromJwtToken(String token) {
        if (StringUtils.isBlank(token)) {
            return 0;
        }
        Claims claims = Jwts.parser().verifyWith(key()).build()
                .parseSignedClaims(token).getPayload();
        Integer tv = claims.get("tv", Integer.class);
        return tv != null ? tv : 0;
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
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(authToken);
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
