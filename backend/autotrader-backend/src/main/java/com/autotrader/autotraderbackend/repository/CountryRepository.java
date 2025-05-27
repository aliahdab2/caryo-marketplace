package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CountryRepository extends JpaRepository<Country, Long>, JpaSpecificationExecutor<Country> {

    Optional<Country> findByCountryCode(String countryCode);

    boolean existsByCountryCode(String countryCode);

    boolean existsByDisplayNameEn(String displayNameEn);

    boolean existsByDisplayNameAr(String displayNameAr);

}
