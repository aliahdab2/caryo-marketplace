package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.InvalidFileException;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

@Service
@Slf4j
public class FileValidationService {
    private final Tika tika = new Tika();
    
    @Value("${app.upload.max-file-size:5242880}") // 5MB default
    private long maxFileSize;
    
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    );

    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File is empty");
        }

        // Check file size
        if (file.getSize() > maxFileSize) {
            throw new InvalidFileException(
                String.format("File size exceeds maximum limit of %d bytes", maxFileSize)
            );
        }

        try {
            // Detect content type using Tika
            String detectedType = tika.detect(file.getInputStream());
            if (!ALLOWED_CONTENT_TYPES.contains(detectedType)) {
                throw new InvalidFileException(
                    String.format("File type %s is not allowed. Allowed types: %s",
                        detectedType, ALLOWED_CONTENT_TYPES)
                );
            }
        } catch (IOException e) {
            log.error("Error validating file: {}", e.getMessage());
            throw new InvalidFileException("Could not validate file type");
        }
    }
}
