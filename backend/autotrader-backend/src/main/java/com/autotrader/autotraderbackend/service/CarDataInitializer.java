package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Professional data initializer for Syrian car brands and models
 * Uses Spring Boot CommandLineRunner for controlled data seeding
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Execute before other initializers
@Profile("disabled") // Disabled - use only CarQuery API for clean data
public class CarDataInitializer implements CommandLineRunner {

    private final CarBrandService carBrandService;
    private final CarModelService carModelService;

    @Value("${app.data.initialize.override:false}")
    private boolean overrideExistingData;

    @Override
    public void run(String... args) {
        log.info("Starting professional Syrian car data initialization...");

        try {
            initializeBrandsAndModels();

            log.info("✅ Syrian car data initialization completed successfully");
        } catch (Exception e) {
            log.error("❌ Error during car data initialization: {}", e.getMessage(), e);
            // Don't re-throw the exception to allow application startup to continue
        }
    }

    /**
     * Initialize brands and models intelligently - only create brands that have models
     */
    private void initializeBrandsAndModels() {
        log.info("Initializing car brands and models with intelligent validation...");
        
        // First, collect all brand-model data
        Map<String, List<ModelData>> brandModelMap = collectAllBrandModelData();
        
        // Create brands only if they have models
        createBrandsWithModels(brandModelMap);
        
        // Create models for each brand
        createModelsForBrands(brandModelMap);
        
        log.info("✅ Intelligent brand-model initialization completed");
    }
    
    /**
     * Collect all brand-model data by introspection of model initialization methods
     */
    private Map<String, List<ModelData>> collectAllBrandModelData() {
        Map<String, List<ModelData>> brandModelMap = new HashMap<>();
        
        // Toyota models
        brandModelMap.put("toyota", Arrays.asList(
            new ModelData("corolla", "Corolla", "كورولا"),
            new ModelData("camry", "Camry", "كامري"),
            new ModelData("rav4", "RAV4", "راف فور"),
            new ModelData("land-cruiser", "Land Cruiser", "لاند كروزر"),
            new ModelData("prado", "Prado", "برادو"),
            new ModelData("yaris", "Yaris", "ياريس"),
            new ModelData("hilux", "Hilux", "هيلكس")
        ));
        
        // Honda models
        brandModelMap.put("honda", Arrays.asList(
            new ModelData("civic", "Civic", "سيفيك"),
            new ModelData("accord", "Accord", "أكورد"),
            new ModelData("crv", "CR-V", "سي آر في"),
            new ModelData("pilot", "Pilot", "بايلوت")
        ));
        
        // Hyundai models
        brandModelMap.put("hyundai", Arrays.asList(
            new ModelData("elantra", "Elantra", "إلنترا"),
            new ModelData("sonata", "Sonata", "سوناتا"),
            new ModelData("tucson", "Tucson", "توكسون"),
            new ModelData("santa-fe", "Santa Fe", "سانتا في"),
            new ModelData("i10", "i10", "آي 10")
        ));
        
        // Kia models
        brandModelMap.put("kia", Arrays.asList(
            new ModelData("rio", "Rio", "ريو"),
            new ModelData("sportage", "Sportage", "سبورتاج"),
            new ModelData("cerato", "Cerato", "سيراتو"),
            new ModelData("sorento", "Sorento", "سورنتو")
        ));
        
        // Mercedes models
        brandModelMap.put("mercedes-benz", Arrays.asList(
            new ModelData("c-class", "C-Class", "الفئة سي"),
            new ModelData("e-class", "E-Class", "الفئة إي"),
            new ModelData("s-class", "S-Class", "الفئة إس"),
            new ModelData("ml-class", "ML-Class", "الفئة إم إل"),
            new ModelData("gle-class", "GLE-Class", "الفئة جي إل إي")
        ));
        
        // BMW models
        brandModelMap.put("bmw", Arrays.asList(
            new ModelData("3-series", "3 Series", "الفئة الثالثة"),
            new ModelData("5-series", "5 Series", "الفئة الخامسة"),
            new ModelData("7-series", "7 Series", "الفئة السابعة"),
            new ModelData("x3", "X3", "إكس 3"),
            new ModelData("x5", "X5", "إكس 5")
        ));
        
        // Volkswagen models
        brandModelMap.put("volkswagen", Arrays.asList(
            new ModelData("jetta", "Jetta", "جيتا"),
            new ModelData("polo", "Polo", "بولو"),
            new ModelData("golf", "Golf", "غولف"),
            new ModelData("passat", "Passat", "باسات"),
            new ModelData("tiguan", "Tiguan", "تيغوان")
        ));
        
        // Peugeot models
        brandModelMap.put("peugeot", Arrays.asList(
            new ModelData("208", "208", "208"),
            new ModelData("301", "301", "301"),
            new ModelData("308", "308", "308"),
            new ModelData("2008", "2008", "2008"),
            new ModelData("3008", "3008", "3008")
        ));
        
        // Chevrolet models
        brandModelMap.put("chevrolet", Arrays.asList(
            new ModelData("cruze", "Cruze", "كروز"),
            new ModelData("malibu", "Malibu", "ماليبو"),
            new ModelData("spark", "Spark", "سبارك"),
            new ModelData("trailblazer", "Trailblazer", "ترايبليزر")
        ));
        
        // Jeep models
        brandModelMap.put("jeep", Arrays.asList(
            new ModelData("grand-cherokee", "Grand Cherokee", "غراند شيروكي"),
            new ModelData("wrangler", "Wrangler", "رانغلر"),
            new ModelData("compass", "Compass", "كومباس")
        ));
        
        // Subaru models
        brandModelMap.put("subaru", Arrays.asList(
            new ModelData("forester", "Forester", "فوريستر"),
            new ModelData("outback", "Outback", "أوتباك"),
            new ModelData("impreza", "Impreza", "إمبريزا"),
            new ModelData("wrx", "WRX", "دبليو آر إكس"),
            new ModelData("wrx-sti", "WRX STI", "دبليو آر إكس إس تي آي"),
            new ModelData("legacy", "Legacy", "ليغاسي"),
            new ModelData("crosstrek", "Crosstrek", "كروس تريك"),
            new ModelData("xv", "XV", "إكس في")
        ));
        
        // Mazda models
        brandModelMap.put("mazda", Arrays.asList(
            new ModelData("3", "3", "3"),
            new ModelData("6", "6", "6"),
            new ModelData("cx-5", "CX-5", "سي إكس 5"),
            new ModelData("cx-9", "CX-9", "سي إكس 9"),
            new ModelData("mx-5", "MX-5", "إم إكس 5"),
            new ModelData("cx-3", "CX-3", "سي إكس 3"),
            new ModelData("cx-30", "CX-30", "سي إكس 30"),
            new ModelData("miata", "Miata", "مياتا")
        ));
        
        // SsangYong models
        brandModelMap.put("ssangyong", Arrays.asList(
            new ModelData("korando", "Korando", "كوراندو"),
            new ModelData("tivoli", "Tivoli", "تيفولي"),
            new ModelData("rexton", "Rexton", "ريكستون"),
            new ModelData("musso", "Musso", "موسو"),
            new ModelData("xlv", "XLV", "إكس إل في"),
            new ModelData("actyon", "Actyon", "أكتيون")
        ));
        
        log.info("Collected model data for {} brands", brandModelMap.size());
        return brandModelMap;
    }
    
