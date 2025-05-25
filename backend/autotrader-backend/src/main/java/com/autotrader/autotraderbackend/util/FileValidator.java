package com.autotrader.autotraderbackend.util;

import com.autotrader.autotraderbackend.exception.InvalidFileException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Objects;
import java.util.Set;

@Service
@Slf4j
public class FileValidator {
    private static final Tika tika = new Tika();
    private static final Set<String> DEFAULT_MIME_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    );
    
    protected final Set<String> allowedTypes;
    protected final long maxFileSize;

    public FileValidator(
            @Value("${app.upload.allowed-types:image/jpeg,image/png,image/gif,image/webp}") String allowedTypes,
            @Value("${app.upload.max-file-size:10485760}") long maxFileSize) {
        this.allowedTypes = StringUtils.isNotBlank(allowedTypes) ? Set.of(allowedTypes.split(",")) : DEFAULT_MIME_TYPES;
        this.maxFileSize = maxFileSize;
    }

    public void validateImageFile(MultipartFile file) {
        if (Objects.isNull(file) || file.isEmpty()) {
            throw new InvalidFileException("File is empty");
        }

        // Check file size
        if (file.getSize() > maxFileSize) {
            throw new InvalidFileException(
                String.format("File size exceeds maximum limit of %d bytes", maxFileSize)
            );
        }

        try {
            String detectedType = tika.detect(file.getInputStream());
            if (!allowedTypes.contains(detectedType)) {
                throw new InvalidFileException(
                    String.format("File type %s is not allowed. Allowed types: %s",
                        detectedType, allowedTypes)
                );
            }
        } catch (IOException e) {
            log.error("Error validating file: {}", e.getMessage());
            throw new InvalidFileException("Could not validate file type", e);
        }
    }

    public String getFileExtension(String mimeType) {
        if (StringUtils.isBlank(mimeType)) {
            throw new InvalidFileException("Mime type cannot be blank");
        }
        return switch (mimeType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> throw new InvalidFileException("Unsupported mime type: " + mimeType);
        };
    }
}
