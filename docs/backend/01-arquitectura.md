# 🏗️ Arquitectura del Backend

## ¿Qué es una arquitectura de microservicios?

En lugar de tener **una sola aplicación** que haga todo (monolito), los microservicios dividen el sistema en **piezas pequeñas e independientes**, donde cada una tiene su propia responsabilidad, su propia base de datos y puede escalar por separado.

**Analogía:** Un restaurante no tiene un solo empleado que cocine, atienda, cobre y limpie. Tiene cocineros, meseros, cajeros y limpiadores — cada uno especializado en su función.

---

## Estructura del proyecto (Maven Multi-módulo)

```
restaurant-backend/          ← Proyecto padre (POM padre)
├── common/                  ← Librería compartida entre todos
├── eureka-server/           ← Registro de servicios
├── config-server/           ← Configuración centralizada
├── api-gateway/             ← Punto de entrada único
├── ms-auth-security/        ← Autenticación y usuarios
├── ms-core-maestros/        ← Catálogos (productos, mesas, clientes)
├── ms-ventas/               ← Pedidos y ventas
├── ms-notificaciones/       ← Alertas y eventos
└── ms-reportes/             ← Generación de PDF
```

---

## Mapa de microservicios

```
                    CLIENTE (browser / app)
                           │
                    JWT en header
                           │
             ┌─────────────▼──────────────┐
             │       API GATEWAY           │  :8080
             │  Spring Cloud Gateway       │
             │  + JWT Auth Filter          │
             │  + Redis (rate limiting)    │
             └──┬──────────┬──────────┬───┘
                │          │          │
         ┌──────▼──┐  ┌────▼────┐ ┌──▼──────┐
         │  Auth   │  │Maestros │ │ Ventas  │
         │  :8081  │  │  :8082  │ │  :8083  │
         └────┬────┘  └────┬────┘ └──┬──────┘
              │            │         │
           db_auth    db_maestros  db_ventas
                                     │
                              RabbitMQ (eventos)
                                     │
                            ┌────────▼────────┐
                            │ Notificaciones  │
                            │     :8084       │
                            └─────────────────┘

Servicios de soporte:
  ┌─────────────┐   ┌──────────────┐   ┌────────────┐
  │   Eureka    │   │Config Server │   │ Reportes   │
  │    :8761    │   │    :8888     │   │   :8085    │
  └─────────────┘   └──────────────┘   └────────────┘
```

---

## Patrón por microservicio

Cada microservicio de negocio sigue el mismo patrón en capas:

```
┌─────────────────────────────────────────────────────┐
│                   HTTP Request                      │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│                  CONTROLLER                         │
│  Recibe la petición HTTP, valida con @Valid,        │
│  llama al Service y devuelve ApiResponse<T>         │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│                   SERVICE                           │
│  Contiene la lógica de negocio. Usa el Repository   │
│  y el Mapper. Lanza excepciones de dominio.         │
└──────────┬────────────────────────────┬─────────────┘
           ▼                            ▼
┌──────────────────┐        ┌───────────────────────┐
│   REPOSITORY     │        │       MAPPER           │
│  Spring Data JPA │        │  MapStruct (interface) │
│  Consultas a BD  │        │  Entity ↔ DTO          │
└──────────┬───────┘        └───────────────────────┘
           ▼
┌──────────────────┐
│    PostgreSQL    │
│  (BD propia por  │
│  microservicio)  │
└──────────────────┘
```

---

## Comunicación entre microservicios

### Síncrona (OpenFeign)
Cuando `ms-ventas` necesita verificar si una mesa existe en `ms-maestros`, lo hace mediante una llamada HTTP directa usando **Feign**:

```java
// ms-ventas llama a ms-maestros
@FeignClient(name = "ms-core-maestros", fallback = MaestrosClientFallback.class)
public interface MaestrosClient {
    @GetMapping("/api/maestros/mesas/{id}")
    ApiResponse<MesaClientResponse> obtenerMesa(@PathVariable Long id);
}
```

El **Fallback** (Resilience4j) responde con un valor por defecto si `ms-maestros` no está disponible.

### Asíncrona (RabbitMQ)
Cuando se crea o actualiza un pedido, `ms-ventas` publica un **evento** en RabbitMQ. `ms-notificaciones` lo consume sin bloquear al usuario:

```
ms-ventas ──publica──▶ exchange.pedidos ──rutea──▶ queue.pedido.nuevo
                                                          │
                                                    ms-notificaciones
                                                     (consumer)
```

---

## Módulo `common` — Librería compartida

No duplicamos código. El módulo `common` centraliza lo que usan todos los microservicios:

| Clase | Propósito |
|---|---|
| `BaseEntity` | Campos comunes: `id`, `createdAt`, `updatedAt`, `activo` |
| `ApiResponse<T>` | Formato uniforme de respuesta JSON |
| `ResourceNotFoundException` | Excepción cuando no se encuentra un recurso |
| `BusinessException` | Excepción de regla de negocio |
| `GlobalExceptionHandler` | Manejador centralizado de errores HTTP |
| `TenantContext` | Multi-tenant via header `X-Tenant-ID` |

---

## ¿Por qué microservicios para un restaurante?

| Aspecto | Beneficio en este proyecto |
|---|---|
| **Escalabilidad** | En hora punta, `ms-ventas` puede escalar sin afectar a `ms-reportes` |
| **Independencia** | Si `ms-reportes` falla, los pedidos siguen funcionando |
| **Aprendizaje** | Cubre todo el stack de Spring Cloud en un proyecto real |
| **Despliegue** | Cada servicio tiene su propio JAR ejecutable |
