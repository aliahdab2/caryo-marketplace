package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service to cleanup resources after tests
 */
@Service
public class ResourceCleanupService {
    
    @Autowired
    private CarListingRepository carListingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Cleans up all test resources
     */
    public void cleanupResources() {
        // Clean up stored car listings for tests
        // Using deleteAll() is fine for tests as the database is ephemeral
        carListingRepository.deleteAll();
        
        // Clean up stored users for tests
        userRepository.deleteAll();
    }
}
