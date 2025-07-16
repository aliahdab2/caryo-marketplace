package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarListingRepository extends JpaRepository<CarListing, Long>, JpaSpecificationExecutor<CarListing> {
    
    // Find all approved listings with pagination
    Page<CarListing> findByApprovedTrue(Pageable pageable);
    
    // Find by id and approved
    Optional<CarListing> findByIdAndApprovedTrue(Long id);
    
    // Find by various criteria with pagination
    Page<CarListing> findByBrandNameEnAndApprovedTrue(String brandNameEn, Pageable pageable);
    
    Page<CarListing> findByModelAndApprovedTrue(String model, Pageable pageable);
    
    Page<CarListing> findByModelYearAndApprovedTrue(Integer modelYear, Pageable pageable);
    
    Page<CarListing> findByPriceBetweenAndApprovedTrue(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
    
    // Find listings by seller
    List<CarListing> findBySeller(User seller);
    
    // Find listings pending approval
    Page<CarListing> findByApprovedFalse(Pageable pageable);
    
    // New methods for efficient count queries
    @Query("SELECT DISTINCT cl.modelYear FROM CarListing cl " +
           "JOIN cl.model m JOIN m.brand b " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "ORDER BY cl.modelYear DESC")
    List<Integer> findDistinctYears();
    
    @Query("SELECT DISTINCT b.slug FROM CarListing cl " +
           "JOIN cl.model m JOIN m.brand b " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "ORDER BY b.displayNameEn")
    List<String> findDistinctBrandSlugs();
    
    @Query("SELECT DISTINCT m.slug FROM CarListing cl " +
           "JOIN cl.model m JOIN m.brand b " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "AND (:brandSlug IS NULL OR b.slug = :brandSlug) " +
           "ORDER BY m.displayNameEn")
    List<String> findDistinctModelSlugs(@Param("brandSlug") String brandSlug);
    
    // Efficient count methods with database-level grouping
    @Query("SELECT b.slug, COUNT(cl) FROM CarListing cl " +
           "JOIN cl.model m JOIN m.brand b " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "GROUP BY b.slug, b.displayNameEn " +
           "ORDER BY b.displayNameEn")
    List<Object[]> findDistinctBrandSlugsWithCounts();
    
    @Query("SELECT m.slug, COUNT(cl) FROM CarListing cl " +
           "JOIN cl.model m JOIN m.brand b " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "GROUP BY m.slug, m.displayNameEn " +
           "ORDER BY m.displayNameEn")
    List<Object[]> findDistinctModelSlugsWithCounts();
    
    @Query("SELECT cl.modelYear, COUNT(cl) FROM CarListing cl " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "GROUP BY cl.modelYear " +
           "ORDER BY cl.modelYear DESC")
    List<Object[]> findDistinctYearsWithCounts();
    
    @Query("SELECT st.name, COUNT(cl) " +
           "FROM CarListing cl " +
           "JOIN cl.seller u " +
           "JOIN u.sellerType st " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "GROUP BY st.name " +
           "ORDER BY st.name")
    List<Object[]> findDistinctSellerTypesWithCounts();
    
    // Count methods for specific filters
    @Query("SELECT COUNT(cl) FROM CarListing cl " +
           "JOIN cl.model m JOIN m.brand b " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "AND cl.modelYear = :year")
    long countByYear(@Param("year") Integer year);
    
    @Query("SELECT COUNT(cl) FROM CarListing cl " +
           "JOIN cl.model m JOIN m.brand b " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "AND b.slug = :brandSlug")
    long countByBrandSlug(@Param("brandSlug") String brandSlug);

    @Query("SELECT COUNT(cl) FROM CarListing cl " +
           "JOIN cl.model m " +
           "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
           "AND m.slug = :modelSlug")
    long countByModelSlug(@Param("modelSlug") String modelSlug);
}