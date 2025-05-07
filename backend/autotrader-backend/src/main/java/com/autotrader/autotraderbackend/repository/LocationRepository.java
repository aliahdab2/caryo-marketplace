package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.Location;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for managing Location entities
 */
@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    // Find active locations by country code (using isActive field)
    List<Location> findByCountryCodeAndIsActiveTrueOrIsActiveIsNull(String countryCode);

    /**
     * Find a location by its slug
     * @param slug The URL-friendly slug
     * @return Optional containing the location if found
     */
    Optional<Location> findBySlug(String slug);
    
    
    /**
     * Find locations by country code and region
     * @param countryCode The ISO country code
     * @param region The region name
     * @return List of locations for the specified country and region
     */
    List<Location> findByCountryCodeAndRegionAndIsActiveTrueOrIsActiveIsNull(String countryCode, String region);
    
    /**
     * Search for locations by name in English or Arabic
     * @param query The search term
     * @param pageable Pagination information
     * @return Page of matching locations
     */
    @Query("SELECT l FROM Location l WHERE " +
           "(LOWER(l.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (l.isActive = true OR l.isActive IS NULL)")
    Page<Location> searchByName(@Param("query") String query, Pageable pageable);
    
    /**
     * Check if a location exists with the given English or Arabic display name
     * @param nameEn The English name to check
     * @param nameAr The Arabic name to check
     * @return True if a location with either name exists
     */
    @Query("SELECT COUNT(l) > 0 FROM Location l WHERE " +
           "LOWER(l.displayNameEn) = LOWER(:nameEn) OR " +
           "LOWER(l.displayNameAr) = LOWER(:nameAr)")
    boolean existsByDisplayNameEnOrDisplayNameAr(
        @Param("nameEn") String nameEn, 
        @Param("nameAr") String nameAr
    );
}