    /**
     * Create brands only if they have models defined
     */
    private void createBrandsWithModels(Map<String, List<ModelData>> brandModelMap) {
        log.info("Creating brands that have models...");
        
        // Get all brand definitions
        Map<String, BrandData> allBrands = getAllBrandDefinitions();
        
        int createdCount = 0;
        int skippedCount = 0;
        
        for (String brandSlug : brandModelMap.keySet()) {
            BrandData brandData = allBrands.get(brandSlug);
            if (brandData == null) {
                log.warn("No brand definition found for slug: {}", brandSlug);
                continue;
            }
            
            try {
                CarBrand existingBrand = null;
                try {
                    existingBrand = carBrandService.getBrandBySlug(brandData.getSlug());
                } catch (Exception e) {
                    // Brand doesn't exist, which is fine
                }

                if (existingBrand == null) {
                    CarBrand brand = new CarBrand();
                    brand.setName(brandData.getName());
                    brand.setSlug(brandData.getSlug());
                    brand.setDisplayNameEn(brandData.getDisplayNameEn());
                    brand.setDisplayNameAr(brandData.getDisplayNameAr());
                    brand.setStatus(com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE);

                    carBrandService.createBrand(brand);
                    createdCount++;
                    log.info("✅ Created brand: {} ({} models)", brandData.getName(), brandModelMap.get(brandSlug).size());
                } else if (overrideExistingData) {
                    existingBrand.setDisplayNameEn(brandData.getDisplayNameEn());
                    existingBrand.setDisplayNameAr(brandData.getDisplayNameAr());
                    carBrandService.updateBrand(existingBrand.getId(), existingBrand);
                    log.debug("Updated existing brand: {}", brandData.getName());
                } else {
                    skippedCount++;
                    log.debug("Brand '{}' already exists, skipping", brandData.getName());
                }
            } catch (Exception e) {
                log.warn("Failed to create brand '{}': {}", brandData.getName(), e.getMessage());
            }
        }
        
        log.info("Brands creation completed - Created: {}, Skipped: {}", createdCount, skippedCount);
    }
    
