# 🛠️ Stack Tecnológico — Backend

## Resumen rápido

| Capa | Tecnología | Versión | Para qué sirve |
|---|---|---|---|
| Lenguaje | Java | 21/23 | Base del backend |
| Framework | Spring Boot | 3.3.5 | Configuración automática, servidor embebido |
| Microservicios | Spring Cloud | 2023.0.3 | Eureka, Gateway, Feign, Config |
| Build | Maven | 3.9.x | Compilar, empaquetar, gestionar dependencias |
| BD | PostgreSQL | 18 | Base de datos relacional |
| ORM | Spring Data JPA | incluido | Mapeo objeto-relacional |
| Migraciones | Flyway | incluido | Control de versiones de BD |
| Mapeo DTO | MapStruct | 1.6.3 | Convierte Entity ↔ DTO automáticamente |
| Boilerplate | Lombok | 1.18.36 | Genera getters, setters, constructores |
| Mensajería | RabbitMQ | 3.13 | Eventos asíncronos entre servicios |
| Auth | JWT (jjwt) | 0.12.6 | Tokens de autenticación |
| Resiliencia | Resilience4j | 2.2 | Circuit breaker, fallback |
| Docs API | SpringDoc OpenAPI | 2.6 | Swagger UI automático |
| Reportes | JasperReports | 6.21.4 | Generación de PDF |
| Métricas | Micrometer + Prometheus | incluido | Monitoreo de rendimiento |
| Dashboards | Grafana | 10.4 | Visualización de métricas |
| Tests | JUnit 5 + Testcontainers | incluido | Tests unitarios e integración |
| Calidad | JaCoCo + Sonar | — | Cobertura y análisis de código |

---

## Java 21 — El lenguaje base

Java 21 es la versión LTS (Long Term Support) más reciente. Las características que más usamos:

- **Records** (DTO inmutables)
- **Pattern matching** para `instanceof`
- **Virtual threads** (Project Loom) — mejor rendimiento en I/O
- **Sealed classes** — jerarquías cerradas de tipos

```java
// Ejemplo: Record para un DTO simple
public record ProductoResumen(Long id, String nombre, BigDecimal precio) {}
```

---

## Spring Boot 3.3.5 — El corazón del backend

Spring Boot elimina la configuración manual que antes requería Spring puro. Con solo agregar una dependencia, ya tienes el servidor levantado y listo.

**¿Qué hace automáticamente?**
- Levanta un servidor Tomcat embebido (no necesitas instalar Tomcat)
- Configura JPA/Hibernate con las propiedades de `application.yml`
- Escanea y registra todos los `@Component`, `@Service`, `@Repository`
- Expone endpoints de Actuator para monitoreo

```yaml
# application.yml — Spring Boot lee esto automáticamente
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/db_maestros
  jpa:
    hibernate:
      ddl-auto: validate   # Flyway maneja el schema
```

---

## Spring Cloud 2023.0.3 — El ecosistema de microservicios

Spring Cloud es un conjunto de herramientas para construir microservicios. Usamos 4 de sus componentes:

### 1. Eureka Server — El directorio telefónico
Cada microservicio se registra en Eureka al arrancar. Cuando `ms-ventas` necesita hablar con `ms-maestros`, pregunta a Eureka: *"¿En qué IP/puerto está ms-maestros?"*

```
Microservicio arranca → se registra en Eureka
Gateway consulta Eureka → obtiene IPs → balancea carga
```

### 2. API Gateway — El portero
El único punto de entrada al sistema. Todo pasa por él:
- Rutea `/api/auth/**` a `ms-auth-security`
- Rutea `/api/maestros/**` a `ms-core-maestros`
- Valida el JWT antes de dejar pasar las rutas protegidas
- Aplica rate limiting con Redis

### 3. OpenFeign — Cliente HTTP declarativo
En lugar de escribir código para hacer llamadas HTTP, defines una interfaz y Spring genera el código:

