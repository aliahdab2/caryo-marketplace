package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.NewsletterSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for managing newsletter subscriptions.
 */
@Repository
public interface NewsletterSubscriptionRepository extends JpaRepository<NewsletterSubscription, Long> {

    /**
     * Find subscription by email address.
     */
    Optional<NewsletterSubscription> findByEmail(String email);

    /**
     * Find subscription by confirmation token.
     */
    Optional<NewsletterSubscription> findByConfirmationToken(String confirmationToken);

    /**
     * Find subscription by unsubscribe token.
     */
    Optional<NewsletterSubscription> findByUnsubscribeToken(String unsubscribeToken);

    /**
     * Check if email already exists.
     */
    boolean existsByEmail(String email);

    /**
     * Find all active and confirmed subscriptions.
     */
    @Query("SELECT n FROM NewsletterSubscription n WHERE n.active = true AND n.confirmedAt IS NOT NULL AND n.unsubscribedAt IS NULL")
    List<NewsletterSubscription> findAllActiveSubscriptions();

    /**
     * Find all active subscriptions by language.
     */
    @Query("SELECT n FROM NewsletterSubscription n WHERE n.active = true AND n.confirmedAt IS NOT NULL AND n.unsubscribedAt IS NULL AND n.preferredLanguage = :language")
    List<NewsletterSubscription> findAllActiveSubscriptionsByLanguage(@Param("language") String language);

    /**
     * Count active subscriptions.
     */
    @Query("SELECT COUNT(n) FROM NewsletterSubscription n WHERE n.active = true AND n.confirmedAt IS NOT NULL AND n.unsubscribedAt IS NULL")
    long countActiveSubscriptions();

    /**
     * Find unconfirmed subscriptions older than specified date.
     */
    @Query("SELECT n FROM NewsletterSubscription n WHERE n.confirmedAt IS NULL AND n.createdAt < :cutoffDate")
    List<NewsletterSubscription> findUnconfirmedSubscriptionsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}
