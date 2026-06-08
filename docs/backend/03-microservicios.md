# 🔧 Microservicios — Detalle por servicio

## 1. `eureka-server` — Registro de servicios `:8761`

**¿Para qué sirve?**
Es el "directorio" del sistema. Cuando un microservicio arranca, se registra aquí con su IP y puerto. Cuando otro servicio lo necesita, pregunta a Eureka por su ubicación.

**Sin Eureka:** Tendrías que configurar manualmente las URLs de cada servicio en cada otro servicio. Si un servicio cambia de puerto, habría que actualizar todos los demás.

**Con Eureka:** Los servicios se descubren automáticamente. El load balancing (`lb://ms-core-maestros`) funciona solo.

```yaml
# Configuración mínima
eureka:
  client:
    register-with-eureka: false  # El servidor no se registra a sí mismo
    fetch-registry: false
```

**URL:** http://localhost:8761 — Dashboard visual con todos los servicios registrados.

---

## 2. `config-server` — Configuración centralizada `:8888`

**¿Para qué sirve?**
Sirve los archivos `application.yml` de cada microservicio desde un lugar central. Los servicios arrancan consultando al Config Server en vez de leer su propio `application.yml`.

**Caso de uso real:** Tienes 8 microservicios que necesitan la URL de la BD. Si cambias el servidor de PostgreSQL, solo cambias el Config Server, no 8 archivos.

```
ms-core-maestros arranca
    → GET http://config-server:8888/ms-core-maestros/default
    → Recibe su configuración (datasource, etc.)
    → Arranca con esa configuración
```

**Archivos de config en:** `config-server/src/main/resources/configs/`

---

## 3. `api-gateway` — Puerta de entrada `:8080`

**¿Para qué sirve?**
Es el único punto de entrada del sistema. El frontend habla SOLO con el gateway, que se encarga de:

1. **Ruteo:** Decide a qué microservicio enviar cada petición
2. **Autenticación:** Valida el JWT en rutas protegidas
3. **CORS:** Permite peticiones desde `localhost:4200`
4. **Rate limiting:** Limita las peticiones por IP (usando Redis)

**Rutas configuradas:**

| Path | Destino | ¿JWT requerido? |
|---|---|---|
| `/api/auth/**` | ms-auth-security | ❌ No |
| `/api/maestros/**` | ms-core-maestros | ✅ Sí |
| `/api/ventas/**` | ms-ventas | ✅ Sí |
| `/api/reportes/**` | ms-reportes | ✅ Sí |

**Componentes clave:**
- `JwtAuthFilter`: Intercepta peticiones, extrae el token del header `Authorization: Bearer <token>`, llama a `JwtUtil.isTokenValid()`. Si el token es inválido → 401 Unauthorized.

```java
// Gateway usa WebFlux (reactivo), no WebMVC
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<Config> {
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // Valida JWT → si OK, pasa al microservicio
            // Si falla → retorna 401
        };
    }
}
```

---

## 4. `ms-auth-security` — Autenticación `:8081`

**¿Para qué sirve?**
Gestiona usuarios y genera tokens JWT. Es el único servicio que crea tokens.

**Base de datos:** `db_auth`

**Endpoints:**
| Método | Path | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registra un nuevo usuario |
| POST | `/api/auth/login` | Inicia sesión y devuelve un JWT |

**Roles disponibles:**

| Rol | Acceso |
|---|---|
| `ADMIN` | Acceso total al sistema |
| `CAJERO` | Gestión de pedidos y cobros |
| `MESERO` | Crear y gestionar pedidos |
| `COCINERO` | Ver pedidos en cocina |

**Flujo de registro:**
```
Cliente → POST /register con {username, password, email, rol}
    → Valida que username y email no existan
    → Encripta contraseña con BCrypt (cost factor 10)
    → Guarda usuario en db_auth
    → Genera JWT con {sub: username, rol: ADMIN}
    → Retorna token
```

**Seguridad:** La contraseña NUNCA se guarda en texto plano. BCrypt genera un hash diferente cada vez aunque la contraseña sea la misma.

---

## 5. `ms-core-maestros` — Catálogos `:8082`

**¿Para qué sirve?**
Gestiona los datos maestros del restaurante: todo lo que se configura antes de empezar a operar.

**Base de datos:** `db_maestros`

**Entidades y relaciones:**
```
Categoria (1) ────────────── (*) Producto
  - id                              - id
  - nombre                          - nombre
  - descripcion                     - descripcion
                                    - precio
Mesa                                - disponible
  - id                              - categoria_id (FK)
  - numero
  - capacidad             Cliente
  - estado (LIBRE|OCUPADA|RESERVADA)  - id
                                      - nombre
                                      - apellido
                                      - email
                                      - telefono
```

