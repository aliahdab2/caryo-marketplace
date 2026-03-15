package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.User;
import com.caryo.marketplace.model.UserBlock;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.security.jwt.JwtUtils;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.security.services.UserDetailsServiceImpl;
import com.caryo.marketplace.service.I18nService;
import com.caryo.marketplace.service.UserBlockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller tests for {@link UserBlockController}
 */
@WebMvcTest(UserBlockController.class)
@DisplayName("UserBlockController Tests")
public class UserBlockControllerTest {

    @Target({ElementType.METHOD, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @WithSecurityContext(factory = UserBlockControllerTest.WithMockUserDetailsImplSecurityContextFactory.class)
    @interface WithMockUserDetailsImpl {
        long userId() default 1L;
        String username() default "testuser";
        String[] roles() default {"USER"};
    }

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
    private UserBlockService userBlockService;

    @MockBean
    private I18nService i18nService;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private UserRepository userRepository;

    private User blocker;
    private User blocked;
    private UserBlock userBlock;

    @BeforeEach
    void setUp() {
        blocker = new User();
        blocker.setId(1L);
        blocker.setUsername("blocker");
        blocker.setEmail("blocker@example.com");

        blocked = new User();
        blocked.setId(2L);
        blocked.setUsername("blocked");
        blocked.setEmail("blocked@example.com");

        userBlock = UserBlock.builder()
                .id(1L)
                .blocker(blocker)
                .blocked(blocked)
                .createdAt(LocalDateTime.now())
                .build();

        // Mock i18n service
        when(i18nService.getMessage(anyString(), anyString(), anyString())).thenAnswer(invocation -> invocation.getArgument(2));
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "blocker", roles = {"USER"})
    @DisplayName("Should block user successfully")
    void shouldBlockUserSuccessfully() throws Exception {
        // Arrange
        when(userBlockService.blockUser(1L, 2L)).thenReturn(userBlock);

        // Act & Assert
        mockMvc.perform(post("/api/users/block/2")
                        .with(csrf())
                        .header("Accept-Language", "en"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").exists());

        verify(userBlockService).blockUser(1L, 2L);
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "blocker", roles = {"USER"})
    @DisplayName("Should unblock user successfully")
    void shouldUnblockUserSuccessfully() throws Exception {
        // Arrange
        doNothing().when(userBlockService).unblockUser(1L, 2L);

        // Act & Assert
        mockMvc.perform(delete("/api/users/block/2")
                        .with(csrf())
                        .header("Accept-Language", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").exists());

        verify(userBlockService).unblockUser(1L, 2L);
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "blocker", roles = {"USER"})
    @DisplayName("Should get blocked users list")
    void shouldGetBlockedUsers() throws Exception {
        // Arrange
        User blocked1 = new User();
        blocked1.setId(2L);
        blocked1.setUsername("blocked1");

        User blocked2 = new User();
        blocked2.setId(3L);
        blocked2.setUsername("blocked2");

        UserBlock block1 = UserBlock.builder()
                .id(1L)
                .blocker(blocker)
                .blocked(blocked1)
                .createdAt(LocalDateTime.now())
                .build();

        UserBlock block2 = UserBlock.builder()
                .id(2L)
                .blocker(blocker)
                .blocked(blocked2)
                .createdAt(LocalDateTime.now())
                .build();

        when(userBlockService.getBlockedUsers(1L)).thenReturn(List.of(block1, block2));

        // Act & Assert
        mockMvc.perform(get("/api/users/block")
                        .header("Accept-Language", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(userBlockService).getBlockedUsers(1L);
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "blocker", roles = {"USER"})
    @DisplayName("Should check if user is blocked")
    void shouldCheckIfUserIsBlocked() throws Exception {
        // Arrange
        when(userBlockService.isBlocked(1L, 2L)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/users/block/2/status")
                        .header("Accept-Language", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data").value(true));

        verify(userBlockService).isBlocked(1L, 2L);
    }

    @Test
    @DisplayName("Should return 401 when unauthenticated - block user")
    void shouldReturn401WhenUnauthenticatedBlockUser() throws Exception {
        mockMvc.perform(post("/api/users/block/2")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());

        verify(userBlockService, never()).blockUser(anyLong(), anyLong());
    }

    @Test
    @DisplayName("Should return 401 when unauthenticated - get blocked users")
    void shouldReturn401WhenUnauthenticatedGetBlockedUsers() throws Exception {
        mockMvc.perform(get("/api/users/block"))
                .andExpect(status().isUnauthorized());

        verify(userBlockService, never()).getBlockedUsers(anyLong());
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "blocker", roles = {"USER"})
    @DisplayName("Should handle Arabic language in block user")
    void shouldHandleArabicLanguageInBlockUser() throws Exception {
        // Arrange
        when(userBlockService.blockUser(1L, 2L)).thenReturn(userBlock);
        when(i18nService.getMessage(eq("user.blocked.success"), eq("ar"), anyString()))
                .thenReturn("تم حظر المستخدم بنجاح");

        // Act & Assert
        mockMvc.perform(post("/api/users/block/2")
                        .with(csrf())
                        .header("Accept-Language", "ar"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("تم حظر المستخدم بنجاح"));

        verify(i18nService).getMessage(eq("user.blocked.success"), eq("ar"), anyString());
    }
}

