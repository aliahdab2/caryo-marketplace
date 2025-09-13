package com.autotrader.autotraderbackend.service;

/**
 * Enhanced interface for car data providers with improved extensibility and monitoring
 */
public interface CarDataProvider {

    /**
     * Get the unique name of this provider
     */
    String getProviderName();

    /**
     * Get the priority of this provider (lower number = higher priority)
     * Used for fallback ordering. Default priorities:
     * - Primary APIs: 1-10
     * - Secondary APIs: 11-50  
     * - Local/Manual data: 51-100
     */
    default int getPriority() {
        return 100; // Default to lowest priority
    }

    /**
     * Get the capabilities supported by this provider
     */
    default ProviderCapabilities getCapabilities() {
        return new ProviderCapabilities();
    }

    /**
     * Load complete dataset from this provider
     */
    DataLoadResult loadCompleteDataset();

    /**
     * Test connection to the provider
     */
    boolean testConnection();

    /**
     * Check if this provider is enabled and available
     */
    boolean isEnabled();

    /**
     * Get provider-specific statistics
     */
    ProviderStatistics getStatistics();

    /**
     * Validate data integrity for this provider
     */
    default ValidationResult validateData() {
        ValidationResult result = new ValidationResult();
        result.setValid(true);
        result.setMessage("Validation not implemented for " + getProviderName());
        return result;
    }

    /**
     * Standard data load result
     */
    class DataLoadResult {
        private boolean success;
        private String errorMessage;
        private java.util.Map<String, LoadResult> results = new java.util.HashMap<>();

        public void addResult(String key, LoadResult result) {
            results.put(key, result);
        }

        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public java.util.Map<String, LoadResult> getResults() { return results; }

        public long getTotalProcessed() {
            return results.values().stream().mapToLong(LoadResult::getProcessed).sum();
        }

        public long getTotalFailed() {
            return results.values().stream().mapToLong(LoadResult::getFailed).sum();
        }
    }

    /**
     * Standard load result
     */
    class LoadResult {
        private String operation;
        private int processed;
        private int failed;
        private int skipped;

        public LoadResult(String operation) {
            this.operation = operation;
        }

        public void incrementProcessed() { processed++; }
        public void incrementProcessed(int count) { processed += count; }
        public void incrementFailed() { failed++; }
        public void incrementFailed(int count) { failed += count; }
        public void incrementSkipped() { skipped++; }
        public void incrementSkipped(int count) { skipped += count; }

        // Getters
        public String getOperation() { return operation; }
        public int getProcessed() { return processed; }
        public int getFailed() { return failed; }
        public int getSkipped() { return skipped; }
        public int getTotal() { return processed + skipped + failed; }
    }

    /**
     * Provider-specific statistics
     */
    class ProviderStatistics {
        private String providerName;
        private long totalBrands;
        private long totalModels;
        private long lastSyncTime;
        private String status;

        // Getters and setters
        public String getProviderName() { return providerName; }
        public void setProviderName(String providerName) { this.providerName = providerName; }
        public long getTotalBrands() { return totalBrands; }
        public void setTotalBrands(long totalBrands) { this.totalBrands = totalBrands; }
        public long getTotalModels() { return totalModels; }
        public void setTotalModels(long totalModels) { this.totalModels = totalModels; }
        public long getLastSyncTime() { return lastSyncTime; }
        public void setLastSyncTime(long lastSyncTime) { this.lastSyncTime = lastSyncTime; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    /**
     * Provider capabilities definition
     */
    class ProviderCapabilities {
        private boolean supportsBrands = true;
        private boolean supportsModels = true;
        private boolean supportsTrims = false;
        private boolean supportsImages = false;
        private boolean supportsSpecs = false;
        private boolean supportsIncrementalSync = false;
        private boolean supportsRealTimeUpdates = false;

        // Getters and setters
        public boolean isSupportsBrands() { return supportsBrands; }
        public void setSupportsBrands(boolean supportsBrands) { this.supportsBrands = supportsBrands; }
        public boolean isSupportsModels() { return supportsModels; }
        public void setSupportsModels(boolean supportsModels) { this.supportsModels = supportsModels; }
        public boolean isSupportsTrims() { return supportsTrims; }
        public void setSupportsTrims(boolean supportsTrims) { this.supportsTrims = supportsTrims; }
        public boolean isSupportsImages() { return supportsImages; }
        public void setSupportsImages(boolean supportsImages) { this.supportsImages = supportsImages; }
        public boolean isSupportsSpecs() { return supportsSpecs; }
        public void setSupportsSpecs(boolean supportsSpecs) { this.supportsSpecs = supportsSpecs; }
        public boolean isSupportsIncrementalSync() { return supportsIncrementalSync; }
        public void setSupportsIncrementalSync(boolean supportsIncrementalSync) { this.supportsIncrementalSync = supportsIncrementalSync; }
        public boolean isSupportsRealTimeUpdates() { return supportsRealTimeUpdates; }
        public void setSupportsRealTimeUpdates(boolean supportsRealTimeUpdates) { this.supportsRealTimeUpdates = supportsRealTimeUpdates; }
    }

    /**
     * Data validation result
     */
    class ValidationResult {
        private boolean valid;
        private String message;
        private java.util.List<String> errors = new java.util.ArrayList<>();
        private java.util.List<String> warnings = new java.util.ArrayList<>();

        // Getters and setters
        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public java.util.List<String> getErrors() { return errors; }
        public void setErrors(java.util.List<String> errors) { this.errors = errors; }
        public java.util.List<String> getWarnings() { return warnings; }
        public void setWarnings(java.util.List<String> warnings) { this.warnings = warnings; }

        public void addError(String error) { this.errors.add(error); }
        public void addWarning(String warning) { this.warnings.add(warning); }
    }
}
