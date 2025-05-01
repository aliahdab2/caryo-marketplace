package com.autotrader.autotraderbackend.exception;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ResourceNotFoundExceptionTest {

    @Test
    void testConstructorAndGetters() {
        String resourceName = "User";
        String fieldName = "id";
        Object fieldValue = 123L;
        String expectedMessage = String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue);

        ResourceNotFoundException exception = new ResourceNotFoundException(resourceName, fieldName, fieldValue);
        
        assertEquals(expectedMessage, exception.getMessage());
        assertEquals(resourceName, exception.getResourceName());
        assertEquals(fieldName, exception.getFieldName());
        assertEquals(fieldValue, exception.getFieldValue());
        assertNull(exception.getCause(), "Cause should be null when not provided");
    }
}
