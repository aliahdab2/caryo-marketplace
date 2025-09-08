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
        // Mock EntityManager.find() to return the seller when called with User.class and seller ID
        when(entityManager.find(User.class, 1L)).thenReturn(seller);

        // Act
        listener.handleListingArchived(eventAdminAction);

        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());

        // Execute the captured runnable
        runnableCaptor.getValue().run();

        // Verify that email service was called for admin action
        verify(emailService).sendListingArchivedByAdminEmail(seller, carListing, null);

        // Verify that EntityManager.find() was called to retrieve the seller
        verify(entityManager).find(User.class, 1L);
    }
    
    @Test
    void handleListingArchived_sellerAction_shouldExecuteInTransaction() {
        // Arrange
        // No need to mock eventUtils.getListingInfo() since it's not used in the new implementation

        // Act
        listener.handleListingArchived(eventSellerAction);

        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());

        // Execute the captured runnable
        runnableCaptor.getValue().run();

        // Verify that email service was NOT called for seller action (only for admin actions)
        verify(emailService, never()).sendListingArchivedByAdminEmail(any(), any(), any());

        // Verify that EntityManager.find() was NOT called for seller action
        verify(entityManager, never()).find(any(), any());
    }
    
    @Test
    void handleListingArchived_withNullEvent_shouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> listener.handleListingArchived(null));
        verifyNoInteractions(txService);
    }
}
