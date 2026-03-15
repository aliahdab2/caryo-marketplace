package com.caryo.marketplace;

import com.caryo.marketplace.config.StorageProperties;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(StorageProperties.class)
@OpenAPIDefinition
public class CaryoMarketplaceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CaryoMarketplaceApplication.class, args);
	}

}