    /**
     * Create models for all brands in the map
     */
    private void createModelsForBrands(Map<String, List<ModelData>> brandModelMap) {
        log.info("Creating models for {} brands...", brandModelMap.size());
        
        for (Map.Entry<String, List<ModelData>> entry : brandModelMap.entrySet()) {
            String brandSlug = entry.getKey();
            List<ModelData> models = entry.getValue();
            
            try {
                createModelsForBrand(brandSlug, models);
                log.debug("Created {} models for brand {}", models.size(), brandSlug);
            } catch (Exception e) {
                log.warn("Failed to create models for brand '{}': {}", brandSlug, e.getMessage());
            }
        }
        
        log.info("Models creation completed");
    }
    
    /**
     * Get all brand definitions as a map for lookup
     */
    private Map<String, BrandData> getAllBrandDefinitions() {
        List<BrandData> brands = Arrays.asList(
            // Japanese/Korean brands
            new BrandData("toyota", "Toyota", "تويوتا"),
            new BrandData("honda", "Honda", "هوندا"),
            new BrandData("nissan", "Nissan", "نيسان"),
            new BrandData("mitsubishi", "Mitsubishi", "ميتسوبيشي"),
            new BrandData("hyundai", "Hyundai", "هيونداي"),
            new BrandData("kia", "Kia", "كيا"),
            new BrandData("mazda", "Mazda", "مازدا"),
            new BrandData("subaru", "Subaru", "سوبارو"),
            new BrandData("suzuki", "Suzuki", "سوزوكي"),
            new BrandData("isuzu", "Isuzu", "ايسوزو"),
            new BrandData("ssangyong", "SsangYong", "سانغ يونغ"),

            // European brands
            new BrandData("mercedes-benz", "Mercedes-Benz", "مرسيدس بنز"),
            new BrandData("bmw", "BMW", "بي إم دبليو"),
            new BrandData("audi", "Audi", "أودي"),
            new BrandData("volkswagen", "Volkswagen", "فولكس فاجن"),
            new BrandData("opel", "Opel", "أوبل"),
            new BrandData("fiat", "Fiat", "فيات"),
            new BrandData("renault", "Renault", "رينو"),
            new BrandData("peugeot", "Peugeot", "بيجو"),
            new BrandData("citroen", "Citroen", "سيتروين"),
            new BrandData("seat", "Seat", "سيات"),
            new BrandData("skoda", "Skoda", "سكودا"),
            new BrandData("volvo", "Volvo", "فولفو"),
            new BrandData("land-rover", "Land Rover", "لاند روفر"),
            new BrandData("jaguar", "Jaguar", "جاغوار"),
            new BrandData("porsche", "Porsche", "بورش"),
            new BrandData("mini", "Mini", "ميني"),

            // American brands
            new BrandData("chevrolet", "Chevrolet", "شيفروليه"),
            new BrandData("ford", "Ford", "فورد"),
            new BrandData("jeep", "Jeep", "جيب"),
            new BrandData("dodge", "Dodge", "دودج"),
            new BrandData("chrysler", "Chrysler", "كرايسلر"),
            new BrandData("gmc", "GMC", "جي إم سي")
        );
        
        return brands.stream().collect(Collectors.toMap(BrandData::getSlug, brand -> brand));
    }

