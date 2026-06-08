# 🌱 Flyway y Datos de Prueba (Seeds)

## ¿Qué es Flyway?

Flyway es una herramienta de **control de versiones para la base de datos**. Igual que Git versiona el código, Flyway versiona los cambios en la BD.

Al arrancar el microservicio, Flyway:
1. Revisa qué migraciones ya se aplicaron (tabla `flyway_schema_history`)
2. Aplica las pendientes en orden
3. Registra cada migración aplicada

---

## Convención de nombres

```
V{version}__{descripcion}.sql
│                │
│                └── Descripción (dos guiones bajos)
└── Número de versión (V mayúscula)

Ejemplos:
  V1__create_maestros.sql     ← Crea las tablas
  V2__seed_maestros.sql       ← Inserta datos de prueba
  V3__add_stock_column.sql    ← (futura migración)
```

**Regla de oro:** Un archivo de migración NUNCA se modifica después de aplicarse. Si necesitas cambiar algo, creas un nuevo archivo V3.

---

## Migraciones del proyecto

### `ms-auth-security`
| Archivo | Contenido |
|---|---|
| `V1__create_usuarios.sql` | Crea tabla `usuarios` |
| `V2__seed_usuarios.sql` | Inserta 4 usuarios (admin, cajero, mesero, cocinero) |

### `ms-core-maestros`
| Archivo | Contenido |
|---|---|
| `V1__create_maestros.sql` | Crea tablas + 4 categorías base + 5 mesas básicas |
| `V2__seed_maestros.sql` | 10 categorías + 32 productos + 12 mesas + 8 clientes |

### `ms-ventas`
| Archivo | Contenido |
|---|---|
| `V1__create_ventas.sql` | Crea tablas `pedidos` y `detalles_pedido` |
| `V2__seed_ventas.sql` | 5 pedidos de ejemplo con sus detalles |

---

## ¿Cómo funciona Flyway?

```
Microservicio arranca
        │
        ▼
Flyway lee la tabla flyway_schema_history:
┌────────────┬──────────────────────────┬────────────┐
│  version   │        description       │   success  │
├────────────┼──────────────────────────┼────────────┤
│     1      │  create_maestros         │    true    │
│     2      │  seed_maestros           │    true    │
└────────────┴──────────────────────────┴────────────┘
        │
        ▼
Compara con los archivos .sql disponibles
        │
        ▼
Si hay archivos nuevos (V3, V4...) → los aplica
Si no hay nuevos → arranca normalmente
```

---

## Seed para pruebas (perfil `test`)

Para tests de integración con Testcontainers, en vez de Flyway, se usa un `TestDataSeeder`:

```java
@Component
@Profile("test")  // Solo activo con @ActiveProfiles("test")
@RequiredArgsConstructor
public class TestDataSeeder implements ApplicationRunner {
    
    @Override
    public void run(ApplicationArguments args) {
        seedCategorias();
        seedProductos();
        seedMesas();
        seedClientes();
    }
    
    private void seedCategorias() {
        if (categoriaRepo.count() > 0) return;  // Idempotente: no duplica
        categoriaRepo.save(Categoria.builder().nombre("Entradas").build());
        // ...
    }
}
```

**¿Por qué no usar Flyway en tests?**
- Los tests crean y destruyen la BD en cada ejecución (`ddl-auto: create-drop`)
- Flyway mantiene historial y daría conflictos entre ejecuciones
- El `TestDataSeeder` es más flexible y programático

---

## Datos de prueba incluidos

Al arrancar por primera vez con las BDs vacías, los seeds cargan automáticamente:

### Usuarios (db_auth)
```
admin    / admin123    → ADMIN
cajero   / cajero123   → CAJERO
mesero   / mesero123   → MESERO
cocinero / cocinero123 → COCINERO
```

### Productos de ejemplo (db_maestros)
| Categoría | Productos |
|---|---|
| Entradas | Ceviche Clásico (S/.32), Causa Rellena (S/.18), Anticuchos (S/.22), Papa a la Huancaína (S/.14) |
| Platos Principales | Lomo Saltado (S/.42), Ají de Gallina (S/.35), Arroz con Pollo (S/.30) |
| Carnes | Pollo a la Brasa (S/.48), Churrasco de Res (S/.58) |
| Bebidas | Inca Kola (S/.8), Chicha Morada (S/.7), Agua Mineral (S/.5) |
| Postres | Arroz con Leche (S/.12), Suspiro Limeño (S/.14), Torta de Chocolate (S/.16) |

### Mesas (db_maestros)
```
Mesas 1-2:   capacidad 2 personas (mesas de pareja)
Mesas 3-6:   capacidad 4 personas (mesas familiares)
Mesas 7-9:   capacidad 6 personas (mesas grupales)
Mesas 10-11: capacidad 8 personas (mesas grandes)
Mesa 12:     capacidad 10 personas (mesa larga)
```

### Pedidos de ejemplo (db_ventas)
```
Pedido 1: Mesa 3, CERRADO, S/.89 (histórico)
Pedido 2: Mesa 5, ABIERTO, S/.112 (en curso)
Pedido 3: Mesa 7, EN_PROCESO, S/.156 (en cocina)
Pedido 4: Mesa 2, CERRADO, S/.44 (histórico)
Pedido 5: Mesa 10, ABIERTO, S/.278 (grupo grande, cumpleaños)
```
