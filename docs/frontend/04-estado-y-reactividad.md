# ⚡ Estado y Reactividad — Signals + Facades

## ¿Qué es el estado?

El "estado" es cualquier dato que cambia con el tiempo y que la UI necesita reflejar. Por ejemplo: la lista de pedidos, si el usuario está logueado, si hay un error visible.

## Angular Signals vs RxJS

| Aspecto | Signals | RxJS Observable |
|---|---|---|
| Complejidad | Baja | Media-Alta |
| Uso ideal | Estado local/global | Streams de eventos, HTTP |
| Subscription | No necesita (automático) | Requiere subscribe/unsubscribe |
| Debugging | Más fácil | Más complejo |
| Performance | Granular (solo re-renderiza lo necesario) | Depende de la implementación |

**En este proyecto:** Usamos **Signals para el estado** y **RxJS para las llamadas HTTP** (Observables del HttpClient).

---

## Signal Store Pattern

Cada feature tiene su propio Store con Signals privados:

```typescript
@Injectable({ providedIn: 'root' })
export class VentasStoreService {
  // ── Estado privado (no accesible desde fuera) ──
  private _pedidos  = signal<Pedido[]>([]);
  private _loading  = signal(false);
  private _error    = signal<string | null>(null);

  // ── API pública readonly ──
  readonly pedidos          = this._pedidos.asReadonly();  // No se puede mutar desde fuera
  readonly loading          = this._loading.asReadonly();
  readonly error            = this._error.asReadonly();
  
  // ── Computed: derivados automáticos ──
  readonly pedidosAbiertos  = computed(() =>
    this._pedidos().filter(p => p.estado === 'ABIERTO')
  );
  readonly totalIngresos    = computed(() =>
    this._pedidos()
      .filter(p => p.estado === 'CERRADO')
      .reduce((acc, p) => acc + p.total, 0)
  );

  // ── Mutadores ──
  setPedidos(list: Pedido[])  { this._pedidos.set(list); }
  setLoading(v: boolean)      { this._loading.set(v); }
  setError(e: string | null)  { this._error.set(e); }
  
  // ── Actualizaciones parciales ──
  actualizarEstado(id: number, estado: Pedido['estado']): void {
    this._pedidos.update(list =>
      list.map(p => p.id === id ? { ...p, estado } : p)
    );
    // No necesita hacer un GET al backend, actualiza solo el elemento
  }
}
```

---

## `computed()` — Valores derivados

Los `computed()` se recalculan automáticamente cuando cambia algún signal del que dependen:

```typescript
// Si _pedidos cambia → pedidosAbiertos se recalcula automáticamente
readonly pedidosAbiertos = computed(() =>
  this._pedidos().filter(p => p.estado === 'ABIERTO')
);

// Si _user cambia → isAuthenticated y token se actualizan solos
readonly isAuthenticated = computed(() => !!this._user());
readonly token           = computed(() => this._user()?.token ?? null);
```

**¿Cuándo se calcula?** Solo cuando alguien lo lee. Si nadie usa `pedidosAbiertos`, no se calcula (lazy).

---

## `effect()` — Reaccionar a cambios

`effect()` ejecuta código como efecto secundario cuando un signal cambia:

```typescript
// En DashboardComponent
constructor() {
  effect(() => {
    // Este bloque se ejecuta CADA VEZ que ventasFacade.pedidos() cambia
    const pedidos = this.ventasFacade.pedidos();
    
    // Actualiza el gráfico doughnut automáticamente
    this.doughnutData = {
      ...this.doughnutData,
      datasets: [{
        ...this.doughnutData.datasets[0],
        data: ['ABIERTO','EN_PROCESO','LISTO','CERRADO','CANCELADO']
          .map(e => pedidos.filter(p => p.estado === e).length)
      }]
    };
  });
}
```

---

## Flujo completo de estado — Ejemplo: Cambiar estado de mesa

```
1. Usuario hace clic en "Ocupar" en una mesa
         │
         ▼
2. MesasComponent.cambiar(mesa, 'OCUPADA')
         │
         ▼
3. MaestrosFacade.cambiarEstadoMesa(id, 'OCUPADA')
         │
         ├── Llama a MaestrosHttpAdapter.cambiarEstadoMesa(id, 'OCUPADA')
         │     └── PATCH /api/maestros/mesas/{id}/estado?estado=OCUPADA
         │
         └── On success:
               MaestrosStoreService.actualizarEstadoMesa(id, 'OCUPADA')
                 └── _mesas.update(...)   ← Modifica el signal
                         │
                         ▼ (reactividad automática)
4. MesasComponent detecta el cambio en facade.mesas()
         │
         ▼
5. La UI se actualiza: la mesa muestra el nuevo estado OCUPADA
   (sin hacer otro GET al backend)
```

---

## Interceptor de autenticación

Cada petición HTTP pasa por `authInterceptor` que agrega el JWT automáticamente:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStoreService);
  const token     = authStore.token();  // Lee el signal del token

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend devuelve 401 → cerrar sesión automáticamente
      if (error.status === 401) {
        authStore.logout();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
```

---

## Guard de autenticación

Protege rutas que requieren login:

```typescript
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router    = inject(Router);

  if (authStore.isAuthenticated()) return true;  // El signal devuelve true

  router.navigate(['/auth/login']);
  return false;
};
```

Si el usuario intenta acceder a `/ventas/pedidos` sin estar logueado, el guard lo redirige al login.
