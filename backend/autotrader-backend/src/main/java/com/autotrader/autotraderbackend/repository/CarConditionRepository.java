package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.CarCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarConditionRepository extends JpaRepository<CarCondition, Long> {
    
    Optional<CarCondition> findByName(String name);
    
    @Query("SELECT c FROM CarCondition c WHERE " +
           "LOWER(c.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CarCondition> searchByName(String query);
}
