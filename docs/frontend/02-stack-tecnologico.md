# 🛠️ Stack Tecnológico — Frontend

## Resumen rápido

| Tecnología | Versión | Para qué sirve |
|---|---|---|
| Angular | 20 | Framework principal SPA |
| TypeScript | 5.8 | Tipado estático sobre JavaScript |
| Ionic Angular | 8 | Componentes UI móviles/web |
| Capacitor | 7 | Compilar como app móvil nativa |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| AG Grid | 34 | Tablas de datos avanzadas |
| Chart.js + ng2-charts | 4.5 / 8 | Gráficos y dashboards |
| RxJS | 7.8 | Programación reactiva (Observables) |
| Angular Signals | 20 | Estado reactivo moderno |
| crypto-js | 4.2 | Cifrado del token en localStorage |
| date-fns | 3.6 | Formateo de fechas |
| xlsx | 0.18 | Exportar datos a Excel |
| lottie-web | 5.12 | Animaciones |
| FontAwesome | 6.5 | Iconos profesionales |
| Karma + Jasmine | — | Tests unitarios |
| ESLint | 8.x | Análisis estático de código |

---

## Angular 20 — El framework principal

Angular es un framework MVC completo para construir SPAs (Single Page Applications). A diferencia de React (librería), Angular provee todo lo necesario: routing, formularios, HTTP, inyección de dependencias.

**¿Qué hace Angular?**
- Mantiene la UI sincronizada con el estado de la aplicación
- Gestiona el routing sin recargar la página
- Inyecta dependencias automáticamente
- Compila TypeScript a JavaScript optimizado

**Standalone Components (Angular 15+):**
```typescript
// Ya no se necesitan NgModules para componentes simples
@Component({
  selector: 'app-productos',
  standalone: true,            // ← Sin módulo padre
  imports: [AgGridAngular, IonContent],  // ← Importa directamente
  template: `...`
})
export class ProductosComponent { }
```

---

## TypeScript 5.8 — JavaScript con tipos

TypeScript detecta errores en tiempo de desarrollo, antes de que lleguen al usuario:

```typescript
// JavaScript: falla en runtime
function calcularTotal(pedido) {
  return pedido.detalles.reduce((acc, d) => acc + d.subtotal, 0);
  // Error si pedido.detalles es undefined → falla en producción
}

// TypeScript: falla en compilación
function calcularTotal(pedido: Pedido): number {
  return pedido.detalles.reduce((acc, d) => acc + d.subtotal, 0);
  // TypeScript garantiza que detalles existe y es un array
}
```

---

## Angular Signals — Estado reactivo moderno

Signals reemplaza a RxJS para gestión de estado local. Son más simples y predecibles:

```typescript
// Signal Store en AuthStoreService
@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  // Estado privado
  private _user = signal<CurrentUser | null>(null);
  
  // Computados derivados (se actualizan automáticamente)
  readonly isAuthenticated = computed(() => !!this._user());
  readonly token           = computed(() => this._user()?.token ?? null);
  
  // Actualizar el estado
  setUser(user: CurrentUser) { this._user.set(user); }
}
```

**¿Por qué Signals en vez de solo RxJS?**
- Más simple para estado local (no necesitas subscribe/unsubscribe)
- Angular re-renderiza SOLO el componente que usa el signal modificado
- Los `computed()` son lazy: solo calculan cuando se necesitan

---

## Facade Pattern — Simplificar la UI

Las Facades actúan como "intermediarias inteligentes" entre los componentes y la lógica de negocio:

```
Component ──▶ Facade ──▶ UseCase ──▶ Repository (HTTP)
                   └──▶ Store (Signal)
```

```typescript
@Injectable({ providedIn: 'root' })
export class MaestrosFacade {
  // El componente solo ve estas propiedades simples
  readonly productos = this.store.productos;  // Signal
  readonly loading   = this.store.loading;    // Signal
  
  loadProductos(): void {
    this.store.setLoading(true);
    this.adapter.getProductos().subscribe({
      next: list => { this.store.setProductos(list); this.store.setLoading(false); },
      error: err  => { this.store.setError(err.message); this.store.setLoading(false); }
    });
  }
}
```

