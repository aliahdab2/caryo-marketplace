package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.FuelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FuelTypeRepository extends JpaRepository<FuelType, Long> {
    
    Optional<FuelType> findByName(String name);
    
    @Query("SELECT f FROM FuelType f WHERE " +
           "LOWER(f.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<FuelType> searchByName(String query);
}
