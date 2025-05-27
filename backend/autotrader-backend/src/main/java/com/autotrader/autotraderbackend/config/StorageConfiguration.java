package com.autotrader.autotraderbackend.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class to enable StorageProperties as a configuration properties bean.
 * This allows Spring Boot to bind properties from application.properties to the StorageProperties class.
 */
@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageConfiguration {
    // This class enables the StorageProperties configuration properties binding
}
