package com.autotrader.autotraderbackend.exception.jwt;

public class UnsupportedJwtTokenException extends CustomJwtException {
    public UnsupportedJwtTokenException(String message) {
        super(message);
    }

    public UnsupportedJwtTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
