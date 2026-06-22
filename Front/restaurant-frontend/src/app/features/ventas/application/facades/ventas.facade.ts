import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { VentasStoreService } from '../../infrastructure/stores/ventas.store';
import { VentasHttpAdapter } from '../../infrastructure/adapters/ventas-http.adapter';
import { Pedido, PedidoRequest } from '../../domain/models/ventas.model';

@Injectable({ providedIn: 'root' })
export class VentasFacade {
  private store   = inject(VentasStoreService);
  private adapter = inject(VentasHttpAdapter);

  readonly pedidos         = this.store.pedidos;
  readonly pedidosAbiertos = this.store.pedidosAbiertos;
  readonly totalIngresos   = this.store.totalIngresos;
  readonly loading         = this.store.loading;
  readonly error           = this.store.error;

  loadPedidos(): void {
    this.store.setLoading(true);
    this.adapter.getPedidos().subscribe({
      next: list => { this.store.setPedidos(list); this.store.setLoading(false); },
      error: err  => { this.store.setError(err.message); this.store.setLoading(false); }
    });
  }

  createPedido(data: PedidoRequest): Observable<Pedido> {
    return this.adapter.createPedido(data);
  }

  cambiarEstado(id: number, estado: Pedido['estado']): void {
    this.adapter.cambiarEstado(id, estado).subscribe({
      next: () => this.store.actualizarEstado(id, estado)
    });
  }
}
