package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.CarTrim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarTrimRepository extends JpaRepository<CarTrim, Long> {
    
    List<CarTrim> findByModel(CarModel model);
    
    List<CarTrim> findByModelAndIsActiveTrue(CarModel model);
    
    @Query("SELECT t FROM CarTrim t WHERE " +
           "LOWER(t.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CarTrim> searchByName(String query);
}
