import { Component, OnInit, inject, signal } from '@angular/core';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaestrosFacade } from '../../../application/facades/maestros.facade';
import { Producto } from '../../../domain/models/maestros.model';
import { AppTableComponent } from '../../../../../shared/components/ui/app-table/app-table.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [AppTableComponent, ReactiveFormsModule],
  styles: [`
    :host { display:block; height:100%; overflow-y:auto; background:#f8fafc; }
    .page { padding:24px; }

    .overlay {
      position:fixed; inset:0; z-index:999;
      background:rgba(15,23,42,.45); backdrop-filter:blur(3px);
      display:flex; align-items:center; justify-content:center; padding:16px;
    }
    .modal {
      background:#fff; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,.18);
      width:100%; max-width:460px; padding:28px;
    }
    .modal-title {
      font-size:18px; font-weight:800; color:#0f172a; margin:0 0 20px;
      padding-bottom:16px; border-bottom:1px solid #f1f5f9;
    }

    .field-label { display:block; font-size:11px; font-weight:700; color:#64748b; margin-bottom:6px; letter-spacing:.05em; text-transform:uppercase; }
    .field {
      width:100%; border:1.5px solid #e2e8f0; border-radius:10px;
      padding:10px 14px; font-size:14px; color:#1e293b; background:#fff;
      transition:border-color .15s; box-sizing:border-box; font-family:inherit;
    }
    .field:focus { outline:none; border-color:#f97316; box-shadow:0 0 0 3px rgba(249,115,22,.12); }
    .field-group { margin-bottom:14px; }

    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

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
    .btn-submit:hover { transform:translateY(-1px); }
    .btn-submit:disabled { opacity:.6; cursor:not-allowed; transform:none; }
    .btn-delete {
      padding:10px 20px; font-size:14px; font-weight:700; color:#fff;
      background:#ef4444; border:none; border-radius:10px;
      cursor:pointer; font-family:inherit; transition:all .15s;
    }
    .btn-delete:hover { background:#dc2626; }

    .error-msg { color:#ef4444; font-size:13px; font-weight:600; margin-bottom:12px; }
  `],
  template: `
    <div class="page">
      <app-table
        title="Productos del menú"
        subtitle="Gestiona los productos disponibles para los pedidos"
        addLabel="Nuevo producto"
        [rowData]="facade.productos()"
        [columnDefs]="cols"
        [loading]="facade.loading()"
        height="500px"
        (refresh)="facade.loadProductos()"
        (add)="abrirModal()" />
    </div>

    <!-- Modal crear/editar -->
    @if (showModal()) {
      <div class="overlay" (click)="cerrarModal()">
        <div class="modal" (click)="$event.stopPropagation()">

          <p class="modal-title">{{ editando() ? 'Editar producto' : 'Nuevo producto' }}</p>

          <form [formGroup]="form" (ngSubmit)="guardar()">

            <div class="field-group">
              <label class="field-label">Nombre *</label>
              <input formControlName="nombre" type="text" class="field" placeholder="Ej: Lomo saltado" />
            </div>

            <div class="field-group">
              <label class="field-label">Descripción</label>
              <textarea formControlName="descripcion" rows="2" class="field"
                placeholder="Descripción opcional..." style="resize:none"></textarea>
            </div>

            <div class="grid-2">
              <div class="field-group">
                <label class="field-label">Precio (S/.) *</label>
                <input formControlName="precio" type="number" step="0.01" min="0.01"
                  class="field" placeholder="0.00" />
              </div>
              <div class="field-group">
                <label class="field-label">Categoría *</label>
                <select formControlName="categoriaId" class="field">
                  <option value="">Seleccionar...</option>
                  @for (cat of facade.categorias(); track cat.id) {
                    <option [value]="cat.id">{{ cat.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="field-group" style="display:flex;align-items:center;gap:10px;cursor:pointer">
              <input formControlName="disponible" type="checkbox"
                style="width:18px;height:18px;accent-color:#f97316;cursor:pointer" />
              <span style="font-size:14px;color:#334155;font-weight:500">Disponible en menú</span>
            </div>

            @if (errorForm()) {
              <p class="error-msg">{{ errorForm() }}</p>
            }

            <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:8px;border-top:1px solid #f1f5f9;margin-top:4px">
              <button type="button" class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-submit" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : (editando() ? 'Guardar cambios' : 'Crear producto') }}
              </button>
            </div>

          </form>
        </div>
      </div>
    }

    <!-- Confirmar eliminación -->
    @if (deletingId() !== null) {
      <div class="overlay">
        <div class="modal" style="max-width:380px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">🗑️</div>
          <p style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 8px">¿Eliminar producto?</p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">Esta acción no se puede deshacer.</p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn-cancel" (click)="deletingId.set(null)">Cancelar</button>
            <button class="btn-delete" (click)="confirmarEliminar()">Sí, eliminar</button>
          </div>
        </div>
      </div>
    }
  `
})
export class ProductosComponent implements OnInit {
  facade    = inject(MaestrosFacade);
  private fb = inject(FormBuilder);

