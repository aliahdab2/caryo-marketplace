package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.SellerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerTypeRepository extends JpaRepository<SellerType, Long> {
    
    Optional<SellerType> findByName(String name);
    
    @Query("SELECT s FROM SellerType s WHERE " +
           "LOWER(s.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<SellerType> searchByName(String query);
}
