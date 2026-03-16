package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.BadRequestException;
import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.*;
import com.caryo.marketplace.model.UserReport.ReportStatus;
import com.caryo.marketplace.payload.request.ReportUserRequest;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.security.jwt.JwtUtils;
import com.caryo.marketplace.security.services.UserDetailsServiceImpl;
import com.caryo.marketplace.service.I18nService;
import com.caryo.marketplace.service.UserReportService;
import com.caryo.marketplace.service.ReportRateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.caryo.marketplace.security.services.UserDetailsImpl;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Custom annotation to provide UserDetailsImpl in security context
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = UserReportControllerTest.WithMockUserDetailsImplSecurityContextFactory.class)
@interface WithMockUserDetailsImpl {
    long userId() default 1L;
    String username() default "testuser";
    String[] roles() default {"USER"};
}

/**
 * Controller tests for UserReportController.
 * Tests REST endpoints for reporting users.
 */
@WebMvcTest(UserReportController.class)
@Import(com.caryo.marketplace.config.TestSecurityConfig.class)
@ActiveProfiles("test")
@DisplayName("UserReportController Tests")
class UserReportControllerTest {
    
    /**
     * Security context factory for creating UserDetailsImpl
     */
    static class WithMockUserDetailsImplSecurityContextFactory implements WithSecurityContextFactory<WithMockUserDetailsImpl> {
        @Override
        public SecurityContext createSecurityContext(WithMockUserDetailsImpl annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            
            List<SimpleGrantedAuthority> authorities = Arrays.stream(annotation.roles())
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
            
            UserDetailsImpl userDetails = new UserDetailsImpl(
                    annotation.userId(),
                    annotation.username(),
                    annotation.username() + "@example.com",
                    "password",
                    authorities
            );
            
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, authorities);
            context.setAuthentication(authentication);
            return context;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserReportService userReportService;

    @MockBean
    private I18nService i18nService;

    @MockBean
    private ReportRateLimitService rateLimitService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    private ReportUserRequest reportRequest;
    private UserReport userReport;

    @BeforeEach
    void setUp() {
        // Create test report request
        reportRequest = new ReportUserRequest();
        reportRequest.setReportedUserId(2L);
        reportRequest.setConversationId(1L);
        reportRequest.setReportType("SPAM");
        reportRequest.setReason("User sent spam messages");

        // Create test user report
        User reporter = new User();
        reporter.setId(1L);
        reporter.setUsername("reporter");

        User reportedUser = new User();
        reportedUser.setId(2L);
        reportedUser.setUsername("reporteduser");

        Conversation conversation = new Conversation();
        conversation.setId(1L);

        userReport = UserReport.builder()
                .id(1L)
                .reporter(reporter)
                .reportedUser(reportedUser)
                .conversation(conversation)
                .reportType(ReportType.SPAM)
                .reason("User sent spam messages")
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        // Mock i18n service
        when(i18nService.getMessage(eq("user.reported.success"), anyString(), anyString()))
                .thenReturn("User has been reported successfully");
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "testuser", roles = {"USER"})
    @DisplayName("Should create report successfully")
    void shouldCreateReportSuccessfully() throws Exception {
        // Arrange
        when(userReportService.createReport(any(ReportUserRequest.class), eq(1L)))
                .thenReturn(userReport);

        // Act & Assert
        mockMvc.perform(post("/api/v1/reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Accept-Language", "en")
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("User has been reported successfully"))
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.reportType").value("SPAM"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        verify(userReportService).createReport(any(ReportUserRequest.class), eq(1L));
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "testuser", roles = {"USER"})
    @DisplayName("Should create report with Arabic language")
    void shouldCreateReportWithArabicLanguage() throws Exception {
        // Arrange
        when(userReportService.createReport(any(ReportUserRequest.class), eq(1L)))
                .thenReturn(userReport);
        when(i18nService.getMessage(eq("user.reported.success"), eq("ar"), anyString()))
                .thenReturn("تم الإبلاغ عن المستخدم بنجاح");

        // Act & Assert
        mockMvc.perform(post("/api/v1/reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Accept-Language", "ar")
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("تم الإبلاغ عن المستخدم بنجاح"));

        verify(userReportService).createReport(any(ReportUserRequest.class), eq(1L));
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "testuser", roles = {"USER"})
    @DisplayName("Should return 400 when request validation fails")
    void shouldReturn400WhenRequestValidationFails() throws Exception {
        // Arrange
        ReportUserRequest invalidRequest = new ReportUserRequest();
        invalidRequest.setReportedUserId(null); // Missing required field
        invalidRequest.setReportType(""); // Empty report type

        // Act & Assert
        mockMvc.perform(post("/api/v1/reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(userReportService, never()).createReport(any(), any());
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "testuser", roles = {"USER"})
    @DisplayName("Should return 400 when user tries to report themselves")
    void shouldReturn400WhenReportingYourself() throws Exception {
        // Arrange
        when(userReportService.createReport(any(ReportUserRequest.class), eq(1L)))
                .thenThrow(new BadRequestException("Cannot report yourself"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isBadRequest());

        verify(userReportService).createReport(any(ReportUserRequest.class), eq(1L));
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "testuser", roles = {"USER"})
    @DisplayName("Should return 404 when reported user not found")
    void shouldReturn404WhenReportedUserNotFound() throws Exception {
        // Arrange
        when(userReportService.createReport(any(ReportUserRequest.class), eq(1L)))
                .thenThrow(new ResourceNotFoundException("User", "id", 2L));

        // Act & Assert
        mockMvc.perform(post("/api/v1/reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isNotFound());

        verify(userReportService).createReport(any(ReportUserRequest.class), eq(1L));
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/reports")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isUnauthorized());

        verify(userReportService, never()).createReport(any(), any());
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "testuser", roles = {"USER"})
    @DisplayName("Should get my reports successfully")
    void shouldGetMyReportsSuccessfully() throws Exception {
        // Arrange
        Pageable pageable = PageRequest.of(0, 20);
        Page<UserReport> reportPage = new PageImpl<>(List.of(userReport), pageable, 1);
        when(userReportService.getReportsByReporter(eq(1L), any(Pageable.class)))
                .thenReturn(reportPage);

        // Act & Assert
        mockMvc.perform(get("/api/v1/reports/my-reports")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].id").value(1L))
                .andExpect(jsonPath("$.content[0].reportType").value("SPAM"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(userReportService).getReportsByReporter(eq(1L), any(Pageable.class));
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "testuser", roles = {"USER"})
    @DisplayName("Should get my reports with custom pagination")
    void shouldGetMyReportsWithCustomPagination() throws Exception {
        // Arrange
        Pageable pageable = PageRequest.of(1, 10);
        Page<UserReport> reportPage = new PageImpl<>(List.of(), pageable, 0);
        when(userReportService.getReportsByReporter(eq(1L), any(Pageable.class)))
                .thenReturn(reportPage);

        // Act & Assert
        mockMvc.perform(get("/api/v1/reports/my-reports")
                        .param("page", "1")
                        .param("size", "10")
                        .param("sortBy", "createdAt")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(0));

        verify(userReportService).getReportsByReporter(eq(1L), any(Pageable.class));
    }

    @Test
    @DisplayName("Should return 401 when getting reports without authentication")
    void shouldReturn401WhenGettingReportsWithoutAuthentication() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/reports/my-reports"))
                .andExpect(status().isUnauthorized());

        verify(userReportService, never()).getReportsByReporter(any(), any());
    }
}

