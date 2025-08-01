package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.ContactFormRequest;
import com.autotrader.autotraderbackend.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive tests for ContactController.
 * Tests contact form submission with multi-language support.
 */
@ExtendWith(MockitoExtension.class)
class ContactControllerTest {

    @Mock
    private EmailService emailService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        ContactController controller = new ContactController(emailService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    // ==================== Success Tests ====================

    @Test
    void submitContactForm_English_Success() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("John Doe");
        request.setEmail("john@example.com");
        request.setMessage("Test message");
        request.setLanguage("en");

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Thank you for your message. We'll get back to you soon!"));

        // Verify email service calls
        verify(emailService).sendContactFormEmail("John Doe", "john@example.com", "Test message", "en");
        verify(emailService).sendContactFormConfirmation("John Doe", "john@example.com", "en");
    }

    @Test
    void submitContactForm_Arabic_Success() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("أحمد محمد");
        request.setEmail("ahmed@example.com");
        request.setMessage("رسالة تجريبية");
        request.setLanguage("ar");

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("شكراً لك على رسالتك. سنرد عليك قريباً!"));

        // Verify email service calls
        verify(emailService).sendContactFormEmail("أحمد محمد", "ahmed@example.com", "رسالة تجريبية", "ar");
        verify(emailService).sendContactFormConfirmation("أحمد محمد", "ahmed@example.com", "ar");
    }

    @Test
    void submitContactForm_DefaultLanguage_Success() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Jane Smith");
        request.setEmail("jane@example.com");
        request.setMessage("Hello world");
        // No language specified - should default to English

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Thank you for your message. We'll get back to you soon!"));

        // Verify email service calls with default language
        verify(emailService).sendContactFormEmail("Jane Smith", "jane@example.com", "Hello world", "en");
        verify(emailService).sendContactFormConfirmation("Jane Smith", "jane@example.com", "en");
    }

    @Test
    void submitContactForm_UpperCaseLanguage_Success() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setMessage("Test message");
        request.setLanguage("AR"); // Upper case should be normalized

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("شكراً لك على رسالتك. سنرد عليك قريباً!"));

        // Verify email service calls with normalized language
        verify(emailService).sendContactFormEmail("Test User", "test@example.com", "Test message", "ar");
        verify(emailService).sendContactFormConfirmation("Test User", "test@example.com", "ar");
    }

    // ==================== Validation Tests ====================

    @Test
    void submitContactForm_EmptyName_BadRequest() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("");
        request.setEmail("test@example.com");
        request.setMessage("Test message");

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitContactForm_NullName_BadRequest() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName(null);
        request.setEmail("test@example.com");
        request.setMessage("Test message");

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitContactForm_InvalidEmail_BadRequest() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("invalid-email");
        request.setMessage("Test message");

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitContactForm_EmptyMessage_BadRequest() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setMessage("");

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitContactForm_ShortMessage_BadRequest() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setMessage("Hi"); // Too short

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitContactForm_LongMessage_BadRequest() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setMessage("a".repeat(2001)); // Too long

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==================== Error Handling Tests ====================

    @Test
    void submitContactForm_EmailServiceException_InternalServerError() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setMessage("Test message");
        request.setLanguage("en");

        // Mock email service to throw exception
        doThrow(new RuntimeException("Email service error"))
                .when(emailService).sendContactFormEmail(anyString(), anyString(), anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Sorry, there was an error processing your message. Please try again later."));
    }

    @Test
    void submitContactForm_EmailServiceExceptionArabic_InternalServerError() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setMessage("Test message");
        request.setLanguage("ar");

        // Mock email service to throw exception
        doThrow(new RuntimeException("Email service error"))
                .when(emailService).sendContactFormEmail(anyString(), anyString(), anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("عذراً، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى لاحقاً."));
    }

    // ==================== Edge Cases ====================

    @Test
    void submitContactForm_UnsupportedLanguage_DefaultsToEnglish() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setMessage("Test message");
        request.setLanguage("fr"); // Unsupported language

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Thank you for your message. We'll get back to you soon!"));

        // Verify email service calls with default language
        verify(emailService).sendContactFormEmail("Test User", "test@example.com", "Test message", "en");
        verify(emailService).sendContactFormConfirmation("Test User", "test@example.com", "en");
    }

    @Test
    void submitContactForm_WhitespaceLanguage_DefaultsToEnglish() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setMessage("Test message");
        request.setLanguage("   "); // Whitespace

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Thank you for your message. We'll get back to you soon!"));

        // Verify email service calls with default language
        verify(emailService).sendContactFormEmail("Test User", "test@example.com", "Test message", "en");
        verify(emailService).sendContactFormConfirmation("Test User", "test@example.com", "en");
    }

    @Test
    void submitContactForm_MaxLengthFields_Success() throws Exception {
        // Arrange
        ContactFormRequest request = new ContactFormRequest();
        request.setName("a".repeat(100)); // Max length name
        request.setEmail("test@example.com");
        request.setMessage("a".repeat(2000)); // Max length message
        request.setLanguage("en");

        // Act & Assert
        mockMvc.perform(post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        // Verify email service calls
        verify(emailService).sendContactFormEmail(request.getName(), "test@example.com", request.getMessage(), "en");
        verify(emailService).sendContactFormConfirmation(request.getName(), "test@example.com", "en");
    }
} 