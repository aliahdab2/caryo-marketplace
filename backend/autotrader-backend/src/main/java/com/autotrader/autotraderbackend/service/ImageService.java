package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import com.autotrader.autotraderbackend.util.FileValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImageService {
    private final FileValidator fileValidator;
    private final StorageService storageService;

    public String uploadImage(MultipartFile file, String prefix) {
        fileValidator.validateImageFile(file);

        String fileName = generateUniqueFileName(file);
        String key = String.format("%s/%s", prefix, fileName);

        try {
            storageService.store(file, key);
            log.info("Successfully uploaded image with key: {}", key);
            return key;
        } catch (StorageException e) {
            log.error("Failed to upload image: {}", e.getMessage());
            throw new StorageException("Failed to upload image", e);
        }
    }

    private String generateUniqueFileName(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            return UUID.randomUUID().toString() + 
                   originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + fileValidator.getFileExtension(Objects.requireNonNull(file.getContentType()));
    }

    public void deleteImage(String imageKey) {
        if (imageKey == null || imageKey.trim().isEmpty()) {
            return;
        }

        try {
            storageService.delete(imageKey);
            log.info("Successfully deleted image with key: {}", imageKey);
        } catch (StorageException e) {
            log.error("Failed to delete image {}: {}", imageKey, e.getMessage());
            throw new StorageException("Failed to delete image", e);
        }
    }
}
