package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.Governorate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GovernorateRepository extends JpaRepository<Governorate, Long> {
    
    Optional<Governorate> findBySlug(String slug);
    
    List<Governorate> findByIsActiveTrue();
    
    List<Governorate> findByCountry_CountryCodeOrderByDisplayNameEnAsc(String countryCode);
    
    List<Governorate> findByCountry_IdOrderByDisplayNameEnAsc(Long countryId);
    
    boolean existsBySlug(String slug);
}
