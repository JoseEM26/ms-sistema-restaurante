package com.restaurant.maestros;

import com.restaurant.common.exception.BusinessException;
import com.restaurant.common.exception.ResourceNotFoundException;
import com.restaurant.maestros.dto.request.CategoriaRequest;
import com.restaurant.maestros.dto.response.CategoriaResponse;
import com.restaurant.maestros.entity.Categoria;
import com.restaurant.maestros.mapper.CategoriaMapper;
import com.restaurant.maestros.repository.CategoriaRepository;
import com.restaurant.maestros.service.CategoriaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CategoriaService — Tests unitarios con datos de prueba")
class CategoriaServiceTest {

    @Mock private CategoriaRepository categoriaRepository;
    @Mock private CategoriaMapper categoriaMapper;
    @InjectMocks private CategoriaService categoriaService;

    // ── Datos de prueba centralizados ──
    private CategoriaRequest requestEntradas;
    private CategoriaRequest requestBebidas;
    private Categoria categoriaEntradas;
    private Categoria categoriaPostres;
    private CategoriaResponse responseEntradas;

    @BeforeEach
    void setup() {
        // Seed de datos de prueba reproducibles
        requestEntradas = new CategoriaRequest();
        requestEntradas.setNombre("Entradas");
        requestEntradas.setDescripcion("Platos de entrada y aperitivos");

        requestBebidas = new CategoriaRequest();
        requestBebidas.setNombre("Bebidas");
        requestBebidas.setDescripcion("Bebidas frías y calientes");

        categoriaEntradas = Categoria.builder()
                .nombre("Entradas")
                .descripcion("Platos de entrada y aperitivos")
                .build();

        categoriaPostres = Categoria.builder()
                .nombre("Postres")
                .descripcion("Dulces y postres")
                .build();

        responseEntradas = CategoriaResponse.builder()
                .id(1L)
                .nombre("Entradas")
                .descripcion("Platos de entrada y aperitivos")
                .activo(true)
                .build();
    }

    @Nested
    @DisplayName("Crear categoría")
    class Crear {

        @Test
        @DisplayName("Crea exitosamente con datos válidos")
        void creaExitosamente() {
            when(categoriaRepository.existsByNombreIgnoreCase("Entradas")).thenReturn(false);
            when(categoriaMapper.toEntity(requestEntradas)).thenReturn(categoriaEntradas);
            when(categoriaRepository.save(categoriaEntradas)).thenReturn(categoriaEntradas);
            when(categoriaMapper.toResponse(categoriaEntradas)).thenReturn(responseEntradas);

            CategoriaResponse resultado = categoriaService.crear(requestEntradas);

            assertThat(resultado).isNotNull();
            assertThat(resultado.getNombre()).isEqualTo("Entradas");
            assertThat(resultado.getActivo()).isTrue();
            verify(categoriaRepository).save(any(Categoria.class));
        }

        @Test
        @DisplayName("Lanza BusinessException si el nombre ya existe")
        void lanzaExcepcionNombreDuplicado() {
            when(categoriaRepository.existsByNombreIgnoreCase("Entradas")).thenReturn(true);

            assertThatThrownBy(() -> categoriaService.crear(requestEntradas))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Ya existe");

            verify(categoriaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Persiste categoría de bebidas correctamente")
        void persisteBebidas() {
            Categoria catBebidas = Categoria.builder().nombre("Bebidas").build();
            CategoriaResponse resBebidas = CategoriaResponse.builder().id(2L).nombre("Bebidas").activo(true).build();

            when(categoriaRepository.existsByNombreIgnoreCase("Bebidas")).thenReturn(false);
            when(categoriaMapper.toEntity(requestBebidas)).thenReturn(catBebidas);
            when(categoriaRepository.save(catBebidas)).thenReturn(catBebidas);
            when(categoriaMapper.toResponse(catBebidas)).thenReturn(resBebidas);

            CategoriaResponse resultado = categoriaService.crear(requestBebidas);

            assertThat(resultado.getNombre()).isEqualTo("Bebidas");
        }
    }

    @Nested
    @DisplayName("Buscar categorías")
    class Buscar {

        @Test
        @DisplayName("Retorna categoría por ID existente")
        void retornaPorId() {
            when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaEntradas));
            when(categoriaMapper.toResponse(categoriaEntradas)).thenReturn(responseEntradas);

            CategoriaResponse resultado = categoriaService.buscarPorId(1L);

            assertThat(resultado.getId()).isEqualTo(1L);
            assertThat(resultado.getNombre()).isEqualTo("Entradas");
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException si ID no existe")
        void lanzaExcepcionIdNoExiste() {
            when(categoriaRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoriaService.buscarPorId(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Lista todas las categorías del seed")
        void listaTodas() {
            List<Categoria> seedCategorias = List.of(
                    categoriaEntradas, categoriaPostres,
                    Categoria.builder().nombre("Bebidas").build(),
                    Categoria.builder().nombre("Platos Principales").build()
            );
            when(categoriaRepository.findAll()).thenReturn(seedCategorias);
            when(categoriaMapper.toResponse(any())).thenReturn(responseEntradas);

            List<CategoriaResponse> resultado = categoriaService.listarTodas();

            assertThat(resultado).hasSize(4);
        }
    }

    @Nested
    @DisplayName("Eliminar (baja lógica)")
    class Eliminar {

        @Test
        @DisplayName("Desactiva la categoría sin borrarla físicamente")
        void desactivaCategoria() {
            when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaEntradas));
            when(categoriaRepository.save(any())).thenReturn(categoriaEntradas);

            categoriaService.eliminar(1L);

            verify(categoriaRepository).save(argThat(c -> !c.getActivo()));
            verify(categoriaRepository, never()).deleteById(any());
        }
    }
}
