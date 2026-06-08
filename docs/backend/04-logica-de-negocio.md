# 💼 Lógica de Negocio — Flujos del Restaurante

## Flujo completo de un pedido

```
1. Mesero selecciona mesa libre
2. Verifica disponibilidad (Feign → ms-maestros)
3. Agrega productos al pedido (Feign → obtiene precios actuales)
4. Sistema marca mesa como OCUPADA
5. Publica evento a cocina (RabbitMQ)
6. Cocina procesa → estado EN_PROCESO
7. Platos listos → estado LISTO
8. Mesero cobra → estado CERRADO
9. Sistema libera la mesa → estado LIBRE
```

---

## Reglas de negocio implementadas

### Regla 1: Una mesa no puede tener dos pedidos abiertos
```java
// En PedidoService
public PedidoResponse crear(PedidoRequest request) {
    var mesa = maestrosClient.obtenerMesa(request.getMesaId()).getData();
    if (!"LIBRE".equals(mesa.getEstado())) {
        throw new BusinessException("La mesa " + mesa.getNumero() + " no está disponible");
    }
    // ...
}
```

### Regla 2: Los precios se fijan al momento del pedido
```java
// El precio viene de ms-maestros en el momento de crear el pedido
ProductoClientResponse producto = maestrosClient.obtenerProducto(detalleReq.getProductoId()).getData();
DetallePedido detalle = DetallePedido.builder()
    .precioUnitario(producto.getPrecio())  // ← Precio actual, no cambiará
    .productoNombre(producto.getNombre())   // ← Nombre actual
    .build();
```

### Regla 3: El total se recalcula automáticamente
```java
// En la entidad Pedido
public void recalcularTotal() {
    this.total = detalles.stream()
        .map(DetallePedido::getSubtotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

### Regla 4: Solo productos disponibles pueden pedirse
```java
if (!producto.getDisponible()) {
    throw new BusinessException("El producto '" + producto.getNombre() + "' no está disponible");
}
```

### Regla 5: Al cerrar/cancelar un pedido, la mesa se libera
```java
if (nuevoEstado == EstadoPedido.CERRADO || nuevoEstado == EstadoPedido.CANCELADO) {
    maestrosClient.cambiarEstadoMesa(pedido.getMesaId(), "LIBRE");
}
```

### Regla 6: Baja lógica (no se borra, se desactiva)
```java
// En CategoriaService.eliminar()
public void eliminar(Long id) {
    Categoria categoria = findById(id);
    categoria.setActivo(false);  // No se borra de la BD
    categoriaRepository.save(categoria);
}
```

### Regla 7: No se permiten nombres duplicados en categorías
```java
if (categoriaRepository.existsByNombreIgnoreCase(request.getNombre())) {
    throw new BusinessException("Ya existe una categoría con ese nombre");
}
```

---

## Modelo de estados de mesa

```
         ┌─────────────────────────────┐
         │                             │
    ┌────▼────┐     CREAR PEDIDO    ┌──┴──────┐
    │  LIBRE  │───────────────────▶│ OCUPADA │
    └────┬────┘                    └──┬──────┘
         │                           │
         │◀──── CERRAR/CANCELAR ─────┘
         │
    ┌────▼────────┐
    │  RESERVADA  │ (se puede reservar anticipadamente)
    └─────────────┘
```

---

## Modelo de estados de pedido

```
                ┌────────────┐
                │   ABIERTO  │ ← Mesero toma el pedido
                └─────┬──────┘
                      │ Cocina empieza a preparar
                ┌─────▼──────┐
                │ EN_PROCESO │
                └─────┬──────┘
                      │ Platos listos para servir
                ┌─────▼──────┐
                │   LISTO    │
                └─────┬──────┘
                      │ Cajero cobra
                ┌─────▼──────┐
                │  CERRADO   │ ← Mesa se libera
                └────────────┘
                      
          (desde cualquier estado)
                ┌───────────┐
                │ CANCELADO │ ← Mesa se libera
                └───────────┘
```

---

## Respuesta estándar de la API

Todos los endpoints devuelven el mismo formato:

```json
{
    "success": true,
    "message": "Pedido creado",
    "data": {
        "id": 1,
        "mesaId": 3,
        "estado": "ABIERTO",
        "total": 89.00,
        "detalles": [...]
    },
    "timestamp": "2024-01-15T10:30:00"
}
```

En caso de error:
```json
{
    "success": false,
    "error": "La mesa 3 no está disponible",
    "timestamp": "2024-01-15T10:30:00"
}
```

---

## Multi-tenant (TenantContext)

El sistema está preparado para manejar múltiples restaurantes. Cada petición HTTP puede llevar un header `X-Tenant-ID` para identificar a qué restaurante pertenece:

```java
// TenantInterceptor extrae el tenant de cada petición
@Override
public boolean preHandle(HttpServletRequest request, ...) {
    String tenantId = request.getHeader("X-Tenant-ID");
    if (tenantId != null) {
        TenantContext.setTenantId(tenantId);
    }
    return true;
}

// En el servicio, puedes usar:
String tenant = TenantContext.getTenantId();
```
