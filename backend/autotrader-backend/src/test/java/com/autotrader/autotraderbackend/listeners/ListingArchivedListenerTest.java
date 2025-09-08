package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.service.AsyncTransactionService;
import com.autotrader.autotraderbackend.service.EmailService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ListingArchivedListenerTest {

    @Autowired
    private AsyncTransactionService txService;

    @MockBean
    private EmailService emailService;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ListingArchivedListener listener;

    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;

    private CarListing carListing;
    private User seller;
    private ListingArchivedEvent eventAdminAction;
    private ListingArchivedEvent eventSellerAction;

    @BeforeEach
    void setUp() {
        seller = new User();
        seller.setId(1L);
        seller.setUsername("testuser");
        seller.setEmail("seller@example.com");

        carListing = new CarListing();
        carListing.setId(1L);
        carListing.setTitle("Test Car for Archival");
        carListing.setSeller(seller);

        eventAdminAction = new ListingArchivedEvent(this, carListing, true);
        eventSellerAction = new ListingArchivedEvent(this, carListing, false);

        // Mock the email service to avoid actual email sending
        doNothing().when(emailService).sendListingArchivedByAdminEmail(any(), any(), any());
    }

    @Test
    void handleListingArchived_adminAction_shouldExecuteInTransaction() {
        // Arrange
        // Since we're using the real EntityManager, we need to persist the seller first
        entityManager.persist(seller);
        entityManager.flush();

        // Act
        listener.handleListingArchived(eventAdminAction);

        // Assert
        // Verify that email service was called for admin action
        verify(emailService).sendListingArchivedByAdminEmail(seller, carListing, null);
    }
    
    @Test
    void handleListingArchived_sellerAction_shouldExecuteInTransaction() {
        // Arrange
        // No need to mock eventUtils.getListingInfo() since it's not used in the new implementation

        // Act
        listener.handleListingArchived(eventSellerAction);

        // Assert
        // Verify that email service was NOT called for seller action (only for admin actions)
        verify(emailService, never()).sendListingArchivedByAdminEmail(any(), any(), any());
    }
    
    @Test
    void handleListingArchived_withNullEvent_shouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> listener.handleListingArchived(null));
    }
}
