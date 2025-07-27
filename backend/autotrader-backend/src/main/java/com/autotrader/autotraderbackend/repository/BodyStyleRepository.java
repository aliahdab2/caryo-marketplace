package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.BodyStyle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BodyStyleRepository extends JpaRepository<BodyStyle, Long> {
    
    Optional<BodyStyle> findByName(String name);
    
    Optional<BodyStyle> findBySlug(String slug);
    
    @Query("SELECT b FROM BodyStyle b WHERE " +
           "LOWER(b.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<BodyStyle> searchByName(String query);
}