**Endpoints clave:**

| Recurso | CRUD completo | Endpoints especiales |
|---|---|---|
| Categorías | ✅ | — |
| Productos | ✅ | `GET /disponibles`, `GET /categoria/{id}` |
| Mesas | ✅ | `GET /libres`, `PATCH /{id}/estado` |
| Clientes | ✅ | — |

**Patrón MapStruct en este servicio:**
```java
// CategoriaMapper genera automáticamente la conversión
@Mapper(componentModel = "spring")
public interface CategoriaMapper {
    CategoriaResponse toResponse(Categoria categoria);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "productos", ignore = true)
    Categoria toEntity(CategoriaRequest request);
    
    @BeanMapping(nullValuePropertyMappingStrategy = IGNORE)
    void updateEntity(CategoriaRequest request, @MappingTarget Categoria cat);
}
```

---

## 6. `ms-ventas` — Pedidos `:8083`

**¿Para qué sirve?**
El corazón del negocio. Gestiona todo el ciclo de vida de un pedido, desde que se abre hasta que se cierra.

**Base de datos:** `db_ventas`

**Estados de un pedido:**
```
ABIERTO → EN_PROCESO → LISTO → CERRADO
              ↓
          CANCELADO
```

**Entidades:**
```
Pedido
  - id
  - mesaId          ← Solo el ID, no la entidad (BD propia)
  - clienteId       ← Solo el ID
  - estado
  - total           ← Se recalcula automáticamente
  - observaciones
  - detalles (1-*)

DetallePedido
  - id
  - productoId       ← ID del producto en ms-maestros
  - productoNombre   ← Se guarda el nombre actual (inmutable)
  - cantidad
  - precioUnitario   ← Se guarda el precio al momento del pedido
  - subtotal
```

**¿Por qué guardar el nombre y precio en DetallePedido?**
Si el precio de un producto cambia después, el pedido histórico debe mostrar el precio que tenía cuando se hizo, no el precio actual.

**Integración con ms-maestros (Feign):**
Al crear un pedido:
1. Llama a Feign → verifica que la mesa existe y está LIBRE
2. Llama a Feign → obtiene el precio actual de cada producto
3. Crea el pedido con los precios obtenidos
4. Llama a Feign → cambia el estado de la mesa a OCUPADA
5. Publica evento en RabbitMQ

**Si ms-maestros no responde:**
Resilience4j activa el fallback:
```java
@Component
public class MaestrosClientFallback implements MaestrosClient {
    @Override
    public ApiResponse<MesaClientResponse> obtenerMesa(Long id) {
        return ApiResponse.error("Servicio de maestros no disponible");
    }
}
```

---

## 7. `ms-notificaciones` — Eventos asíncronos `:8084`

**¿Para qué sirve?**
Consume eventos de RabbitMQ publicados por `ms-ventas` y procesa notificaciones sin bloquear el flujo principal.

**¿Por qué asíncrono?**
Cuando un mesero crea un pedido, el sistema debe responder rápidamente. Notificar a la cocina, enviar un email, actualizar dashboards — esas tareas pueden hacerse en paralelo sin que el mesero espere.

**Queues que escucha:**
| Queue | Cuándo se publica | Acción |
|---|---|---|
| `queue.pedido.nuevo` | Al crear pedido | Notifica cocina |
| `queue.pedido.actualizado` | Al cambiar estado | Notifica actualización |

```java
@RabbitListener(queues = "queue.pedido.nuevo")
public void recibirPedidoNuevo(Map<String, Object> evento) {
    // Aquí iría: enviar email, push notification, notificar pantalla cocina
    log.info("Nuevo pedido #{} para Mesa #{}", evento.get("pedidoId"), evento.get("mesaId"));
}
```

---

## 8. `ms-reportes` — Generación de PDF `:8085`

**¿Para qué sirve?**
Genera reportes en PDF usando JasperReports y permite exportar a Excel usando Apache POI.

**JasperReports:** Motor de reportes que compila plantillas `.jrxml` (XML) y las rellena con datos para generar PDF.

**Endpoints:**
| Path | Formato | Descripción |
|---|---|---|
| `GET /api/reportes/ventas/pdf` | PDF | Reporte de ventas del mes |
| `GET /api/reportes/pedidos/pdf` | PDF | Pedidos del día |

**Flujo:**
```
Request → Compila plantilla .jrxml
       → Obtiene datos (vía Feign a ms-ventas)
       → JasperFillManager rellena la plantilla
       → Exporta a bytes PDF
       → Response con Content-Type: application/pdf
```
