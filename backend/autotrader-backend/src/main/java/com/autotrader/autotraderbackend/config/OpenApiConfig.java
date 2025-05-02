package com.autotrader.autotraderbackend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI autoTraderOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("AutoTrader Marketplace API")
                .description("REST API for AutoTrader Marketplace")
                .version("1.0.0")
                .contact(new Contact()
                    .name("AutoTrader Team")
                    .email("support@autotrader.com"))
                .license(new License()
                    .name("MIT License")))
            .components(new Components()
                .addSecuritySchemes("bearer-token",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }
}
