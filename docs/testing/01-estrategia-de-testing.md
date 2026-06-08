# 🧪 Estrategia de Testing

## Pirámide de tests

```
        /\
       /  \
      / E2E \         (no implementado — manual)
     /────────\
    /Integración\     ← Testcontainers + @SpringBootTest
   /──────────────\
  /   Unitarios   \   ← JUnit 5 + Mockito
 /──────────────────\
```

**Regla:** Más tests unitarios (rápidos, muchos), menos tests de integración (lentos, pocos).

---

## Tests unitarios — JUnit 5 + Mockito

Los tests unitarios prueban **una clase en aislamiento**, simulando sus dependencias con Mocks.

### ¿Qué es un Mock?

Un Mock es un objeto falso que simula el comportamiento de una dependencia real:

```java
// En lugar de usar el CategoriaRepository REAL (que requiere BD),
// usamos un Mock que devuelve lo que queremos
@Mock
private CategoriaRepository categoriaRepository;

// Le decimos qué debe devolver
when(categoriaRepository.findById(1L))
    .thenReturn(Optional.of(categoriaEntradas));
```

### Ejemplo completo

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("CategoriaService — Tests unitarios")
class CategoriaServiceTest {

    @Mock private CategoriaRepository categoriaRepository;
    @Mock private CategoriaMapper categoriaMapper;
    @InjectMocks private CategoriaService categoriaService;
    
    // Datos de prueba centralizados en @BeforeEach
    private CategoriaRequest requestEntradas;
    private Categoria categoriaEntradas;
    
    @BeforeEach
    void setup() {
        requestEntradas = new CategoriaRequest();
        requestEntradas.setNombre("Entradas");
        
        categoriaEntradas = Categoria.builder().nombre("Entradas").build();
    }
    
    @Test
    @DisplayName("Crear categoría exitosamente")
    void crearExitosamente() {
        // Arrange: configurar el comportamiento esperado
        when(categoriaRepository.existsByNombreIgnoreCase("Entradas")).thenReturn(false);
        when(categoriaMapper.toEntity(requestEntradas)).thenReturn(categoriaEntradas);
        when(categoriaRepository.save(any())).thenReturn(categoriaEntradas);
        when(categoriaMapper.toResponse(any())).thenReturn(responseEntradas);
        
        // Act: ejecutar lo que queremos probar
        CategoriaResponse resultado = categoriaService.crear(requestEntradas);
        
        // Assert: verificar el resultado
        assertThat(resultado).isNotNull();
        assertThat(resultado.getNombre()).isEqualTo("Entradas");
        verify(categoriaRepository).save(any());  // verificar que se guardó
    }
    
    @Test
    @DisplayName("Lanza excepción si el nombre ya existe")
    void lanzaExcepcionNombreDuplicado() {
        when(categoriaRepository.existsByNombreIgnoreCase("Entradas")).thenReturn(true);
        
        assertThatThrownBy(() -> categoriaService.crear(requestEntradas))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Ya existe");
        
        verify(categoriaRepository, never()).save(any());  // nunca debió guardar
    }
}
```

---

## Tests de integración — Testcontainers

Los tests de integración prueban **el sistema completo** con una BD real (PostgreSQL en Docker):

```java
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")  // ← Activa TestDataSeeder automáticamente
class CategoriaIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("db_maestros_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        // Apunta el datasource al PostgreSQL del contenedor
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.flyway.enabled", () -> "false");  // Usa TestDataSeeder
    }

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Test
    void seederCargoCategoriasAlArrancar() {
        // TestDataSeeder cargó 4 categorías automáticamente
        assertThat(categoriaRepository.count()).isGreaterThanOrEqualTo(4);
    }
}
```

**¿Cómo funciona Testcontainers?**
1. Al ejecutar los tests, levanta un contenedor Docker con PostgreSQL
2. Ejecuta los tests contra esa BD real
3. Al terminar, destruye el contenedor

---

## TestDataSeeder — Datos automáticos en tests

```java
@Component
@Profile("test")              // Solo en el perfil "test"
@RequiredArgsConstructor
public class TestDataSeeder implements ApplicationRunner {

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedCategorias();   // Carga categorías
        seedProductos();    // Carga productos (uno por categoría)
        seedMesas();        // Carga 11 mesas
        seedClientes();     // Carga 3 clientes de prueba
    }
    
    private void seedCategorias() {
        if (categoriaRepo.count() > 0) return;  // Idempotente
        categoriaRepo.save(Categoria.builder().nombre("Entradas").build());
        // ... etc
    }
}
```

---

## JaCoCo — Cobertura de código

JaCoCo mide qué porcentaje del código es ejecutado por los tests:

```bash
# Genera reporte de cobertura
mvn clean verify

# Reporte HTML en:
# target/site/jacoco/index.html
```

**Métricas que mide:**
- **Line coverage:** ¿Qué % de líneas se ejecutaron?
- **Branch coverage:** ¿Qué % de ramas (if/else) se tomaron?
- **Method coverage:** ¿Qué % de métodos se llamaron?

El plugin está configurado en el parent POM y excluye:
- DTOs y Entities (código generado por Lombok/MapStruct)
- Clases `*Application.java` (main)

---

## Ejecutar los tests

```bash
# Solo tests unitarios (rápido, ~5 segundos)
mvn test

# Tests unitarios + integración (requiere Docker, ~2-3 minutos)
mvn verify

# Un módulo específico
mvn test -pl ms-core-maestros

# Con reporte de cobertura
mvn clean verify
# Ver reporte en: ms-core-maestros/target/site/jacoco/index.html
```

---

## Resumen de herramientas de testing

| Herramienta | Tipo | Propósito |
|---|---|---|
| JUnit 5 | Framework | Motor de tests |
| Mockito | Mocking | Simular dependencias |
| AssertJ | Assertions | `assertThat().isEqualTo()` más legible |
| Testcontainers | Integración | BD real en Docker para tests |
| JaCoCo | Cobertura | Medir % de código testeado |
| SonarQube | Calidad | Análisis estático + cobertura integrada |
| `@ActiveProfiles("test")` | Config | Activa TestDataSeeder y config de test |
