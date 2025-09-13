package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.CarBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarBrandRepository extends JpaRepository<CarBrand, Long> {
    
    Optional<CarBrand> findBySlug(String slug);
    
    List<CarBrand> findByIsActiveTrue();
    
    Optional<CarBrand> findByName(String name);

    @Query("SELECT b FROM CarBrand b WHERE " +
           "LOWER(b.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CarBrand> searchByName(String query);
    
    // Duplicate checking methods
    boolean existsByNameIgnoreCase(String name);
    boolean existsByDisplayNameEnIgnoreCase(String displayNameEn);
    boolean existsByDisplayNameArIgnoreCase(String displayNameAr);
    boolean existsBySlug(String slug);
}
