package com.caryo.marketplace.payment;

import com.caryo.marketplace.model.Dealer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for PaymentTransaction entities
 */
@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    /**
     * Find transaction by our internal transaction ID
     */
    Optional<PaymentTransaction> findByTransactionId(String transactionId);

    /**
     * Find transaction by external payment ID (from provider)
     */
    Optional<PaymentTransaction> findByExternalPaymentId(String externalPaymentId);

    /**
     * Find transaction by idempotency key (prevent duplicates)
     */
    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);

    /**
     * Find all transactions for a dealer
     */
    Page<PaymentTransaction> findByDealerOrderByCreatedAtDesc(Dealer dealer, Pageable pageable);

    /**
     * Find transactions by dealer and status
     */
    List<PaymentTransaction> findByDealerAndStatus(Dealer dealer, PaymentStatus status);

    /**
     * Find transactions by status
     */
    List<PaymentTransaction> findByStatus(PaymentStatus status);

    /**
     * Find failed transactions that need retry
     */
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.status = 'FAILED' AND pt.retryAttempts < 3 AND pt.nextRetryAt <= :now")
    List<PaymentTransaction> findFailedTransactionsForRetry(@Param("now") ZonedDateTime now);

    /**
     * Find pending verification transactions (for manual transfers)
     */
    List<PaymentTransaction> findByStatusAndProviderType(PaymentStatus status, PaymentProviderType providerType);

    /**
     * Find transactions by date range
     */
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.createdAt >= :startDate AND pt.createdAt <= :endDate")
    List<PaymentTransaction> findByDateRange(@Param("startDate") ZonedDateTime startDate, @Param("endDate") ZonedDateTime endDate);

    /**
     * Count successful payments for a dealer
     */
    @Query("SELECT COUNT(pt) FROM PaymentTransaction pt WHERE pt.dealer = :dealer AND pt.status = 'COMPLETED'")
    Long countSuccessfulPaymentsByDealer(@Param("dealer") Dealer dealer);

    /**
     * Get total payment amount for a dealer
     */
    @Query("SELECT COALESCE(SUM(pt.amount), 0) FROM PaymentTransaction pt WHERE pt.dealer = :dealer AND pt.status = 'COMPLETED'")
    Double getTotalPaymentAmountByDealer(@Param("dealer") Dealer dealer);

    /**
     * Find recent transactions for dashboard
     */
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.createdAt >= :since ORDER BY pt.createdAt DESC")
    List<PaymentTransaction> findRecentTransactions(@Param("since") ZonedDateTime since);
}
