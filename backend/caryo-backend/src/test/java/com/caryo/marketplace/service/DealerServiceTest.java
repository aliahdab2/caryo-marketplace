package com.caryo.marketplace.service;

import com.caryo.marketplace.model.Dealer;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.request.DealerProfileUpdateRequest;
import com.caryo.marketplace.payload.request.SignupRequest;
import com.caryo.marketplace.repository.DealerRepository;
import com.caryo.marketplace.service.storage.StorageKeyGenerator;
import com.caryo.marketplace.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DealerServiceTest {

    @Mock
    private DealerRepository dealerRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private StorageKeyGenerator storageKeyGenerator;

    @InjectMocks
    private DealerService dealerService;

    private User user;
    private SignupRequest signupRequest;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");

        signupRequest = new SignupRequest();
        signupRequest.setBusinessName("Test Dealer");
        signupRequest.setBusinessEmail("dealer@example.com");
        signupRequest.setBusinessPhone("+1234567890");
    }

    @Test
    void createDealer_withTempLogoUrl_shouldMoveFile() {
        // Arrange
        String tempUrl = "http://localhost:8080/api/files/temp/uuid-123.jpg";
        String tempKey = "temp/uuid-123.jpg";
        String destKey = "dealers/logos/uuid-123.jpg";

        signupRequest.setLogoUrl(tempUrl);

        when(storageKeyGenerator.extractKeyFromUrl(tempUrl)).thenReturn(tempKey);
        when(storageKeyGenerator.getFilename(tempKey)).thenReturn("uuid-123.jpg");
        when(storageService.move(tempKey, destKey)).thenReturn(destKey);
        when(dealerRepository.save(any(Dealer.class))).thenAnswer(inv -> {
            Dealer d = inv.getArgument(0);
            d.setId(1L);
            return d;
        });

        // Act
        Dealer result = dealerService.createDealer(user, signupRequest);

        // Assert
        assertThat(result.getLogoUrl()).isEqualTo(destKey);
        verify(storageService).move(tempKey, destKey);
    }

    @Test
    void createDealer_withNonTempLogoUrl_shouldKeepOriginal() {
        // Arrange
        String externalUrl = "https://example.com/logo.png";
        signupRequest.setLogoUrl(externalUrl);

        when(storageKeyGenerator.extractKeyFromUrl(externalUrl)).thenReturn(externalUrl);
        when(dealerRepository.save(any(Dealer.class))).thenAnswer(inv -> {
            Dealer d = inv.getArgument(0);
            d.setId(1L);
            return d;
        });

        // Act
        Dealer result = dealerService.createDealer(user, signupRequest);

        // Assert
        assertThat(result.getLogoUrl()).isEqualTo(externalUrl);
        verify(storageService, never()).move(anyString(), anyString());
    }

    @Test
    void createDealer_withNullLogoUrl_shouldSetNullLogo() {
        // Arrange
        signupRequest.setLogoUrl(null);

        when(dealerRepository.save(any(Dealer.class))).thenAnswer(inv -> {
            Dealer d = inv.getArgument(0);
            d.setId(1L);
            return d;
        });

        // Act
        Dealer result = dealerService.createDealer(user, signupRequest);

        // Assert
        assertThat(result.getLogoUrl()).isNull();
        verify(storageService, never()).move(anyString(), anyString());
    }

    @Test
    void createDealer_whenMoveFails_shouldKeepOriginalUrl() {
        // Arrange
        String tempUrl = "http://localhost:8080/api/files/temp/uuid-123.jpg";
        String tempKey = "temp/uuid-123.jpg";

        signupRequest.setLogoUrl(tempUrl);

        when(storageKeyGenerator.extractKeyFromUrl(tempUrl)).thenReturn(tempKey);
        when(storageKeyGenerator.getFilename(tempKey)).thenReturn("uuid-123.jpg");
        when(storageService.move(anyString(), anyString())).thenThrow(new RuntimeException("Move failed"));
        when(dealerRepository.save(any(Dealer.class))).thenAnswer(inv -> {
            Dealer d = inv.getArgument(0);
            d.setId(1L);
            return d;
        });

        // Act
        Dealer result = dealerService.createDealer(user, signupRequest);

        // Assert - should gracefully fall back to original URL
        assertThat(result.getLogoUrl()).isEqualTo(tempUrl);
    }

    @Test
    void updatePublicProfile_logoChanged_shouldDeleteOldFile() {
        // Arrange
        Dealer dealer = createDealer();
        dealer.setLogoUrl("/api/v1/files/dealers/logos/old-logo.jpg");

        DealerProfileUpdateRequest updateRequest = new DealerProfileUpdateRequest();
        updateRequest.setLogoUrl("/api/v1/files/dealers/logos/new-logo.jpg");

        when(storageKeyGenerator.extractKeyFromUrl("/api/v1/files/dealers/logos/old-logo.jpg"))
                .thenReturn("dealers/logos/old-logo.jpg");
        when(storageService.delete("dealers/logos/old-logo.jpg")).thenReturn(true);
        when(dealerRepository.save(any(Dealer.class))).thenReturn(dealer);

        // Act
        Dealer result = dealerService.updatePublicProfile(dealer, updateRequest);

        // Assert
        verify(storageService).delete("dealers/logos/old-logo.jpg");
        assertThat(result.getLogoUrl()).isEqualTo("/api/v1/files/dealers/logos/new-logo.jpg");
    }

    @Test
    void updatePublicProfile_logoUnchanged_shouldNotDelete() {
        // Arrange
        Dealer dealer = createDealer();
        String sameUrl = "/api/v1/files/dealers/logos/same-logo.jpg";
        dealer.setLogoUrl(sameUrl);

        DealerProfileUpdateRequest updateRequest = new DealerProfileUpdateRequest();
        updateRequest.setLogoUrl(sameUrl);

        when(dealerRepository.save(any(Dealer.class))).thenReturn(dealer);

        // Act
        dealerService.updatePublicProfile(dealer, updateRequest);

        // Assert
        verify(storageService, never()).delete(anyString());
    }

    @Test
    void updatePublicProfile_logoSetToNull_shouldDeleteOldFile() {
        // Arrange
        Dealer dealer = createDealer();
        dealer.setLogoUrl("/api/v1/files/dealers/logos/old-logo.jpg");

        DealerProfileUpdateRequest updateRequest = new DealerProfileUpdateRequest();
        updateRequest.setLogoUrl(""); // Empty string means set to null

        when(storageKeyGenerator.extractKeyFromUrl("/api/v1/files/dealers/logos/old-logo.jpg"))
                .thenReturn("dealers/logos/old-logo.jpg");
        when(storageService.delete("dealers/logos/old-logo.jpg")).thenReturn(true);
        when(dealerRepository.save(any(Dealer.class))).thenReturn(dealer);

        // Act
        Dealer result = dealerService.updatePublicProfile(dealer, updateRequest);

        // Assert
        verify(storageService).delete("dealers/logos/old-logo.jpg");
        assertThat(result.getLogoUrl()).isNull();
    }

    @Test
    void updatePublicProfile_deleteOldFileFails_shouldStillUpdate() {
        // Arrange
        Dealer dealer = createDealer();
        dealer.setLogoUrl("/api/v1/files/dealers/logos/old-logo.jpg");

        DealerProfileUpdateRequest updateRequest = new DealerProfileUpdateRequest();
        updateRequest.setLogoUrl("/api/v1/files/dealers/logos/new-logo.jpg");

        when(storageKeyGenerator.extractKeyFromUrl("/api/v1/files/dealers/logos/old-logo.jpg"))
                .thenReturn("dealers/logos/old-logo.jpg");
        when(storageService.delete("dealers/logos/old-logo.jpg"))
                .thenThrow(new RuntimeException("Delete failed"));
        when(dealerRepository.save(any(Dealer.class))).thenReturn(dealer);

        // Act
        Dealer result = dealerService.updatePublicProfile(dealer, updateRequest);

        // Assert - update should succeed despite delete failure
        assertThat(result.getLogoUrl()).isEqualTo("/api/v1/files/dealers/logos/new-logo.jpg");
    }

    @Test
    void updatePublicProfile_withRelativeApiPath_shouldBeValid() {
        // Arrange
        Dealer dealer = createDealer();
        DealerProfileUpdateRequest updateRequest = new DealerProfileUpdateRequest();
        updateRequest.setLogoUrl("/api/v1/files/dealers/logos/logo.jpg");

        when(dealerRepository.save(any(Dealer.class))).thenReturn(dealer);

        // Act
        Dealer result = dealerService.updatePublicProfile(dealer, updateRequest);

        // Assert - should not throw (relative /api/ paths are valid)
        assertThat(result.getLogoUrl()).isEqualTo("/api/v1/files/dealers/logos/logo.jpg");
    }

    @Test
    void updatePublicProfile_withHttpsUrl_shouldBeValid() {
        // Arrange
        Dealer dealer = createDealer();
        DealerProfileUpdateRequest updateRequest = new DealerProfileUpdateRequest();
        updateRequest.setLogoUrl("https://example.com/logo.png");

        when(dealerRepository.save(any(Dealer.class))).thenReturn(dealer);

        // Act
        Dealer result = dealerService.updatePublicProfile(dealer, updateRequest);

        // Assert
        assertThat(result.getLogoUrl()).isEqualTo("https://example.com/logo.png");
    }

    private Dealer createDealer() {
        Dealer dealer = new Dealer();
        dealer.setId(1L);
        dealer.setUser(user);
        dealer.setBusinessName("Test Dealer");
        dealer.setBusinessEmail("dealer@example.com");
        return dealer;
    }
}
