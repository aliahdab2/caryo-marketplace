package com.caryo.marketplace.service.storage;

import java.time.Instant;

/**
 * Lightweight DTO representing an object in storage, used by {@link StorageService#listByPrefix}.
 */
public record StorageObjectInfo(String key, Instant lastModified, long size) {
}
