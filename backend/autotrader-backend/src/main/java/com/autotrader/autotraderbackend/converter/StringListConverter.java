package com.autotrader.autotraderbackend.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * JPA AttributeConverter for converting List<String> to JSON string and vice versa.
 * This provides clean separation between entity fields and database storage,
 * ensuring compatibility with both H2 (testing) and PostgreSQL (production).
 */
@Converter
@Slf4j
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final TypeReference<List<String>> listTypeRef = new TypeReference<List<String>>() {};

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "[]";
        }

        try {
            String json = objectMapper.writeValueAsString(attribute);
            log.debug("Converting list to JSON: {} -> {}", attribute, json);
            return json;
        } catch (JsonProcessingException e) {
            log.error("Error converting list to JSON: {}", attribute, e);
            throw new IllegalArgumentException("Error converting list to JSON", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return new ArrayList<>();
        }

        // Handle edge case where database has double-encoded JSON string like "[]" instead of []
        String cleanedData = dbData.trim();
        if (cleanedData.startsWith("\"") && cleanedData.endsWith("\"") && cleanedData.length() >= 2) {
            // Remove the outer quotes: "[]" -> []
            cleanedData = cleanedData.substring(1, cleanedData.length() - 1);
            log.debug("Removed outer quotes from JSON: {} -> {}", dbData, cleanedData);
        }

        try {
            List<String> list = objectMapper.readValue(cleanedData, listTypeRef);
            log.debug("Converting JSON to list: {} -> {}", cleanedData, list);
            return list != null ? list : new ArrayList<>();
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to list: {}", cleanedData, e);
            // Return empty list instead of throwing to prevent ApplicationContext load failures
            log.warn("Returning empty list due to JSON parse error. Original value: {}", dbData);
            return new ArrayList<>();
        }
    }
}

