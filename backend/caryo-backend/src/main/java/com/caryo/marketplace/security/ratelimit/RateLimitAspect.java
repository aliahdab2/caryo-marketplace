package com.caryo.marketplace.security.ratelimit;

import com.caryo.marketplace.exception.RateLimitExceededException;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Aspect to enforce rate limiting on annotated methods
 */
@Slf4j
@Aspect
@Component
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    @Value("${app.ratelimit.enabled:true}")
    private boolean enabled;

    public RateLimitAspect(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Around("@annotation(com.caryo.marketplace.security.ratelimit.RateLimit)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!enabled) {
            return joinPoint.proceed();
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        RateLimit rateLimit = signature.getMethod().getAnnotation(RateLimit.class);

        String key = buildRateLimitKey(rateLimit.keyType(), signature.getMethod().getName());

        boolean allowed = rateLimitService.isAllowed(
            key,
            rateLimit.maxRequests(),
            rateLimit.windowSeconds()
        );

        if (!allowed) {
            int remaining = rateLimitService.getRemainingRequests(key);
            long resetTime = rateLimitService.getSecondsUntilReset(key);

            log.warn("Rate limit exceeded for key: {} (resets in {} seconds)", key, resetTime);

            throw new RateLimitExceededException(
                rateLimit.message(),
                remaining,
                resetTime
            );
        }

        return joinPoint.proceed();
    }

    /**
     * Build the rate limit key based on the key type
     */
    private String buildRateLimitKey(RateLimitKeyType keyType, String methodName) {
        String baseKey;

        switch (keyType) {
            case IP:
                baseKey = getClientIP();
                break;
            case USER:
                baseKey = getUserIdentifier();
                break;
            case IP_AND_ENDPOINT:
                baseKey = getClientIP() + ":" + methodName;
                break;
            case USER_AND_ENDPOINT:
                baseKey = getUserIdentifier() + ":" + methodName;
                break;
            default:
                baseKey = getClientIP();
        }

        return baseKey;
    }

    /**
     * Get client IP address from request
     */
    private String getClientIP() {
        ServletRequestAttributes attributes =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes == null) {
            return "unknown";
        }

        HttpServletRequest request = attributes.getRequest();

        // Check for IP in headers (proxy/load balancer scenarios)
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // Handle multiple IPs in X-Forwarded-For (take the first one)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip != null ? ip : "unknown";
    }

    /**
     * Get user identifier (username or "anonymous" if not authenticated)
     */
    private String getUserIdentifier() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
            && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            return "user:" + userDetails.getUsername();
        }

        // Fall back to IP for anonymous users
        return "anon:" + getClientIP();
    }
}
