package com.restaurant.maestros;

import com.restaurant.maestros.entity.Categoria;
import com.restaurant.maestros.repository.CategoriaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")   // activa TestDataSeeder y config de test
@DisplayName("Integration Tests — Testcontainers + Seed automático")
class CategoriaIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("db_maestros_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",      postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
        r.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        r.add("spring.flyway.enabled", () -> "false");  // Flyway off en tests, usa ddl-auto + seeder
    }

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Test
    @DisplayName("El seeder cargó las categorías automáticamente al arrancar")
    void seederCargoCategoriasAlArrancar() {
        assertThat(categoriaRepository.count()).isGreaterThanOrEqualTo(4);
    }

    @Test
    @DisplayName("Existen las categorías base del restaurante")
    void categoriasPrincipalesExisten() {
        assertThat(categoriaRepository.findByNombreIgnoreCase("Entradas")).isPresent();
        assertThat(categoriaRepository.findByNombreIgnoreCase("Platos Principales")).isPresent();
        assertThat(categoriaRepository.findByNombreIgnoreCase("Bebidas")).isPresent();
        assertThat(categoriaRepository.findByNombreIgnoreCase("Postres")).isPresent();
    }

    @Test
    @DisplayName("Crear y recuperar categoría en BD real")
    void crearYRecuperarCategoria() {
        Categoria nueva = Categoria.builder()
                .nombre("Categoría Test " + System.currentTimeMillis())
                .descripcion("Solo para test de integración")
                .build();

        Categoria saved = categoriaRepository.save(nueva);

        assertThat(saved.getId()).isNotNull();
        assertThat(categoriaRepository.findById(saved.getId()))
                .isPresent()
                .get()
                .extracting(Categoria::getNombre)
                .isEqualTo(nueva.getNombre());
    }
}
