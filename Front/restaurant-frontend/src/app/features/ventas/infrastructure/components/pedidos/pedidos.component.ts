import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { VentasFacade } from '../../../application/facades/ventas.facade';
import { MaestrosFacade } from '../../../../../features/maestros/application/facades/maestros.facade';
import { Pedido } from '../../../domain/models/ventas.model';
import { AppTableComponent } from '../../../../../shared/components/ui/app-table/app-table.component';

interface DetalleForm { productoId: number; cantidad: number; notas: string; }

const ESTADO_BADGE: Record<string, string> = {
  ABIERTO:    '<span class="badge badge-info">Abierto</span>',
  EN_PROCESO: '<span class="badge badge-warning">En proceso</span>',
  LISTO:      '<span class="badge badge-success">Listo</span>',
  CERRADO:    '<span class="badge badge-gray">Cerrado</span>',
  CANCELADO:  '<span class="badge badge-danger">Cancelado</span>'
};

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [AppTableComponent, ReactiveFormsModule],
  styles: [`
    :host { display:block; height:100%; overflow-y:auto; background:#f8fafc; }
    .page { padding:24px; }

    /* Modal overlay */
    .overlay {
      position:fixed; inset:0; z-index:999;
      background:rgba(15,23,42,.45); backdrop-filter:blur(3px);
      display:flex; align-items:center; justify-content:center; padding:16px;
    }
    .modal {
      background:#fff; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,.18);
      width:100%; max-width:520px; max-height:90vh; overflow-y:auto; padding:28px;
    }
    .modal-title {
      font-size:18px; font-weight:800; color:#0f172a; margin:0 0 20px;
      padding-bottom:16px; border-bottom:1px solid #f1f5f9;
    }

    /* Form elements */
    .field-label { display:block; font-size:11px; font-weight:700; color:#64748b; margin-bottom:6px; letter-spacing:.05em; text-transform:uppercase; }
    .field {
      width:100%; border:1.5px solid #e2e8f0; border-radius:10px;
      padding:10px 14px; font-size:14px; color:#1e293b; background:#fff;
      transition:border-color .15s; box-sizing:border-box; font-family:inherit;
    }
    .field:focus { outline:none; border-color:#f97316; box-shadow:0 0 0 3px rgba(249,115,22,.12); }
    .field-group { margin-bottom:16px; }

    /* Detalle row */
    .det-row {
      display:flex; gap:8px; align-items:center;
      background:#f8fafc; border:1px solid #f1f5f9; border-radius:10px;
      padding:10px; margin-bottom:8px;
    }
    .det-row select { flex:1; }
    .det-row input[type="number"] { width:72px; text-align:center; }
    .det-remove { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:16px; padding:4px; line-height:1; }
    .det-remove:hover { color:#ef4444; }

    /* Buttons */
    .btn-add-det {
      font-size:12px; font-weight:700; color:#f97316; background:none; border:none;
      cursor:pointer; padding:0; display:flex; align-items:center; gap:4px;
    }
    .btn-add-det:hover { color:#ea580c; }
    .btn-cancel {
      padding:10px 20px; font-size:14px; color:#64748b; background:#f8fafc;
      border:1.5px solid #e2e8f0; border-radius:10px; cursor:pointer; font-family:inherit;
      transition:all .15s; font-weight:600;
    }
    .btn-cancel:hover { background:#f1f5f9; }
    .btn-submit {
      padding:10px 24px; font-size:14px; font-weight:700; color:#fff;
      background:linear-gradient(135deg,#f97316,#ea580c);
      border:none; border-radius:10px; cursor:pointer; font-family:inherit;
      transition:all .15s; box-shadow:0 4px 12px rgba(249,115,22,.3);
    }
    .btn-submit:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(249,115,22,.4); }
    .btn-submit:disabled { opacity:.6; cursor:not-allowed; transform:none; }

    /* Total */
    .total-box {
      display:flex; justify-content:space-between; align-items:center;
      background:#fff7ed; border:1px solid #fed7aa; border-radius:10px;
      padding:10px 14px; margin:12px 0;
    }

    /* Error / empty */
    .error-msg { color:#ef4444; font-size:13px; font-weight:600; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
    .empty-det {
      text-align:center; padding:20px; border:1.5px dashed #e2e8f0;
      border-radius:10px; color:#94a3b8; font-size:13px; margin-bottom:8px;
    }
  `],
  template: `
    <div class="page">
      <app-table
        title="Pedidos"
        [subtitle]="subtitulo()"
        addLabel="Nuevo pedido"
        [rowData]="facade.pedidos()"
        [columnDefs]="cols"
        [loading]="facade.loading()"
        height="520px"
        (refresh)="facade.loadPedidos()"
        (add)="abrirModal()" />
    </div>

    <!-- Modal nuevo pedido -->
    @if (showModal()) {
      <div class="overlay" (click)="cerrarModal()">
        <div class="modal" (click)="$event.stopPropagation()">

          <p class="modal-title">Nuevo pedido</p>

          <form [formGroup]="form" (ngSubmit)="crearPedido()">

            <!-- Mesa -->
            <div class="field-group">
              <label class="field-label">Mesa *</label>
              <select formControlName="mesaId" class="field">
                <option value="">Seleccionar mesa libre...</option>
                @for (mesa of maestros.mesasLibres(); track mesa.id) {
                  <option [value]="mesa.id">Mesa {{ mesa.numero }} — {{ mesa.capacidad }} personas</option>
                }
              </select>
              @if (maestros.mesasLibres().length === 0) {
                <p style="font-size:12px;color:#f97316;margin:4px 0 0">No hay mesas libres disponibles</p>
              }
            </div>

            <!-- Observaciones -->
            <div class="field-group">
              <label class="field-label">Observaciones</label>
              <textarea formControlName="observaciones" rows="2"
                placeholder="Alergias, preferencias..."
                class="field" style="resize:none"></textarea>
            </div>

            <!-- Detalles / Productos -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <label class="field-label" style="margin:0">Productos *</label>
              <button type="button" class="btn-add-det" (click)="agregarDetalle()">
                + Agregar producto
              </button>
            </div>

            @if (detalles().length === 0) {
              <div class="empty-det">Agrega al menos un producto al pedido</div>
            }

            @for (det of detalles(); track $index) {
              <div class="det-row">
                <select [value]="det.productoId" class="field"
                  (change)="actualizarDetalle($index, 'productoId', $any($event.target).value)">
                  <option value="0">Seleccionar...</option>
                  @for (prod of maestros.productosDisponibles(); track prod.id) {
                    <option [value]="prod.id">{{ prod.nombre }} — S/. {{ prod.precio.toFixed(2) }}</option>
                  }
                </select>
                <input type="number" min="1" [value]="det.cantidad" class="field"
                  (input)="actualizarDetalle($index, 'cantidad', $any($event.target).value)" />
                <button type="button" class="det-remove" (click)="quitarDetalle($index)">✕</button>
              </div>
            }

            @if (totalEstimado() > 0) {
              <div class="total-box">
                <span style="font-size:13px;font-weight:700;color:#92400e">Total estimado</span>
                <span style="font-size:16px;font-weight:800;color:#f97316">S/. {{ totalEstimado().toFixed(2) }}</span>
              </div>
            }

            @if (errorForm()) {
              <div class="error-msg">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ errorForm() }}
              </div>
            }

            <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:4px;margin-top:8px;border-top:1px solid #f1f5f9">
              <button type="button" class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-submit" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Crear pedido' }}
              </button>
            </div>

          </form>
        </div>
      </div>
    }
  `
})
export class PedidosComponent implements OnInit {
  facade   = inject(VentasFacade);
  maestros = inject(MaestrosFacade);
  private fb = inject(FormBuilder);

