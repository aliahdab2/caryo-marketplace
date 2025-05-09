package com.autotrader.autotraderbackend.exception.jwt;

public class InvalidJwtSignatureException extends CustomJwtException {
    public InvalidJwtSignatureException(String message) {
        super(message);
    }

    public InvalidJwtSignatureException(String message, Throwable cause) {
        super(message, cause);
    }
}
