package com.autotrader.autotraderbackend.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Utility class for generating URL-friendly slugs from strings.
 */
public class SlugUtils {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\p{L}\\p{N}]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern ARABIC_DIACRITICS = Pattern.compile("\\p{InArabic}");

    /**
     * Converts a string into a URL-friendly slug.
     * 
     * @param input The string to convert
     * @return A URL-friendly slug
     */
    public static String slugify(String input) {
        if (input == null) {
            return "";
        }

        // Handle Arabic text by transliterating to Latin
        String result = input;
        if (containsArabic(result)) {
            result = transliterateArabic(result);
        }

        // Convert to lowercase and normalize
        String normalized = Normalizer.normalize(result.toLowerCase(Locale.ENGLISH), Normalizer.Form.NFD);
        
        // Remove diacritics
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}", "");
        
        // Replace non-alphanumeric characters with hyphens
        normalized = NON_LATIN.matcher(normalized).replaceAll("-");
        
        // Replace whitespace with hyphens
        normalized = WHITESPACE.matcher(normalized).replaceAll("-");
        
        // Collapse multiple hyphens to a single hyphen
        normalized = normalized.replaceAll("-+", "-");
        
        // Remove leading and trailing hyphens
        normalized = normalized.replaceAll("^-|-$", "");
        
        return normalized;
    }

    /**
     * Checks if a string contains Arabic characters.
     * 
     * @param text The text to check
     * @return true if the text contains Arabic characters, false otherwise
     */
    private static boolean containsArabic(String text) {
        return ARABIC_DIACRITICS.matcher(text).find();
    }

    /**
     * Simple transliteration of Arabic text to Latin alphabet.
     * This is a basic implementation - consider using a dedicated library for more accurate transliteration.
     * 
     * @param arabicText The Arabic text to transliterate
     * @return A Latin alphabet representation of the Arabic text
     */
    private static String transliterateArabic(String arabicText) {
        // This is a very simplified transliteration.
        // For production, consider using a library like ICU4J or Apache Commons Lang for proper transliteration.
        String result = arabicText;
        
        // Alef variants
        result = result.replace("أ", "a").replace("إ", "i").replace("آ", "a").replace("ا", "a");
        
        // Single character replacements
        result = result.replace("ب", "b").replace("ت", "t").replace("ج", "j");
        result = result.replace("ح", "h").replace("د", "d").replace("ر", "r");
        result = result.replace("ز", "z").replace("س", "s").replace("ص", "s");
        result = result.replace("ض", "d").replace("ط", "t").replace("ظ", "z");
        result = result.replace("ع", "a").replace("ف", "f").replace("ق", "q");
        result = result.replace("ك", "k").replace("ل", "l").replace("م", "m");
        result = result.replace("ن", "n").replace("ه", "h").replace("و", "w");
        result = result.replace("ي", "y").replace("ى", "a").replace("ء", "'");
        result = result.replace("ة", "a");
        
        // Multi-character replacements (handle separately)
        result = result.replace("ث", "th");
        result = result.replace("خ", "kh");
        result = result.replace("ذ", "th");
        result = result.replace("ش", "sh");
        result = result.replace("غ", "gh");
        
        return result;
    }
}
