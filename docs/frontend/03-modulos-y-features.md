# 📦 Módulos y Features del Frontend

## Mapa de la aplicación

```
http://localhost:4200/
│
├── /auth/login              → LoginComponent
│
├── /ventas/dashboard        → DashboardComponent   (protegido)
├── /ventas/pedidos          → PedidosComponent     (protegido)
│
├── /maestros/mesas          → MesasComponent       (protegido)
├── /maestros/productos      → ProductosComponent   (protegido)
│
└── /reportes                → ReportesComponent    (protegido)
```

---

## Feature: Auth

**Ubicación:** `src/app/features/auth/`

**Responsabilidad:** Login, registro de usuarios y gestión del token JWT.

### Componentes

**`LoginComponent`**
- Formulario reactivo con validación
- Llama a `AuthFacade.login()`
- Muestra errores del servidor en tiempo real
- Redirige al dashboard si el login es exitoso

### Flujo de autenticación

```
Usuario escribe credenciales
        │
        ▼
LoginComponent.onSubmit()
        │
        ▼
AuthFacade.login(request)
        │
        ▼
LoginUseCase.execute(request)
        │
        ▼
AuthHttpAdapter → POST /api/auth/login
        │
        ▼ (respuesta del backend)
AuthStoreService.setUser(user)
  - Cifra token con crypto-js
  - Guarda en localStorage
  - Actualiza signal _user
        │
        ▼ (reactividad automática)
Router.navigate('/ventas/dashboard')
```

---

## Feature: Maestros

**Ubicación:** `src/app/features/maestros/`

**Responsabilidad:** CRUD de los catálogos del restaurante.

### `MesasComponent` — El plano del restaurante

El componente más interesante del sistema. Implementa un **drag & drop nativo** sin librerías externas:

```typescript
// Estado de la mesa con posición
interface MesaConPos extends Mesa {
  x: number;  // Posición horizontal en el plano (px)
  y: number;  // Posición vertical en el plano (px)
}

// Drag manual con eventos del mouse
onDown(ev: MouseEvent, mesa: MesaConPos): void {
  this._drag = { mesaId: mesa.id, startMouseX: ev.clientX, ... };
}

onMove(ev: MouseEvent): void {
  // Calcula la nueva posición relativa al contenedor
  const x = this._drag.startPosX + ev.clientX - this._drag.startMouseX;
  this._positions.update(pos => ({ ...pos, [this._drag.mesaId]: { x, y } }));
}

onUp(): void {
  localStorage.setItem('restaurant_mesa_layout', JSON.stringify(this._positions()));
  this._drag = null;
}
```

**Características:**
- Plano con cuadrícula CSS tipo suelo de restaurante
- Mesas con color según estado (verde/naranja/amarillo)
- Posiciones persistidas en `localStorage`
- Modo edición: activa drag & drop
- Modo normal: hover muestra acciones (Liberar/Ocupar)
- Botón "Restablecer" vuelve al layout por defecto

### `ProductosComponent`

Usa el componente **reutilizable** `AppTableComponent`:

```typescript
<app-table
  title="Productos del menú"
  addLabel="Nuevo producto"
  [rowData]="facade.productos()"    ← Signal reactivo
  [columnDefs]="cols"
  [loading]="facade.loading()"      ← Muestra spinner automáticamente
  (refresh)="facade.loadProductos()"
  (add)="nuevo()" />
```

---

## Feature: Ventas

**Ubicación:** `src/app/features/ventas/`

### `DashboardComponent`

Página principal con indicadores clave del negocio:

**KPI Cards (usando `KpiCardComponent`):**
- Total de pedidos
- Pedidos abiertos
- Ingresos de pedidos cerrados
- Mesas libres disponibles

**Gráficos (Chart.js):**
- Doughnut: distribución de pedidos por estado
- Bar: ingresos por día (últimos 7 días)

**Estado de mesas:** Mini-plano con colores de estado

**Reactivo con `effect()`:**
```typescript
constructor() {
  // Cada vez que cambian los pedidos, el gráfico se actualiza solo
  effect(() => {
    const pedidos = this.ventasFacade.pedidos();
    this.doughnutData = { ...this.doughnutData,
      datasets: [{ data: ['ABIERTO','EN_PROCESO','LISTO','CERRADO','CANCELADO']
        .map(e => pedidos.filter(p => p.estado === e).length) }]
    };
  });
}
```

### `PedidosComponent`

Tabla completa de pedidos con acciones integradas:

```typescript
// Cell renderer con botones de acción
{ headerName: 'Acciones',
  onCellClicked: (p) => {
    const btn = (p.event?.target as HTMLElement)?.closest('[data-action]');
    const action = btn.dataset['action'];
    if (action === 'procesar') this.facade.cambiarEstado(id, 'EN_PROCESO');
    if (action === 'cancelar') this.facade.cambiarEstado(id, 'CANCELADO');
    if (action === 'cerrar')   this.facade.cambiarEstado(id, 'CERRADO');
  }
}
```

---

## Feature: Reportes

**Ubicación:** `src/app/features/reportes/`

Permite descargar reportes PDF generados por `ms-reportes` (JasperReports) y exportar a Excel con `xlsx`:

```typescript
// Descarga PDF del backend
descargarVentas(): void {
  this.http.get('/api/reportes/ventas/pdf', { responseType: 'blob' })
    .subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'ventas.pdf'; a.click();
    });
}

// Exporta Excel en el cliente (sin backend)
exportarExcel(): void {
  import('xlsx').then(XLSX => {
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, 'ventas.xlsx');
  });
}
```

---

## Componentes compartidos (`shared/`)

### `AppTableComponent`
Wrapper reutilizable sobre AG Grid con:
- Toolbar con título, búsqueda rápida, botón refresh y botón de acción
- Loading spinner integrado
- Búsqueda en tiempo real (quickFilterText)
- Paginación con 10/20/50 registros
- Tema naranja personalizado (Theming API de AG Grid v34)

**Uso:**
```html
<app-table
  title="Pedidos"
  addLabel="Nuevo pedido"
  [rowData]="pedidos()"
  [columnDefs]="cols"
  [loading]="loading()"
  (refresh)="reload()"
  (add)="nuevo()" />
```

### `KpiCardComponent`
Card de métrica reutilizable:
```html
<app-kpi-card
  icon="💰"
  label="Ingresos del día"
  prefix="S/."
  [value]="totalIngresos() | number:'1.2-2'"
  bg="#f0fdf4" />
```

### `LottieLoaderComponent`
Animación de carga usando `lottie-web`:
```html
<app-lottie-loader message="Cargando pedidos..." />
```