    /**
     * Initialize car brands data with validation
     */
    private void initializeBrandsWithValidation(Set<String> allowedBrands) {
        log.info("Initializing car brands...");

        List<BrandData> brands = Arrays.asList(
            // Japanese/Korean brands
            new BrandData("toyota", "Toyota", "تويوتا"),
            new BrandData("honda", "Honda", "هوندا"),
            new BrandData("nissan", "Nissan", "نيسان"),
            new BrandData("mitsubishi", "Mitsubishi", "ميتسوبيشي"),
            new BrandData("hyundai", "Hyundai", "هيونداي"),
            new BrandData("kia", "Kia", "كيا"),
            new BrandData("mazda", "Mazda", "مازدا"),
            new BrandData("subaru", "Subaru", "سوبارو"),
            new BrandData("suzuki", "Suzuki", "سوزوكي"),
            new BrandData("isuzu", "Isuzu", "ايسوزو"),
            new BrandData("daewoo", "Daewoo", "ديو"),
            new BrandData("ssangyong", "SsangYong", "سانغ يونغ"),

            // European brands
            new BrandData("mercedes-benz", "Mercedes-Benz", "مرسيدس بنز"),
            new BrandData("bmw", "BMW", "بي إم دبليو"),
            new BrandData("audi", "Audi", "أودي"),
            new BrandData("volkswagen", "Volkswagen", "فولكس فاجن"),
            new BrandData("opel", "Opel", "أوبل"),
            new BrandData("fiat", "Fiat", "فيات"),
            new BrandData("renault", "Renault", "رينو"),
            new BrandData("peugeot", "Peugeot", "بيجو"),
            new BrandData("citroen", "Citroen", "سيتروين"),
            new BrandData("seat", "Seat", "سيات"),
            new BrandData("skoda", "Skoda", "سكودا"),
            new BrandData("volvo", "Volvo", "فولفو"),
            new BrandData("land-rover", "Land Rover", "لاند روفر"),
            new BrandData("jaguar", "Jaguar", "جاغوار"),
            new BrandData("porsche", "Porsche", "بورش"),
            new BrandData("mini", "Mini", "ميني"),

            // American brands
            new BrandData("chevrolet", "Chevrolet", "شيفروليه"),
            new BrandData("ford", "Ford", "فورد"),
            new BrandData("jeep", "Jeep", "جيب"),
            new BrandData("dodge", "Dodge", "دودج"),
            new BrandData("chrysler", "Chrysler", "كرايسلر"),
            new BrandData("gmc", "GMC", "جي إم سي"),
            new BrandData("cadillac", "Cadillac", "كاديلاك"),
            new BrandData("lincoln", "Lincoln", "لينكولن"),

            // Chinese brands
            new BrandData("geely", "Geely", "جيلي"),
            new BrandData("changan", "Changan", "شانجان"),
            new BrandData("byd", "BYD", "بي واي دي"),
            new BrandData("great-wall", "Great Wall", "غريت وول"),
            new BrandData("chery", "Chery", "شيري"),
            new BrandData("haval", "Haval", "هافال"),
            new BrandData("brilliance", "Brilliance", "بريليانس"),
            new BrandData("foton", "Foton", "فوتون"),
            new BrandData("dongfeng", "Dongfeng", "دونغفنغ"),
            new BrandData("jac", "JAC", "جاك"),

            // Iranian brands
            new BrandData("saipa", "Saipa", "سايبا"),
            new BrandData("ikco", "IKCO", "ايران خودرو"),
            new BrandData("iran-khodro", "Iran Khodro", "ايران خودرو"),
            new BrandData("pars-khodro", "Pars Khodro", "بارس خودرو"),

            // Russian/Ukrainian brands
            new BrandData("lada", "Lada", "لادا"),
            new BrandData("uaz", "UAZ", "يو أي زي"),
            new BrandData("gaz", "GAZ", "غاز"),
            new BrandData("zaz", "ZAZ", "زاز")
        );

        int createdCount = 0;
        int skippedCount = 0;

        for (BrandData brandData : brands) {
            try {
                CarBrand existingBrand = null;
                try {
                    existingBrand = carBrandService.getBrandBySlug(brandData.getSlug());
                } catch (Exception e) {
                    // Brand doesn't exist, which is fine
                }

                if (existingBrand == null) {
                    CarBrand brand = new CarBrand();
                    brand.setName(brandData.getName());
                    brand.setSlug(brandData.getSlug());
                    brand.setDisplayNameEn(brandData.getDisplayNameEn());
                    brand.setDisplayNameAr(brandData.getDisplayNameAr());
                    brand.setStatus(com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE);

                    carBrandService.createBrand(brand);
                    createdCount++;
                } else if (overrideExistingData) {
                    existingBrand.setDisplayNameEn(brandData.getDisplayNameEn());
                    existingBrand.setDisplayNameAr(brandData.getDisplayNameAr());
                    carBrandService.updateBrand(existingBrand.getId(), existingBrand);
                    log.debug("Updated existing brand: {}", brandData.getName());
                } else {
                    skippedCount++;
                }
            } catch (Exception e) {
                log.warn("Failed to create/update brand {}: {}", brandData.getName(), e.getMessage());
            }
        }

        log.info("Brands initialization completed - Created: {}, Skipped: {}", createdCount, skippedCount);
    }

