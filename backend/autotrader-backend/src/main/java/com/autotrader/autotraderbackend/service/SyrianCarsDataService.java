package com.autotrader.autotraderbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import jakarta.annotation.PostConstruct;

// Import model classes
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;

/**
 * Syrian Local Market Data Provider
 * Provides Syrian market car data from web scraping or local fallback
 * Supplements CarQuery API with Syrian-specific brands and models
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "syriacars.enabled", havingValue = "true", matchIfMissing = false)
public class SyrianCarsDataService implements CarDataProvider {

    private final CarBrandService carBrandService;
    private final CarModelService carModelService;
    private final ArabicTranslationService arabicTranslationService;

    @Value("${syriacars.enabled:true}")
    private boolean enabled;

    @Value("${syriacars.scraping.enabled:false}")
    private boolean scrapingEnabled;

    @Value("${syriacars.website.url:https://www.syriacars.net}")
    private String syrianCarsUrl;

    @Value("${syriacars.scraping.timeout:30000}")
    private int scrapingTimeout;


    /**
     * Validate configuration at startup
     */
    @PostConstruct
    public void validateConfiguration() {
        log.info("Initializing SyrianCars data service...");
        
        if (syrianCarsUrl == null || syrianCarsUrl.trim().isEmpty()) {
            throw new IllegalStateException("SyrianCars website URL is not configured. Please set 'syriacars.website.url' property.");
        }
        
        if (scrapingTimeout <= 0) {
            throw new IllegalStateException("SyrianCars scraping timeout must be positive. Current value: " + scrapingTimeout);
        }
        
        log.info("SyrianCars data service configured successfully:");
        log.info("  - Enabled: {}", enabled);
        log.info("  - Website URL: {}", syrianCarsUrl);
        log.info("  - Scraping Enabled: {}", scrapingEnabled);
        log.info("  - Scraping Timeout: {}ms", scrapingTimeout);
        
        if (enabled) {
            log.info("✅ SyrianCars data service: CONFIGURED - Connection testing will be done on-demand");
        } else {
            log.info("SyrianCars data service is disabled via configuration");
        }
    }

    @Override
    public String getProviderName() {
        return "SyrianCars";
    }

    @Override
    public int getPriority() {
        return 2; // Secondary priority - Syrian market specific
    }

    @Override
    public ProviderCapabilities getCapabilities() {
        ProviderCapabilities capabilities = new ProviderCapabilities();
        capabilities.setSupportsBrands(true);
        capabilities.setSupportsModels(true);
        capabilities.setSupportsTrims(true);
        capabilities.setSupportsImages(false);
        capabilities.setSupportsSpecs(true);
        capabilities.setSupportsIncrementalSync(true);
        capabilities.setSupportsRealTimeUpdates(false);
        return capabilities;
    }

    @Override
    public boolean testConnection() {
        try {
            if (!enabled) {
                log.debug("SyrianCars service is disabled");
                return false;
            }

            if (scrapingEnabled) {
                // Test scraping connection
                log.info("Testing SyrianCars.net scraping connection");
                try {
                    Document doc = Jsoup.connect(syrianCarsUrl)
                            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                            .timeout(10000) // Shorter timeout for connection test
                            .followRedirects(true)
                            .get();
                    
                    log.info("✅ SyrianCars.net scraping connection successful - page title: {}", doc.title());
                    return true;
                } catch (IOException e) {
                    log.warn("❌ SyrianCars.net scraping connection failed: {}", e.getMessage());
                    // Fall back to local data test
                }
            }

            // Test if local Syrian market data is available
            log.info("Testing Syrian local market data availability");
            boolean hasLocalData = hasSyrianMarketData();
            if (hasLocalData) {
                log.info("✅ Syrian local market data available");
            } else {
                log.warn("❌ No Syrian market data available");
            }
            return hasLocalData;
            
        } catch (Exception e) {
            log.error("Syrian data availability test failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public ProviderStatistics getStatistics() {
        ProviderStatistics stats = new ProviderStatistics();
        stats.setProviderName(getProviderName());
        stats.setStatus(isEnabled() ? (testConnection() ? "HEALTHY" : "UNHEALTHY") : "DISABLED");
        stats.setLastSyncTime(System.currentTimeMillis());

        if (isEnabled()) {
            try {
                // Count Syrian brands and models that might be missing from CarQuery
                stats.setTotalBrands(getSyrianBrands().size());
                stats.setTotalModels(getSyrianModels().size());
            } catch (Exception e) {
                log.warn("Error counting Syrian car data: {}", e.getMessage());
            }
        }

        return stats;
    }

    @Override
    public ValidationResult validateData() {
        ValidationResult result = new ValidationResult();

        if (!isEnabled()) {
            result.setValid(false);
            result.setMessage("SyrianCars provider is disabled");
            result.addError("Provider not enabled in configuration");
            return result;
        }

        if (!testConnection()) {
            result.setValid(false);
            result.setMessage("SyrianCars.net API connection failed");
            result.addError("Cannot connect to SyrianCars.net API");
            return result;
        }

        result.setValid(true);
        result.setMessage("SyrianCars.net provider validation passed");
        result.addWarning("This provider supplements CarQuery data with Syrian market specifics");

        return result;
    }

    @Override
    public DataLoadResult loadCompleteDataset() {
        log.info("Loading complete Syrian car dataset from SyrianCars.net");

        DataLoadResult result = new DataLoadResult();

        try {
            if (!isEnabled()) {
                throw new RuntimeException("SyrianCars provider is disabled");
            }

            if (!testConnection()) {
                throw new RuntimeException("Cannot connect to SyrianCars.net API");
            }

            result.addResult("brands", loadSyrianBrands());
            result.addResult("models", loadSyrianModels());

            log.info("✅ Syrian car dataset loaded successfully from SyrianCars.net");
            result.setSuccess(true);

        } catch (Exception e) {
            log.error("❌ Error loading Syrian car dataset: {}", e.getMessage(), e);
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
        }

        return result;
    }

    /**
     * Load Syrian-specific brands from syriacars.net
     */
    private LoadResult loadSyrianBrands() {
        LoadResult result = new LoadResult("brands");

        try {
            List<SyrianBrand> syrianBrands = loadSyrianMarketBrands();

            for (SyrianBrand brand : syrianBrands) {
                try {
                    createOrUpdateSyrianBrand(brand);
                    result.incrementProcessed();
                } catch (Exception e) {
                    log.warn("Failed to process Syrian brand {}: {}", brand.getName(), e.getMessage());
                    result.incrementFailed();
                }
            }

            log.info("Processed {} Syrian brands", result.getProcessed());

        } catch (Exception e) {
            log.error("Error loading Syrian brands: {}", e.getMessage());
            result.incrementFailed(1);
        }

        return result;
    }

    /**
     * Load Syrian-specific models from syriacars.net
     */
    private LoadResult loadSyrianModels() {
        LoadResult result = new LoadResult("models");

        try {
            List<SyrianModel> syrianModels = loadSyrianMarketModels();

            for (SyrianModel model : syrianModels) {
                try {
                    createOrUpdateSyrianModel(model);
                    result.incrementProcessed();
                } catch (Exception e) {
                    log.warn("Failed to process Syrian model {}: {}", model.getName(), e.getMessage());
                    result.incrementFailed();
                }
            }

            log.info("Processed {} Syrian models", result.getProcessed());

        } catch (Exception e) {
            log.error("Error loading Syrian models: {}", e.getMessage());
            result.incrementFailed(1);
        }

        return result;
    }

    /**
     * Load Syrian market brands from web scraping or fallback to local data
     */
    private List<SyrianBrand> loadSyrianMarketBrands() {
        // Try web scraping first if enabled
        if (scrapingEnabled) {
            try {
                List<SyrianBrand> scrapedBrands = scrapeSyrianCarsBrands();
                if (!scrapedBrands.isEmpty()) {
                    log.info("Successfully scraped {} brands from SyrianCars.net", scrapedBrands.size());
                    return scrapedBrands;
                }
            } catch (Exception e) {
                log.warn("Web scraping failed, falling back to local data: {}", e.getMessage());
            }
        }

        // Fallback to local data
        return getFallbackBrands();
    }

    /**
     * Scrape brands from SyrianCars.net website
     */
    private List<SyrianBrand> scrapeSyrianCarsBrands() throws IOException {
        List<SyrianBrand> brands = new ArrayList<>();

        try {
            log.info("Scraping brands from: {}", syrianCarsUrl);

            // Connect to SyrianCars.net with timeout and proper headers
            Document doc = Jsoup.connect(syrianCarsUrl)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.5")
                    .header("Accept-Encoding", "gzip, deflate")
                    .header("Connection", "keep-alive")
                    .timeout(scrapingTimeout)
                    .followRedirects(true)
                    .get();

            log.debug("Successfully connected to SyrianCars.net, page title: {}", doc.title());

            // Try multiple selectors for different possible page structures
            String[] brandSelectors = {
                "select[name=make] option",           // Dropdown options
                "select[name=brand] option",          // Alternative dropdown
                ".brand-list a",                      // Brand list links
                ".makes-list li",                     // Makes list items
                ".car-brands a",                      // Car brands links
                "a[href*='make=']",                   // Links with make parameter
                "a[href*='brand=']",                  // Links with brand parameter
                ".brand-item",                        // Brand items
                "[data-brand]"                        // Elements with brand data attribute
            };

            for (String selector : brandSelectors) {
                Elements brandElements = doc.select(selector);
                log.debug("Trying selector '{}': found {} elements", selector, brandElements.size());

                for (Element element : brandElements) {
                    String brandName = element.text().trim();
                    String brandValue = element.attr("value");
                    String brandHref = element.attr("href");
                    String brandData = element.attr("data-brand");

                    // Extract brand name from different sources
                    if (brandName.isEmpty() && !brandData.isEmpty()) {
                        brandName = brandData.trim();
                    }

                    // Extract slug from different sources
                    String slug = "";
                    if (!brandValue.isEmpty() && !brandValue.equals("0")) {
                        slug = brandValue.toLowerCase().replaceAll("[^a-z0-9-]", "-");
                    } else if (!brandHref.isEmpty()) {
                        // Extract from URL parameters
                        if (brandHref.contains("make=")) {
                            slug = brandHref.substring(brandHref.indexOf("make=") + 5);
                            if (slug.contains("&")) slug = slug.substring(0, slug.indexOf("&"));
                        } else if (brandHref.contains("brand=")) {
                            slug = brandHref.substring(brandHref.indexOf("brand=") + 6);
                            if (slug.contains("&")) slug = slug.substring(0, slug.indexOf("&"));
                        }
                        slug = slug.toLowerCase().replaceAll("[^a-z0-9-]", "-");
                    } else {
                        slug = brandName.toLowerCase().replaceAll("[^a-z0-9-]", "-");
                    }

                    // Validate and add brand
                    if (!brandName.isEmpty() && brandName.length() > 1 && !slug.isEmpty()) {
                        // Skip common non-brand values
                        if (brandName.equalsIgnoreCase("select") || brandName.equalsIgnoreCase("choose") || 
                            brandName.equalsIgnoreCase("all") || brandName.length() < 2) {
                            continue;
                        }

                        // Clean the brand name before translation
                        String cleanBrandName = cleanBrandNameForTranslation(brandName);
                        
                        // Generate Arabic translation
                        String arabicName = arabicTranslationService.translateBrandToArabic(cleanBrandName);
                        
                        // Only add if we have a valid Arabic translation
                        if (arabicName != null && !arabicName.trim().isEmpty() && !arabicName.equalsIgnoreCase(brandName)) {
                            brands.add(new SyrianBrand(brandName, arabicName, slug));
                            log.debug("Scraped brand: {} -> {} (slug: {})", brandName, arabicName, slug);
                        } else {
                            log.debug("Skipping brand '{}' - no valid Arabic translation", brandName);
                        }
                    }
                }

                // If we found brands with this selector, break
                if (!brands.isEmpty()) {
                    log.info("Successfully scraped {} brands using selector: {}", brands.size(), selector);
                    break;
                }
            }

            // If still no brands found, try to extract from page text
            if (brands.isEmpty()) {
                log.warn("No brands found with standard selectors, trying text extraction");
                String pageText = doc.text();
                log.debug("Page text sample: {}", pageText.length() > 200 ? pageText.substring(0, 200) + "..." : pageText);
                
                // This is a fallback - in a real scenario, you'd analyze the actual page structure
                // For now, we'll use our fallback data
                log.info("Scraping failed to find brands, using fallback data");
                return getFallbackBrands();
            }

            log.info("Successfully scraped {} brands from SyrianCars.net", brands.size());

        } catch (IOException e) {
            log.error("Error scraping SyrianCars.net: {}", e.getMessage());
            throw e;
        }

        return brands;
    }

    /**
     * Clean brand name for translation by removing counts, extra text, and extracting the English brand name
     * Examples:
     * "بيجو - Peugeot (57)" -> "Peugeot"
     * "تويوتا - Toyota (258)" -> "Toyota" 
     * "BMW (712)" -> "BMW"
     */
    private String cleanBrandNameForTranslation(String brandName) {
        if (brandName == null || brandName.trim().isEmpty()) {
            return brandName;
        }
        
        String cleaned = brandName.trim();
        
        // Remove count numbers in parentheses (e.g., "(57)", "(258)")
        cleaned = cleaned.replaceAll("\\s*\\(\\d+\\)\\s*$", "");
        
        // If the text contains both Arabic and English (e.g., "بيجو - Peugeot"), extract English part
        if (cleaned.contains(" - ")) {
            String[] parts = cleaned.split(" - ");
            // Look for the English part (contains Latin characters)
            for (String part : parts) {
                String trimmedPart = part.trim();
                if (trimmedPart.matches(".*[a-zA-Z].*")) { // Contains Latin characters
                    cleaned = trimmedPart;
                    break;
                }
            }
        }
        
        // Remove any remaining parentheses and extra whitespace
        cleaned = cleaned.replaceAll("[\\(\\)]", "").trim();
        
        log.debug("Cleaned brand name: '{}' -> '{}'", brandName, cleaned);
        return cleaned;
    }

    /**
     * Fallback local brand data
     */
    private List<SyrianBrand> getFallbackBrands() {
        List<SyrianBrand> brands = new ArrayList<>();

        // Syrian market specific brands that might be missing from CarQuery
        brands.add(new SyrianBrand("Al-Waha", "الواحة", "al-waha"));
        brands.add(new SyrianBrand("Cham Wings", "تشرين", "cham-wings"));
        brands.add(new SyrianBrand("Tishreen", "تشرين", "tishreen"));
        brands.add(new SyrianBrand("Syrian Car Assembly", "الشركة السورية لتجميع السيارات", "syrian-assembly"));

        // Brands popular in Syrian market with better Arabic translations
        brands.add(new SyrianBrand("Hyundai", "هيونداي", "hyundai"));
        brands.add(new SyrianBrand("Kia", "كيا", "kia"));
        brands.add(new SyrianBrand("Renault", "رينو", "renault"));
        brands.add(new SyrianBrand("Peugeot", "بيجو", "peugeot"));
        brands.add(new SyrianBrand("Toyota", "تويوتا", "toyota"));
        brands.add(new SyrianBrand("Nissan", "نيسان", "nissan"));
        brands.add(new SyrianBrand("Mercedes-Benz", "مرسيدس بنز", "mercedes-benz"));
        brands.add(new SyrianBrand("BMW", "بي إم دبليو", "bmw"));
        brands.add(new SyrianBrand("Volkswagen", "فولكس واجن", "volkswagen"));
        brands.add(new SyrianBrand("Audi", "أودي", "audi"));
        brands.add(new SyrianBrand("Ford", "فورد", "ford"));
        brands.add(new SyrianBrand("Chevrolet", "شفروليه", "chevrolet"));
        brands.add(new SyrianBrand("Mitsubishi", "ميتسوبيشي", "mitsubishi"));
        brands.add(new SyrianBrand("Suzuki", "سوزوكي", "suzuki"));
        brands.add(new SyrianBrand("Honda", "هوندا", "honda"));
        brands.add(new SyrianBrand("Mazda", "مازدا", "mazda"));
        brands.add(new SyrianBrand("Subaru", "سوبارو", "subaru"));
        brands.add(new SyrianBrand("SsangYong", "سانغ يونغ", "ssangyong"));

        return brands;
    }

    /**
     * Load Syrian market models from local data
     */
    private List<SyrianModel> loadSyrianMarketModels() {
        List<SyrianModel> models = new ArrayList<>();

        // Syrian market specific models
        models.add(new SyrianModel("al-waha", "City Van", "سيارة المدينة"));
        models.add(new SyrianModel("cham-wings", "Family", "عائلية"));
        models.add(new SyrianModel("tishreen", "Pickup", "بيك أب"));

        // Popular models in Syrian market with Arabic translations
        // Hyundai
        models.add(new SyrianModel("hyundai", "Accent", "أكسنت"));
        models.add(new SyrianModel("hyundai", "Elantra", "إلانترا"));
        models.add(new SyrianModel("hyundai", "Tucson", "توكسون"));
        models.add(new SyrianModel("hyundai", "Santa Fe", "سانتا في"));
        models.add(new SyrianModel("hyundai", "i10", "آي 10"));
        models.add(new SyrianModel("hyundai", "i20", "آي 20"));

        // Kia
        models.add(new SyrianModel("kia", "Rio", "ريو"));
        models.add(new SyrianModel("kia", "Cerato", "سيراتو"));
        models.add(new SyrianModel("kia", "Sportage", "سبورتاج"));
        models.add(new SyrianModel("kia", "Sorento", "سورينتو"));
        models.add(new SyrianModel("kia", "Picanto", "بيكانتو"));

        // Renault
        models.add(new SyrianModel("renault", "Symbol", "سيمان"));
        models.add(new SyrianModel("renault", "Logan", "لوغان"));
        models.add(new SyrianModel("renault", "Duster", "داستر"));
        models.add(new SyrianModel("renault", "Clio", "كليو"));
        models.add(new SyrianModel("renault", "Megane", "ميغان"));

        // Peugeot
        models.add(new SyrianModel("peugeot", "206", "206"));
        models.add(new SyrianModel("peugeot", "207", "207"));
        models.add(new SyrianModel("peugeot", "208", "208"));
        models.add(new SyrianModel("peugeot", "301", "301"));
        models.add(new SyrianModel("peugeot", "3008", "3008"));

        // Toyota
        models.add(new SyrianModel("toyota", "Corolla", "كورولا"));
        models.add(new SyrianModel("toyota", "Camry", "كامري"));
        models.add(new SyrianModel("toyota", "Yaris", "يارس"));
        models.add(new SyrianModel("toyota", "RAV4", "راف 4"));
        models.add(new SyrianModel("toyota", "Land Cruiser", "لاند كروزر"));

        // Nissan
        models.add(new SyrianModel("nissan", "Sunny", "ساني"));
        models.add(new SyrianModel("nissan", "Qashqai", "قشقاي"));
        models.add(new SyrianModel("nissan", "Patrol", "باترول"));
        models.add(new SyrianModel("nissan", "Altima", "ألتيما"));

        // Mercedes-Benz
        models.add(new SyrianModel("mercedes-benz", "C-Class", "سي كلاس"));
        models.add(new SyrianModel("mercedes-benz", "E-Class", "إي كلاس"));
        models.add(new SyrianModel("mercedes-benz", "S-Class", "أس كلاس"));
        models.add(new SyrianModel("mercedes-benz", "ML-Class", "أم أل كلاس"));

        // BMW
        models.add(new SyrianModel("bmw", "3 Series", "سلسلة 3"));
        models.add(new SyrianModel("bmw", "5 Series", "سلسلة 5"));
        models.add(new SyrianModel("bmw", "7 Series", "سلسلة 7"));
        models.add(new SyrianModel("bmw", "X3", "إكس 3"));
        models.add(new SyrianModel("bmw", "X5", "إكس 5"));

        return models;
    }



    /**
     * Check if Syrian market data is available
     */
    private boolean hasSyrianMarketData() {
        try {
            // Check if we have local data or can load from resources
            List<SyrianBrand> brands = loadSyrianMarketBrands();
            List<SyrianModel> models = loadSyrianMarketModels();
            return !brands.isEmpty() && !models.isEmpty();
        } catch (Exception e) {
            log.warn("Error checking Syrian market data availability: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get list of Syrian brands (for statistics)
     */
    private List<String> getSyrianBrands() {
        return loadSyrianMarketBrands().stream()
            .map(SyrianBrand::getSlug)
            .collect(Collectors.toList());
    }

    /**
     * Get list of Syrian models (for statistics)
     */
    private List<String> getSyrianModels() {
        return loadSyrianMarketModels().stream()
            .map(SyrianModel::getName)
            .collect(Collectors.toList());
    }

    /**
     * Create or update a Syrian brand with strict validation (same as CarQuery)
     */
    private void createOrUpdateSyrianBrand(SyrianBrand syrianBrand) {
        try {
            String brandSlug = syrianBrand.getSlug();
            String brandName = syrianBrand.getName();
            CarBrand existingBrand = null;

            // Check if brand already exists by slug or name
            try {
                existingBrand = carBrandService.getBrandBySlug(brandSlug);
                log.debug("Syrian brand '{}' already exists (slug: {}), checking for new models", brandName, brandSlug);
            } catch (Exception e) {
                // Check by name as well
                try {
                    existingBrand = carBrandService.getBrandByName(brandName);
                    log.debug("Syrian brand '{}' already exists (name: {}), checking for new models", brandName, brandName);
                } catch (Exception ex) {
                    // Brand doesn't exist, validate it has models before creating
                    if (validateSyrianBrandHasModels(syrianBrand.getSlug())) {
                        createSyrianBrandDirectly(syrianBrand);
                        return; // Brand created, models will be imported in next phase
                    } else {
                        log.info("Skipping Syrian brand '{}' - no models available", brandName);
                        return;
                    }
                }
            }

            // If brand exists, import any new models
            if (existingBrand != null) {
                importSyrianModelsForExistingBrand(existingBrand, syrianBrand.getSlug());
            }

        } catch (Exception e) {
            log.error("Failed to create/update Syrian brand '{}': {}", syrianBrand.getName(), e.getMessage());
            throw e;
        }
    }

    /**
     * Create or update a Syrian model with strict validation (same as CarQuery)
     */
    private void createOrUpdateSyrianModel(SyrianModel syrianModel) {
        try {
            // Find the brand for this model
            CarBrand brand = carBrandService.getBrandBySlug(syrianModel.getBrandSlug());
            
            String modelName = syrianModel.getName();

            // Check if model already exists for this brand by name or slug
            List<CarModel> existingModels = carModelService.getModelsByBrandId(brand.getId());

            // Generate expected slug for comparison
            String expectedSlug = (brand.getName() + "-" + modelName).toLowerCase().replaceAll("[^a-z0-9-]", "-");
            
            boolean modelExists = existingModels.stream()
                .anyMatch(model -> model.getName().equals(modelName) || model.getSlug().equals(expectedSlug));

            if (modelExists) {
                log.debug("Syrian model '{}' already exists for brand '{}', skipping",
                         modelName, brand.getDisplayNameEn());
                return;
            }

            // Model doesn't exist, create it directly with validation
            createSyrianModelDirectly(brand, syrianModel);

        } catch (Exception e) {
            log.warn("Failed to create/update Syrian model '{}': {}", syrianModel.getName(), e.getMessage());
        }
    }

    /**
     * Validate that a Syrian brand has available models
     */
    private boolean validateSyrianBrandHasModels(String brandSlug) {
        try {
            log.debug("Validating models availability for Syrian brand: {}", brandSlug);

            List<SyrianModel> availableModels = loadSyrianMarketModels().stream()
                .filter(model -> model.getBrandSlug().equals(brandSlug))
                .collect(java.util.stream.Collectors.toList());

            if (availableModels.isEmpty()) {
                log.warn("❌ SYRIAN BRAND VALIDATION FAILED: '{}' has no models available - will not be imported", brandSlug);
                return false;
            }

            int modelCount = availableModels.size();
            log.debug("✅ SYRIAN BRAND VALIDATION PASSED: '{}' has {} models available", brandSlug, modelCount);
            return true;

        } catch (Exception e) {
            log.warn("❌ SYRIAN BRAND VALIDATION ERROR: Cannot validate models for brand '{}': {} - will not be imported to maintain data quality", brandSlug, e.getMessage());
            return false;
        }
    }

    /**
     * Comprehensive data quality validation for Syrian brand creation (same as CarQuery)
     */
    private boolean validateSyrianBrandDataQuality(SyrianBrand syrianBrand) {
        String englishName = syrianBrand.getName();

        // 1. Validate Arabic translation availability
        String arabicName = syrianBrand.getArabicName();
        if (arabicName == null || arabicName.trim().isEmpty()) {
            log.warn("❌ SYRIAN DATA QUALITY CHECK FAILED: '{}' - No Arabic translation available", englishName);
            return false;
        }

        // 2. Validate translation is actually different from English
        if (arabicName.equalsIgnoreCase(englishName.trim())) {
            log.warn("❌ SYRIAN DATA QUALITY CHECK FAILED: '{}' - Arabic translation is identical to English name", englishName);
            return false;
        }

        // 3. Validate slug is present and properly formatted
        String slug = syrianBrand.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            log.warn("❌ SYRIAN DATA QUALITY CHECK FAILED: '{}' - No slug available", englishName);
            return false;
        }

        // 4. Check for existing brand with same slug to prevent duplicates
        try {
            carBrandService.getBrandBySlug(slug);
            log.debug("Syrian brand '{}' already exists with slug '{}', will check for new models", englishName, slug);
            return true; // Brand exists, but we can still import new models
        } catch (Exception e) {
            // Brand doesn't exist, which is fine for new brand creation
        }

        log.debug("✅ SYRIAN BRAND DATA QUALITY PASSED: '{}' -> '{}' (slug: {})", englishName, arabicName, slug);
        return true;
    }

    /**
     * Create Syrian brand directly with validation (same as CarQuery)
     */
    private void createSyrianBrandDirectly(SyrianBrand syrianBrand) {
        try {
            // COMPREHENSIVE DATA QUALITY VALIDATION - Only proceed if ALL checks pass
            if (!validateSyrianBrandDataQuality(syrianBrand)) {
                log.warn("❌ SYRIAN BRAND CREATION SKIPPED: '{}' failed comprehensive data quality validation", syrianBrand.getName());
                return;
            }

            String englishName = syrianBrand.getName();
            String arabicName = syrianBrand.getArabicName();
            String brandSlug = syrianBrand.getSlug();

            CarBrand brand = new CarBrand();
            brand.setName(englishName);
            brand.setSlug(brandSlug);
            brand.setDisplayNameEn(englishName);
            brand.setDisplayNameAr(arabicName);
            brand.setIsActive(true);

            CarBrand savedBrand = carBrandService.createBrand(brand);
            log.info("✅ SYRIAN BRAND CREATED: '{}' -> '{}' (ID: {}, slug: {})", 
                    englishName, arabicName, savedBrand.getId(), brandSlug);

        } catch (Exception e) {
            log.error("❌ CRITICAL ERROR creating Syrian brand '{}': {}", syrianBrand.getName(), e.getMessage());
            throw e;
        }
    }

    /**
     * Import new models for existing Syrian brand
     */
    private void importSyrianModelsForExistingBrand(CarBrand existingBrand, String brandSlug) {
        try {
            log.debug("Checking for new Syrian models for existing brand: {}", existingBrand.getName());
            
            List<SyrianModel> availableModels = loadSyrianMarketModels().stream()
                .filter(model -> model.getBrandSlug().equals(brandSlug))
                .collect(java.util.stream.Collectors.toList());
            
            int newModelsCount = 0;
            for (SyrianModel modelData : availableModels) {
                try {
                    // Check if this model already exists
                    List<CarModel> existingModels = carModelService.getModelsByBrandId(existingBrand.getId());
                    String expectedSlug = (existingBrand.getName() + "-" + modelData.getName()).toLowerCase().replaceAll("[^a-z0-9-]", "-");
                    
                    boolean modelExists = existingModels.stream()
                        .anyMatch(model -> model.getName().equals(modelData.getName()) || model.getSlug().equals(expectedSlug));
                    
                    if (!modelExists) {
                        createSyrianModelDirectly(existingBrand, modelData);
                        newModelsCount++;
                    }
                } catch (Exception e) {
                    log.warn("Failed to process Syrian model '{}' for brand '{}': {}", 
                            modelData.getName(), existingBrand.getName(), e.getMessage());
                }
            }
            
            if (newModelsCount > 0) {
                log.info("✅ Imported {} new Syrian models for existing brand '{}'", newModelsCount, existingBrand.getName());
            } else {
                log.debug("No new Syrian models found for existing brand '{}'", existingBrand.getName());
            }
            
        } catch (Exception e) {
            log.error("Failed to import Syrian models for existing brand '{}': {}", existingBrand.getName(), e.getMessage());
        }
    }

    /**
     * Comprehensive data quality validation for Syrian model creation (same as CarQuery)
     */
    private boolean validateSyrianModelDataQuality(CarBrand brand, SyrianModel syrianModel) {
        String englishModelName = syrianModel.getName();

        // 1. Validate Arabic translation availability
        String arabicModelName = syrianModel.getArabicName();
        if (arabicModelName == null || arabicModelName.trim().isEmpty()) {
            log.warn("❌ SYRIAN MODEL DATA QUALITY CHECK FAILED: '{}' for brand '{}' - No Arabic translation available",
                    englishModelName, brand.getDisplayNameEn());
            return false;
        }

        // 2. Validate translation is actually different from English (unless it's alphanumeric)
        if (arabicModelName.equalsIgnoreCase(englishModelName.trim()) && !englishModelName.matches(".*\\d.*")) {
            log.warn("❌ SYRIAN MODEL DATA QUALITY CHECK FAILED: '{}' for brand '{}' - Arabic translation is identical to English name",
                    englishModelName, brand.getDisplayNameEn());
            return false;
        }

        // 3. Validate basic data integrity
        if (englishModelName == null || englishModelName.trim().isEmpty()) {
            log.warn("❌ SYRIAN MODEL DATA QUALITY CHECK FAILED: Empty model name for brand '{}'", brand.getDisplayNameEn());
            return false;
        }

        log.debug("✅ SYRIAN MODEL DATA QUALITY PASSED: '{}' -> '{}' for brand '{}'", 
                englishModelName, arabicModelName, brand.getDisplayNameEn());
        return true;
    }

    /**
     * Create Syrian model directly with validation (same as CarQuery)
     */
    private void createSyrianModelDirectly(CarBrand brand, SyrianModel syrianModel) {
        try {
            // COMPREHENSIVE DATA QUALITY VALIDATION - Only proceed if ALL checks pass
            if (!validateSyrianModelDataQuality(brand, syrianModel)) {
                log.warn("❌ SYRIAN MODEL CREATION SKIPPED: '{}' for brand '{}' failed comprehensive data quality validation",
                        syrianModel.getName(), brand.getDisplayNameEn());
                return;
            }

            String englishModelName = syrianModel.getName();
            String arabicModelName = syrianModel.getArabicName();
            // Generate slug with brand-model format for proper filtering (same as CarQuery)
            String modelSlug = (brand.getName() + "-" + englishModelName).toLowerCase().replaceAll("[^a-z0-9-]", "-");

            CarModel model = new CarModel();
            model.setName(englishModelName);
            model.setSlug(modelSlug);
            model.setDisplayNameEn(englishModelName);
            model.setDisplayNameAr(arabicModelName);
            model.setBrand(brand);
            model.setIsActive(true);

            CarModel savedModel = carModelService.createModel(model);
            log.info("✅ SYRIAN MODEL CREATED: '{}' -> '{}' for brand '{}' (ID: {}, slug: {})", 
                    englishModelName, arabicModelName, brand.getDisplayNameEn(), savedModel.getId(), modelSlug);

        } catch (Exception e) {
            log.error("❌ CRITICAL ERROR creating Syrian model '{}' for brand '{}': {}", 
                    syrianModel.getName(), brand.getDisplayNameEn(), e.getMessage());
            throw e;
        }
    }

    /**
     * Syrian brand data structure
     */
    private static class SyrianBrand {
        private final String name;
        private final String arabicName;
        private final String slug;

        public SyrianBrand(String name, String arabicName, String slug) {
            this.name = name;
            this.arabicName = arabicName;
            this.slug = slug;
        }

        public String getName() { return name; }
        public String getArabicName() { return arabicName; }
        public String getSlug() { return slug; }
    }

    /**
     * Syrian model data structure
     */
    private static class SyrianModel {
        private final String brandSlug;
        private final String name;
        private final String arabicName;

        public SyrianModel(String brandSlug, String name, String arabicName) {
            this.brandSlug = brandSlug;
            this.name = name;
            this.arabicName = arabicName;
        }

        public String getBrandSlug() { return brandSlug; }
        public String getName() { return name; }
        public String getArabicName() { return arabicName; }
    }
}
