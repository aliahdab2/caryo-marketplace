package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarListingRepository extends JpaRepository<CarListing, Long>, JpaSpecificationExecutor<CarListing> {

       // Eagerly load the to-one associations that CarListingMapper dereferences,
       // so a page of results is fetched in a single query instead of N+1
       // (media is a collection and is batch-loaded via hibernate.default_batch_fetch_size)
       @Override
       @EntityGraph(attributePaths = { "model", "model.brand", "seller", "seller.sellerType",
                     "fuelType", "transmissionType", "governorate", "location" })
       Page<CarListing> findAll(Specification<CarListing> spec, Pageable pageable);

       // Find all approved listings with pagination
       Page<CarListing> findByApprovedTrue(Pageable pageable);

       // Find by id and approved
       Optional<CarListing> findByIdAndApprovedTrue(Long id);

       // Find by id and approved with media (eager fetch)
       @Query("SELECT cl FROM CarListing cl LEFT JOIN FETCH cl.media WHERE cl.id = :id AND cl.approved = true")
       Optional<CarListing> findByIdAndApprovedTrueWithMedia(@Param("id") Long id);

       // Find by various criteria with pagination
       Page<CarListing> findByBrandNameEnAndApprovedTrue(String brandNameEn, Pageable pageable);

       Page<CarListing> findByModelAndApprovedTrue(String model, Pageable pageable);

       Page<CarListing> findByModelYearAndApprovedTrue(Integer modelYear, Pageable pageable);

       Page<CarListing> findByPriceBetweenAndApprovedTrue(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);

       // Find listings by seller
       List<CarListing> findBySeller(User seller);

       Page<CarListing> findBySellerAndApprovedTrueAndArchivedFalse(User seller, Pageable pageable);

       Page<CarListing> findBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(User seller, Pageable pageable);

       long countBySellerAndApprovedTrue(User seller);

       long countBySellerAndApprovedTrueAndSoldTrue(User seller);

       long countBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(User seller);

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

       @Query("SELECT ft.name, COUNT(cl) " +
                     "FROM CarListing cl " +
                     "JOIN cl.fuelType ft " +
                     "WHERE cl.approved = true AND cl.sold = false AND cl.archived = false " +
                     "GROUP BY ft.name " +
                     "ORDER BY ft.name")
       List<Object[]> findDistinctFuelTypesWithCounts();

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

       // Hierarchy management methods

       /**
        * Count active car listings by brand ID
        */
       @Query("SELECT COUNT(cl) FROM CarListing cl WHERE cl.model.brand.id = :brandId AND cl.isUserActive = true")
       long countActiveByBrandId(@Param("brandId") Long brandId);

       /**
        * Count active car listings by model IDs
        */
       @Query("SELECT COUNT(cl) FROM CarListing cl WHERE cl.model.id IN :modelIds AND cl.isUserActive = true")
       long countActiveByModelIds(@Param("modelIds") List<Long> modelIds);

       /**
        * Bulk deactivate car listings by brand ID
        */
       @Modifying
       @Query("UPDATE CarListing cl SET cl.isUserActive = false WHERE cl.model.brand.id = :brandId AND cl.isUserActive = true")
       int deactivateByBrandId(@Param("brandId") Long brandId);

       /**
        * Bulk deactivate car listings by model IDs
        */
       @Modifying
       @Query("UPDATE CarListing cl SET cl.isUserActive = false WHERE cl.model.id IN :modelIds AND cl.isUserActive = true")
       int deactivateByModelIds(@Param("modelIds") List<Long> modelIds);

       /**
        * Count active (approved, not sold, not archived) listings by user
        * Used to enforce listing limits for regular users
        */
       @Query("SELECT COUNT(cl) FROM CarListing cl " +
                     "WHERE cl.seller = :user " +
                     "AND cl.approved = true " +
                     "AND cl.sold = false " +
                     "AND cl.archived = false " +
                     "AND cl.expired = false " +
                     "AND (cl.expirationDate IS NULL OR cl.expirationDate > CURRENT_TIMESTAMP)")
       long countActiveListingsByUser(@Param("user") User user);

       /**
        * Full-text search using PostgreSQL tsvector/tsquery.
        * Returns listing IDs ranked by relevance (brand/model matches rank highest).
        * Uses 'simple' text search config for bilingual (Arabic + English) support.
        * The limit parameter caps results to keep the subsequent IN clause efficient.
        */
       @Query(value = """
              SELECT id FROM car_listings
              WHERE search_vector @@ plainto_tsquery('simple', :query)
              ORDER BY ts_rank_cd(search_vector, plainto_tsquery('simple', :query)) DESC
              LIMIT :maxResults
              """, nativeQuery = true)
       List<Long> findIdsByFullTextSearch(@Param("query") String query, @Param("maxResults") int maxResults);

       /**
        * Prefix-based full-text search for autocomplete/typeahead.
        * Appends :* to the last word so partial input matches (e.g., "Toy" → "Toyota").
        * Input is sanitized to alphanumeric + Arabic characters + whitespace only.
        * Uses 'simple' text search config for bilingual support.
        */
       @Query(value = """
              SELECT id FROM car_listings
              WHERE search_vector @@ to_tsquery('simple',
                  regexp_replace(
                      trim(regexp_replace(:query, '[^a-zA-Z0-9\\u0600-\\u06FF\\s]', '', 'g')),
                      '\\s+', ' & ', 'g'
                  ) || ':*'
              )
              ORDER BY ts_rank_cd(search_vector,
                  to_tsquery('simple',
                      regexp_replace(
                          trim(regexp_replace(:query, '[^a-zA-Z0-9\\u0600-\\u06FF\\s]', '', 'g')),
                          '\\s+', ' & ', 'g'
                      ) || ':*'
                  )
              ) DESC
              LIMIT :maxResults
              """, nativeQuery = true)
       List<Long> findIdsByFullTextSearchPrefix(@Param("query") String query, @Param("maxResults") int maxResults);
}