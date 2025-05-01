package com.autotrader.autotraderbackend.exception;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class StorageFileNotFoundExceptionTest {

    @Test
    void testConstructorWithMessage() {
        String message = "Could not find file.";
        StorageFileNotFoundException exception = new StorageFileNotFoundException(message);
        
        assertEquals(message, exception.getMessage());
        assertNull(exception.getCause());
    }

    @Test
    void testConstructorWithMessageAndCause() {
        String message = "Could not find file due to underlying issue.";
        Throwable cause = new RuntimeException("File system error");
        StorageFileNotFoundException exception = new StorageFileNotFoundException(message, cause);
        
        assertEquals(message, exception.getMessage());
        assertEquals(cause, exception.getCause());
    }
}
