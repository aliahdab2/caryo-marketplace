package com.autotrader.autotraderbackend.exception.jwt;

public class ExpiredJwtTokenException extends CustomJwtException {
    public ExpiredJwtTokenException(String message) {
        super(message);
    }

    public ExpiredJwtTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
