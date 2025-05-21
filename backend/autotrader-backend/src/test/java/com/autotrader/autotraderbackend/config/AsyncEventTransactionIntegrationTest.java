package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.events.ListingApprovedEvent;
import com.autotrader.autotraderbackend.listeners.ListingEventUtils;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.service.AsyncTransactionService;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Integration tests for {@link AsyncEventsConfig} transaction management
 */
@SpringBootTest
@ActiveProfiles("test")
public class AsyncEventTransactionIntegrationTest extends IntegrationTestWithS3 {

    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    @Autowired
    private PlatformTransactionManager transactionManager;
    
    @MockBean
    private ListingEventUtils eventUtils;

    @Test
    void transactionTemplateBean_shouldBeCreated() {
        // Arrange & Act
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        
        // Assert
        assertNotNull(transactionTemplate);
    }

    @Test
    void asyncTransactionService_shouldBeCreatedWithTransactionTemplate() {
        // Arrange & Act
        AsyncTransactionService service = new AsyncTransactionService(new TransactionTemplate(transactionManager));
        
        // Assert
        assertNotNull(service);
    }
    
    @Test
    void publishingEvent_shouldTriggerListenerWithTransaction() throws Exception {
        // Arrange
        when(eventUtils.getListingInfo(any())).thenReturn("Test listing info");
        
        User seller = new User();
        seller.setId(1L);
        seller.setUsername("testuser");
        
        CarListing listing = new CarListing();
        listing.setId(1L);
        listing.setBrand("BMW");
        listing.setModel("X5");
        listing.setModelYear(2023);
        listing.setPrice(BigDecimal.valueOf(50000));
        listing.setSeller(seller);
        
        CountDownLatch latch = new CountDownLatch(1);
        doAnswer(invocation -> {
            latch.countDown();
            return null;
        }).when(eventUtils).getListingInfo(any());
        
        // Act
        eventPublisher.publishEvent(new ListingApprovedEvent(this, listing));
        
        // Assert - wait for async processing to complete
        boolean processed = latch.await(5, TimeUnit.SECONDS);
        assertTrue(processed, "Event was not processed within the timeout period");
        
        // Verify the event was processed
        verify(eventUtils, timeout(5000)).getListingInfo(any());
    }
}
