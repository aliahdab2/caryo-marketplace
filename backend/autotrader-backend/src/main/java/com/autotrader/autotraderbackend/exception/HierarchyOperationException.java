package com.autotrader.autotraderbackend.exception;

/**
 * Exception thrown when hierarchy operations fail
 */
public class HierarchyOperationException extends RuntimeException {
    
    public HierarchyOperationException(String message) {
        super(message);
    }
    
    public HierarchyOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
