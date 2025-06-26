package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.SellerType;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerTypeRepository extends JpaRepository<SellerType, Long> {
    
    @Cacheable(value = "sellerTypes", key = "#name")
    Optional<SellerType> findByName(String name);
    
    @Cacheable(value = "sellerTypes", key = "'nameIgnoreCase:' + #name.toLowerCase()")
    Optional<SellerType> findByNameIgnoreCase(String name);
    
    @Query("SELECT s FROM SellerType s WHERE " +
           "LOWER(s.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<SellerType> searchByName(@Param("query") String query);
    
    @Cacheable(value = "sellerTypes", key = "'all'")
    @Query("SELECT s FROM SellerType s ORDER BY s.displayNameEn ASC")
    List<SellerType> findAllOrderByDisplayNameEn();
    
    boolean existsByName(String name);
    
    boolean existsByNameIgnoreCase(String name);
}
