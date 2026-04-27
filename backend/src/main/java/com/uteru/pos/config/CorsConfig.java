package com.uteru.pos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    private final String[] allowedOrigins;
    private final String[] allowedOriginPatterns;

    public CorsConfig(@Value("${spring.web.cors.allowed-origins}") String allowedOrigins) {
        var entries = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);
        this.allowedOrigins = Arrays.stream(entries)
                .filter(origin -> !origin.contains("*"))
                .toArray(String[]::new);
        this.allowedOriginPatterns = Arrays.stream(entries)
                .filter(origin -> origin.contains("*"))
                .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        var registration = registry.addMapping("/api/**")
                .allowedMethods("GET", "POST", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "X-Requested-With")
                .allowCredentials(false)
                .maxAge(3600);

        if (allowedOrigins.length > 0) {
            registration.allowedOrigins(allowedOrigins);
        }
        if (allowedOriginPatterns.length > 0) {
            registration.allowedOriginPatterns(allowedOriginPatterns);
        }
    }
}
