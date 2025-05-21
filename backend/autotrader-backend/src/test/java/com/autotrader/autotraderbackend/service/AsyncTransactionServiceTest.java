package com.autotrader.autotraderbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AsyncTransactionService}
 */
@ExtendWith(MockitoExtension.class)
public class AsyncTransactionServiceTest {

    @Mock
    private TransactionTemplate transactionTemplate;

    @Mock
    private TransactionStatus transactionStatus;

    private AsyncTransactionService asyncTransactionService;

    @BeforeEach
    void setUp() {
        asyncTransactionService = new AsyncTransactionService(transactionTemplate);
    }

    @Test
    void executeInTransaction_withSupplier_success() {
        // Arrange
        String expected = "success";
        Supplier<String> operation = () -> expected;
        
        when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(transactionStatus);
        });

        // Act
        String result = asyncTransactionService.executeInTransaction(operation);

        // Assert
        assertEquals(expected, result);
        verify(transactionTemplate).execute(any());
        verifyNoMoreInteractions(transactionStatus);
    }

    @Test
    void executeInTransaction_withSupplier_operationThrowsException() {
        // Arrange
        Supplier<String> operation = () -> {
            throw new RuntimeException("Test exception");
        };
        
        when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(transactionStatus);
        });

        // Act
        String result = asyncTransactionService.executeInTransaction(operation);

        // Assert
        assertNull(result);
        verify(transactionTemplate).execute(any());
        verify(transactionStatus).setRollbackOnly();
    }

    @Test
    void executeInTransaction_withSupplier_transactionExceptionThrown() {
        // Arrange
        Supplier<String> operation = () -> "success";
        when(transactionTemplate.execute(any())).thenThrow(new TransactionException("Test transaction exception") {});

        // Act
        String result = asyncTransactionService.executeInTransaction(operation);

        // Assert
        assertNull(result);
        verify(transactionTemplate).execute(any());
    }

    @Test
    void executeInTransaction_withRunnable_success() {
        // Arrange
        Runnable operation = mock(Runnable.class);
        
        when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(transactionStatus);
        });

        // Act
        asyncTransactionService.executeInTransaction(operation);

        // Assert
        verify(operation).run();
        verify(transactionTemplate).execute(any());
        verifyNoMoreInteractions(transactionStatus);
    }

    @Test
    void executeInTransaction_withRunnable_operationThrowsException() {
        // Arrange
        Runnable operation = () -> {
            throw new RuntimeException("Test exception");
        };
        
        when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(transactionStatus);
        });

        // Act
        asyncTransactionService.executeInTransaction(operation);

        // Assert
        verify(transactionTemplate).execute(any());
        verify(transactionStatus).setRollbackOnly();
    }

    @Test
    void executeInTransaction_withRunnable_transactionExceptionThrown() {
        // Arrange
        Runnable operation = mock(Runnable.class);
        when(transactionTemplate.execute(any())).thenThrow(new TransactionException("Test transaction exception") {});

        // Act
        asyncTransactionService.executeInTransaction(operation);

        // Assert
        verify(transactionTemplate).execute(any());
        verifyNoInteractions(operation);
    }
}
