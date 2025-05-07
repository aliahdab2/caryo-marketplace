package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.Transmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransmissionRepository extends JpaRepository<Transmission, Long> {
    
    Optional<Transmission> findByName(String name);
    
    @Query("SELECT t FROM Transmission t WHERE " +
           "LOWER(t.displayNameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.displayNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Transmission> searchByName(String query);
}
