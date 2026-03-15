package com.caryo.marketplace.listeners;

import com.caryo.marketplace.events.ListingApprovedEvent;
import com.caryo.marketplace.model.CarBrand;
import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.CarModel;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.service.AsyncTransactionService;
import com.caryo.marketplace.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ListingApprovedListener}
 */
@ExtendWith(MockitoExtension.class)
class ListingApprovedListenerTest {

    @Mock
    private AsyncTransactionService txService;

    @Mock
    private ListingEventUtils eventUtils;

    @Mock
    private EmailService emailService;

    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;

    private ListingApprovedListener listener;
    private CarListing listing;
    private User seller;
    private CarBrand testCarBrand;
    private CarModel testCarModel;
    private ListingApprovedEvent event;

    @BeforeEach
    void setUp() {
        listener = new ListingApprovedListener(eventUtils, txService, emailService);

        seller = new User();
        seller.setId(1L);
        seller.setUsername("testuser");

        testCarBrand = new CarBrand();
        testCarBrand.setId(1L);
        testCarBrand.setName("Toyota");
        testCarBrand.setDisplayNameEn("Toyota");
        testCarBrand.setDisplayNameAr("تويوتا");
        testCarBrand.setSlug("toyota");

        testCarModel = new CarModel();
        testCarModel.setId(1L);
        testCarModel.setName("Camry");
        testCarModel.setDisplayNameEn("Camry");
        testCarModel.setDisplayNameAr("كامري");
        testCarModel.setBrand(testCarBrand);
        testCarModel.setSlug("camry");

        listing = new CarListing();
        listing.setId(1L);
        listing.setModel(testCarModel); // Set CarModel
        listing.setBrandNameEn(testCarBrand.getDisplayNameEn()); // Denormalized
        listing.setBrandNameAr(testCarBrand.getDisplayNameAr()); // Denormalized
        listing.setModelNameEn(testCarModel.getDisplayNameEn()); // Denormalized
        listing.setModelNameAr(testCarModel.getDisplayNameAr()); // Denormalized
        listing.setModelYear(2022);
        listing.setPrice(BigDecimal.valueOf(25000));
        listing.setSeller(seller);

        event = new ListingApprovedEvent(this, listing);
    }

    @Test
    void handleListingApproved_shouldExecuteInTransaction() {
        // Arrange
        when(eventUtils.getListingInfo(any())).thenReturn("listing info");

        // Act
        listener.handleListingApproved(event);

        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());

        // Execute the captured runnable
        runnableCaptor.getValue().run();

        verify(eventUtils).getListingInfo(listing);
    }

    @Test
    void handleListingApproved_shouldSendEmailAndCompleteAnalyticsLog() {
        // Arrange
        seller.setEmail("seller@test.com");
        when(eventUtils.getListingInfo(any())).thenReturn("listing info");

        // Act
        listener.handleListingApproved(event);

        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        runnableCaptor.getValue().run();

        // Verify email was sent
        verify(emailService).sendListingApprovedEmail(seller, listing);

        // Verify the entire transaction body executed without exceptions
        // (covers the structured analytics log at the end of the transaction)
        verify(eventUtils).getListingInfo(listing);
    }

    @Test
    void handleListingApproved_withNullEvent_shouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> listener.handleListingApproved(null));
        verifyNoInteractions(txService);
    }

    @Test
    void handleListingApproved_withNullSeller_shouldHandleGracefully() {
        // Arrange
        listing.setSeller(null);
        when(eventUtils.getListingInfo(any())).thenReturn("listing info");

        // Act
        listener.handleListingApproved(event);

        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());

        // Execute the captured runnable - should not throw exception despite null seller
        runnableCaptor.getValue().run();

        verify(eventUtils).getListingInfo(listing);
    }
}
