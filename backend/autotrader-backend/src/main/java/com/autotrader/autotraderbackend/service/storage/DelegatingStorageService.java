package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.exception.StorageFileNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.stream.Stream;

@Service
@Slf4j
public class DelegatingStorageService implements StorageService {

    private final S3StorageService primaryStorageService;
    private final LocalStorageService fallbackStorageService;

    public DelegatingStorageService(S3StorageService primaryStorageService, LocalStorageService fallbackStorageService) {
        log.info("Initializing DelegatingStorageService with Primary: S3, Fallback: Local");
        this.primaryStorageService = primaryStorageService;
        this.fallbackStorageService = fallbackStorageService;
    }

    @Override
    public void init() {
        log.info("Initializing primary (S3) storage...");
        try {
            primaryStorageService.init();
        } catch (Exception e) {
            log.error("Failed to initialize primary (S3) storage: {}. Proceeding without primary.", e.getMessage(), e);
        }
        log.info("Initializing fallback (Local) storage...");
        try {
            fallbackStorageService.init();
        } catch (Exception e) {
            log.error("Failed to initialize fallback (Local) storage: {}. Fallback may not be available.", e.getMessage(), e);
        }
    }

    @Override
    public String store(MultipartFile file, String key) {
        try {
            log.debug("Attempting to store file '{}' using primary (S3) storage.", key);
            return primaryStorageService.store(file, key);
        } catch (Exception e) {
            log.warn("Failed to store file '{}' using primary (S3) storage: {}. Attempting fallback (Local) storage.", key, e.getMessage());
            try {
                return fallbackStorageService.store(file, key);
            } catch (Exception fallbackException) {
                log.error("Failed to store file '{}' using fallback (Local) storage as well: {}", key, fallbackException.getMessage(), fallbackException);
                throw new StorageException("Failed to store file using both primary and fallback services", fallbackException);
            }
        }
    }

    @Override
    public Stream<Path> loadAll() {
        log.warn("loadAll() called on DelegatingStorageService. Reflecting fallback (Local) storage only.");
        try {
             return fallbackStorageService.loadAll();
        } catch (Exception e) {
             log.error("Error loading all from fallback storage: {}", e.getMessage(), e);
             return Stream.empty();
        }
    }

    @Override
    public Path load(String key) {
         try {
            log.warn("load(Path) on DelegatingStorageService attempts fallback (Local) first for key '{}'.", key);
            return fallbackStorageService.load(key);
         } catch (Exception e) {
            log.warn("Failed to load path for key '{}' from fallback (Local): {}. This might indicate the file is only in primary (S3) or does not exist.", key, e.getMessage());
            throw new StorageFileNotFoundException("Could not load file path (tried fallback): " + key, e);
         }
    }

    @Override
    public Resource loadAsResource(String key) {
        try {
            log.debug("Attempting to load resource '{}' using primary (S3) storage.", key);
            return primaryStorageService.loadAsResource(key);
        } catch (StorageFileNotFoundException | UnsupportedOperationException primaryException) {
            log.warn("Primary storage could not load resource '{}' ({}). Attempting fallback.", key, primaryException.getMessage());
             try {
                return fallbackStorageService.loadAsResource(key);
            } catch (Exception fallbackException) {
                log.error("Failed to load resource '{}' using fallback (Local) storage as well: {}", key, fallbackException.getMessage(), fallbackException);
                throw new StorageFileNotFoundException("Could not read file: " + key, fallbackException);
            }
        } catch (Exception e) { // Catch other primary exceptions
             log.warn("Failed to load resource '{}' using primary (S3) storage: {}. Attempting fallback (Local) storage.", key, e.getMessage());
             try {
                return fallbackStorageService.loadAsResource(key);
            } catch (Exception fallbackException) {
                log.error("Failed to load resource '{}' using fallback (Local) storage as well: {}", key, fallbackException.getMessage(), fallbackException);
                throw new StorageFileNotFoundException("Could not read file: " + key, fallbackException);
            }
        }
    }

    @Override
    public boolean delete(String key) {
        boolean primaryDeleted = false;
        boolean fallbackDeleted = false;
        try {
            log.debug("Attempting to delete file '{}' from primary (S3) storage.", key);
            primaryDeleted = primaryStorageService.delete(key);
        } catch (Exception e) {
            log.warn("Failed to delete file '{}' from primary (S3) storage: {}. Continuing with fallback.", key, e.getMessage());
        }
        try {
            log.debug("Attempting to delete file '{}' from fallback (Local) storage.", key);
            fallbackDeleted = fallbackStorageService.delete(key);
        } catch (Exception e) {
            log.warn("Failed to delete file '{}' from fallback (Local) storage: {}", key, e.getMessage());
        }
        return primaryDeleted || fallbackDeleted;
    }

    @Override
    public void deleteAll() {
        log.warn("Attempting to delete all files from primary (S3) and fallback (Local) storage.");
        try {
            primaryStorageService.deleteAll();
        } catch (Exception e) {
            log.error("Error deleting all files from primary (S3) storage: {}", e.getMessage(), e);
        }
        try {
            fallbackStorageService.deleteAll();
        } catch (Exception e) {
            log.error("Error deleting all files from fallback (Local) storage: {}", e.getMessage(), e);
        }
    }

    @Override
    public String getSignedUrl(String key, long expirationSeconds) {
        try {
            log.debug("Attempting to get signed URL for '{}' from primary (S3) storage.", key);
            return primaryStorageService.getSignedUrl(key, expirationSeconds);
        } catch (UnsupportedOperationException e) {
             log.warn("Primary storage (S3) does not support signed URLs for key '{}'. Attempting fallback.", key);
             try {
                 return fallbackStorageService.getSignedUrl(key, expirationSeconds);
             } catch (UnsupportedOperationException fallbackE) {
                 log.error("Neither primary nor fallback storage support signed URLs for key '{}'.", key);
                 throw fallbackE;
             } catch (Exception fallbackE) {
                 log.error("Error getting signed URL from fallback for key '{}': {}", key, fallbackE.getMessage(), fallbackE);
                 throw new StorageException("Failed to get signed URL from fallback", fallbackE);
             }
        } catch (Exception e) {
            log.warn("Failed to get signed URL for '{}' from primary (S3) storage: {}. Attempting fallback (Local) storage.", key, e.getMessage());
            try {
                return fallbackStorageService.getSignedUrl(key, expirationSeconds);
            } catch (Exception fallbackException) {
                log.error("Failed to get signed URL for '{}' from fallback (Local) storage as well: {}", key, fallbackException.getMessage(), fallbackException);
                throw new StorageException("Failed to get signed URL using both primary and fallback services", fallbackException);
            }
        }
    }
}
