package com.autotrader.autotraderbackend.service.email;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EmailValidationServiceTest {

    private EmailValidationService validationService;

    @BeforeEach
    void setUp() {
        validationService = new EmailValidationService();
    }

    @Test
    void shouldAcceptValidTemplatedEmailInputs() {
        validationService.validateTemplatedEmailInputs(
            "test@example.com",
            "Test Subject",
            "test-template",
            "en"
        );
        // No exception means success
    }

    @Test
    void shouldRejectNullRecipient() {
        assertThatThrownBy(() ->
            validationService.validateTemplatedEmailInputs(null, "Subject", "template", "en")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("recipient");
    }

    @Test
    void shouldRejectEmptySubject() {
        assertThatThrownBy(() ->
            validationService.validateTemplatedEmailInputs("test@example.com", "", "template", "en")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("subject");
    }

    @Test
    void shouldRejectEmptyTemplateName() {
        assertThatThrownBy(() ->
            validationService.validateTemplatedEmailInputs("test@example.com", "Subject", "", "en")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Template name");
    }

    @Test
    void shouldRejectUnsupportedLanguage() {
        assertThatThrownBy(() ->
            validationService.validateTemplatedEmailInputs("test@example.com", "Subject", "template", "fr")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Unsupported language");
    }

    @Test
    void shouldAcceptValidSimpleEmailInputs() {
        validationService.validateSimpleEmailInputs(
            "test@example.com",
            "Test Subject",
            "Test body"
        );
    }

    @Test
    void shouldRejectEmptyTextInSimpleEmail() {
        assertThatThrownBy(() ->
            validationService.validateSimpleEmailInputs("test@example.com", "Subject", "")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("text");
    }

    @Test
    void shouldValidateListingEmailInputs() {
        User seller = mock(User.class);
        when(seller.getEmail()).thenReturn("seller@example.com");
        when(seller.getUsername()).thenReturn("seller");

        CarListing listing = mock(CarListing.class);

        boolean result = validationService.validateListingEmailInputs(seller, listing, "en");

        assertThat(result).isTrue();
    }

    @Test
    void shouldReturnFalseForNullSeller() {
        CarListing listing = mock(CarListing.class);

        boolean result = validationService.validateListingEmailInputs(null, listing, "en");

        assertThat(result).isFalse();
    }

    @Test
    void shouldReturnFalseForNullListing() {
        User seller = mock(User.class);
        when(seller.getEmail()).thenReturn("seller@example.com");

        boolean result = validationService.validateListingEmailInputs(seller, null, "en");

        assertThat(result).isFalse();
    }

    @Test
    void shouldReturnFalseForSellerWithNullEmail() {
        User seller = mock(User.class);
        when(seller.getEmail()).thenReturn(null);
        when(seller.getUsername()).thenReturn("seller");

        CarListing listing = mock(CarListing.class);

        boolean result = validationService.validateListingEmailInputs(seller, listing, "en");

        assertThat(result).isFalse();
    }

    @Test
    void shouldValidateUserEmailInputs() {
        User user = mock(User.class);
        when(user.getEmail()).thenReturn("user@example.com");

        boolean result = validationService.validateUserEmailInputs(user, "en");

        assertThat(result).isTrue();
    }

    @Test
    void shouldReturnFalseForNullUser() {
        boolean result = validationService.validateUserEmailInputs(null, "en");

        assertThat(result).isFalse();
    }

    @Test
    void shouldValidateContactFormInputs() {
        validationService.validateContactFormInputs(
            "John Doe",
            "john@example.com",
            "Hello, this is a test message",
            "en"
        );
    }

    @Test
    void shouldRejectEmptyContactFormName() {
        assertThatThrownBy(() ->
            validationService.validateContactFormInputs("", "john@example.com", "Message", "en")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("name");
    }

    @Test
    void shouldRejectEmptyContactFormMessage() {
        assertThatThrownBy(() ->
            validationService.validateContactFormInputs("John", "john@example.com", "", "en")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("message");
    }

    @Test
    void shouldValidateRenewalDays() {
        validationService.validateRenewalDays(30);
        validationService.validateRenewalDays(1);
        validationService.validateRenewalDays(365);
    }

    @Test
    void shouldRejectZeroRenewalDays() {
        assertThatThrownBy(() ->
            validationService.validateRenewalDays(0)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("positive");
    }

    @Test
    void shouldRejectNegativeRenewalDays() {
        assertThatThrownBy(() ->
            validationService.validateRenewalDays(-1)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("positive");
    }

    @Test
    void shouldRejectRenewalDaysOver365() {
        assertThatThrownBy(() ->
            validationService.validateRenewalDays(366)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("365");
    }

    @ParameterizedTest
    @ValueSource(strings = {"test@example.com", "user.name@domain.org", "a@b.co"})
    void shouldAcceptValidEmailFormats(String email) {
        assertThat(validationService.isValidEmailFormat(email)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"invalid", "@example.com", "test@", "test", "a@b", ""})
    void shouldRejectInvalidEmailFormats(String email) {
        assertThat(validationService.isValidEmailFormat(email)).isFalse();
    }

    @Test
    void shouldReturnFalseForNullEmail() {
        assertThat(validationService.isValidEmailFormat(null)).isFalse();
    }

    @Test
    void shouldCheckLanguageSupport() {
        assertThat(validationService.isLanguageSupported("en")).isTrue();
        assertThat(validationService.isLanguageSupported("ar")).isTrue();
        assertThat(validationService.isLanguageSupported("fr")).isFalse();
        assertThat(validationService.isLanguageSupported("de")).isFalse();
    }

    @Test
    void shouldReturnSupportedLanguages() {
        assertThat(validationService.getSupportedLanguages())
            .containsExactlyInAnyOrder("en", "ar");
    }

    @Test
    void shouldReturnDefaultLanguage() {
        assertThat(validationService.getDefaultLanguage()).isEqualTo("en");
    }

    @Test
    void shouldValidatePasswordResetInputs() {
        validationService.validatePasswordResetInputs(
            "test@example.com",
            "username",
            "https://example.com/reset?token=abc123"
        );
    }

    @Test
    void shouldRejectEmptyEmailInPasswordReset() {
        assertThatThrownBy(() ->
            validationService.validatePasswordResetInputs("", "username", "https://reset.url")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Email");
    }

    @Test
    void shouldRejectEmptyUsernameInPasswordReset() {
        assertThatThrownBy(() ->
            validationService.validatePasswordResetInputs("test@example.com", "", "https://reset.url")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Username");
    }

    @Test
    void shouldRejectEmptyResetUrl() {
        assertThatThrownBy(() ->
            validationService.validatePasswordResetInputs("test@example.com", "username", "")
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Reset URL");
    }
}
