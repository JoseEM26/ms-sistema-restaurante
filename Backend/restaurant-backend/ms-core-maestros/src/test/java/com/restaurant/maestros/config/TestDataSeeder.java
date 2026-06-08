package com.restaurant.maestros.config;

import com.restaurant.maestros.entity.Categoria;
import com.restaurant.maestros.entity.Cliente;
import com.restaurant.maestros.entity.Mesa;
import com.restaurant.maestros.entity.Producto;
import com.restaurant.maestros.enums.EstadoMesa;
import com.restaurant.maestros.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

// Se ejecuta SOLO con el perfil "test" (no afecta producción)
@Component
@Profile("test")
@RequiredArgsConstructor
public class TestDataSeeder implements ApplicationRunner {

    private final CategoriaRepository categoriaRepo;
    private final ProductoRepository  productoRepo;
    private final MesaRepository      mesaRepo;
    private final ClienteRepository   clienteRepo;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedCategorias();
        seedProductos();
        seedMesas();
        seedClientes();
    }

    private void seedCategorias() {
        if (categoriaRepo.count() > 0) return;

        categoriaRepo.save(Categoria.builder().nombre("Entradas").descripcion("Platos de entrada").build());
        categoriaRepo.save(Categoria.builder().nombre("Platos Principales").descripcion("Platos de fondo").build());
        categoriaRepo.save(Categoria.builder().nombre("Bebidas").descripcion("Bebidas frías y calientes").build());
        categoriaRepo.save(Categoria.builder().nombre("Postres").descripcion("Dulces y postres").build());
    }

    private void seedProductos() {
        if (productoRepo.count() > 0) return;

        Categoria entrada  = categoriaRepo.findByNombreIgnoreCase("Entradas").orElseThrow();
        Categoria principal = categoriaRepo.findByNombreIgnoreCase("Platos Principales").orElseThrow();
        Categoria bebida   = categoriaRepo.findByNombreIgnoreCase("Bebidas").orElseThrow();
        Categoria postre   = categoriaRepo.findByNombreIgnoreCase("Postres").orElseThrow();

        productoRepo.save(Producto.builder().nombre("Ceviche Clásico")   .precio(new BigDecimal("32.00")).categoria(entrada)   .disponible(true).build());
        productoRepo.save(Producto.builder().nombre("Causa Rellena")     .precio(new BigDecimal("18.00")).categoria(entrada)   .disponible(true).build());
        productoRepo.save(Producto.builder().nombre("Lomo Saltado")      .precio(new BigDecimal("42.00")).categoria(principal) .disponible(true).build());
        productoRepo.save(Producto.builder().nombre("Ají de Gallina")    .precio(new BigDecimal("35.00")).categoria(principal) .disponible(true).build());
        productoRepo.save(Producto.builder().nombre("Arroz con Pollo")   .precio(new BigDecimal("30.00")).categoria(principal) .disponible(true).build());
        productoRepo.save(Producto.builder().nombre("Inca Kola")         .precio(new BigDecimal("8.00")) .categoria(bebida)    .disponible(true).build());
        productoRepo.save(Producto.builder().nombre("Chicha Morada")     .precio(new BigDecimal("7.00")) .categoria(bebida)    .disponible(true).build());
        productoRepo.save(Producto.builder().nombre("Arroz con Leche")   .precio(new BigDecimal("12.00")).categoria(postre)    .disponible(true).build());
        productoRepo.save(Producto.builder().nombre("Suspiro Limeño")    .precio(new BigDecimal("14.00")).categoria(postre)    .disponible(true).build());
        // Producto NO disponible para test
        productoRepo.save(Producto.builder().nombre("Producto Agotado")  .precio(new BigDecimal("20.00")).categoria(entrada)   .disponible(false).build());
    }

    private void seedMesas() {
        if (mesaRepo.count() > 0) return;

        for (int i = 1; i <= 10; i++) {
            mesaRepo.save(Mesa.builder()
                    .numero(i)
                    .capacidad(i <= 4 ? 2 : i <= 8 ? 4 : 6)
                    .estado(EstadoMesa.LIBRE)
                    .build());
        }
        // Mesa ocupada para tests
        mesaRepo.save(Mesa.builder().numero(11).capacidad(4).estado(EstadoMesa.OCUPADA).build());
    }

    private void seedClientes() {
        if (clienteRepo.count() > 0) return;

        clienteRepo.save(Cliente.builder().nombre("Carlos").apellido("Quispe").telefono("987654321").email("carlos@test.com").build());
        clienteRepo.save(Cliente.builder().nombre("María").apellido("López").telefono("976543210").email("maria@test.com").build());
        clienteRepo.save(Cliente.builder().nombre("Jorge").apellido("Ramírez").telefono("965432109").email("jorge@test.com").build());
    }
}
