package com.autotrader.autotraderbackend.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import static org.junit.jupiter.api.Assertions.*;

class SlugUtilsTest_fixed {

    @Test
    void slugify_withNullInput_shouldReturnEmptyString() {
        String result = SlugUtils.slugify(null);
        assertEquals("", result);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void slugify_withNullOrEmptyInput_shouldReturnEmptyString(String input) {
        String result = SlugUtils.slugify(input);
        assertEquals("", result);
    }

    @ParameterizedTest
    @CsvSource({
        "'Hello World', 'hello-world'",
        "'Toyota Camry 2022', 'toyota-camry-2022'",
        "'  Spaces  Around  ', 'spaces-around'",
        "'Special!@#$%^&*()Characters', 'special-characters'",
        "'Multiple---Hyphens', 'multiple-hyphens'",
        "'Trailing-Hyphen-', 'trailing-hyphen'",
        "'-Leading-Hyphen', 'leading-hyphen'",
        "'UPPERCASE', 'uppercase'",
        "'MixedCASE', 'mixedcase'",
        "'Numbers123', 'numbers123'",
        "'Hyphenated-Text', 'hyphenated-text'",
        "'économie française', 'economie-francaise'",
        "'café äöü ñ', 'cafe-aou-n'",
    })
    void slugify_withVariousInputs_shouldReturnCorrectSlug(String input, String expected) {
        String result = SlugUtils.slugify(input);
        assertEquals(expected, result);
    }

    @Test
    void slugify_withArabicText_shouldTransliterateCorrectly() {
        // Testing Arabic text transliteration
        String arabicText = "مرحبا بالعالم";
        String result = SlugUtils.slugify(arabicText);
        
        // The exact transliteration may vary but should not contain Arabic characters
        assertFalse(result.matches(".*\\p{InArabic}.*"), "Slug should not contain Arabic characters");
        assertTrue(result.length() > 0, "Slug should not be empty");
        assertTrue(result.matches("^[a-z0-9-]+$"), "Slug should only contain lowercase letters, numbers, and hyphens");
    }

    // Testing direct use of the public API for Arabic text
    @Test
    void slugify_withArabicCharacters_shouldProcessCorrectly() {
        // Test with Arabic characters
        String result = SlugUtils.slugify("مرحبا بالعالم");
        assertFalse(result.contains("مرحبا"), "Result should not contain Arabic characters");
        assertTrue(result.matches("^[a-z0-9-]+$"), "Result should only contain lowercase letters, numbers, and hyphens");
    }
    
    @Test
    void slugify_withMixedArabicAndLatinText_shouldProcessCorrectly() {
        // Test with mixed Arabic and Latin text
        String result = SlugUtils.slugify("Hello مرحبا World");
        assertTrue(result.contains("hello"), "Result should contain Latin characters");
        assertTrue(result.contains("world"), "Result should contain Latin characters");
        assertFalse(result.contains("مرحبا"), "Result should not contain Arabic characters");
    }
}
