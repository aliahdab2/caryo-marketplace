package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Test service to cleanup resources after tests
 * Implements AutoCloseable to support try-with-resources pattern
 */
@Service
public class TestResourceCleanupService implements AutoCloseable {
    
    private static final Logger logger = LoggerFactory.getLogger(TestResourceCleanupService.class);
    
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
        
        logger.info("Test resources cleaned up successfully");
    }
    
    /**
     * Implementation of AutoCloseable interface
     * Automatically called when used with try-with-resources
     */
    @Override
    public void close() {
        cleanupResources();
    }
}
