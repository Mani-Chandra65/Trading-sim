package com.crypto.sim.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;
    private final String[] allowedMethods;
    private final String[] allowedHeaders;
    private final String[] exposedHeaders;
    private final boolean allowCredentials;
    private final long maxAgeSeconds;

    public WebConfig(
            @Value("${app.cors.allowed-origins:http://localhost:5173}") String allowedOrigins,
            @Value("${app.cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}") String allowedMethods,
            @Value("${app.cors.allowed-headers:*}") String allowedHeaders,
            @Value("${app.cors.exposed-headers:Authorization}") String exposedHeaders,
            @Value("${app.cors.allow-credentials:true}") boolean allowCredentials,
            @Value("${app.cors.max-age-seconds:3600}") long maxAgeSeconds) {
        this.allowedOrigins = allowedOrigins.split("\\s*,\\s*");
        this.allowedMethods = allowedMethods.split("\\s*,\\s*");
        this.allowedHeaders = allowedHeaders.split("\\s*,\\s*");
        this.exposedHeaders = exposedHeaders.split("\\s*,\\s*");
        this.allowCredentials = allowCredentials;
        this.maxAgeSeconds = maxAgeSeconds;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods(allowedMethods)
                .allowedHeaders(allowedHeaders)
                .exposedHeaders(exposedHeaders)
                .allowCredentials(allowCredentials)
                .maxAge(maxAgeSeconds);
    }
}
