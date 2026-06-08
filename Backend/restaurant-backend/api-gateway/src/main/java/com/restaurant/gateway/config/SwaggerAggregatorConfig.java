package com.restaurant.gateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Paths;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Configuration
public class SwaggerAggregatorConfig {

    private static final Map<String, String> SERVICE_DOCS = Map.of(
            "Auth",     "http://localhost:8081/v3/api-docs",
            "Maestros", "http://localhost:8082/v3/api-docs",
            "Ventas",   "http://localhost:8083/v3/api-docs"
    );

    @Bean
    OpenAPI gatewayOpenAPI(WebClient.Builder builder) {
        Paths paths = new Paths();

        SERVICE_DOCS.forEach((name, url) -> {
            try {
                OpenAPI remote = builder.build()
                        .get()
                        .uri(url)
                        .accept(MediaType.APPLICATION_JSON)
                        .retrieve()
                        .bodyToMono(OpenAPI.class)
                        .timeout(Duration.ofSeconds(5))
                        .block();

                if (remote != null && remote.getPaths() != null) {
                    remote.getPaths().forEach(paths::addPathItem);
                }
            } catch (Exception ignored) {
                // servicio no disponible al arrancar — se omite
            }
        });

        return new OpenAPI()
                .info(new Info()
                        .title("Restaurant API — Todos los endpoints")
                        .description("Auth · Maestros · Ventas unificados")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("API Gateway")
                ))
                .paths(paths);
    }

    @Bean
    WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
