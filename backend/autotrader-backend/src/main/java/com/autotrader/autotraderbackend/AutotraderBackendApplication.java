package com.autotrader.autotraderbackend;

import com.autotrader.autotraderbackend.config.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(StorageProperties.class)
public class AutotraderBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(AutotraderBackendApplication.class, args);
	}

}
