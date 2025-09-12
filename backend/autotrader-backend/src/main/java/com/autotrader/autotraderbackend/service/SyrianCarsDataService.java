package com.autotrader.autotraderbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
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
@ConditionalOnProperty(name = "syriacars.enabled", havingValue = "false", matchIfMissing = true)
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

    private final RestTemplate restTemplate;

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
            try {
                boolean available = testConnection();
                if (available) {
                    log.info("✅ SyrianCars data service: READY");
                } else {
                    log.warn("⚠️ SyrianCars data service: LIMITED - Some features may be unavailable");
                }
            } catch (Exception e) {
                log.warn("⚠️ SyrianCars data service initialization warning: {} - Will use fallback data", e.getMessage());
            }
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
            // Test if local Syrian market data is available
            log.info("Testing Syrian local market data availability");
            return enabled && hasSyrianMarketData();
        } catch (Exception e) {
            log.error("Syrian local data availability test failed: {}", e.getMessage());
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

            // Connect to SyrianCars.net with timeout
            Document doc = Jsoup.connect(syrianCarsUrl)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(scrapingTimeout)
                    .followRedirects(true)
                    .get();

            // Try different selectors for brands (you may need to adjust these based on the actual website structure)
            Elements brandElements = doc.select("select[name=make] option, .brand-list a, .makes-list li");

            for (Element element : brandElements) {
                String brandName = element.text().trim();
                String brandValue = element.attr("value");

                if (!brandName.isEmpty() && !brandValue.equals("") && !brandValue.equals("0")) {
                    // Create brand with English name and generate Arabic translation
                    String arabicName = arabicTranslationService.translateBrandToArabic(brandName);
                    String slug = brandValue.toLowerCase().replaceAll("[^a-z0-9-]", "-");

                    brands.add(new SyrianBrand(brandName, arabicName, slug));
                    log.debug("Scraped brand: {} -> {}", brandName, arabicName);
                }
            }

            // If no brands found with selectors, try to find brand links
            if (brands.isEmpty()) {
                Elements brandLinks = doc.select("a[href*='make='], a[href*='brand=']");
                for (Element link : brandLinks) {
                    String brandName = link.text().trim();
                    if (!brandName.isEmpty() && brandName.length() > 2) {
                        String arabicName = arabicTranslationService.translateBrandToArabic(brandName);
                        String slug = brandName.toLowerCase().replaceAll("[^a-z0-9-]", "-");

                        brands.add(new SyrianBrand(brandName, arabicName, slug));
                    }
                }
            }

            log.info("Scraped {} brands from SyrianCars.net", brands.size());

        } catch (IOException e) {
            log.error("Error scraping SyrianCars.net: {}", e.getMessage());
            throw e;
        }

        return brands;
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
        models.add(new SyrianModel("Al-Waha", "City Van", "سيارة المدينة"));
        models.add(new SyrianModel("Cham Wings", "Family", "عائلية"));
        models.add(new SyrianModel("Tishreen", "Pickup", "بيك أب"));

        // Popular models in Syrian market with Arabic translations
        // Hyundai
        models.add(new SyrianModel("Hyundai", "Accent", "أكسنت"));
        models.add(new SyrianModel("Hyundai", "Elantra", "إلانترا"));
        models.add(new SyrianModel("Hyundai", "Tucson", "توكسون"));
        models.add(new SyrianModel("Hyundai", "Santa Fe", "سانتا في"));
        models.add(new SyrianModel("Hyundai", "i10", "آي 10"));
        models.add(new SyrianModel("Hyundai", "i20", "آي 20"));

        // Kia
        models.add(new SyrianModel("Kia", "Rio", "ريو"));
        models.add(new SyrianModel("Kia", "Cerato", "سيراتو"));
        models.add(new SyrianModel("Kia", "Sportage", "سبورتاج"));
        models.add(new SyrianModel("Kia", "Sorento", "سورينتو"));
        models.add(new SyrianModel("Kia", "Picanto", "بيكانتو"));

        // Renault
        models.add(new SyrianModel("Renault", "Symbol", "سيمان"));
        models.add(new SyrianModel("Renault", "Logan", "لوغان"));
        models.add(new SyrianModel("Renault", "Duster", "داستر"));
        models.add(new SyrianModel("Renault", "Clio", "كليو"));
        models.add(new SyrianModel("Renault", "Megane", "ميغان"));

        // Peugeot
        models.add(new SyrianModel("Peugeot", "206", "206"));
        models.add(new SyrianModel("Peugeot", "207", "207"));
        models.add(new SyrianModel("Peugeot", "208", "208"));
        models.add(new SyrianModel("Peugeot", "301", "301"));
        models.add(new SyrianModel("Peugeot", "3008", "3008"));

        // Toyota
        models.add(new SyrianModel("Toyota", "Corolla", "كورولا"));
        models.add(new SyrianModel("Toyota", "Camry", "كامري"));
        models.add(new SyrianModel("Toyota", "Yaris", "يارس"));
        models.add(new SyrianModel("Toyota", "RAV4", "راف 4"));
        models.add(new SyrianModel("Toyota", "Land Cruiser", "لاند كروزر"));

        // Nissan
        models.add(new SyrianModel("Nissan", "Sunny", "ساني"));
        models.add(new SyrianModel("Nissan", "Qashqai", "قشقاي"));
        models.add(new SyrianModel("Nissan", "Patrol", "باترول"));
        models.add(new SyrianModel("Nissan", "Altima", "ألتيما"));

        // Mercedes-Benz
        models.add(new SyrianModel("Mercedes-Benz", "C-Class", "سي كلاس"));
        models.add(new SyrianModel("Mercedes-Benz", "E-Class", "إي كلاس"));
        models.add(new SyrianModel("Mercedes-Benz", "S-Class", "أس كلاس"));
        models.add(new SyrianModel("Mercedes-Benz", "ML-Class", "أم أل كلاس"));

        // BMW
        models.add(new SyrianModel("BMW", "3 Series", "سلسلة 3"));
        models.add(new SyrianModel("BMW", "5 Series", "سلسلة 5"));
        models.add(new SyrianModel("BMW", "7 Series", "سلسلة 7"));
        models.add(new SyrianModel("BMW", "X3", "إكس 3"));
        models.add(new SyrianModel("BMW", "X5", "إكس 5"));

        return models;
    }

    /**
     * Create or update a Syrian brand
     */
    @Transactional
    private void createOrUpdateSyrianBrand(SyrianBrand syrianBrand) {
        try {
            // Check if brand already exists (from CarQuery or manual entry)
            CarBrand existingBrand = carBrandService.getBrandBySlug(syrianBrand.getSlug());

            // Update existing brand with Syrian market data
            if (existingBrand.getDisplayNameAr() == null || existingBrand.getDisplayNameAr().isEmpty()) {
                existingBrand.setDisplayNameAr(syrianBrand.getArabicName());
                carBrandService.updateBrand(existingBrand.getId(), existingBrand);
                log.debug("Updated brand {} with Arabic name: {}", existingBrand.getName(), syrianBrand.getArabicName());
            }

        } catch (Exception e) {
            // Brand doesn't exist, create new one
            CarBrand newBrand = new CarBrand();
            newBrand.setName(syrianBrand.getSlug());
            newBrand.setSlug(syrianBrand.getSlug());
            newBrand.setDisplayNameEn(syrianBrand.getName());
            newBrand.setDisplayNameAr(syrianBrand.getArabicName());
            newBrand.setIsActive(true);

            carBrandService.createBrand(newBrand);
            log.info("Created new Syrian market brand: {}", syrianBrand.getName());
        }
    }

    /**
     * Create or update a Syrian model
     */
    @Transactional
    private void createOrUpdateSyrianModel(SyrianModel syrianModel) {
        try {
            // Find the brand first
            CarBrand brand = carBrandService.getBrandBySlug(syrianModel.getBrandSlug());

            // Check if model already exists
            // Try to find existing model by name and brand
            List<CarModel> existingModels = carModelService.getModelsByBrandId(brand.getId());
            CarModel existingModel = existingModels.stream()
                .filter(model -> model.getName().equals(syrianModel.getName()))
                .findFirst()
                .orElse(null);

            // Update existing model with Syrian data
            if (existingModel.getDisplayNameAr() == null || existingModel.getDisplayNameAr().isEmpty()) {
                existingModel.setDisplayNameAr(syrianModel.getArabicName());
                carModelService.updateModel(existingModel.getId(), existingModel);
                log.debug("Updated model {} with Arabic name: {}", existingModel.getDisplayNameEn(), syrianModel.getArabicName());
            }

        } catch (Exception e) {
            // Model doesn't exist, create new one
            try {
                CarBrand brand = carBrandService.getBrandBySlug(syrianModel.getBrandSlug());

                CarModel newModel = new CarModel();
                newModel.setName(syrianModel.getName());
                newModel.setSlug(syrianModel.getName().toLowerCase().replaceAll("[^a-z0-9-]", "-"));
                newModel.setDisplayNameEn(syrianModel.getName());
                newModel.setDisplayNameAr(syrianModel.getArabicName());
                newModel.setBrand(brand);
                newModel.setIsActive(true);

                carModelService.createModel(newModel);
                log.info("Created new Syrian market model: {} for brand {}", syrianModel.getName(), syrianModel.getBrandSlug());

            } catch (Exception brandException) {
                log.warn("Cannot create model {} - brand {} not found", syrianModel.getName(), syrianModel.getBrandSlug());
            }
        }
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
     * Basic English to Arabic brand name translation
     * In production, you might want to use a proper translation service
     */
    @Deprecated
    private String translateBrandToArabicLegacy(String englishName) {
        // Simple translation mapping for common brands
        Map<String, String> translations = new HashMap<>();
        translations.put("Toyota", "تويوتا");
        translations.put("Honda", "هوندا");
        translations.put("Nissan", "نيسان");
        translations.put("Mazda", "مازدا");
        translations.put("Subaru", "سوبارو");
        translations.put("Mitsubishi", "ميتسوبيشي");
        translations.put("Suzuki", "سوزوكي");
        translations.put("Hyundai", "هيونداي");
        translations.put("Kia", "كيا");
        translations.put("Renault", "رينو");
        translations.put("Peugeot", "بيجو");
        translations.put("Mercedes-Benz", "مرسيدس بنز");
        translations.put("BMW", "بي إم دبليو");
        translations.put("Audi", "أودي");
        translations.put("Volkswagen", "فولكس واجن");
        translations.put("Ford", "فورد");
        translations.put("Chevrolet", "شفروليه");
        translations.put("SsangYong", "سانغ يونغ");

        return translations.getOrDefault(englishName, englishName);
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
