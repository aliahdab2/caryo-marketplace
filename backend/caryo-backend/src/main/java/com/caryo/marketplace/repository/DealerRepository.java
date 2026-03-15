package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.Dealer;
import com.caryo.marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DealerRepository extends JpaRepository<Dealer, Long> {

    /**
     * Find dealer by user
     */
    Optional<Dealer> findByUser(User user);

    /**
     * Find dealer by user ID
     */
    Optional<Dealer> findByUserId(Long userId);

    /**
     * Check if dealer exists by user
     */
    boolean existsByUser(User user);

    /**
     * Check if dealer exists by user ID
     */
    boolean existsByUserId(Long userId);

    /**
     * Check if VAT number exists for a different dealer
     */
    boolean existsByVatNumberAndIdNot(String vatNumber, Long id);

    /**
     * Check if business email exists for a different dealer
     */
    boolean existsByBusinessEmailAndIdNot(String businessEmail, Long id);

    /**
     * Check if VAT number exists (handles null values)
     */
    @Query("SELECT COUNT(d) > 0 FROM Dealer d WHERE d.vatNumber = :vatNumber AND (:id IS NULL OR d.id != :id)")
    boolean existsByVatNumber(@Param("vatNumber") String vatNumber, @Param("id") Long id);

    /**
     * Check if business email exists (handles null values)
     */
    @Query("SELECT COUNT(d) > 0 FROM Dealer d WHERE d.businessEmail = :businessEmail AND (:id IS NULL OR d.id != :id)")
    boolean existsByBusinessEmail(@Param("businessEmail") String businessEmail, @Param("id") Long id);

    /**
     * Find dealers by business name pattern
     */
    @Query("SELECT d FROM Dealer d WHERE LOWER(d.businessName) LIKE LOWER(CONCAT('%', :businessName, '%'))")
    List<Dealer> findByBusinessNameContainingIgnoreCase(@Param("businessName") String businessName);

    /**
     * Count dealers by seller type
     */
    @Query("SELECT COUNT(d) FROM Dealer d WHERE d.user.sellerType.name = :sellerTypeName")
    long countBySellerTypeName(@Param("sellerTypeName") String sellerTypeName);

    /**
     * Find dealer by business name (case insensitive)
     */
    @Query("SELECT d FROM Dealer d WHERE LOWER(d.businessName) = LOWER(:businessName)")
    Optional<Dealer> findByBusinessNameIgnoreCase(@Param("businessName") String businessName);

    /**
     * Find dealer by VAT number (case insensitive)
     */
    @Query("SELECT d FROM Dealer d WHERE LOWER(d.vatNumber) = LOWER(:vatNumber)")
    Optional<Dealer> findByVatNumberIgnoreCase(@Param("vatNumber") String vatNumber);

    /**
     * Find dealer by business email (case insensitive)
     */
    @Query("SELECT d FROM Dealer d WHERE LOWER(d.businessEmail) = LOWER(:businessEmail)")
    Optional<Dealer> findByBusinessEmailIgnoreCase(@Param("businessEmail") String businessEmail);
}
