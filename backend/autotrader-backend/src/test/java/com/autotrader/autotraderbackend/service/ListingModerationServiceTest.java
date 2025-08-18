package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingModerationAction;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.ListingModerationActionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ListingModerationServiceTest {

    @Mock
    private ListingModerationActionRepository moderationActionRepository;

    @Mock
    private com.autotrader.autotraderbackend.repository.CarListingRepository carListingRepository;

    @Mock
    private com.autotrader.autotraderbackend.repository.UserRepository userRepository;

    @InjectMocks
    private ListingModerationService listingModerationService;

    private CarListing testListing;
    private Authentication mockAuth;

    @BeforeEach
    void setUp() {
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Test Car");
        testListing.setApproved(true);

        mockAuth = mock(Authentication.class);
        when(mockAuth.getName()).thenReturn("admin@example.com");

        // Set up common mocks
        when(carListingRepository.findById(1L)).thenReturn(java.util.Optional.of(testListing));
        
        User mockAdmin = new User();
        mockAdmin.setUsername("admin@example.com");
        when(userRepository.findByUsername("admin@example.com")).thenReturn(java.util.Optional.of(mockAdmin));
    }

    @Test
    void hideListingAsAdmin_ShouldCreateHideAction() {
        // Arrange
        String reason = "Inappropriate content";
        String adminUsername = "admin@example.com";
        
        // Mock that listing is not currently hidden
        when(moderationActionRepository.isListingHiddenByAdmin(1L)).thenReturn(false);

        // Act
        listingModerationService.hideListingAsAdmin(1L, reason, adminUsername);

        // Assert
        verify(moderationActionRepository).save(argThat(action -> 
            action.getListing().getId().equals(1L) &&
            action.getActionType().equals("HIDE") &&
            action.getReason().equals(reason) &&
            action.getIsActive()
        ));
    }

    @Test
    void unhideListingAsAdmin_ShouldCreateUnhideAction() {
        // Arrange
        String adminUsername = "admin@example.com";
        
        // Mock that listing is currently hidden
        when(moderationActionRepository.isListingHiddenByAdmin(1L)).thenReturn(true);

        // Act
        listingModerationService.unhideListingAsAdmin(1L, adminUsername);

        // Assert
        verify(moderationActionRepository).save(argThat(action -> 
            action.getActionType().equals("UNHIDE") &&
            action.getIsActive()
        ));
    }

    @Test
    void isListingHiddenByAdmin_WhenHidden_ShouldReturnTrue() {
        // Arrange
        when(moderationActionRepository.isListingHiddenByAdmin(1L))
            .thenReturn(true);

        // Act
        boolean result = listingModerationService.isListingHiddenByAdmin(1L);

        // Assert
        assertTrue(result);
    }

    @Test
    void isListingHiddenByAdmin_WhenNotHidden_ShouldReturnFalse() {
        // Arrange
        when(moderationActionRepository.isListingHiddenByAdmin(1L))
            .thenReturn(false);

        // Act
        boolean result = listingModerationService.isListingHiddenByAdmin(1L);

        // Assert
        assertFalse(result);
    }

    @Test
    void isListingApproved_WhenApproved_ShouldReturnTrue() {
        // Arrange
        ListingModerationAction approveAction = new ListingModerationAction();
        approveAction.setActionType("APPROVE");
        approveAction.setIsActive(true);
        
        when(moderationActionRepository.findLatestActiveActionByType(1L, "APPROVE"))
            .thenReturn(Optional.of(approveAction));

        // Act
        boolean result = listingModerationService.isListingApproved(1L);

        // Assert
        assertTrue(result);
    }

    @Test
    void isListingSold_WhenSold_ShouldReturnTrue() {
        // Arrange
        ListingModerationAction soldAction = new ListingModerationAction();
        soldAction.setActionType("MARK_SOLD");
        soldAction.setIsActive(true);
        
        when(moderationActionRepository.findLatestActiveActionByType(1L, "MARK_SOLD"))
            .thenReturn(Optional.of(soldAction));

        // Act
        boolean result = listingModerationService.isListingSold(1L);

        // Assert
        assertTrue(result);
    }

    @Test
    void isListingArchived_WhenArchived_ShouldReturnTrue() {
        // Arrange
        ListingModerationAction archiveAction = new ListingModerationAction();
        archiveAction.setActionType("ARCHIVE");
        archiveAction.setIsActive(true);
        
        when(moderationActionRepository.findLatestActiveActionByType(1L, "ARCHIVE"))
            .thenReturn(Optional.of(archiveAction));

        // Act
        boolean result = listingModerationService.isListingArchived(1L);

        // Assert
        assertTrue(result);
    }

    @Test
    void isListingExpired_WhenExpired_ShouldReturnTrue() {
        // Arrange
        ListingModerationAction expireAction = new ListingModerationAction();
        expireAction.setActionType("EXPIRE");
        expireAction.setIsActive(true);
        
        when(moderationActionRepository.findLatestActiveActionByType(1L, "EXPIRE"))
            .thenReturn(Optional.of(expireAction));

        // Act
        boolean result = listingModerationService.isListingExpired(1L);

        // Assert
        assertTrue(result);
    }

    @Test
    void getListingStatus_WhenExpired_ShouldReturnExpired() {
        // Arrange
        when(moderationActionRepository.findLatestActiveActionByType(1L, "EXPIRE"))
            .thenReturn(Optional.of(createMockAction("EXPIRE")));

        // Act
        String status = listingModerationService.getListingStatus(1L);

        // Assert
        assertEquals("EXPIRED", status);
    }

    @Test
    void getListingStatus_WhenArchived_ShouldReturnArchived() {
        // Arrange
        when(moderationActionRepository.findLatestActiveActionByType(1L, "EXPIRE"))
            .thenReturn(Optional.empty());
        when(moderationActionRepository.findLatestActiveActionByType(1L, "ARCHIVE"))
            .thenReturn(Optional.of(createMockAction("ARCHIVE")));

        // Act
        String status = listingModerationService.getListingStatus(1L);

        // Assert
        assertEquals("ARCHIVED", status);
    }

    @Test
    void getListingStatus_WhenSold_ShouldReturnSold() {
        // Arrange
        when(moderationActionRepository.findLatestActiveActionByType(1L, "EXPIRE"))
            .thenReturn(Optional.empty());
        when(moderationActionRepository.findLatestActiveActionByType(1L, "ARCHIVE"))
            .thenReturn(Optional.empty());
        when(moderationActionRepository.findLatestActiveActionByType(1L, "MARK_SOLD"))
            .thenReturn(Optional.of(createMockAction("MARK_SOLD")));

        // Act
        String status = listingModerationService.getListingStatus(1L);

        // Assert
        assertEquals("SOLD", status);
    }

    @Test
    void getListingStatus_WhenHidden_ShouldReturnHidden() {
        // Arrange - Mock the underlying repository calls that the service methods use
        // For isListingExpired - mock ACTION_EXPIRE
        when(moderationActionRepository.findLatestActiveActionByType(1L, ListingModerationService.ACTION_EXPIRE))
            .thenReturn(Optional.empty()); // Not expired
        
        // For isListingArchived - mock ACTION_ARCHIVE and ACTION_UNARCHIVE
        when(moderationActionRepository.findLatestActiveActionByType(1L, ListingModerationService.ACTION_ARCHIVE))
            .thenReturn(Optional.empty()); // Not archived
        when(moderationActionRepository.findLatestActiveActionByType(1L, ListingModerationService.ACTION_UNARCHIVE))
            .thenReturn(Optional.empty());
        
        // For isListingSold - mock ACTION_MARK_SOLD and ACTION_UNMARK_SOLD
        when(moderationActionRepository.findLatestActiveActionByType(1L, ListingModerationService.ACTION_MARK_SOLD))
            .thenReturn(Optional.empty()); // Not sold
        when(moderationActionRepository.findLatestActiveActionByType(1L, ListingModerationService.ACTION_UNMARK_SOLD))
            .thenReturn(Optional.empty());
        
        // For isListingHiddenByAdmin - this uses the direct repository method
        when(moderationActionRepository.isListingHiddenByAdmin(1L)).thenReturn(true); // This should trigger HIDDEN

        // Act
        String status = listingModerationService.getListingStatus(1L);

        // Assert
        assertEquals("HIDDEN", status);
    }

    @Test
    void getListingStatus_WhenNotApproved_ShouldReturnPending() {
        // Arrange - No active actions
        when(moderationActionRepository.findLatestActiveActionByType(eq(1L), anyString()))
            .thenReturn(Optional.empty());

        // Act
        String status = listingModerationService.getListingStatus(1L);

        // Assert
        assertEquals("PENDING", status);
    }

    @Test
    void getListingStatus_WhenActive_ShouldReturnActive() {
        // Arrange
        when(moderationActionRepository.findLatestActiveActionByType(1L, "EXPIRE"))
            .thenReturn(Optional.empty());
        when(moderationActionRepository.findLatestActiveActionByType(1L, "ARCHIVE"))
            .thenReturn(Optional.empty());
        when(moderationActionRepository.findLatestActiveActionByType(1L, "MARK_SOLD"))
            .thenReturn(Optional.empty());
        when(moderationActionRepository.findLatestActiveActionByType(1L, "HIDE"))
            .thenReturn(Optional.empty());
        when(moderationActionRepository.findLatestActiveActionByType(1L, "APPROVE"))
            .thenReturn(Optional.of(createMockAction("APPROVE")));

        // Act
        String status = listingModerationService.getListingStatus(1L);

        // Assert
        assertEquals("ACTIVE", status);
    }

    @Test
    void getModerationHistory_ShouldReturnOrderedActions() {
        // Arrange
        ListingModerationAction action1 = createMockAction("APPROVE");
        action1.setPerformedAt(LocalDateTime.now().minusDays(2));
        
        ListingModerationAction action2 = createMockAction("HIDE");
        action2.setPerformedAt(LocalDateTime.now().minusDays(1));
        
        List<ListingModerationAction> actions = Arrays.asList(action2, action1); // Latest first
        
        when(moderationActionRepository.findByListingIdOrderByPerformedAtDesc(1L))
            .thenReturn(actions);

        // Act
        List<ListingModerationAction> result = listingModerationService.getModerationHistory(1L);

        // Assert
        assertEquals(2, result.size());
        assertEquals("HIDE", result.get(0).getActionType()); // Latest first
        assertEquals("APPROVE", result.get(1).getActionType());
    }

    private ListingModerationAction createMockAction(String actionType) {
        ListingModerationAction action = new ListingModerationAction();
        action.setActionType(actionType);
        action.setIsActive(true);
        action.setPerformedAt(LocalDateTime.now());
        
        User mockUser = new User();
        mockUser.setUsername("admin@example.com");
        action.setPerformedBy(mockUser);
        
        return action;
    }
}
