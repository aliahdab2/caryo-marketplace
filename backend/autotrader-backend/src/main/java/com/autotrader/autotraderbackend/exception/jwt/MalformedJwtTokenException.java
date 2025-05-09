package com.autotrader.autotraderbackend.exception.jwt;

public class MalformedJwtTokenException extends CustomJwtException {
    public MalformedJwtTokenException(String message) {
        super(message);
    }

    public MalformedJwtTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
