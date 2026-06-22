import { Injectable, inject } from '@angular/core';
import { MaestrosStoreService } from '../../infrastructure/stores/maestros.store';
import { MaestrosHttpAdapter } from '../../infrastructure/adapters/maestros-http.adapter';
import { Categoria, Producto, Mesa, Cliente } from '../../domain/models/maestros.model';

@Injectable({ providedIn: 'root' })
export class MaestrosFacade {
  private store   = inject(MaestrosStoreService);
  private adapter = inject(MaestrosHttpAdapter);

  // Signals expuestos a los componentes
  readonly categorias           = this.store.categorias;
  readonly productos            = this.store.productos;
  readonly mesas                = this.store.mesas;
  readonly clientes             = this.store.clientes;
  readonly mesasLibres          = this.store.mesasLibres;
  readonly productosDisponibles = this.store.productosDisponibles;
  readonly loading              = this.store.loading;
  readonly error                = this.store.error;

  // Categorías
  loadCategorias(): void {
    this.store.setLoading(true);
    this.adapter.getCategorias().subscribe({
      next: list => { this.store.setCategorias(list); this.store.setLoading(false); },
      error: err  => { this.store.setError(err.message); this.store.setLoading(false); }
    });
  }
  createCategoria(data: Categoria): void {
    this.adapter.createCategoria(data).subscribe({ next: () => this.loadCategorias() });
  }
  deleteCategoria(id: number): void {
    this.adapter.deleteCategoria(id).subscribe({ next: () => this.loadCategorias() });
  }

  // Productos
  loadProductos(): void {
    this.store.setLoading(true);
    this.adapter.getProductos().subscribe({
      next: list => { this.store.setProductos(list); this.store.setLoading(false); },
      error: err  => { this.store.setError(err.message); this.store.setLoading(false); }
    });
  }
  createProducto(data: Producto): void {
    this.adapter.createProducto(data).subscribe({ next: () => this.loadProductos() });
  }
  updateProducto(id: number, data: Producto): void {
    this.adapter.updateProducto(id, data).subscribe({ next: () => this.loadProductos() });
  }
  deleteProducto(id: number): void {
    this.adapter.deleteProducto(id).subscribe({ next: () => this.loadProductos() });
  }

  // Mesas
  loadMesas(): void {
    this.store.setLoading(true);
    this.adapter.getMesas().subscribe({
      next: list => { this.store.setMesas(list); this.store.setLoading(false); },
      error: err  => { this.store.setError(err.message); this.store.setLoading(false); }
    });
  }
  cambiarEstadoMesa(id: number, estado: Mesa['estado']): void {
    this.adapter.cambiarEstadoMesa(id, estado).subscribe({
      next: () => this.store.actualizarEstadoMesa(id, estado)
    });
  }

  // Clientes
  loadClientes(): void {
    this.adapter.getClientes().subscribe({ next: list => this.store.setClientes(list) });
  }
  createCliente(data: Cliente): void {
    this.adapter.createCliente(data).subscribe({ next: () => this.loadClientes() });
  }
}