  showModal  = signal(false);
  guardando  = signal(false);
  editando   = signal<Producto | null>(null);
  deletingId = signal<number | null>(null);
  errorForm  = signal('');

  form = this.fb.group({
    nombre:      ['', Validators.required],
    descripcion: [''],
    precio:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    disponible:  [true],
    categoriaId: ['', Validators.required],
  });

  cols: ColDef<Producto>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'nombre', headerName: 'Producto', flex: 2,
      cellRenderer: (p: ICellRendererParams) =>
        `<span style="font-weight:600;color:#1e293b">${p.value}</span>` },
    { field: 'categoriaNombre', headerName: 'Categoría', flex: 1,
      cellRenderer: (p: ICellRendererParams) =>
        `<span class="badge badge-info">${p.value ?? '—'}</span>` },
    { field: 'precio', headerName: 'Precio', width: 110,
      cellRenderer: (p: ICellRendererParams) =>
        `<span style="font-weight:700;color:#f97316">S/. ${(p.value ?? 0).toFixed(2)}</span>` },
    { field: 'disponible', headerName: 'Estado', width: 110,
      cellRenderer: (p: ICellRendererParams) =>
        p.value
          ? '<span class="badge badge-success">✓ Activo</span>'
          : '<span class="badge badge-danger">✗ Inactivo</span>' },
    { field: 'descripcion', headerName: 'Descripción', flex: 2,
      cellRenderer: (p: ICellRendererParams) =>
        p.value
          ? `<span style="font-size:12px;color:#64748b">${p.value}</span>`
          : '<span style="font-size:12px;color:#cbd5e1">—</span>' },
    { headerName: 'Acciones', width: 160, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: ICellRendererParams<Producto>) =>
        `<div style="display:flex;gap:6px;align-items:center;height:100%">
          <button data-action="edit" data-id="${p.data?.id}"
            class="badge badge-info" style="cursor:pointer">✏️ Editar</button>
          <button data-action="delete" data-id="${p.data?.id}"
            class="badge badge-danger" style="cursor:pointer">🗑️ Eliminar</button>
        </div>`,
      onCellClicked: (p) => {
        const btn = (p.event?.target as HTMLElement)?.closest('[data-action]') as HTMLElement;
        if (!btn) return;
        const id = Number(btn.dataset['id']);
        if (btn.dataset['action'] === 'edit') {
          const prod = this.facade.productos().find(pr => pr.id === id);
          if (prod) this.abrirModal(prod);
        }
        if (btn.dataset['action'] === 'delete') this.deletingId.set(id);
      }
    }
  ];

  ngOnInit(): void {
    this.facade.loadProductos();
    this.facade.loadCategorias();
  }

  abrirModal(producto?: Producto): void {
    this.editando.set(producto ?? null);
    this.errorForm.set('');
    this.guardando.set(false);
    this.form.reset({
      nombre:      producto?.nombre      ?? '',
      descripcion: producto?.descripcion ?? '',
      precio:      producto?.precio      ?? null,
      disponible:  producto?.disponible  ?? true,
      categoriaId: producto?.categoriaId?.toString() ?? '',
    });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.showModal.set(false);
    this.editando.set(null);
    this.form.reset();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorForm.set('Completa los campos requeridos.');
      return;
    }
    this.errorForm.set('');
    this.guardando.set(true);

    const v = this.form.getRawValue();
    const payload: Producto = {
      nombre:      v.nombre!,
      descripcion: v.descripcion ?? '',
      precio:      Number(v.precio),
      disponible:  v.disponible ?? true,
      categoriaId: Number(v.categoriaId),
    };

    const editando = this.editando();
    if (editando?.id) {
      this.facade.updateProducto(editando.id, payload);
      this.guardando.set(false);
      this.cerrarModal();
    } else {
      this.facade.createProducto(payload);
      this.guardando.set(false);
      this.cerrarModal();
    }
  }

  confirmarEliminar(): void {
    const id = this.deletingId();
    if (id !== null) {
      this.facade.deleteProducto(id);
      this.deletingId.set(null);
    }
  }
}
