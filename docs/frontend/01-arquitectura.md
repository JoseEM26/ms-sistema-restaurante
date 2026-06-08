# 🏗️ Arquitectura del Frontend — Angular 20

## ¿Qué es Clean Architecture en el frontend?

Clean Architecture organiza el código en capas con una regla fundamental: **las capas internas no conocen a las capas externas**. El dominio (la lógica de negocio) no sabe nada de Angular, HTTP, o el navegador.

```
┌────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE                         │
│   Components (UI), HTTP Adapters, Stores (Signal)      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              APPLICATION                         │  │
│  │        Use Cases, Facades, Orchestration         │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │                DOMAIN                      │  │  │
│  │  │   Models (interfaces), Ports (abstracts)   │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Regla de dependencias:** Las flechas siempre apuntan hacia adentro. Infrastructure → Application → Domain.

---

## Estructura de carpetas

```
src/app/
├── core/                       ← Singleton: servicios globales
│   ├── design/
│   │   └── tokens.scss         ← TODOS los colores y tokens de diseño
│   ├── guards/
│   │   └── auth.guard.ts       ← Protege rutas que requieren login
│   ├── interceptors/
│   │   └── auth.interceptor.ts ← Agrega JWT a cada petición HTTP
│   └── models/
│       └── api-response.model.ts ← Formato estándar de respuesta
│
├── shared/                     ← Componentes reutilizables
│   └── components/ui/
│       ├── app-table/          ← Tabla AG Grid con toolbar
│       ├── kpi-card/           ← Card de métrica (KPI)
│       └── lottie-loader/      ← Animación de carga
│
└── features/                   ← Un directorio por funcionalidad
    ├── auth/
    │   ├── domain/
    │   │   ├── models/         ← LoginRequest, AuthResponse (interfaces puras)
    │   │   └── ports/          ← AuthRepository (abstract class)
    │   ├── application/
    │   │   ├── usecases/       ← LoginUseCase, RegisterUseCase
    │   │   └── facades/        ← AuthFacade (simplifica la UI)
    │   └── infrastructure/
    │       ├── adapters/       ← AuthHttpAdapter (implementa el puerto con HTTP)
    │       ├── stores/         ← AuthStoreService (estado con Signals)
    │       └── components/     ← LoginComponent (UI)
    │
    ├── maestros/               ← Misma estructura
    ├── ventas/                 ← Misma estructura
    └── reportes/               ← Misma estructura
```

---

## ¿Por qué esta estructura?

### Sin Clean Architecture (código espagueti):
```typescript
// El componente hace TODO
@Component({...})
export class ProductosComponent {
  productos = signal([]);
  
  constructor(private http: HttpClient) {
    // Lógica de negocio mezclada con HTTP mezclada con UI
    this.http.get('/api/maestros/productos').subscribe(r => {
      if (r.success && r.data.length > 0) {
        this.productos.set(r.data.filter(p => p.disponible));
      }
    });
  }
}
```

### Con Clean Architecture:
```typescript
// Dominio: solo interfaces, sin dependencias
interface Producto { id: number; nombre: string; precio: number; }
abstract class ProductoRepository {
  abstract getProductos(): Observable<Producto[]>;
}

// Infraestructura: implementación HTTP
@Injectable({ providedIn: 'root' })
class ProductoHttpAdapter implements ProductoRepository {
  getProductos(): Observable<Producto[]> {
    return this.http.get('/api/maestros/productos').pipe(map(r => r.data));
  }
}

// Facade: simplifica para la UI
@Injectable({ providedIn: 'root' })
class MaestrosFacade {
  readonly productos = this.store.productos; // Signal
  loadProductos() { this.adapter.getProductos().subscribe(...); }
}

// Componente: solo UI, delega todo a la Facade
@Component({...})
class ProductosComponent {
  facade = inject(MaestrosFacade);
  ngOnInit() { this.facade.loadProductos(); }
}
```

---

## Flujo de datos en la aplicación

```
Usuario hace clic
      │
      ▼
Component (UI)
  └─ llama a Facade.metodo()
            │
            ▼
         Facade (Application)
           ├─ llama a UseCase
           ├─ actualiza Store (Signal)
           └─ llama a Adapter (HTTP)
                      │
                      ▼
               HTTP Adapter (Infrastructure)
                 └─ HttpClient → API Gateway
                                      │
                                      ▼
                              Microservicio Backend
                                      │
                                      ▼ (respuesta)
               HTTP Adapter recibe datos
                      │
                      ▼
               Store.set(datos)
                      │
                      ▼ (reactividad automática)
Component se actualiza en pantalla
```

---

## Routing — Lazy loading

Cada feature carga sus componentes de forma lazy (solo cuando el usuario navega a esa ruta):

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'ventas',
    canActivate: [authGuard],    // ← Solo si está autenticado
    loadChildren: () =>
      import('./features/ventas/ventas.routes')  // ← Carga lazy
        .then(m => m.VENTAS_ROUTES)
  }
];
```

**Beneficio:** El bundle inicial de la app es pequeño. Solo se descarga el código de `ventas` cuando el usuario navega a esa sección.
