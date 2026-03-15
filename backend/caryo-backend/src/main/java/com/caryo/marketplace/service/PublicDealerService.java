package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.dealer.DealerNotFoundException;
import com.caryo.marketplace.model.Dealer;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.payload.response.DealerStatsResponse;
import com.caryo.marketplace.payload.response.PublicDealerResponse;
import com.caryo.marketplace.repository.CarListingRepository;
import com.caryo.marketplace.repository.DealerRepository;
import com.caryo.marketplace.mapper.CarListingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicDealerService {

    private final DealerRepository dealerRepository;
    private final CarListingRepository carListingRepository;
    private final CarListingMapper carListingMapper;

    @Transactional(readOnly = true)
    public PublicDealerResponse getPublicDealerProfile(Long dealerId) {
        Dealer dealer = dealerRepository.findById(dealerId)
            .orElseThrow(() -> new DealerNotFoundException("Dealer not found with ID: " + dealerId, dealerId));

        User seller = dealer.getUser();

        long totalListings = carListingRepository.countBySellerAndApprovedTrue(seller);
        long soldCount = carListingRepository.countBySellerAndApprovedTrueAndSoldTrue(seller);
        long activeListings = carListingRepository.countBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(seller);

        DealerStatsResponse stats = new DealerStatsResponse(totalListings, activeListings, soldCount);

        return new PublicDealerResponse(
            dealer.getId(),
            dealer.getBusinessName(),
            dealer.getBusinessPhone(),
            dealer.getTradingAddress(),
            dealer.getLogoUrl(),
            dealer.getBannerUrl(),
            dealer.getCreatedAt(),
            dealer.getDescription(),
            dealer.getDescriptionAr(),
            dealer.getWorkingHours(),
            dealer.getSocialLinks(),
            stats
        );
    }

    @Transactional(readOnly = true)
    public Page<CarListingResponse> getPublicDealerListings(Long dealerId, Pageable pageable) {
        Dealer dealer = dealerRepository.findById(dealerId)
            .orElseThrow(() -> new DealerNotFoundException("Dealer not found with ID: " + dealerId, dealerId));

        return carListingRepository
            .findBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(dealer.getUser(), pageable)
            .map(carListingMapper::toCarListingResponse);
    }
}
