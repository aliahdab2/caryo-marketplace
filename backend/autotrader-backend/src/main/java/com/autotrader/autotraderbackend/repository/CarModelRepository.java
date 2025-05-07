package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarModelRepository extends JpaRepository<CarModel, Long> {
    
    Optional<CarModel> findBySlug(String slug);
    
    List<CarModel> findByBrand(CarBrand brand);
    
    List<CarModel> findByBrandAndIsActiveTrue(CarBrand brand);
    
    @Query("SELECT m FROM CarModel m WHERE " +
           "LOWER(m.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CarModel> searchByName(String query);
}