    /**
     * Initialize car models data
     */
    private void initializeModels() {
        log.info("Initializing car models...");

        // Initialize models for major brands
        initializeToyotaModels();
        initializeHondaModels();
        initializeHyundaiModels();
        initializeKiaModels();
        initializeMercedesModels();
        initializeBmwModels();
        initializeVolkswagenModels();
        initializePeugeotModels();
        initializeChevroletModels();
        initializeJeepModels();
        initializeSubaruModels();
        initializeMazdaModels();
        initializeSsangYongModels();

        log.info("Models initialization completed");
    }

    private void initializeToyotaModels() {
        createModelsForBrand("toyota", Arrays.asList(
            new ModelData("corolla", "Corolla", "كورولا"),
            new ModelData("camry", "Camry", "كامري"),
            new ModelData("rav4", "RAV4", "راف فور"),
            new ModelData("land-cruiser", "Land Cruiser", "لاند كروزر"),
            new ModelData("prado", "Prado", "برادو"),
            new ModelData("yaris", "Yaris", "ياريس"),
            new ModelData("hilux", "Hilux", "هيلكس")
        ));
    }

    private void initializeHondaModels() {
        createModelsForBrand("honda", Arrays.asList(
            new ModelData("civic", "Civic", "سيفيك"),
            new ModelData("accord", "Accord", "أكورد"),
            new ModelData("crv", "CR-V", "سي آر في"),
            new ModelData("pilot", "Pilot", "بايلوت")
        ));
    }

    private void initializeHyundaiModels() {
        createModelsForBrand("hyundai", Arrays.asList(
            new ModelData("elantra", "Elantra", "إلنترا"),
            new ModelData("sonata", "Sonata", "سوناتا"),
            new ModelData("tucson", "Tucson", "توكسون"),
            new ModelData("santa-fe", "Santa Fe", "سانتا في"),
            new ModelData("i10", "i10", "آي 10")
        ));
    }

    private void initializeKiaModels() {
        createModelsForBrand("kia", Arrays.asList(
            new ModelData("rio", "Rio", "ريو"),
            new ModelData("sportage", "Sportage", "سبورتاج"),
            new ModelData("cerato", "Cerato", "سيراتو"),
            new ModelData("sorento", "Sorento", "سورنتو")
        ));
    }

    private void initializeMercedesModels() {
        createModelsForBrand("mercedes-benz", Arrays.asList(
            new ModelData("c-class", "C-Class", "الفئة سي"),
            new ModelData("e-class", "E-Class", "الفئة إي"),
            new ModelData("s-class", "S-Class", "الفئة إس"),
            new ModelData("ml-class", "ML-Class", "الفئة إم إل"),
            new ModelData("gle-class", "GLE-Class", "الفئة جي إل إي")
        ));
    }

    private void initializeBmwModels() {
        createModelsForBrand("bmw", Arrays.asList(
            new ModelData("3-series", "3 Series", "الفئة الثالثة"),
            new ModelData("5-series", "5 Series", "الفئة الخامسة"),
            new ModelData("7-series", "7 Series", "الفئة السابعة"),
            new ModelData("x3", "X3", "إكس 3"),
            new ModelData("x5", "X5", "إكس 5")
        ));
    }

    private void initializeVolkswagenModels() {
        createModelsForBrand("volkswagen", Arrays.asList(
            new ModelData("jetta", "Jetta", "جيتا"),
            new ModelData("polo", "Polo", "بولو"),
            new ModelData("golf", "Golf", "غولف"),
            new ModelData("passat", "Passat", "باسات"),
            new ModelData("tiguan", "Tiguan", "تيغوان")
        ));
    }

    private void initializePeugeotModels() {
        createModelsForBrand("peugeot", Arrays.asList(
            new ModelData("208", "208", "208"),
            new ModelData("301", "301", "301"),
            new ModelData("308", "308", "308"),
            new ModelData("2008", "2008", "2008"),
            new ModelData("3008", "3008", "3008")
        ));
    }

    private void initializeChevroletModels() {
        createModelsForBrand("chevrolet", Arrays.asList(
            new ModelData("cruze", "Cruze", "كروز"),
            new ModelData("malibu", "Malibu", "ماليبو"),
            new ModelData("spark", "Spark", "سبارك"),
            new ModelData("trailblazer", "Trailblazer", "ترايبليزر")
        ));
    }

