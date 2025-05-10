package com.autotrader.autotraderbackend.service.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.stream.Stream;

@Service
@Profile("test")
// Ensure this bean is only created if S3 is NOT enabled AND the profile is "test"
@ConditionalOnProperty(name = "storage.s3.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpStorageService implements StorageService {

    @Override
    public void init() {
        // No-op
    }

    @Override
    public String store(MultipartFile file, String key) {
        // No-op
        return key;
    }

    @Override
    public Stream<Path> loadAll() {
        // No-op
        return Stream.empty();
    }

    @Override
    public Path load(String key) {
        // No-op
        return null;
    }

    @Override
    public Resource loadAsResource(String key) {
        // No-op
        return null;
    }

    @Override
    public void deleteAll() {
        // No-op
    }

    @Override
    public boolean delete(String key) {
        // No-op
        return true;
    }

    @Override
    public String getSignedUrl(String key, long expirationSeconds) {
        // No-op
        return "http://localhost/noop/" + key;
    }
}
