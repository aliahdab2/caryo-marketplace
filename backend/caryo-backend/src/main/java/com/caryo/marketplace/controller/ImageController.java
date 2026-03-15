package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.StorageException;
import com.caryo.marketplace.service.PublicUploadRateLimitService;
import com.caryo.marketplace.service.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for handling public image uploads (e.g., during signup).
 * Uses S3/MinIO storage for consistency with other file uploads.
 * 
 * Security measures:
 * - Rate limiting by IP address (10 uploads per hour)
 * - File type validation (images only)
 * - File size validation (5MB max)
 */
@RestController
@RequestMapping("/api/images")
@Tag(name = "Images", description = "Public image upload and retrieval (rate-limited)")
public class ImageController {

    private static final Logger logger = LoggerFactory.getLogger(ImageController.class);
    
    private final StorageService storageService;
    private final PublicUploadRateLimitService rateLimitService;

    public ImageController(StorageService storageService, PublicUploadRateLimitService rateLimitService) {
        this.storageService = storageService;
        this.rateLimitService = rateLimitService;
    }

    /**
     * Upload an image (public endpoint for signup flow).
     * Rate limited to 10 uploads per hour per IP address.
     * Stores to S3/MinIO in the "temp" folder by default. Files are moved to
     * their permanent location (e.g., dealers/logos) after account creation.
     *
     * @param file The image file to upload
     * @param folder Optional folder path (default: "temp")
     * @param request HTTP request to get client IP
     * @return A map containing the fileName and fileDownloadUri
     */
    @PostMapping("/upload")
    @Operation(
        summary = "Upload an image (public, rate-limited)",
        description = "Uploads an image file and returns its download URI. Rate limited to 10 uploads per hour per IP. Used for signup flow.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Image uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid file or unsupported type"),
            @ApiResponse(responseCode = "429", description = "Rate limit exceeded")
        }
    )
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "temp") String folder,
            HttpServletRequest request) {
        
        // Get client IP address
        String clientIp = getClientIp(request);
        
        // Check rate limit
        if (!rateLimitService.canUpload(clientIp)) {
            logger.warn("Rate limit exceeded for public image upload from IP: {}", clientIp);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Rate limit exceeded. Please try again later.");
            errorResponse.put("remainingUploads", "0");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        }
        
        logger.info("Received public image upload request: {}, size: {}, IP: {}", 
                file.getOriginalFilename(), file.getSize(), clientIp);

        if (file.isEmpty()) {
            throw new StorageException("Failed to store empty file");
        }

        // Validate file type (images only)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new StorageException("Only image files are allowed. Received: " + contentType);
        }

        // Validate file size (max 5MB for public uploads)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new StorageException("File size exceeds maximum allowed (5MB)");
        }

        // Generate unique filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image");
        
        if (originalFilename.contains("..")) {
            throw new StorageException("Filename contains invalid path sequence");
        }

        String fileExtension = "";
        if (originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Sanitize folder path
        String sanitizedFolder = folder.replaceAll("[^a-zA-Z0-9/_-]", "");
        String key = sanitizedFolder + "/" + UUID.randomUUID().toString() + fileExtension;

        // Store to S3/MinIO
        storageService.store(file, key);
        
        // Record upload for rate limiting
        rateLimitService.recordUpload(clientIp);
        
        logger.info("Image stored with key: {}. Remaining uploads for IP: {}", 
                key, rateLimitService.getRemainingUploads(clientIp));

        // Build the download URI
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/")
                .path(key)
                .toUriString();

        Map<String, String> response = new HashMap<>();
        response.put("fileName", key);
        response.put("fileDownloadUri", fileDownloadUri);
        response.put("key", key);
        response.put("remainingUploads", String.valueOf(rateLimitService.getRemainingUploads(clientIp)));

        return ResponseEntity.ok(response);
    }

    /**
     * Get an image by key.
     * Delegates to the files endpoint for consistency.
     *
     * @param key The storage key of the image (can include path separators as %2F)
     * @return The image resource
     */
    @GetMapping("/{key:.+}")
    @Operation(
        summary = "Get an image by key",
        description = "Downloads an image by its storage key.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Image downloaded successfully"),
            @ApiResponse(responseCode = "404", description = "Image not found")
        }
    )
    public ResponseEntity<Resource> getImage(@PathVariable String key) {
        logger.info("Received image download request for key: {}", key);
        
        Resource resource = storageService.loadAsResource(key);
        
        // Determine content type
        String contentType = "application/octet-stream";
        String lowerKey = key.toLowerCase();
        if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (lowerKey.endsWith(".png")) {
            contentType = "image/png";
        } else if (lowerKey.endsWith(".gif")) {
            contentType = "image/gif";
        } else if (lowerKey.endsWith(".webp")) {
            contentType = "image/webp";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
    
    /**
     * Extract client IP address from request, handling proxies.
     */
    private String getClientIp(HttpServletRequest request) {
        // Check for forwarded headers (when behind proxy/load balancer)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs; take the first (client)
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
