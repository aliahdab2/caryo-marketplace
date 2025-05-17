## Redis Integration Guide for Development

This guide explains how to use the Redis instance that's already configured in your `docker-compose.dev.yml` file for caching in your Spring Boot application.

### 1. Add Redis Dependencies

Add the following dependencies to your `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

### 2. Configure Redis in application-dev.yml

Add or modify the following properties in your `application-dev.yml`:

```yaml
spring:
  cache:
    type: redis
  redis:
    host: redis  # Use the service name from docker-compose
    port: 6379
    timeout: 2000
    # Optional: Set a database index (0-15)
    database: 0
    # Optional: Set connection pool properties
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 2
        max-wait: -1ms
```

### 3. Create a Redis Configuration Class

Create a Redis configuration class in your project:

```java
package com.autotrader.autotraderbackend.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
@Profile("dev") // Only apply this in the dev profile
public class RedisCacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10)) // Cache entries expire after 10 minutes
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())
                )
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfig)
                .withCacheConfiguration("locations", // Custom config for locations cache
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofHours(24)) // Locations can be cached longer
                                .serializeKeysWith(
                                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
                                )
                                .serializeValuesWith(
                                        RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())
                                ))
                .build();
    }
}
```

### 4. Use Caching Annotations in Your Services

To use caching in your services, use the following annotations:

```java
@Service
public class LocationServiceImpl implements LocationService {
    
    @Cacheable(value = "locations", key = "#countryCode")
    public List<Location> getLocationsByCountryCode(String countryCode) {
        // This method's results will be cached using Redis
        // ...
    }
    
    @CachePut(value = "locations", key = "#location.id")
    public Location updateLocation(Location location) {
        // This method will update the cache after modification
        // ...
    }
    
    @CacheEvict(value = "locations", key = "#id")
    public void deleteLocation(Long id) {
        // This will remove the cached item when a location is deleted
        // ...
    }
    
    @CacheEvict(value = "locations", allEntries = true)
    public void clearLocationCache() {
        // This will clear the entire locations cache
        // ...
    }
}
```

### 5. Test Redis Caching

To test that Redis caching is working:

1. Make the same API call twice in quick succession
2. Check the API logs - the first call should hit the database, the second should retrieve from cache
3. Use the Redis CLI to inspect cached values:

```bash
# Connect to Redis container
docker exec -it autotrader-backend-redis-1 redis-cli

# List all keys
KEYS *

# Get a specific cached value
GET "locations::SY"

# Monitor Redis operations in real-time
MONITOR
```
