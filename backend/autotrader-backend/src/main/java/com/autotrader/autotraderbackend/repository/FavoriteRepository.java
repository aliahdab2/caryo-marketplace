package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.Favorite;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.CarListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUser(User user);
    Optional<Favorite> findByUserAndCarListing(User user, CarListing carListing);
    boolean existsByUserAndCarListing(User user, CarListing carListing);
    void deleteByUserAndCarListing(User user, CarListing carListing);
} 