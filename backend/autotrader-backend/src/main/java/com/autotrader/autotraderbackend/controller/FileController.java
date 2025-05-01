package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for handling file operations including upload, download, and managing files.
 */
@RestController
@RequestMapping("/api/files")
public class FileController {
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    private final StorageService storageService;

    public FileController(StorageService storageService) {
        this.storageService = storageService;
    }

    /**
     * Upload a file for a car listing.
     * Requires authentication.
     * 
     * @param file The file to upload
     * @param listingId The ID of the car listing (optional)
     * @return A map containing the file URL and key
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "listingId", required = false) Long listingId) {
        
        logger.info("Received file upload request: {}, size: {}, listingId: {}", 
                file.getOriginalFilename(), file.getSize(), listingId);
        
        if (file.isEmpty()) {
            throw new StorageException("Failed to store empty file");
        }
        
        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedFileType(contentType)) {
            throw new StorageException("Unsupported file type: " + contentType);
        }
        
        // Generate a unique key for the file
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        // Create a path based on listing ID (if provided) or a generic "uploads" folder
        String path = listingId != null ? "listings/" + listingId : "uploads";
        String key = path + "/" + UUID.randomUUID().toString() + fileExtension;
        
        // Store the file
        String url = storageService.store(file, key);
        logger.info("File stored with key: {}, URL: {}", key, url);
        
        // Return the URL and key
        Map<String, String> result = new HashMap<>();
        result.put("url", url);
        result.put("key", key);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Download a file by its key.
     * 
     * @param key The key of the file to download
     * @return The file as a resource
     */
    @GetMapping("/{key}")
    public ResponseEntity<Resource> getFile(@PathVariable String key) {
        logger.info("Received file download request for key: {}", key);
        Resource resource = storageService.loadAsResource(key);
        
        // Try to determine content type
        String contentType = "application/octet-stream";
        String filename = resource.getFilename();
        if (filename != null && filename.contains(".")) {
            String extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();
            if (extension.equals(".jpg") || extension.equals(".jpeg")) {
                contentType = "image/jpeg";
            } else if (extension.equals(".png")) {
                contentType = "image/png";
            } else if (extension.equals(".pdf")) {
                contentType = "application/pdf";
            }
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
    
    /**
     * Get a signed URL for a file.
     * This is useful for private/sensitive files that need temporary access.
     * 
     * @param key The key of the file
     * @param expiration The expiration time in seconds
     * @return A map containing the signed URL
     */
    @GetMapping("/signed")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> getSignedUrl(
            @RequestParam("key") String key,
            @RequestParam(value = "expiration", defaultValue = "3600") long expiration) {
        
        logger.info("Generating signed URL for key: {} with expiration: {}", key, expiration);
        String signedUrl = storageService.getSignedUrl(key, expiration);
        
        Map<String, String> result = new HashMap<>();
        result.put("url", signedUrl);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Delete a file.
     * Requires admin role.
     * 
     * @param key The key of the file to delete
     * @return A map containing a success message
     */
    @DeleteMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteFile(@PathVariable String key) {
        logger.info("Received file deletion request for key: {}", key);
        boolean deleted = storageService.delete(key);
        
        Map<String, String> result = new HashMap<>();
        if (deleted) {
            result.put("message", "File deleted successfully");
            logger.info("File deleted successfully: {}", key);
        } else {
            result.put("message", "File not found or could not be deleted");
            logger.warn("File not found or could not be deleted: {}", key);
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Check if the file type is allowed.
     * 
     * @param contentType The content type of the file
     * @return true if the file type is allowed, false otherwise
     */
    private boolean isAllowedFileType(String contentType) {
        List<String> allowedTypes = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp", 
            "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        return allowedTypes.contains(contentType);
    }
}
