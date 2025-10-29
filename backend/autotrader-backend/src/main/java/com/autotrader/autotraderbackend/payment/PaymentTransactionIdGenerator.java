package com.autotrader.autotraderbackend.payment;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Generates unique transaction IDs for payments
 * 
 * Format: TXN_YYYYMMDD_HHMMSS_XXXXX
 * Example: TXN_20250129_143052_00001
 */
@Component
public class PaymentTransactionIdGenerator {

    private static final AtomicLong counter = new AtomicLong(1);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HHmmss");

    /**
     * Generate a unique transaction ID
     */
    public String generateTransactionId() {
        LocalDateTime now = LocalDateTime.now();
        String date = now.format(DATE_FORMATTER);
        String time = now.format(TIME_FORMATTER);
        long sequence = counter.getAndIncrement();
        
        // Reset counter daily to keep numbers manageable
        if (sequence > 99999) {
            counter.set(1);
            sequence = 1;
        }
        
        return String.format("TXN_%s_%s_%05d", date, time, sequence);
    }

    /**
     * Generate a reference number for manual transfers
     * Format: REF_YYYYMMDD_XXXXX
     */
    public String generateReferenceNumber() {
        LocalDateTime now = LocalDateTime.now();
        String date = now.format(DATE_FORMATTER);
        long sequence = counter.getAndIncrement();
        
        if (sequence > 99999) {
            counter.set(1);
            sequence = 1;
        }
        
        return String.format("REF_%s_%05d", date, sequence);
    }

    /**
     * Validate transaction ID format
     */
    public boolean isValidTransactionId(String transactionId) {
        if (transactionId == null) {
            return false;
        }
        
        // Should match pattern: TXN_YYYYMMDD_HHMMSS_XXXXX
        return transactionId.matches("^TXN_\\d{8}_\\d{6}_\\d{5}$");
    }

    /**
     * Validate reference number format
     */
    public boolean isValidReferenceNumber(String referenceNumber) {
        if (referenceNumber == null) {
            return false;
        }
        
        // Should match pattern: REF_YYYYMMDD_XXXXX
        return referenceNumber.matches("^REF_\\d{8}_\\d{5}$");
    }
}