---

## Ionic Angular 8 — Componentes UI

Ionic proporciona componentes UI que funcionan igual en web, iOS y Android:

| Componente | Equivalente web | Para qué |
|---|---|---|
| `ion-content` | `<div>` con scroll | Área de contenido scrollable |
| `ion-header` | `<header>` | Cabecera de página |
| `ion-toolbar` | `<div class="toolbar">` | Barra de acciones |
| `ion-card` | `<div class="card">` | Tarjeta con sombra |
| `ion-button` | `<button>` | Botón con estilos Ionic |
| `ion-spinner` | CSS animation | Indicador de carga |

---

## AG Grid 34 — Tablas empresariales

AG Grid es la librería de tablas más potente para Angular. Usamos la versión Community (gratuita) con el nuevo **Theming API**:

```typescript
// Definimos el tema una sola vez y lo reutilizamos
export const restaurantTheme = themeQuartz.withParams({
  headerBackgroundColor: '#1e293b',  // Header oscuro
  rowHoverColor: '#fff7ed',          // Hover naranja claro
  accentColor: '#f97316',            // Naranja primario
});

// En el componente de tabla reutilizable
<ag-grid-angular [theme]="restaurantTheme" [rowData]="datos" [columnDefs]="cols" />
```

**Características usadas:**
- Paginación automática
- Filtro por columna
- Ordenamiento
- Quick filter (búsqueda global)
- Cell renderers personalizados (badges, botones)

---

## Chart.js + ng2-charts — Gráficos

Chart.js dibuja gráficos en un elemento `<canvas>`. ng2-charts es el wrapper Angular:

```typescript
// Dashboard usa dos tipos de gráfico
doughnutData: ChartData<'doughnut'> = {
  labels: ['Abierto', 'En Proceso', 'Listo', 'Cerrado'],
  datasets: [{ data: [5, 3, 2, 10], backgroundColor: ['#f97316', '#3b82f6', ...] }]
};

// En el template
<canvas baseChart [data]="doughnutData" type="doughnut"></canvas>
```

**Integración con Signals:**
```typescript
constructor() {
  // effect() re-ejecuta cada vez que cambia ventasFacade.pedidos()
  effect(() => {
    const pedidos = this.ventasFacade.pedidos();
    // Actualiza el gráfico automáticamente cuando hay nuevos pedidos
    this.doughnutData = { ...this.doughnutData, datasets: [{ data: calcular(pedidos) }] };
  });
}
```

---

## crypto-js — Token seguro en localStorage

El token JWT se cifra antes de guardarlo en localStorage para dificultar el robo por XSS:

```typescript
import AES from 'crypto-js/aes';

setUser(user: CurrentUser): void {
  const encToken = AES.encrypt(user.token, 'r3st@ur@nt-k3y-2024').toString();
  localStorage.setItem('r_token', encToken);
  // En memoria se guarda el token real (para uso inmediato)
  this._user.set(user);
}

private hydrate(): CurrentUser | null {
  const stored = JSON.parse(localStorage.getItem('r_user'));
  // Al rehidratar, descifra el token
  stored.token = AES.decrypt(stored.token, 'r3st@ur@nt-k3y-2024').toString(Utf8);
  return stored;
}
```

---

## date-fns — Fechas en español

```typescript
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// En el dashboard
hoy = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });
// Resultado: "sábado 7 de junio 2025"

// En la tabla de pedidos
format(new Date(p.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es });
// Resultado: "07/06/2025 14:30"
```

---

## Design Tokens — `tokens.scss`

**Todos los colores del sistema están en un solo archivo:**
`src/app/core/design/tokens.scss`

```scss
// Colores de marca
$color-primary:      #f97316;  // Naranja principal
$color-primary-dark: #ea580c;  // Naranja oscuro (hover)
$color-primary-50:   #fff7ed;  // Naranja muy claro (backgrounds)

// Para usar en cualquier componente:
.mi-boton {
  background: var(--primary);      // CSS Custom Property
  &:hover { background: var(--primary-dark); }
}
```

**¿Por qué centralizar colores?**
Si el cliente cambia el naranja a azul, cambias un solo archivo y se actualiza TODO el sistema.
