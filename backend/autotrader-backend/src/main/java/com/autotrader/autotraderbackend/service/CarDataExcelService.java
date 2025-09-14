package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for handling Excel export and import operations for car data
 * Supports bilingual data (English and Arabic) with data integrity validation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarDataExcelService {

    private final CarBrandService carBrandService;
    private final CarModelService carModelService;

    // Excel column headers
    private static final String[] BRAND_HEADERS = {
        "ID", "Name (English)", "Name (Arabic)", "Slug", "Country of Origin", "Is Active", "Created At", "Updated At"
    };
    
    private static final String[] MODEL_HEADERS = {
        "ID", "Brand ID", "Brand Name (English)", "Brand Name (Arabic)", 
        "Model Name (English)", "Model Name (Arabic)", "Slug", "Year Start", "Year End", "Is Active", "Created At", "Updated At"
    };

    /**
     * Export all car brands and models to Excel format
     * @return Excel file as byte array
     * @throws IOException if Excel generation fails
     */
    public byte[] exportCarDataToExcel() throws IOException {
        log.info("Starting car data export to Excel");
        
        try (Workbook workbook = new XSSFWorkbook()) {
            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle booleanStyle = createBooleanStyle(workbook);
            
            // Create brands sheet
            createBrandsSheet(workbook, headerStyle, dateStyle, booleanStyle);
            
            // Create models sheet
            createModelsSheet(workbook, headerStyle, dateStyle, booleanStyle);
            
            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            
            log.info("Successfully exported car data to Excel");
            return outputStream.toByteArray();
            
        } catch (Exception e) {
            log.error("Error exporting car data to Excel", e);
            throw new IOException("Failed to export car data to Excel: " + e.getMessage(), e);
        }
    }

    /**
     * Import car data from Excel file
     * @param file Excel file to import
     * @return Import result with statistics
     * @throws IOException if file processing fails
     */
    @Transactional
    public ExcelImportResult importCarDataFromExcel(MultipartFile file) throws IOException {
        log.info("Starting car data import from Excel file: {}", file.getOriginalFilename());
        
        ExcelImportResult result = new ExcelImportResult();
        
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {
            
            // Import brands first
            if (workbook.getNumberOfSheets() > 0) {
                Sheet brandsSheet = workbook.getSheetAt(0);
                ImportSheetResult brandResult = importBrandsFromSheet(brandsSheet);
                result.setBrandsResult(brandResult);
            }
            
            // Import models second
            if (workbook.getNumberOfSheets() > 1) {
                Sheet modelsSheet = workbook.getSheetAt(1);
                ImportSheetResult modelResult = importModelsFromSheet(modelsSheet);
                result.setModelsResult(modelResult);
            }
            
            log.info("Successfully imported car data from Excel. Brands: {} created, {} updated, {} errors. Models: {} created, {} updated, {} errors",
                    result.getBrandsResult().getCreated(), result.getBrandsResult().getUpdated(), result.getBrandsResult().getErrors().size(),
                    result.getModelsResult().getCreated(), result.getModelsResult().getUpdated(), result.getModelsResult().getErrors().size());
            
            return result;
            
        } catch (Exception e) {
            log.error("Error importing car data from Excel", e);
            throw new IOException("Failed to import car data from Excel: " + e.getMessage(), e);
        }
    }

    /**
     * Create brands sheet in the workbook
     */
    private void createBrandsSheet(Workbook workbook, CellStyle headerStyle, CellStyle dateStyle, CellStyle booleanStyle) {
        Sheet sheet = workbook.createSheet("Car Brands");
        
        // Create header row
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < BRAND_HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(BRAND_HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Get all brands
        List<CarBrand> brands = carBrandService.getAllBrands();
        
        // Create data rows
        int rowNum = 1;
        for (CarBrand brand : brands) {
            Row row = sheet.createRow(rowNum++);
            
            row.createCell(0).setCellValue(brand.getId() != null ? brand.getId() : 0);
            row.createCell(1).setCellValue(brand.getDisplayNameEn() != null ? brand.getDisplayNameEn() : "");
            row.createCell(2).setCellValue(brand.getDisplayNameAr() != null ? brand.getDisplayNameAr() : "");
            row.createCell(3).setCellValue(brand.getSlug() != null ? brand.getSlug() : "");
            row.createCell(4).setCellValue(""); // Country of origin - not in current model
            
            Cell activeCell = row.createCell(5);
            activeCell.setCellValue(brand.getStatus() != null ? (brand.getStatus() == com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE) : true);
            activeCell.setCellStyle(booleanStyle);
            
            // Date cells would need actual timestamps from your model
            row.createCell(6).setCellValue(""); // Created at
            row.createCell(7).setCellValue(""); // Updated at
        }
        
        // Auto-size columns
        for (int i = 0; i < BRAND_HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
        }
        
        log.debug("Created brands sheet with {} brands", brands.size());
    }

    /**
     * Create models sheet in the workbook
     */
    private void createModelsSheet(Workbook workbook, CellStyle headerStyle, CellStyle dateStyle, CellStyle booleanStyle) {
        Sheet sheet = workbook.createSheet("Car Models");
        
        // Create header row
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < MODEL_HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(MODEL_HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Get all models
        List<CarModel> models = carModelService.getAllModels();
        
        // Create data rows
        int rowNum = 1;
        for (CarModel model : models) {
            Row row = sheet.createRow(rowNum++);
            
            row.createCell(0).setCellValue(model.getId() != null ? model.getId() : 0);
            row.createCell(1).setCellValue(model.getBrand() != null && model.getBrand().getId() != null ? model.getBrand().getId() : 0);
            row.createCell(2).setCellValue(model.getBrand() != null ? model.getBrand().getDisplayNameEn() : "");
            row.createCell(3).setCellValue(model.getBrand() != null ? model.getBrand().getDisplayNameAr() : "");
            row.createCell(4).setCellValue(model.getDisplayNameEn() != null ? model.getDisplayNameEn() : "");
            row.createCell(5).setCellValue(model.getDisplayNameAr() != null ? model.getDisplayNameAr() : "");
            row.createCell(6).setCellValue(model.getSlug() != null ? model.getSlug() : "");
            row.createCell(7).setCellValue(""); // Year start - not in current model
            row.createCell(8).setCellValue(""); // Year end - not in current model
            
            Cell activeCell = row.createCell(9);
            activeCell.setCellValue(model.getStatus() != null ? (model.getStatus() == com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE) : true);
            activeCell.setCellStyle(booleanStyle);
            
            row.createCell(10).setCellValue(""); // Created at
            row.createCell(11).setCellValue(""); // Updated at
        }
        
        // Auto-size columns
        for (int i = 0; i < MODEL_HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
        }
        
        log.debug("Created models sheet with {} models", models.size());
    }

    /**
     * Import brands from Excel sheet
     */
    private ImportSheetResult importBrandsFromSheet(Sheet sheet) {
        ImportSheetResult result = new ImportSheetResult();
        
        // Skip header row
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            
            try {
                // Extract brand data from row
                Long id = getCellValueAsLong(row.getCell(0));
                String nameEn = getCellValueAsString(row.getCell(1));
                String nameAr = getCellValueAsString(row.getCell(2));
                String slug = getCellValueAsString(row.getCell(3));
                Boolean isActive = getCellValueAsBoolean(row.getCell(5));
                
                // Validate required fields
                if (nameEn == null || nameEn.trim().isEmpty()) {
                    result.addError(i, "English name is required");
                    continue;
                }
                
                if (nameAr == null || nameAr.trim().isEmpty()) {
                    result.addError(i, "Arabic name is required");
                    continue;
                }
                
                if (slug == null || slug.trim().isEmpty()) {
                    slug = nameEn.toLowerCase().replaceAll("[^a-z0-9-]", "-");
                }
                
                // Check if brand exists (update) or create new
                CarBrand brand;
                boolean isUpdate = false;
                
                if (id != null && id > 0) {
                    try {
                        brand = carBrandService.getBrandById(id);
                        isUpdate = true;
                    } catch (Exception e) {
                        // Brand with ID doesn't exist, create new
                        brand = new CarBrand();
                    }
                } else {
                    // Check if brand exists by slug
                    try {
                        brand = carBrandService.getBrandBySlug(slug);
                        isUpdate = true;
                    } catch (Exception e) {
                        // Brand doesn't exist, create new
                        brand = new CarBrand();
                    }
                }
                
                // Set brand properties
                brand.setName(nameEn);
                brand.setDisplayNameEn(nameEn);
                brand.setDisplayNameAr(nameAr);
                brand.setSlug(slug);
                brand.setStatus((isActive != null && isActive) ? com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE : com.autotrader.autotraderbackend.model.ModelStatus.INACTIVE);
                
                // Save brand
                if (isUpdate) {
                    carBrandService.updateBrand(brand.getId(), brand);
                    result.incrementUpdated();
                } else {
                    carBrandService.createBrand(brand);
                    result.incrementCreated();
                }
                
            } catch (Exception e) {
                result.addError(i, "Error processing brand: " + e.getMessage());
                log.warn("Error processing brand at row {}: {}", i, e.getMessage());
            }
        }
        
        return result;
    }

    /**
     * Import models from Excel sheet
     */
    private ImportSheetResult importModelsFromSheet(Sheet sheet) {
        ImportSheetResult result = new ImportSheetResult();
        
        // Skip header row
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            
            try {
                // Extract model data from row
                Long id = getCellValueAsLong(row.getCell(0));
                Long brandId = getCellValueAsLong(row.getCell(1));
                String modelNameEn = getCellValueAsString(row.getCell(4));
                String modelNameAr = getCellValueAsString(row.getCell(5));
                String slug = getCellValueAsString(row.getCell(6));
                Boolean isActive = getCellValueAsBoolean(row.getCell(9));
                
                // Validate required fields
                if (brandId == null || brandId <= 0) {
                    result.addError(i, "Brand ID is required");
                    continue;
                }
                
                if (modelNameEn == null || modelNameEn.trim().isEmpty()) {
                    result.addError(i, "English model name is required");
                    continue;
                }
                
                if (modelNameAr == null || modelNameAr.trim().isEmpty()) {
                    result.addError(i, "Arabic model name is required");
                    continue;
                }
                
                // Get brand
                CarBrand brand;
                try {
                    brand = carBrandService.getBrandById(brandId);
                } catch (Exception e) {
                    result.addError(i, "Brand with ID " + brandId + " not found");
                    continue;
                }
                
                if (slug == null || slug.trim().isEmpty()) {
                    slug = (brand.getName() + "-" + modelNameEn).toLowerCase().replaceAll("[^a-z0-9-]", "-");
                }
                
                // Check if model exists (update) or create new
                CarModel model;
                boolean isUpdate = false;
                
                if (id != null && id > 0) {
                    try {
                        model = carModelService.getModelById(id);
                        isUpdate = true;
                    } catch (Exception e) {
                        // Model with ID doesn't exist, create new
                        model = new CarModel();
                    }
                } else {
                    // Check if model exists by slug
                    try {
                        model = carModelService.getModelBySlug(slug);
                        isUpdate = true;
                    } catch (Exception e) {
                        // Model doesn't exist, create new
                        model = new CarModel();
                    }
                }
                
                // Set model properties
                model.setName(modelNameEn);
                model.setDisplayNameEn(modelNameEn);
                model.setDisplayNameAr(modelNameAr);
                model.setSlug(slug);
                model.setBrand(brand);
                model.setStatus((isActive != null && isActive) ? com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE : com.autotrader.autotraderbackend.model.ModelStatus.INACTIVE);
                
                // Save model
                if (isUpdate) {
                    carModelService.updateModel(model.getId(), model);
                    result.incrementUpdated();
                } else {
                    carModelService.createModel(model);
                    result.incrementCreated();
                }
                
            } catch (Exception e) {
                result.addError(i, "Error processing model: " + e.getMessage());
                log.warn("Error processing model at row {}: {}", i, e.getMessage());
            }
        }
        
        return result;
    }

    // Helper methods for cell value extraction
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }
    
    private Long getCellValueAsLong(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case NUMERIC:
                return (long) cell.getNumericCellValue();
            case STRING:
                try {
                    return Long.parseLong(cell.getStringCellValue().trim());
                } catch (NumberFormatException e) {
                    return null;
                }
            default:
                return null;
        }
    }
    
    private Boolean getCellValueAsBoolean(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case STRING:
                String value = cell.getStringCellValue().trim().toLowerCase();
                return "true".equals(value) || "yes".equals(value) || "1".equals(value);
            case NUMERIC:
                return cell.getNumericCellValue() != 0;
            default:
                return null;
        }
    }

    // Style creation methods
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }
    
    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd hh:mm:ss"));
        return style;
    }
    
    private CellStyle createBooleanStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    // Result classes
    public static class ExcelImportResult {
        private ImportSheetResult brandsResult = new ImportSheetResult();
        private ImportSheetResult modelsResult = new ImportSheetResult();
        
        public ImportSheetResult getBrandsResult() { return brandsResult; }
        public void setBrandsResult(ImportSheetResult brandsResult) { this.brandsResult = brandsResult; }
        public ImportSheetResult getModelsResult() { return modelsResult; }
        public void setModelsResult(ImportSheetResult modelsResult) { this.modelsResult = modelsResult; }
        
        public boolean isSuccess() {
            return brandsResult.getErrors().isEmpty() && modelsResult.getErrors().isEmpty();
        }
        
        public String getSummary() {
            return String.format("Brands: %d created, %d updated, %d errors. Models: %d created, %d updated, %d errors.",
                    brandsResult.getCreated(), brandsResult.getUpdated(), brandsResult.getErrors().size(),
                    modelsResult.getCreated(), modelsResult.getUpdated(), modelsResult.getErrors().size());
        }
    }
    
    public static class ImportSheetResult {
        private int created = 0;
        private int updated = 0;
        private Map<Integer, String> errors = new HashMap<>();
        
        public int getCreated() { return created; }
        public void incrementCreated() { this.created++; }
        public int getUpdated() { return updated; }
        public void incrementUpdated() { this.updated++; }
        public Map<Integer, String> getErrors() { return errors; }
        public void addError(int row, String error) { this.errors.put(row, error); }
    }
}
