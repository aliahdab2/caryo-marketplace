package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.BadRequestException;
import com.caryo.marketplace.payload.request.CreateConversationRequest;
import com.caryo.marketplace.payload.request.SendMessageRequest;
import com.caryo.marketplace.payload.response.ApiResponse;
import com.caryo.marketplace.payload.response.ConversationResponse;
import com.caryo.marketplace.payload.response.ConversationStatsResponse;
import com.caryo.marketplace.payload.response.MessageResponse;
import com.caryo.marketplace.payload.response.PageResponse;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.service.ConversationService;
import com.caryo.marketplace.service.I18nService;
import com.caryo.marketplace.service.MessageSanitizationService;
import com.caryo.marketplace.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ConversationControllerTest {

    @Mock
    private ConversationService conversationService;

    @Mock
    private I18nService i18nService;

    @Mock
    private MessageSanitizationService messageSanitizationService;

    @InjectMocks
    private ConversationController conversationController;

    private UserDetailsImpl userDetails;

    private static final Long TEST_USER_ID = 1L;
    private static final Long TEST_CONVERSATION_ID = 10L;
    private static final Long TEST_MESSAGE_ID = 100L;

    @BeforeEach
    void setUp() {
        User testUser = new User();
        testUser.setId(TEST_USER_ID);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        userDetails = UserDetailsImpl.build(testUser);
    }

    @Nested
    @DisplayName("POST /api/conversations")
    class CreateConversation {

        @Test
        @DisplayName("Should create conversation and return 201")
        void createConversation_Success() {
            CreateConversationRequest request = CreateConversationRequest.builder()
                    .listingId(5L)
                    .initialMessage("Is this car still available?")
                    .build();

            ConversationResponse convResponse = ConversationResponse.builder()
                    .id(TEST_CONVERSATION_ID)
                    .listingId(5L)
                    .build();

            when(conversationService.createConversation(request, TEST_USER_ID)).thenReturn(convResponse);
            when(i18nService.getMessage("conversation.created.success", "en")).thenReturn("Conversation created");

            ResponseEntity<ApiResponse<ConversationResponse>> response =
                    conversationController.createConversation(request, userDetails, "en");

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("success", response.getBody().getStatus());
            assertEquals(TEST_CONVERSATION_ID, response.getBody().getData().getId());

            verify(conversationService).createConversation(request, TEST_USER_ID);
        }
    }

    @Nested
    @DisplayName("GET /api/conversations/my-conversations")
    class GetUserConversations {

        @Test
        @DisplayName("Should return paginated conversations")
        void getUserConversations_Success() {
            ConversationResponse conv = ConversationResponse.builder()
                    .id(TEST_CONVERSATION_ID)
                    .build();

            Page<ConversationResponse> page = new PageImpl<>(List.of(conv), PageRequest.of(0, 20), 1);
            when(conversationService.getUserConversations(eq(TEST_USER_ID), any(Pageable.class)))
                    .thenReturn(page);

            ResponseEntity<PageResponse<ConversationResponse>> response =
                    conversationController.getUserConversations(0, 20, "lastMessageAt", "desc", userDetails);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getContent().size());
            assertEquals(1, response.getBody().getTotalElements());
        }

        @Test
        @DisplayName("Should handle ascending sort direction")
        void getUserConversations_AscSort() {
            Page<ConversationResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
            when(conversationService.getUserConversations(eq(TEST_USER_ID), any(Pageable.class)))
                    .thenReturn(page);

            ResponseEntity<PageResponse<ConversationResponse>> response =
                    conversationController.getUserConversations(0, 10, "createdAt", "asc", userDetails);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().getContent().isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/conversations/stats")
    class GetConversationStats {

        private MockMvc mockMvc;

        @BeforeEach
        void setUpMockMvc() {
            // Standalone MockMvc exercises the real request mappings, so these
            // tests guard the routing contract: /stats must never be captured
            // by the numeric /{id} handler (the original bug returned 500).
            HandlerMethodArgumentResolver principalResolver = new HandlerMethodArgumentResolver() {
                @Override
                public boolean supportsParameter(MethodParameter parameter) {
                    return UserDetailsImpl.class.isAssignableFrom(parameter.getParameterType());
                }

                @Override
                public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                              NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                    return userDetails;
                }
            };
            mockMvc = MockMvcBuilders.standaloneSetup(conversationController)
                    .setCustomArgumentResolvers(principalResolver)
                    .build();
        }

        @Test
        @DisplayName("Should return aggregated stats and not be swallowed by /{id}")
        void getStats_RoutesToStatsHandler() throws Exception {
            ConversationStatsResponse stats = new ConversationStatsResponse(7L, 4L, 5L, 2L);
            when(conversationService.getConversationStats(TEST_USER_ID)).thenReturn(stats);

            mockMvc.perform(get("/api/v1/conversations/stats"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalConversations").value(7))
                    .andExpect(jsonPath("$.activeConversations").value(4))
                    .andExpect(jsonPath("$.unreadMessages").value(5))
                    .andExpect(jsonPath("$.archivedConversations").value(2));

            verify(conversationService).getConversationStats(TEST_USER_ID);
            verify(conversationService, never()).getConversation(anyLong(), anyLong());
        }

        @Test
        @DisplayName("Numeric IDs should still route to the /{id} handler")
        void getConversationById_StillRoutes() throws Exception {
            ConversationResponse conv = ConversationResponse.builder()
                    .id(TEST_CONVERSATION_ID)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            when(conversationService.getConversation(TEST_CONVERSATION_ID, TEST_USER_ID)).thenReturn(conv);

            mockMvc.perform(get("/api/v1/conversations/" + TEST_CONVERSATION_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(TEST_CONVERSATION_ID));

            verify(conversationService).getConversation(TEST_CONVERSATION_ID, TEST_USER_ID);
        }

        @Test
        @DisplayName("Non-numeric path segments other than known literals should 404, not 500")
        void getConversation_NonNumericPath_NotFound() throws Exception {
            mockMvc.perform(get("/api/v1/conversations/not-a-number"))
                    .andExpect(status().isNotFound());

            verify(conversationService, never()).getConversation(anyLong(), anyLong());
        }
    }

    @Nested
    @DisplayName("GET /api/conversations/{id}")
    class GetConversation {

        @Test
        @DisplayName("Should return conversation by ID")
        void getConversation_Success() {
            ConversationResponse conv = ConversationResponse.builder()
                    .id(TEST_CONVERSATION_ID)
                    .listingId(5L)
                    .build();

            when(conversationService.getConversation(TEST_CONVERSATION_ID, TEST_USER_ID)).thenReturn(conv);

            ResponseEntity<ConversationResponse> response =
                    conversationController.getConversation(TEST_CONVERSATION_ID, userDetails);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(TEST_CONVERSATION_ID, response.getBody().getId());
        }
    }

    @Nested
    @DisplayName("GET /api/conversations/{id}/messages")
    class GetConversationMessages {

        @Test
        @DisplayName("Should return paginated messages")
        void getMessages_Success() {
            MessageResponse msg = MessageResponse.builder()
                    .id(TEST_MESSAGE_ID)
                    .content("Hello")
                    .build();

            Page<MessageResponse> page = new PageImpl<>(List.of(msg), PageRequest.of(0, 50), 1);
            when(conversationService.getConversationMessages(eq(TEST_CONVERSATION_ID), eq(TEST_USER_ID), any(Pageable.class)))
                    .thenReturn(page);

            ResponseEntity<PageResponse<MessageResponse>> response =
                    conversationController.getConversationMessages(TEST_CONVERSATION_ID, 0, 50, "createdAt", "asc", userDetails);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getContent().size());
        }
    }

    @Nested
    @DisplayName("POST /api/conversations/{id}/messages")
    class SendMessage {

        @Test
        @DisplayName("Should send message and return 201")
        void sendMessage_Success() {
            SendMessageRequest request = new SendMessageRequest();
            request.setContent("Hello seller!");

            MessageResponse msgResponse = MessageResponse.builder()
                    .id(TEST_MESSAGE_ID)
                    .content("Hello seller!")
                    .build();

            when(conversationService.sendMessage(TEST_CONVERSATION_ID, request, TEST_USER_ID))
                    .thenReturn(msgResponse);
            when(i18nService.getMessage("message.sent.success", "en")).thenReturn("Message sent");

            ResponseEntity<ApiResponse<MessageResponse>> response =
                    conversationController.sendMessage(TEST_CONVERSATION_ID, request, userDetails, "en");

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("success", response.getBody().getStatus());
            assertEquals("Hello seller!", response.getBody().getData().getContent());
        }
    }

    @Nested
    @DisplayName("PATCH /api/conversations/messages/{messageId}/read")
    class MarkMessageAsRead {

        @Test
        @DisplayName("Should mark message as read")
        void markMessageAsRead_Success() {
            doNothing().when(conversationService).markMessageAsRead(TEST_MESSAGE_ID, TEST_USER_ID);
            when(i18nService.getMessage("message.marked.read.success", "en")).thenReturn("Marked as read");

            ResponseEntity<ApiResponse<Void>> response =
                    conversationController.markMessageAsRead(TEST_MESSAGE_ID, userDetails, "en");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(conversationService).markMessageAsRead(TEST_MESSAGE_ID, TEST_USER_ID);
        }
    }

    @Nested
    @DisplayName("PATCH /api/conversations/{id}/messages/read-all")
    class MarkAllMessagesAsRead {

        @Test
        @DisplayName("Should mark all messages as read")
        void markAllAsRead_Success() {
            doNothing().when(conversationService).markAllMessagesAsRead(TEST_CONVERSATION_ID, TEST_USER_ID);
            when(i18nService.getMessage("messages.marked.read.all.success", "en")).thenReturn("All marked as read");

            ResponseEntity<ApiResponse<Void>> response =
                    conversationController.markAllMessagesAsRead(TEST_CONVERSATION_ID, userDetails, "en");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(conversationService).markAllMessagesAsRead(TEST_CONVERSATION_ID, TEST_USER_ID);
        }
    }

    @Nested
    @DisplayName("PATCH /api/conversations/{id}/archive")
    class ArchiveConversation {

        @Test
        @DisplayName("Should archive conversation")
        void archive_Success() {
            doNothing().when(conversationService).archiveConversation(TEST_CONVERSATION_ID, TEST_USER_ID);
            when(i18nService.getMessage("conversation.archived.success", "en")).thenReturn("Archived");

            ResponseEntity<ApiResponse<Void>> response =
                    conversationController.archiveConversation(TEST_CONVERSATION_ID, userDetails, "en");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(conversationService).archiveConversation(TEST_CONVERSATION_ID, TEST_USER_ID);
        }
    }

    @Nested
    @DisplayName("PATCH /api/conversations/{id}/block")
    class BlockUser {

        @Test
        @DisplayName("Should block user in conversation")
        void blockUser_Success() {
            doNothing().when(conversationService).blockUser(TEST_CONVERSATION_ID, TEST_USER_ID);
            when(i18nService.getMessage("conversation.user.blocked.success", "en", "User has been blocked successfully"))
                    .thenReturn("User blocked");

            ResponseEntity<ApiResponse<Void>> response =
                    conversationController.blockUser(TEST_CONVERSATION_ID, userDetails, "en");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(conversationService).blockUser(TEST_CONVERSATION_ID, TEST_USER_ID);
        }
    }

    @Nested
    @DisplayName("PATCH /api/conversations/{id}/status")
    class UpdateConversationStatus {

        @Test
        @DisplayName("Should update conversation status")
        void updateStatus_Success() {
            doNothing().when(conversationService).updateConversationStatus(TEST_CONVERSATION_ID, "closed", TEST_USER_ID);
            when(i18nService.getMessage("conversation.status.updated.success", "en")).thenReturn("Status updated");

            ResponseEntity<ApiResponse<Void>> response =
                    conversationController.updateConversationStatus(TEST_CONVERSATION_ID, "closed", userDetails, "en");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(conversationService).updateConversationStatus(TEST_CONVERSATION_ID, "closed", TEST_USER_ID);
        }
    }

    @Nested
    @DisplayName("POST /api/conversations/{id}/messages/attachments")
    class UploadMessageAttachment {

        @Test
        @DisplayName("Should upload attachment and return 201")
        void uploadAttachment_Success() {
            MultipartFile file = mock(MultipartFile.class);
            Map<String, Object> result = Map.of("fileKey", "uploads/attachment.pdf", "fileName", "attachment.pdf");

            when(conversationService.uploadMessageAttachment(TEST_CONVERSATION_ID, file, TEST_USER_ID))
                    .thenReturn(result);
            when(i18nService.getMessage("message.attachment.uploaded.success", "en")).thenReturn("Uploaded");

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    conversationController.uploadMessageAttachment(TEST_CONVERSATION_ID, file, userDetails, "en");

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("uploads/attachment.pdf", response.getBody().getData().get("fileKey"));
        }
    }

    @Nested
    @DisplayName("POST /api/conversations/{id}/messages/with-attachments")
    class SendMessageWithAttachments {

        @Test
        @DisplayName("Should send message with attachments")
        void sendWithAttachments_Success() {
            MultipartFile[] files = new MultipartFile[]{mock(MultipartFile.class)};
            String content = "Check this image";

            MessageResponse msgResponse = MessageResponse.builder()
                    .id(TEST_MESSAGE_ID)
                    .content(content)
                    .build();

            when(messageSanitizationService.sanitize(content)).thenReturn(content);
            when(conversationService.sendMessageWithAttachments(
                    eq(TEST_CONVERSATION_ID), eq(content), eq("image"), eq(files), eq(TEST_USER_ID)))
                    .thenReturn(msgResponse);
            when(i18nService.getMessage("message.sent.success", "en")).thenReturn("Sent");

            ResponseEntity<ApiResponse<MessageResponse>> response =
                    conversationController.sendMessageWithAttachments(
                            TEST_CONVERSATION_ID, content, "image", files, userDetails, "en");

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("success", response.getBody().getStatus());
        }

        @Test
        @DisplayName("Should throw BadRequestException when both content and files are empty")
        void sendWithAttachments_EmptyContentAndFiles() {
            when(i18nService.getMessage("error.message.content.required", "en")).thenReturn("Content required");

            assertThrows(BadRequestException.class, () ->
                    conversationController.sendMessageWithAttachments(
                            TEST_CONVERSATION_ID, "", "text", null, userDetails, "en"));
        }

        @Test
        @DisplayName("Should throw BadRequestException when content exceeds 1000 chars")
        void sendWithAttachments_ContentTooLong() {
            String longContent = "x".repeat(1001);
            when(i18nService.getMessage("error.message.content.too.long", "en")).thenReturn("Content too long");

            assertThrows(BadRequestException.class, () ->
                    conversationController.sendMessageWithAttachments(
                            TEST_CONVERSATION_ID, longContent, "text", null, userDetails, "en"));
        }

        @Test
        @DisplayName("Should sanitize content before sending")
        void sendWithAttachments_SanitizesContent() {
            String maliciousContent = "<script>alert('xss')</script>";
            String sanitizedContent = "alert('xss')";
            MultipartFile[] files = new MultipartFile[]{mock(MultipartFile.class)};

            MessageResponse msgResponse = MessageResponse.builder()
                    .id(TEST_MESSAGE_ID)
                    .content(sanitizedContent)
                    .build();

            when(messageSanitizationService.sanitize(maliciousContent)).thenReturn(sanitizedContent);
            when(conversationService.sendMessageWithAttachments(
                    eq(TEST_CONVERSATION_ID), eq(sanitizedContent), eq("text"), eq(files), eq(TEST_USER_ID)))
                    .thenReturn(msgResponse);
            when(i18nService.getMessage("message.sent.success", "en")).thenReturn("Sent");

            conversationController.sendMessageWithAttachments(
                    TEST_CONVERSATION_ID, maliciousContent, "text", files, userDetails, "en");

            verify(messageSanitizationService).sanitize(maliciousContent);
            verify(conversationService).sendMessageWithAttachments(
                    TEST_CONVERSATION_ID, sanitizedContent, "text", files, TEST_USER_ID);
        }
    }
}
