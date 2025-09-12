package com.autotrader.autotraderbackend.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * JPA AttributeConverter for converting Map<String, Object> to JSON string and vice versa.
 * This provides clean separation between entity fields and database storage,
 * ensuring compatibility with both H2 (testing) and PostgreSQL (production).
 */
@Converter
@Slf4j
public class JsonMapConverter implements AttributeConverter<Map<String, Object>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> mapTypeRef = new TypeReference<Map<String, Object>>() {};

    @Override
    public String convertToDatabaseColumn(Map<String, Object> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "{}";
        }
        
        try {
            String json = objectMapper.writeValueAsString(attribute);
            log.debug("Converting map to JSON: {} -> {}", attribute, json);
            return json;
        } catch (JsonProcessingException e) {
            log.error("Error converting map to JSON: {}", attribute, e);
            throw new IllegalArgumentException("Error converting map to JSON", e);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return Map.of();
        }
        
        try {
            Map<String, Object> map = objectMapper.readValue(dbData, mapTypeRef);
            log.debug("Converting JSON to map: {} -> {}", dbData, map);
            return map;
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to map: {}", dbData, e);
            throw new IllegalArgumentException("Error converting JSON to map", e);
        }
    }
}
