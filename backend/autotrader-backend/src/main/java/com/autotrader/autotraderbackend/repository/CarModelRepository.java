package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarModelRepository extends JpaRepository<CarModel, Long> {
    
    @Query("SELECT m FROM CarModel m LEFT JOIN FETCH m.brand WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "m.name LIKE CONCAT('%', :search, '%') OR " +
           "m.displayNameEn LIKE CONCAT('%', :search, '%') OR " +
           "m.displayNameAr LIKE CONCAT('%', :search, '%')) AND " +
           "(:brandId IS NULL OR m.brand.id = :brandId)")
    Page<CarModel> findAllWithFilters(@Param("search") String search, 
                                      @Param("brandId") Long brandId, 
                                      Pageable pageable);

    Optional<CarModel> findBySlug(String slug);
    
    List<CarModel> findByBrand(CarBrand brand);
    
    List<CarModel> findByBrandAndIsActiveTrue(CarBrand brand);
    
    List<CarModel> findByIsActiveFalse();
    
    List<CarModel> findByBrandIdAndName(Long brandId, String name);
    
    @Query("SELECT m FROM CarModel m WHERE " +
           "LOWER(m.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CarModel> searchByName(String query);
    
    // Method to fetch all models with brand relationships loaded
    @Query("SELECT m FROM CarModel m LEFT JOIN FETCH m.brand")
    List<CarModel> findAllWithBrands();
    
    // Duplicate checking methods
    boolean existsByBrandAndNameIgnoreCase(CarBrand brand, String name);
    boolean existsByBrandAndDisplayNameEnIgnoreCase(CarBrand brand, String displayNameEn);
    boolean existsByBrandAndDisplayNameArIgnoreCase(CarBrand brand, String displayNameAr);
    boolean existsBySlug(String slug);
    
    // Find models by brand ID
    List<CarModel> findByBrandId(Long brandId);
    
    // Count active models by brand ID
    @Query("SELECT COUNT(m) FROM CarModel m WHERE m.brand.id = :brandId AND m.isActive = true")
    long countActiveByBrandId(@Param("brandId") Long brandId);
    
    // Bulk deactivation of models by brand ID
    @Modifying
    @Query("UPDATE CarModel m SET m.isActive = false WHERE m.brand.id = :brandId AND m.isActive = true")
    int deactivateByBrandId(@Param("brandId") Long brandId);
}
