package com.caryo.marketplace.exception;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class StorageExceptionTest {

    @Test
    void testConstructorWithMessage() {
        String message = "Failed to store file.";
        StorageException exception = new StorageException(message);

        assertEquals(message, exception.getMessage());
        assertNull(exception.getCause());
    }

    @Test
    void testConstructorWithMessageAndCause() {
        String message = "Failed to store file due to underlying issue.";
        Throwable cause = new RuntimeException("Disk full");
        StorageException exception = new StorageException(message, cause);

        assertEquals(message, exception.getMessage());
        assertEquals(cause, exception.getCause());
    }
}
