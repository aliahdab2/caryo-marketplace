package com.autotrader.autotraderbackend.service.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.stream.Stream;

/**
 * No-operation implementation of {@link StorageService} for test environments.
 *
 * <p>All methods return successful results without performing actual storage operations.
 * This allows tests to run without requiring S3/MinIO infrastructure.
 *
 * <p><strong>Activation conditions:</strong>
 * <ul>
 *   <li>Profile is "test"</li>
 *   <li>Property {@code storage.s3.enabled=false} (or not set)</li>
 * </ul>
 *
 * <p><strong>Behavior:</strong>
 * <ul>
 *   <li>{@code store()} returns the provided key without saving</li>
 *   <li>{@code delete()} always returns true</li>
 *   <li>{@code copy()}/{@code move()} return the destination key</li>
 *   <li>{@code loadAsResource()} returns null</li>
 *   <li>{@code listByPrefix()} returns an empty list</li>
 *   <li>{@code getSignedUrl()} returns a fake localhost URL</li>
 * </ul>
 *
 * @see S3StorageService for production implementation
 * @see StorageService
 */
@Service
@Profile("test")
@ConditionalOnProperty(name = "storage.s3.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpStorageService implements StorageService {

    /** {@inheritDoc} No-op implementation. */
    @Override
    public void init() {
        // No-op: nothing to initialize in test mode
    }

    /** {@inheritDoc} Returns the key without actually storing the file. */
    @Override
    public String store(MultipartFile file, String key) {
        return key;
    }

    /** {@inheritDoc} Returns an empty stream. */
    @Override
    public Stream<Path> loadAll() {
        return Stream.empty();
    }

    /** {@inheritDoc} Returns null (no file system paths in test mode). */
    @Override
    public Path load(String key) {
        return null;
    }

    /** {@inheritDoc} Returns null (no actual resources in test mode). */
    @Override
    public Resource loadAsResource(String key) {
        return null;
    }

    /** {@inheritDoc} No-op implementation. */
    @Override
    public void deleteAll() {
        // No-op: nothing to delete in test mode
    }

    /** {@inheritDoc} Returns true without deleting anything. */
    @Override
    public boolean delete(String key) {
        return true;
    }

    /** {@inheritDoc} Returns a fake localhost URL for testing. */
    @Override
    public String getSignedUrl(String key, long expirationSeconds) {
        return "http://localhost/noop/" + key;
    }

    /** {@inheritDoc} Returns the destination key without copying. */
    @Override
    public String copy(String sourceKey, String destinationKey) {
        return destinationKey;
    }

    /** {@inheritDoc} Returns the destination key without moving. */
    @Override
    public String move(String sourceKey, String destinationKey) {
        return destinationKey;
    }

    /** {@inheritDoc} Returns an empty list. */
    @Override
    public List<StorageObjectInfo> listByPrefix(String prefix) {
        return Collections.emptyList();
    }
}