  showModal = signal(false);
  guardando = signal(false);
  detalles  = signal<DetalleForm[]>([]);
  errorForm = signal('');

  form = this.fb.group({
    mesaId:        ['', Validators.required],
    observaciones: [''],
  });

  subtitulo = computed(() =>
    `${this.facade.pedidos().length} total · ${this.facade.pedidosAbiertos().length} abiertos`
  );

  totalEstimado = computed(() => {
    const prods = this.maestros.productosDisponibles();
    return this.detalles().reduce((acc, det) => {
      const prod = prods.find(p => p.id === det.productoId);
      return acc + (prod ? prod.precio * det.cantidad : 0);
    }, 0);
  });

  cols: ColDef<Pedido>[] = [
    { field: 'id', headerName: '#', width: 70, pinned: 'left' },
    { field: 'mesaId', headerName: 'Mesa', width: 90,
      cellRenderer: (p: ICellRendererParams) =>
        `<span style="font-weight:700;color:#f97316">Mesa ${p.value}</span>` },
    { field: 'estado', headerName: 'Estado', width: 140,
      cellRenderer: (p: ICellRendererParams) => ESTADO_BADGE[p.value] ?? p.value },
    { field: 'total', headerName: 'Total', width: 120,
      cellRenderer: (p: ICellRendererParams) =>
        `<span style="font-weight:600;color:#334155">S/. ${(p.value ?? 0).toFixed(2)}</span>` },
    { field: 'fechaCreacion', headerName: 'Fecha', flex: 1,
      valueFormatter: p => p.value
        ? format(new Date(p.value), 'dd/MM/yyyy HH:mm', { locale: es }) : '' },
    { field: 'observaciones', headerName: 'Observaciones', flex: 1,
      cellRenderer: (p: ICellRendererParams) =>
        p.value
          ? `<span style="color:#64748b;font-size:12px">${p.value}</span>`
          : '<span style="color:#cbd5e1">—</span>' },
    { headerName: 'Acciones', width: 210, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: ICellRendererParams<Pedido>) => {
        const e = p.data?.estado;
        if (e === 'ABIERTO') return `
          <div style="display:flex;gap:6px;align-items:center;height:100%">
            <button data-id="${p.data?.id}" data-action="procesar"
              class="badge badge-info" style="cursor:pointer">▶ Procesar</button>
            <button data-id="${p.data?.id}" data-action="cancelar"
              class="badge badge-danger" style="cursor:pointer">✕ Cancelar</button>
          </div>`;
        if (e === 'EN_PROCESO') return `
          <div style="display:flex;gap:6px;align-items:center;height:100%">
            <button data-id="${p.data?.id}" data-action="listo"
              class="badge badge-success" style="cursor:pointer">✔ Listo</button>
            <button data-id="${p.data?.id}" data-action="cancelar"
              class="badge badge-danger" style="cursor:pointer">✕ Cancelar</button>
          </div>`;
        if (e === 'LISTO') return `
          <div style="display:flex;gap:6px;align-items:center;height:100%">
            <button data-id="${p.data?.id}" data-action="cerrar"
              class="badge badge-warning" style="cursor:pointer">💰 Cerrar</button>
          </div>`;
        return '<span style="color:#cbd5e1;font-size:12px">—</span>';
      },
      onCellClicked: (p) => {
        const btn = (p.event?.target as HTMLElement)?.closest('[data-action]') as HTMLElement;
        if (!btn) return;
        const id = Number(btn.dataset['id']);
        const action = btn.dataset['action'];
        if (action === 'procesar') this.facade.cambiarEstado(id, 'EN_PROCESO');
        if (action === 'listo')    this.facade.cambiarEstado(id, 'LISTO');
        if (action === 'cancelar') this.facade.cambiarEstado(id, 'CANCELADO');
        if (action === 'cerrar')   this.facade.cambiarEstado(id, 'CERRADO');
      }
    }
  ];

  ngOnInit(): void {
    this.facade.loadPedidos();
    this.maestros.loadMesas();
    this.maestros.loadProductos();
  }

  abrirModal(): void {
    this.form.reset();
    this.detalles.set([{ productoId: 0, cantidad: 1, notas: '' }]);
    this.errorForm.set('');
    this.guardando.set(false);
    this.showModal.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.showModal.set(false);
    this.detalles.set([]);
  }

  agregarDetalle(): void {
    this.detalles.update(d => [...d, { productoId: 0, cantidad: 1, notas: '' }]);
  }

  quitarDetalle(i: number): void {
    this.detalles.update(d => d.filter((_, idx) => idx !== i));
  }

  actualizarDetalle(i: number, campo: keyof DetalleForm, valor: string): void {
    this.detalles.update(d => {
      const copy = [...d];
      copy[i] = { ...copy[i], [campo]: campo === 'notas' ? valor : Number(valor) };
      return copy;
    });
  }

  crearPedido(): void {
    this.errorForm.set('');
    if (this.form.invalid) {
      this.errorForm.set('Selecciona una mesa para el pedido.');
      return;
    }
    const detallesValidos = this.detalles().filter(d => d.productoId > 0 && d.cantidad > 0);
    if (!detallesValidos.length) {
      this.errorForm.set('Agrega al menos un producto al pedido.');
      return;
    }

    this.guardando.set(true);
    const v = this.form.getRawValue();
    this.facade.createPedido({
      mesaId:        Number(v.mesaId),
      observaciones: v.observaciones || undefined,
      detalles:      detallesValidos.map(d => ({
        productoId: d.productoId,
        cantidad:   d.cantidad,
        notas:      d.notas || undefined,
      })),
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.showModal.set(false);
        this.detalles.set([]);
        this.facade.loadPedidos();
        this.maestros.loadMesas();
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err?.error?.error ?? err?.error?.message ?? err?.message ?? 'Error al crear el pedido. Verifica que el servidor esté disponible.';
        this.errorForm.set(msg);
      }
    });
  }
}
