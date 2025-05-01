package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.stream.Stream;

/**
 * Implementation of StorageService that uses the local file system for storage.
 */
@Service
@Slf4j // Add Lombok annotation for logging
public class LocalStorageService implements StorageService {

    private final Path rootLocation;
    private final String baseUrl;

    /**
     * Constructor that accepts StorageProperties for the new configuration
     */
    public LocalStorageService(StorageProperties properties) {
        // Use properties.getLocation() and properties.getBaseUrl()
        this.rootLocation = Paths.get(properties.getLocation());
        this.baseUrl = properties.getBaseUrl();
        log.info("LocalStorageService initialized. Root location: {}, Base URL: {}", this.rootLocation, this.baseUrl);
    }

    @Override
    public void init() {
        try {
            Files.createDirectories(rootLocation);
            log.info("Initialized local storage directory: {}", rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize local storage location {}: {}", rootLocation, e.getMessage(), e);
            throw new StorageException("Could not initialize storage", e);
        }
    }

    @Override
    public String store(MultipartFile file, String key) {
        try {
            if (file.isEmpty()) {
                log.warn("Attempted to store empty file with key: {}", key);
                throw new StorageException("Failed to store empty file.");
            }
            
            Path destinationFile = this.rootLocation.resolve(Paths.get(key))
                    .normalize().toAbsolutePath();
            
            // Ensure the destination is within our storage root to prevent path traversal attacks
            if (!destinationFile.getParent().startsWith(this.rootLocation.toAbsolutePath())) {
                // Security check
                log.error("Cannot store file outside current storage directory. Attempted path: {}", destinationFile);
                throw new StorageException("Cannot store file outside current storage directory.");
            }
            
            Files.createDirectories(destinationFile.getParent()); // Ensure parent directories exist
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
                log.info("Stored file locally: {}", destinationFile);
                // Return a URL based on the key and baseUrl
                // Ensure no double slashes
                String relativePath = key.startsWith("/") ? key.substring(1) : key;
                String effectiveBaseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
                return effectiveBaseUrl + relativePath;
            }
        } catch (IOException e) {
            log.error("Failed to store file {} locally: {}", key, e.getMessage(), e);
            throw new StorageException("Failed to store file.", e);
        }
    }

    @Override
    public Stream<Path> loadAll() {
        try {
            log.debug("Loading all files from local storage: {}", rootLocation);
            return Files.walk(this.rootLocation, 1)
                    .filter(path -> !path.equals(this.rootLocation))
                    .map(this.rootLocation::relativize);
        } catch (IOException e) {
            log.error("Failed to read stored files from {}: {}", rootLocation, e.getMessage(), e);
            throw new StorageException("Failed to read stored files", e);
        }
    }

    @Override
    public Path load(String key) {
        log.debug("Loading local file path for key: {}", key);
        return rootLocation.resolve(key);
    }

    @Override
    public Resource loadAsResource(String key) {
        try {
            Path file = load(key);
            log.debug("Loading local file as resource: {}", file);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                log.warn("Could not read local file: {}", key);
                throw new StorageFileNotFoundException("Could not read file: " + key);
            }
        } catch (MalformedURLException e) {
            log.error("Malformed URL for local file key {}: {}", key, e.getMessage(), e);
            throw new StorageFileNotFoundException("Could not read file: " + key, e);
        }
    }

    @Override
    public boolean delete(String key) {
        try {
            Path file = load(key);
            boolean deleted = Files.deleteIfExists(file);
            if (deleted) {
                log.info("Deleted local file: {}", file);
            } else {
                log.warn("Attempted to delete non-existent local file: {}", file);
            }
            return deleted;
        } catch (IOException e) {
            log.error("Failed to delete local file {}: {}", key, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public void deleteAll() {
        log.warn("Attempting to delete all files in local storage directory: {}", rootLocation);
        FileSystemUtils.deleteRecursively(rootLocation.toFile());
        // Re-initialize the directory after deleting
        init(); 
    }

    @Override
    public String getSignedUrl(String key, long expirationSeconds) {
        log.warn("LocalStorageService does not support generating signed URLs. Returning standard URL for key: {}", key);
        // Local storage doesn't typically use signed URLs in the same way S3 does.
        // Return the regular URL constructed from baseUrl and key.
        String relativePath = key.startsWith("/") ? key.substring(1) : key;
        String effectiveBaseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
        return effectiveBaseUrl + relativePath;
        // Alternatively, throw UnsupportedOperationException if this should not be called for local storage
        // throw new UnsupportedOperationException("Signed URLs are not supported by LocalStorageService");
    }
}
