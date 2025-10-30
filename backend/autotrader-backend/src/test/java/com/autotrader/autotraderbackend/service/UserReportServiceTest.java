package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.model.UserReport.ReportStatus;
import com.autotrader.autotraderbackend.payload.request.ReportUserRequest;
import com.autotrader.autotraderbackend.repository.ConversationRepository;
import com.autotrader.autotraderbackend.repository.UserReportRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserReportService.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserReportService Tests")
public class UserReportServiceTest {

    @Mock
    private UserReportRepository userReportRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @InjectMocks
    private UserReportService userReportService;

    private User reporter;
    private User reportedUser;
    private Conversation testConversation;
    private ReportUserRequest request;

    @BeforeEach
    void setUp() {
        // Create test users
        reporter = new User();
        reporter.setId(1L);
        reporter.setEmail("reporter@example.com");
        reporter.setUsername("reporter");

        reportedUser = new User();
        reportedUser.setId(2L);
        reportedUser.setEmail("reported@example.com");
        reportedUser.setUsername("reporteduser");

        // Create test conversation
        CarListing listing = new CarListing();
        listing.setId(1L);
        listing.setTitle("Test Car");
        listing.setSeller(reportedUser);

        testConversation = Conversation.builder()
                .id(1L)
                .listing(listing)
                .buyer(reporter)
                .seller(reportedUser)
                .status(ConversationStatus.ACTIVE)
                .build();

        // Create test request
        request = new ReportUserRequest();
        request.setReportedUserId(2L);
        request.setConversationId(1L);
        request.setReportType("SPAM");
        request.setReason("User sent spam messages");
    }

    @Test
    @DisplayName("Should create report successfully")
    void shouldCreateReportSuccessfully() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reportedUser));
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userReportRepository.existsPendingReportByReporterAndReportedUser(reporter, reportedUser)).thenReturn(false);
        
        UserReport savedReport = UserReport.builder()
                .id(1L)
                .reporter(reporter)
                .reportedUser(reportedUser)
                .conversation(testConversation)
                .reportType("SPAM")
                .reason("User sent spam messages")
                .status(ReportStatus.PENDING)
                .build();

        when(userReportRepository.save(any(UserReport.class))).thenReturn(savedReport);

        // Act
        UserReport result = userReportService.createReport(request, 1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getReporter().getId()).isEqualTo(1L);
        assertThat(result.getReportedUser().getId()).isEqualTo(2L);
        assertThat(result.getReportType()).isEqualTo("SPAM");
        assertThat(result.getStatus()).isEqualTo(ReportStatus.PENDING);

        verify(userReportRepository).save(any(UserReport.class));
        verify(userReportRepository).existsPendingReportByReporterAndReportedUser(reporter, reportedUser);
    }

    @Test
    @DisplayName("Should create report without conversation")
    void shouldCreateReportWithoutConversation() {
        // Arrange
        request.setConversationId(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reportedUser));
        when(userReportRepository.existsPendingReportByReporterAndReportedUser(reporter, reportedUser)).thenReturn(false);
        
        UserReport savedReport = UserReport.builder()
                .id(1L)
                .reporter(reporter)
                .reportedUser(reportedUser)
                .conversation(null)
                .reportType("HARASSMENT")
                .reason("User was harassing")
                .status(ReportStatus.PENDING)
                .build();

        when(userReportRepository.save(any(UserReport.class))).thenReturn(savedReport);

        // Act
        UserReport result = userReportService.createReport(request, 1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getConversation()).isNull();
        verify(conversationRepository, never()).findById(any());
    }

    @Test
    @DisplayName("Should throw exception when reporter not found")
    void shouldThrowExceptionWhenReporterNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userReportService.createReport(request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User");

        verify(userReportRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when reported user not found")
    void shouldThrowExceptionWhenReportedUserNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userReportService.createReport(request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User");

        verify(userReportRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when trying to report yourself")
    void shouldThrowExceptionWhenReportingYourself() {
        // Arrange
        request.setReportedUserId(1L); // Same as reporter

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));

        // Act & Assert
        assertThatThrownBy(() -> userReportService.createReport(request, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot report yourself");

        verify(userReportRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when duplicate pending report exists")
    void shouldThrowExceptionWhenDuplicatePendingReportExists() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reportedUser));
        when(userReportRepository.existsPendingReportByReporterAndReportedUser(reporter, reportedUser)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userReportService.createReport(request, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already submitted");

        verify(userReportRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when conversation not found")
    void shouldThrowExceptionWhenConversationNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reportedUser));
        when(conversationRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userReportService.createReport(request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Conversation");

        verify(userReportRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when reporter not participant in conversation")
    void shouldThrowExceptionWhenReporterNotParticipant() {
        // Arrange
        User nonParticipant = new User();
        nonParticipant.setId(999L);
        nonParticipant.setUsername("nonparticipant");

        CarListing listing2 = new CarListing();
        listing2.setId(2L);
        listing2.setTitle("Another Car");
        listing2.setSeller(reportedUser);

        Conversation conversationWithoutReporter = Conversation.builder()
                .id(1L)
                .listing(listing2)
                .buyer(nonParticipant)
                .seller(reportedUser)
                .status(ConversationStatus.ACTIVE)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reportedUser));
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversationWithoutReporter));

        // Act & Assert
        assertThatThrownBy(() -> userReportService.createReport(request, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("participant");

        verify(userReportRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should get reports by reporter")
    void shouldGetReportsByReporter() {
        // Arrange
        UserReport report1 = UserReport.builder()
                .id(1L)
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reportType("SPAM")
                .reason("Spam messages")
                .status(ReportStatus.PENDING)
                .build();

        List<UserReport> reports = List.of(report1);
        Pageable pageable = PageRequest.of(0, 20);
        Page<UserReport> page = new PageImpl<>(reports, pageable, 1);

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userReportRepository.findByReporterOrderByCreatedAtDesc(reporter, pageable)).thenReturn(page);

        // Act
        Page<UserReport> result = userReportService.getReportsByReporter(1L, pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(1L);
        verify(userReportRepository).findByReporterOrderByCreatedAtDesc(reporter, pageable);
    }

    @Test
    @DisplayName("Should get reports by status")
    void shouldGetReportsByStatus() {
        // Arrange
        UserReport report1 = UserReport.builder()
                .id(1L)
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reportType("SPAM")
                .reason("Spam messages")
                .status(ReportStatus.PENDING)
                .build();

        List<UserReport> reports = List.of(report1);
        Pageable pageable = PageRequest.of(0, 20);
        Page<UserReport> page = new PageImpl<>(reports, pageable, 1);

        when(userReportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING, pageable)).thenReturn(page);

        // Act
        Page<UserReport> result = userReportService.getReportsByStatus(ReportStatus.PENDING, pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(userReportRepository).findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING, pageable);
    }
}
