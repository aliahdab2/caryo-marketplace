package com.autotrader.autotraderbackend.service.email;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class EmailSecurityServiceTest {

    private EmailSecurityService securityService;

    @BeforeEach
    void setUp() {
        securityService = new EmailSecurityService();
    }

    @Test
    void shouldReturnFalseForNullContent() {
        assertThat(securityService.containsSuspiciousContent(null)).isFalse();
    }

    @Test
    void shouldReturnFalseForEmptyContent() {
        assertThat(securityService.containsSuspiciousContent("")).isFalse();
    }

    @Test
    void shouldReturnFalseForSafeContent() {
        assertThat(securityService.containsSuspiciousContent("Hello, this is a normal email")).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "<script>alert('xss')</script>",
        "javascript:alert(1)",
        "<img onclick=\"alert('xss')\"",
        "<img onerror=\"alert('xss')\"",
        "eval(maliciousCode)",
        "document.cookie",
        "window.location",
        "<div onload=\"alert('xss')\"",
        "<input onmouseover=\"alert('xss')\"",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:alert(1)"
    })
    void shouldDetectSuspiciousContent(String maliciousContent) {
        assertThat(securityService.containsSuspiciousContent(maliciousContent)).isTrue();
    }

    @Test
    void shouldDetectSuspiciousContentCaseInsensitive() {
        assertThat(securityService.containsSuspiciousContent("<SCRIPT>")).isTrue();
        assertThat(securityService.containsSuspiciousContent("JAVASCRIPT:")).isTrue();
        assertThat(securityService.containsSuspiciousContent("OnClick=")).isTrue();
    }

    @Test
    void shouldMaskEmailCorrectly() {
        assertThat(securityService.maskEmail("john.doe@example.com")).isEqualTo("j******e@example.com");
        assertThat(securityService.maskEmail("ab@example.com")).isEqualTo("**@example.com");
        assertThat(securityService.maskEmail("abc@example.com")).isEqualTo("a*c@example.com");
    }

    @Test
    void shouldReturnInvalidForNullEmail() {
        assertThat(securityService.maskEmail(null)).isEqualTo("invalid-email");
    }

    @Test
    void shouldReturnInvalidForEmptyEmail() {
        assertThat(securityService.maskEmail("")).isEqualTo("invalid-email");
    }

    @Test
    void shouldReturnInvalidForEmailWithoutAtSymbol() {
        assertThat(securityService.maskEmail("invalid")).isEqualTo("invalid-email");
    }

    @Test
    void shouldReturnInvalidForEmailStartingWithAt() {
        assertThat(securityService.maskEmail("@example.com")).isEqualTo("invalid-email");
    }

    @Test
    void shouldSanitizeScriptTags() {
        String input = "Hello <script>alert('xss')</script> World";
        String sanitized = securityService.sanitizeContent(input);
        assertThat(sanitized).doesNotContain("<script>");
        assertThat(sanitized).contains("Hello");
        assertThat(sanitized).contains("World");
    }

    @Test
    void shouldSanitizeEventHandlers() {
        String input = "<img src=\"x\" onclick=\"alert('xss')\" />";
        String sanitized = securityService.sanitizeContent(input);
        assertThat(sanitized).doesNotContain("onclick");
    }

    @Test
    void shouldSanitizeJavascriptProtocol() {
        String input = "<a href=\"javascript:alert('xss')\">Click</a>";
        String sanitized = securityService.sanitizeContent(input);
        assertThat(sanitized).doesNotContain("javascript:");
    }

    @Test
    void shouldReturnNullForNullSanitization() {
        assertThat(securityService.sanitizeContent(null)).isNull();
    }

    @Test
    void shouldReturnEmptyForEmptySanitization() {
        assertThat(securityService.sanitizeContent("")).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "tempmail.com",
        "throwaway.email",
        "guerrillamail.com",
        "10minutemail.com",
        "mailinator.com",
        "temp-mail.org",
        "fakeinbox.com",
        "trashmail.com",
        "yopmail.com"
    })
    void shouldDetectThrowawayEmails(String domain) {
        assertThat(securityService.isThrowawayEmail("user@" + domain)).isTrue();
    }

    @Test
    void shouldNotFlagLegitimateEmails() {
        assertThat(securityService.isThrowawayEmail("user@gmail.com")).isFalse();
        assertThat(securityService.isThrowawayEmail("user@company.com")).isFalse();
        assertThat(securityService.isThrowawayEmail("user@outlook.com")).isFalse();
    }

    @Test
    void shouldReturnFalseForNullThrowawayCheck() {
        assertThat(securityService.isThrowawayEmail(null)).isFalse();
    }

    @Test
    void shouldReturnFalseForEmptyThrowawayCheck() {
        assertThat(securityService.isThrowawayEmail("")).isFalse();
    }

    @Test
    void shouldConsiderSafeEmailsAsSafe() {
        assertThat(securityService.isSafeEmail("valid@example.com")).isTrue();
    }

    @Test
    void shouldDetectNewlineInjection() {
        assertThat(securityService.isSafeEmail("user\n@example.com")).isFalse();
        assertThat(securityService.isSafeEmail("user\r@example.com")).isFalse();
    }

    @Test
    void shouldDetectMultipleAtSymbols() {
        assertThat(securityService.isSafeEmail("user@domain@example.com")).isFalse();
    }

    @Test
    void shouldDetectControlCharacters() {
        assertThat(securityService.isSafeEmail("user\u0000@example.com")).isFalse();
    }

    @Test
    void shouldReturnFalseForNullSafeEmailCheck() {
        assertThat(securityService.isSafeEmail(null)).isFalse();
    }

    @Test
    void shouldReturnFalseForEmptySafeEmailCheck() {
        assertThat(securityService.isSafeEmail("")).isFalse();
    }
}
