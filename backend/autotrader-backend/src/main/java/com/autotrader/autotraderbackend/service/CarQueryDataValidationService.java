package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.dto.CarQueryMakeResponse;
import com.autotrader.autotraderbackend.dto.CarQueryModelResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Data validation service for CarQuery API responses
 * Ensures data quality and consistency before persistence
 */
@Service
@Slf4j
public class CarQueryDataValidationService {

    /**
     * Validation result containing validation status and any issues found
     */
    public static class ValidationResult {
        private final boolean valid;
        private final List<String> issues;
        private final List<String> warnings;

        public ValidationResult(boolean valid, List<String> issues, List<String> warnings) {
            this.valid = valid;
            this.issues = issues != null ? issues : new ArrayList<>();
            this.warnings = warnings != null ? warnings : new ArrayList<>();
        }

        public boolean isValid() { return valid; }
        public List<String> getIssues() { return issues; }
        public List<String> getWarnings() { return warnings; }

        public static ValidationResult valid() {
            return new ValidationResult(true, new ArrayList<>(), new ArrayList<>());
        }

        public static ValidationResult invalid(List<String> issues) {
            return new ValidationResult(false, issues, new ArrayList<>());
        }

        public static ValidationResult withWarnings(List<String> warnings) {
            return new ValidationResult(true, new ArrayList<>(), warnings);
        }
    }

    /**
     * Validate CarQuery make response
     */
    public ValidationResult validateMakeResponse(CarQueryMakeResponse response) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (response == null) {
            issues.add("Response is null");
            return ValidationResult.invalid(issues);
        }

        if (response.getMakes() == null) {
            issues.add("Makes list is null");
            return ValidationResult.invalid(issues);
        }

        if (response.getMakes().isEmpty()) {
            warnings.add("Makes list is empty");
        }

        // Validate individual makes
        Set<String> makeIds = new HashSet<>();
        Set<String> makeDisplays = new HashSet<>();

        for (CarQueryMakeResponse.CarQueryMake make : response.getMakes()) {
            ValidationResult makeValidation = validateMake(make);
            if (!makeValidation.isValid()) {
                issues.addAll(makeValidation.getIssues());
            }
            warnings.addAll(makeValidation.getWarnings());

            // Check for duplicates
            if (make.getMakeId() != null && !makeIds.add(make.getMakeId().toLowerCase())) {
                issues.add("Duplicate make ID found: " + make.getMakeId());
            }

            if (make.getMakeDisplay() != null && !makeDisplays.add(make.getMakeDisplay().toLowerCase())) {
                warnings.add("Duplicate make display name found: " + make.getMakeDisplay());
            }
        }

        if (!issues.isEmpty()) {
            return ValidationResult.invalid(issues);
        }

        if (!warnings.isEmpty()) {
            return ValidationResult.withWarnings(warnings);
        }

        return ValidationResult.valid();
    }

    /**
     * Validate individual make data
     */
    public ValidationResult validateMake(CarQueryMakeResponse.CarQueryMake make) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (make == null) {
            issues.add("Make is null");
            return ValidationResult.invalid(issues);
        }

        // Required fields validation
        if (!StringUtils.hasText(make.getMakeId())) {
            issues.add("Make ID is empty or null");
        }

        if (!StringUtils.hasText(make.getMakeDisplay())) {
            issues.add("Make display name is empty or null");
        }

        // Format validation
        if (make.getMakeId() != null && make.getMakeId().length() > 50) {
            issues.add("Make ID too long: " + make.getMakeId());
        }

        if (make.getMakeDisplay() != null && make.getMakeDisplay().length() > 100) {
            issues.add("Make display name too long: " + make.getMakeDisplay());
        }

        // Check for suspicious characters
        if (make.getMakeId() != null && !make.getMakeId().matches("^[a-zA-Z0-9_-]+$")) {
            issues.add("Make ID contains invalid characters: " + make.getMakeId());
        }

        if (make.getMakeDisplay() != null && make.getMakeDisplay().matches(".*[<>\"';&].*")) {
            issues.add("Make display name contains potentially dangerous characters: " + make.getMakeDisplay());
        }

        if (!issues.isEmpty()) {
            return ValidationResult.invalid(issues);
        }

        if (!warnings.isEmpty()) {
            return ValidationResult.withWarnings(warnings);
        }

        return ValidationResult.valid();
    }

    /**
     * Validate CarQuery model response
     */
    public ValidationResult validateModelResponse(CarQueryModelResponse response) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (response == null) {
            issues.add("Response is null");
            return ValidationResult.invalid(issues);
        }

        if (response.getModels() == null) {
            issues.add("Models list is null");
            return ValidationResult.invalid(issues);
        }

        if (response.getModels().isEmpty()) {
            warnings.add("Models list is empty");
        }

        // Validate individual models
        Set<String> modelNames = new HashSet<>();

        for (CarQueryModelResponse.CarQueryModel model : response.getModels()) {
            ValidationResult modelValidation = validateModel(model);
            if (!modelValidation.isValid()) {
                issues.addAll(modelValidation.getIssues());
            }
            warnings.addAll(modelValidation.getWarnings());

            // Check for duplicate model names within the same make
            String key = model.getModelMakeId() + ":" + model.getModelName();
            if (!modelNames.add(key.toLowerCase())) {
                warnings.add("Duplicate model name for make: " + model.getModelName());
            }
        }

        if (!issues.isEmpty()) {
            return ValidationResult.invalid(issues);
        }

        if (!warnings.isEmpty()) {
            return ValidationResult.withWarnings(warnings);
        }

        return ValidationResult.valid();
    }

    /**
     * Validate individual model data
     */
    public ValidationResult validateModel(CarQueryModelResponse.CarQueryModel model) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (model == null) {
            issues.add("Model is null");
            return ValidationResult.invalid(issues);
        }

        // Required fields validation
        if (!StringUtils.hasText(model.getModelName())) {
            issues.add("Model name is empty or null");
        }

        if (!StringUtils.hasText(model.getModelMakeId())) {
            issues.add("Model make ID is empty or null");
        }

        // Format validation
        if (model.getModelName() != null && model.getModelName().length() > 100) {
            issues.add("Model name too long: " + model.getModelName());
        }

        if (model.getModelMakeId() != null && model.getModelMakeId().length() > 50) {
            issues.add("Model make ID too long: " + model.getModelMakeId());
        }

        // Check for suspicious characters in model name
        if (model.getModelName() != null && model.getModelName().matches(".*[<>\"';&].*")) {
            issues.add("Model name contains potentially dangerous characters: " + model.getModelName());
        }

        if (!issues.isEmpty()) {
            return ValidationResult.invalid(issues);
        }

        if (!warnings.isEmpty()) {
            return ValidationResult.withWarnings(warnings);
        }

        return ValidationResult.valid();
    }
}
