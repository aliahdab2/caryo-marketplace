package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.DriveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriveTypeRepository extends JpaRepository<DriveType, Long> {
    
    Optional<DriveType> findByName(String name);
    
    @Query("SELECT d FROM DriveType d WHERE " +
           "LOWER(d.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<DriveType> searchByName(String query);
}
