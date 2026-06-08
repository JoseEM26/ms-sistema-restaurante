# 🗄️ Modelo de Datos

## Bases de datos del sistema

Cada microservicio tiene su **propia base de datos**. Este es el principio de "database per service" en microservicios.

| Microservicio | Base de datos | Tablas |
|---|---|---|
| ms-auth-security | `db_auth` | `usuarios` |
| ms-core-maestros | `db_maestros` | `categorias`, `productos`, `mesas`, `clientes` |
| ms-ventas | `db_ventas` | `pedidos`, `detalles_pedido` |

---

## `db_auth` — Usuarios del sistema

```sql
CREATE TABLE usuarios (
    id         BIGSERIAL    PRIMARY KEY,
    username   VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,      -- BCrypt hash, NUNCA texto plano
    email      VARCHAR(150) NOT NULL UNIQUE,
    rol        VARCHAR(20)  NOT NULL,      -- ADMIN, CAJERO, MESERO, COCINERO
    activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

**Usuarios seed:**
| username | password | rol |
|---|---|---|
| admin | admin123 | ADMIN |
| cajero | cajero123 | CAJERO |
| mesero | mesero123 | MESERO |
| cocinero | cocinero123 | COCINERO |

---

## `db_maestros` — Catálogos

### Diagrama de relaciones

```
┌─────────────────┐         ┌──────────────────────────┐
│   categorias    │         │         productos         │
├─────────────────┤         ├──────────────────────────┤
│ id (PK)         │◄───┐    │ id (PK)                  │
│ nombre (UNIQUE) │    │    │ nombre                    │
│ descripcion     │    └────│ categoria_id (FK)         │
│ activo          │         │ precio (NUMERIC 10,2)     │
│ created_at      │         │ descripcion               │
│ updated_at      │         │ disponible (BOOL)         │
└─────────────────┘         │ activo                    │
                            │ created_at / updated_at   │
                            └──────────────────────────┘

┌──────────────────┐        ┌──────────────────────────┐
│      mesas       │        │        clientes           │
├──────────────────┤        ├──────────────────────────┤
│ id (PK)          │        │ id (PK)                   │
│ numero (UNIQUE)  │        │ nombre                    │
│ capacidad        │        │ apellido                  │
│ estado           │        │ telefono                  │
│   LIBRE          │        │ email (UNIQUE)            │
│   OCUPADA        │        │ activo                    │
│   RESERVADA      │        │ created_at / updated_at   │
│ activo           │        └──────────────────────────┘
│ created_at       │
└──────────────────┘
```

**Datos seed:**
- 10 categorías (Entradas, Sopas, Platos Principales, Carnes, Mariscos, Pasta, Bebidas, Bebidas Calientes, Postres, Menú del Día)
- 32 productos con precios reales de restaurante peruano
- 12 mesas (de 2 a 10 personas)
- 8 clientes de ejemplo

---

## `db_ventas` — Pedidos

```
┌──────────────────────────────────┐
│             pedidos              │
├──────────────────────────────────┤
│ id (PK)                          │
│ mesa_id     ← ID de db_maestros  │
│ cliente_id  ← ID de db_maestros  │
│ estado  (ABIERTO|EN_PROCESO|     │
│          LISTO|CERRADO|CANCELADO)│
│ total (NUMERIC 10,2)             │
│ observaciones                    │
│ activo                           │
│ created_at / updated_at          │
└────────────────┬─────────────────┘
                 │ 1:N
                 ▼
┌──────────────────────────────────┐
│          detalles_pedido         │
├──────────────────────────────────┤
│ id (PK)                          │
│ pedido_id (FK → pedidos.id)      │
│ producto_id   ← ID de db_maestros│
│ producto_nombre ← Snapshot       │
│ cantidad                         │
│ precio_unitario ← Snapshot       │
│ subtotal (= cantidad × precio)   │
│ notas                            │
└──────────────────────────────────┘
```

**¿Por qué `mesa_id` y `cliente_id` no son FK a db_maestros?**
Porque son bases de datos separadas. No puedes tener FK entre diferentes instancias de PostgreSQL. En su lugar, cada microservicio es responsable de validar que el ID existe (usando Feign).

**¿Por qué `producto_nombre` y `precio_unitario` en el detalle?**
Son "snapshots" del momento del pedido. Si el precio del producto cambia mañana, el pedido histórico debe mostrar el precio de cuando se hizo.

---

## Campo `activo` — Baja lógica

Ninguna entidad se borra físicamente de la BD. En cambio, se desactiva:

```sql
-- Baja lógica (lo que hace el sistema)
UPDATE categorias SET activo = false WHERE id = 5;

-- Baja física (lo que NO hacemos)
DELETE FROM categorias WHERE id = 5;
```

**Ventajas:**
- Auditoría completa: puedes ver todo lo que existió
- Recuperación: puedes reactivar si fue un error
- Integridad: los pedidos históricos siguen referenciando el producto aunque esté "eliminado"
