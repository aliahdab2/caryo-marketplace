package com.caryo.marketplace.exception.jwt;

public class UnsupportedJwtTokenException extends CustomJwtException {
    public UnsupportedJwtTokenException(String message) {
        super(message);
    }

    public UnsupportedJwtTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
