package com.autotrader.autotraderbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Service for generating Imgproxy URLs for image transformations.
 * Imgproxy is an industry-standard, high-performance image processing service.
 * 
 * @see <a href="https://docs.imgproxy.net/">Imgproxy Documentation</a>
 */
@Service
@Slf4j
public class ImgproxyService {

    @Value("${imgproxy.url:http://localhost:8081}")
    private String imgproxyUrl;

    @Value("${imgproxy.key:736563757265}")
    private String key;

    @Value("${imgproxy.salt:73616c74}")
    private String salt;

    @Value("${imgproxy.bucket:caryo-assets}")
    private String bucket;

    // Preset sizes for common use cases
    public static final String SIZE_ORIGINAL = "1920";
    public static final String SIZE_LARGE = "1200";
    public static final String SIZE_MEDIUM = "800";
    public static final String SIZE_SMALL = "400";
    public static final String SIZE_THUMBNAIL = "200";
    public static final String SIZE_BLUR = "10";

    /**
     * Generate an Imgproxy URL for an image with specific dimensions.
     * 
     * @param s3Key The S3/MinIO object key (e.g., "listings/123/image.jpg")
     * @param width Target width
     * @param height Target height (0 for auto)
     * @return Signed Imgproxy URL
     */
    public String getResizedUrl(String s3Key, int width, int height) {
        String processingOptions = String.format("rs:fit:%d:%d", width, height);
        return generateUrl(s3Key, processingOptions);
    }

    /**
     * Generate URL for a specific preset size.
     * 
     * @param s3Key The S3/MinIO object key
     * @param size One of: original, large, medium, small, thumbnail
     * @return Signed Imgproxy URL
     */
    public String getPresetUrl(String s3Key, String size) {
        int width = switch (size.toLowerCase()) {
            case "original" -> 1920;
            case "large" -> 1200;
            case "medium" -> 800;
            case "small" -> 400;
            case "thumbnail" -> 200;
            default -> 800;
        };
        return getResizedUrl(s3Key, width, 0);
    }

    /**
     * Generate a base64 blur placeholder URL (LQIP).
     * Returns a tiny 10x10 image for use as blur placeholder.
     * 
     * @param s3Key The S3/MinIO object key
     * @return Signed Imgproxy URL for blur placeholder
     */
    public String getBlurPlaceholderUrl(String s3Key) {
        // rs:fit:10:10/bl:5 = resize to 10px and apply blur
        String processingOptions = "rs:fit:10:10/bl:5/q:50";
        return generateUrl(s3Key, processingOptions);
    }

    /**
     * Generate a WebP optimized URL.
     * 
     * @param s3Key The S3/MinIO object key
     * @param width Target width
     * @return Signed Imgproxy URL with WebP format
     */
    public String getWebpUrl(String s3Key, int width) {
        String processingOptions = String.format("rs:fit:%d:0/f:webp", width);
        return generateUrl(s3Key, processingOptions);
    }

    /**
     * Generate URL with custom processing options.
     * 
     * @param s3Key The S3/MinIO object key
     * @param processingOptions Imgproxy processing string (e.g., "rs:fit:800:600/bl:5")
     * @return Signed Imgproxy URL
     * 
     * @see <a href="https://docs.imgproxy.net/generating_the_url">Imgproxy URL Format</a>
     */
    public String generateUrl(String s3Key, String processingOptions) {
        // Source URL format for S3: s3://bucket/key
        String sourceUrl = String.format("s3://%s/%s", bucket, s3Key);
        String encodedSource = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(sourceUrl.getBytes(StandardCharsets.UTF_8));

        // Path: /processing_options/encoded_source
        String path = String.format("/%s/%s", processingOptions, encodedSource);

        // Generate signature
        String signature = generateSignature(path);

        return String.format("%s/%s%s", imgproxyUrl, signature, path);
    }

    /**
     * Generate HMAC-SHA256 signature for Imgproxy URL.
     */
    private String generateSignature(String path) {
        try {
            byte[] keyBytes = hexStringToByteArray(key);
            byte[] saltBytes = hexStringToByteArray(salt);

            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
            hmac.init(secretKey);
            hmac.update(saltBytes);
            byte[] hash = hmac.doFinal(path.getBytes(StandardCharsets.UTF_8));

            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to generate Imgproxy signature", e);
            // Return unsigned URL (works if IMGPROXY_KEY is not set)
            return "insecure";
        }
    }

    /**
     * Convert hex string to byte array.
     */
    private byte[] hexStringToByteArray(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }

    /**
     * Check if Imgproxy is enabled and configured.
     */
    public boolean isEnabled() {
        return imgproxyUrl != null && !imgproxyUrl.isBlank();
    }

    /**
     * Get image dimensions and other info (using Imgproxy info endpoint).
     * 
     * @param s3Key The S3/MinIO object key
     * @return Imgproxy info URL
     */
    public String getInfoUrl(String s3Key) {
        String sourceUrl = String.format("s3://%s/%s", bucket, s3Key);
        String encodedSource = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(sourceUrl.getBytes(StandardCharsets.UTF_8));
        String path = "/info/" + encodedSource;
        String signature = generateSignature(path);
        return String.format("%s/%s%s", imgproxyUrl, signature, path);
    }
}
