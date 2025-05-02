package com.autotrader.autotraderbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;
import java.util.Set;

@Configuration
@ConfigurationProperties(prefix = "app.upload")
@Data
public class FileUploadProperties {
    private long maxFileSize = 5242880; // 5MB default
    private String imageBasePath = "listings";
    private Set<String> allowedTypes = Set.of(
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    );
}
