package com.autotrader.autotraderbackend.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.stream.Stream;

/**
 * Interface for storage services, providing methods for storing and retrieving files.
 * Implementations can be S3, local file system, or other storage solutions.
 */
public interface StorageService {

    /**
     * Initialize the storage service (e.g., create base directories).
     */
    void init();

    /**
     * Store a file with a given key (path/filename).
     *
     * @param file The file to store.
     * @param key  The unique key (path and filename) to store the file under.
     * @return The publicly accessible URL or a reference identifier for the stored file.
     */
    String store(MultipartFile file, String key);

    /**
     * Load all files as a stream of paths (primarily for local storage).
     *
     * @return A stream of file paths.
     */
    Stream<Path> loadAll();

    /**
     * Load a file as a path based on its key.
     *
     * @param key The key of the file to load.
     * @return The path to the file.
     */
    Path load(String key);

    /**
     * Load a file as a resource based on its key.
     *
     * @param key The key of the file to load.
     * @return The file as a resource.
     */
    Resource loadAsResource(String key);

    /**
     * Delete all files managed by the service.
     */
    void deleteAll();

    /**
     * Delete a specific file by its key.
     *
     * @param key The key of the file to delete.
     * @return true if deleted successfully, false otherwise.
     */
    boolean delete(String key);

    /**
     * Generate a pre-signed URL for temporary access to a file, typically used for private files.
     *
     * @param key               The key of the file.
     * @param expirationSeconds The duration in seconds for which the URL should be valid.
     * @return A pre-signed URL string.
     * @throws UnsupportedOperationException if the storage backend does not support signed URLs.
     */
    String getSignedUrl(String key, long expirationSeconds);
}
