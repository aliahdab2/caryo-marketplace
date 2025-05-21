package com.autotrader.autotraderbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.function.Supplier;

/**
 * Service to execute code within transactions in asynchronous contexts.
 * This service provides methods for executing code within new transactions,
 * which is particularly useful for asynchronous event handlers where the
 * transaction context may be lost.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AsyncTransactionService {

    private final TransactionTemplate transactionTemplate;

    /**
     * Execute the given supplier within a new transaction.
     * If the transaction fails, exceptions are caught and logged.
     *
     * @param operation The operation to execute within a transaction
     * @param <T> The return type of the operation
     * @return The result of the operation, or null if an exception occurred
     */
    public <T> T executeInTransaction(Supplier<T> operation) {
        try {
            return transactionTemplate.execute(status -> {
                try {
                    return operation.get();
                } catch (Exception e) {
                    log.error("Error executing operation in transaction: {}", e.getMessage(), e);
                    status.setRollbackOnly();
                    return null;
                }
            });
        } catch (TransactionException e) {
            log.error("Transaction operation failed: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Execute the given runnable within a new transaction.
     * If the transaction fails, exceptions are caught and logged.
     *
     * @param operation The operation to execute within a transaction
     */
    public void executeInTransaction(Runnable operation) {
        try {
            transactionTemplate.execute(status -> {
                try {
                    operation.run();
                    return null;
                } catch (Exception e) {
                    log.error("Error executing operation in transaction: {}", e.getMessage(), e);
                    status.setRollbackOnly();
                    return null;
                }
            });
        } catch (TransactionException e) {
            log.error("Transaction operation failed: {}", e.getMessage(), e);
        }
    }
}