    private void initializeJeepModels() {
        createModelsForBrand("jeep", Arrays.asList(
            new ModelData("grand-cherokee", "Grand Cherokee", "غراند شيروكي"),
            new ModelData("wrangler", "Wrangler", "رانغلر"),
            new ModelData("compass", "Compass", "كومباس")
        ));
    }

    private void initializeSubaruModels() {
        createModelsForBrand("subaru", Arrays.asList(
            new ModelData("forester", "Forester", "فوريستر"),
            new ModelData("outback", "Outback", "أوتباك"),
            new ModelData("impreza", "Impreza", "إمبريزا"),
            new ModelData("wrx", "WRX", "دبليو آر إكس"),
            new ModelData("wrx-sti", "WRX STI", "دبليو آر إكس إس تي آي"),
            new ModelData("legacy", "Legacy", "ليغاسي"),
            new ModelData("crosstrek", "Crosstrek", "كروس تريك"),
            new ModelData("xv", "XV", "إكس في")
        ));
    }

    private void initializeMazdaModels() {
        createModelsForBrand("mazda", Arrays.asList(
            new ModelData("3", "3", "3"),
            new ModelData("6", "6", "6"),
            new ModelData("cx-5", "CX-5", "سي إكس 5"),
            new ModelData("cx-9", "CX-9", "سي إكس 9"),
            new ModelData("mx-5", "MX-5", "إم إكس 5"),
            new ModelData("cx-3", "CX-3", "سي إكس 3"),
            new ModelData("cx-30", "CX-30", "سي إكس 30"),
            new ModelData("cx-50", "CX-50", "سي إكس 50")
        ));
    }

    private void initializeSsangYongModels() {
        createModelsForBrand("ssangyong", Arrays.asList(
            new ModelData("tivoli", "Tivoli", "تيفولي"),
            new ModelData("korando", "Korando", "كوراندو"),
            new ModelData("rexton", "Rexton", "ريكستون"),
            new ModelData("musso", "Musso", "موسو"),
            new ModelData("actyon", "Actyon", "أكتيون"),
            new ModelData("kyron", "Kyron", "كايرون")
        ));
    }

    /**
     * Helper method to create models for a specific brand
     */
    private void createModelsForBrand(String brandSlug, List<ModelData> models) {
        try {
            CarBrand brand = carBrandService.getBrandBySlug(brandSlug);
            int createdCount = 0;

            for (ModelData modelData : models) {
                try {
                    CarModel model = new CarModel();
                    model.setBrand(brand);
                    model.setName(modelData.getName());
                    model.setSlug(modelData.getSlug());
                    model.setDisplayNameEn(modelData.getDisplayNameEn());
                    model.setDisplayNameAr(modelData.getDisplayNameAr());
                    model.setStatus(com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE);

                    carModelService.createModel(model);
                    createdCount++;
                } catch (Exception e) {
                    log.debug("Model {} already exists for brand {}", modelData.getName(), brandSlug);
                }
            }

            if (createdCount > 0) {
                log.debug("Created {} models for brand {}", createdCount, brandSlug);
            }
        } catch (Exception e) {
            log.warn("Failed to initialize models for brand {}: {}", brandSlug, e.getMessage());
        }
    }

    /**
     * Data class for brand information
     */
    private static class BrandData {
        private final String name;
        private final String slug;
        private final String displayNameEn;
        private final String displayNameAr;

        public BrandData(String name, String displayNameEn, String displayNameAr) {
            this.name = name;
            this.slug = name.toLowerCase().replace(" ", "-");
            this.displayNameEn = displayNameEn;
            this.displayNameAr = displayNameAr;
        }

        // Getters
        public String getName() { return name; }
        public String getSlug() { return slug; }
        public String getDisplayNameEn() { return displayNameEn; }
        public String getDisplayNameAr() { return displayNameAr; }
    }

    /**
     * Data class for model information
     */
    private static class ModelData {
        private final String name;
        private final String slug;
        private final String displayNameEn;
        private final String displayNameAr;

        public ModelData(String name, String displayNameEn, String displayNameAr) {
            this.name = name;
            this.slug = name.toLowerCase().replace(" ", "-");
            this.displayNameEn = displayNameEn;
            this.displayNameAr = displayNameAr;
        }

        // Getters
        public String getName() { return name; }
        public String getSlug() { return slug; }
        public String getDisplayNameEn() { return displayNameEn; }
        public String getDisplayNameAr() { return displayNameAr; }
    }
}