```java
// Sin Feign (código manual)
ResponseEntity<MesaResponse> r = restTemplate.getForEntity(
    "http://ms-core-maestros/api/maestros/mesas/" + id, MesaResponse.class);

// Con Feign (declarativo)
@FeignClient(name = "ms-core-maestros")
public interface MaestrosClient {
    @GetMapping("/api/maestros/mesas/{id}")
    ApiResponse<MesaClientResponse> obtenerMesa(@PathVariable Long id);
}
```

### 4. Config Server — Configuración centralizada
En lugar de tener `application.yml` en cada microservicio, Config Server los sirve desde un lugar central. Útil cuando tienes 10+ microservicios y cambias la URL de la base de datos.

---

## Lombok — Elimina boilerplate

Sin Lombok necesitas escribir manualmente getters, setters, constructores, `equals`, `hashCode` y `toString`. Con Lombok solo pones una anotación:

```java
// Sin Lombok: ~50 líneas de código repetitivo
// Con Lombok: 5 anotaciones
@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class Producto extends BaseEntity {
    private String nombre;
    private BigDecimal precio;
    // Lombok genera automáticamente: getNombre(), setNombre(), etc.
}
```

---

## MapStruct — Conversión automática Entity ↔ DTO

**¿Por qué no exponer directamente la Entity en la API?**
Porque la Entity puede tener campos que no quieres mostrar (contraseñas, campos internos) y puede tener relaciones circulares que rompen la serialización JSON.

MapStruct genera código Java en tiempo de compilación (no usa reflection, es muy rápido):

```java
@Mapper(componentModel = "spring")
public interface ProductoMapper {
    // MapStruct genera automáticamente el código de conversión
    @Mapping(target = "categoriaNombre", source = "categoria.nombre")
    ProductoResponse toResponse(Producto producto);
    
    @Mapping(target = "id", ignore = true)
    Producto toEntity(ProductoRequest request);
}
```

---

## Flyway — Control de versiones de la base de datos

Flyway aplica scripts SQL en orden cuando el servicio arranca. Si la BD ya tiene ese script aplicado, lo salta:

```
V1__create_maestros.sql → Crea las tablas
V2__seed_maestros.sql   → Inserta datos de prueba
V3__add_column.sql      → (futura migración)
```

**¿Por qué no usar `ddl-auto: create`?**
Porque `create` borra y recrea las tablas en cada reinicio, perdiendo datos. Flyway mantiene un historial preciso de cada cambio en producción.

---

## Resilience4j — Resiliencia ante fallos

Cuando `ms-ventas` llama a `ms-maestros` y este no responde, Resilience4j aplica el patrón **Circuit Breaker**:

```
Estado CERRADO → Las llamadas fluyen normalmente
     │ (50% de llamadas fallan)
     ▼
Estado ABIERTO → No hace la llamada, llama al Fallback
     │ (después de 10 segundos)
     ▼
Estado SEMI-ABIERTO → Permite algunas llamadas de prueba
```

```yaml
resilience4j:
  circuitbreaker:
    instances:
      ms-core-maestros:
        slidingWindowSize: 10          # Ventana de 10 llamadas
        failureRateThreshold: 50       # Si el 50% falla, abre el circuito
        waitDurationInOpenState: 10s   # Espera 10s antes de reintentar
```

---

## JWT (jjwt) — Tokens de autenticación

JWT (JSON Web Token) es un token firmado que contiene información del usuario. El Gateway lo valida en cada petición sin consultar la base de datos:

```
┌────────────────────────────────────────┐
│              JWT TOKEN                 │
├──────────────┬─────────────────────────┤
│   HEADER     │ {"alg":"HS384"}         │
├──────────────┼─────────────────────────┤
│   PAYLOAD    │ {"sub":"admin",         │
│              │  "rol":"ADMIN",         │
│              │  "exp":1234567890}      │
├──────────────┼─────────────────────────┤
│   SIGNATURE  │ HMAC-SHA384(header+     │
│              │ payload, secret)        │
└──────────────┴─────────────────────────┘
```

El token tiene una firma criptográfica. Si alguien lo modifica, la firma no coincide y se rechaza.
