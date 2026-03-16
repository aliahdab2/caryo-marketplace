package com.caryo.marketplace.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    private static final String[] CACHE_NAMES = {
        "favorites",
        "locations", "locationsByCountry", "locationsByGovernorate", "locationsByGovernorateSlug",
        "carBrands", "activeBrands", "carModels", "carModelsPage", "modelsByBrand",
        "bodyStyles", "fuelTypes", "transmissionTypes", "driveTypes", "carConditions",
        "carqueryMakes", "carqueryModels",
        "sellerTypes"
    };

    @Bean
    @Primary
    @ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis")
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeValuesWith(
                    RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        // Reference data caches with longer TTL (rarely changes)
        RedisCacheConfiguration longTtlConfig = defaultConfig.entryTtl(Duration.ofHours(6));

        // User-specific caches with shorter TTL
        RedisCacheConfiguration shortTtlConfig = defaultConfig.entryTtl(Duration.ofMinutes(5));

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();

        // Short TTL caches (user-specific, frequently changing)
        cacheConfigs.put("favorites", shortTtlConfig);

        // Long TTL caches (reference data, rarely changes)
        for (String name : new String[]{
            "carBrands", "activeBrands", "carModels", "carModelsPage", "modelsByBrand",
            "bodyStyles", "fuelTypes", "transmissionTypes", "driveTypes", "carConditions",
            "carqueryMakes", "carqueryModels", "sellerTypes"
        }) {
            cacheConfigs.put(name, longTtlConfig);
        }

        // Medium TTL for location data
        RedisCacheConfiguration mediumTtlConfig = defaultConfig.entryTtl(Duration.ofHours(1));
        for (String name : new String[]{
            "locations", "locationsByCountry", "locationsByGovernorate", "locationsByGovernorateSlug"
        }) {
            cacheConfigs.put(name, mediumTtlConfig);
        }

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "spring.cache.type", havingValue = "simple", matchIfMissing = true)
    public CacheManager simpleCacheManager() {
        return new ConcurrentMapCacheManager(CACHE_NAMES);
    }
}
