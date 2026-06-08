import {
  Component, OnInit, inject, signal, computed,
  ElementRef, ViewChild, effect
} from '@angular/core';
import { MaestrosFacade } from '../../../application/facades/maestros.facade';
import { Mesa } from '../../../domain/models/maestros.model';

interface DragState {
  mesaId: number;
  startMouseX: number;
  startMouseY: number;
  startPosX: number;
  startPosY: number;
}

const STORAGE_KEY = 'restaurant_mesa_layout';
const TABLE_W = 120;
const TABLE_H = 130;

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [],
  styles: [`
    .page { display: flex; flex-direction: column; height: 100%; background: #f8fafc; }

    /* ── Toolbar ── */
    .toolbar {
      display: flex; align-items: center;
      justify-content: space-between; gap: 12px;
      padding: 14px 20px;
      background: white;
      border-bottom: 1px solid #f0f2f5;
      flex-shrink: 0; flex-wrap: wrap;
    }
    .toolbar-left  { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .toolbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    .page-title { font-size: 16px; font-weight: 800; color: #1e293b; margin: 0; }
    .page-sub   { font-size: 11.5px; color: #94a3b8; margin: 2px 0 0; }

    /* ── KPI chips ── */
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 11px; border-radius: 999px;
      font-size: 11.5px; font-weight: 600; border: 1px solid;
    }
    .chip .dot { width: 7px; height: 7px; border-radius: 50%; }
    .chip-libre     { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
    .chip-libre     .dot { background: #22c55e; }
    .chip-ocupada   { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
    .chip-ocupada   .dot { background: #f97316; }
    .chip-reservada { background: #fefce8; border-color: #fde68a; color: #92400e; }
    .chip-reservada .dot { background: #f59e0b; }

    /* ── Botones ── */
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 9px;
      font-size: 12px; font-weight: 600; border: none; cursor: pointer;
      transition: all .15s;
    }
    .btn-reset  { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
    .btn-reset:hover { background: #e2e8f0; }
    .btn-edit   { background: #f97316; color: white; box-shadow: 0 2px 8px rgba(249,115,22,.3); }
    .btn-edit:hover   { background: #ea580c; }
    .btn-edit.on { background: #1e293b; box-shadow: 0 2px 8px rgba(0,0,0,.2); }

    /* ── Edit banner ── */
    .edit-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 20px;
      background: #fff7ed; border-bottom: 1px solid #fed7aa;
      font-size: 12px; color: #c2410c; font-weight: 500;
      flex-shrink: 0;
    }

    /* ── Floor plan ── */
    .floor-wrap {
      flex: 1; overflow: auto; padding: 20px;
    }

    .floor-plan {
      position: relative;
      min-width: 860px; min-height: 580px;
      border-radius: 16px;
      border: 2px solid #e8ecf0;
      background-color: #fafbfc;
      background-image:
        linear-gradient(rgba(148,163,184,.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,.1) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .floor-plan::before {
      content: '';
      position: absolute; inset: 10px;
      border: 1.5px dashed rgba(148,163,184,.2);
      border-radius: 10px;
      pointer-events: none;
    }

    /* ── Mesa card ── */
    .mesa-card {
      position: absolute;
      width: 120px;
      user-select: none;
      transition: filter .12s, transform .12s;
    }
    .mesa-card.editable { cursor: grab; }
    .mesa-card.editable:hover { z-index: 50; }
    .mesa-card.dragging {
      cursor: grabbing; z-index: 100;
      filter: drop-shadow(0 10px 24px rgba(0,0,0,.18));
      transform: scale(1.07) rotate(1.5deg);
    }

    /* Inner card */
    .mesa-inner {
      display: flex; flex-direction: column; align-items: center;
      padding: 16px 10px 14px;
      border-radius: 18px;
      border: 2px solid transparent;
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,.07);
      transition: all .15s;
      position: relative;
      text-align: center;
    }
    .mesa-card:not(.dragging):hover .mesa-inner {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,.1);
    }

    /* Colores por estado */
    .estado-LIBRE     .mesa-inner { border-color: #86efac; background: linear-gradient(145deg,#f0fdf4,#fff); }
    .estado-OCUPADA   .mesa-inner { border-color: #fdba74; background: linear-gradient(145deg,#fff7ed,#fff); }
    .estado-RESERVADA .mesa-inner { border-color: #fde047; background: linear-gradient(145deg,#fefce8,#fff); }

    /* Icono estado (burbuja esquina) */
    .estado-badge {
      position: absolute; top: -8px; right: -8px;
      width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; border: 2.5px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,.12);
      color: white; font-weight: 700;
    }
    .estado-LIBRE     .estado-badge { background: #22c55e; }
    .estado-OCUPADA   .estado-badge { background: #f97316; }
    .estado-RESERVADA .estado-badge { background: #f59e0b; }

    /* Número mesa */
    .mesa-num {
      font-size: 28px; font-weight: 900; line-height: 1;
    }
    .estado-LIBRE     .mesa-num { color: #16a34a; }
    .estado-OCUPADA   .mesa-num { color: #ea580c; }
    .estado-RESERVADA .mesa-num { color: #d97706; }

    .mesa-name {
      font-size: 9px; font-weight: 700; letter-spacing: .07em;
      text-transform: uppercase; margin-top: 2px;
      color: #cbd5e1;
    }

    .mesa-cap {
      display: flex; align-items: center; gap: 3px;
      margin-top: 8px; font-size: 11px; color: #94a3b8; font-weight: 500;
    }

    /* Acciones rápidas */
    .mesa-actions {
      display: flex; gap: 4px; margin-top: 8px;
      justify-content: center;
    }
    .act-btn {
      padding: 3px 9px; border-radius: 6px;
      font-size: 9.5px; font-weight: 700;
      border: none; cursor: pointer; transition: all .1s;
    }
    .act-libre   { background: #dcfce7; color: #15803d; }
    .act-libre:hover   { background: #22c55e; color: white; }
    .act-ocupar  { background: #ffedd5; color: #c2410c; }
    .act-ocupar:hover  { background: #f97316; color: white; }

    /* Hint drag */
    .drag-hint {
      text-align: center; margin-top: 6px;
      font-size: 9px; font-weight: 700;
      color: #cbd5e1; letter-spacing: .04em;
      opacity: 0; transition: opacity .15s;
    }
    .mesa-card.editable:hover .drag-hint { opacity: 1; }

    /* Empty state */
    .empty {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 10px; color: #cbd5e1;
    }
    .empty svg { width: 48px; height: 48px; }
    .empty p { font-size: 14px; font-weight: 500; }
  `],
  template: `
    <div class="page">

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div>
            <p class="page-title">🍽️ Plano del restaurante</p>
            <p class="page-sub">{{ facade.mesas().length }} mesas · Arrastra para reposicionar</p>
          </div>
          <div class="chips">
            <span class="chip chip-libre">
              <span class="dot"></span>{{ contar('LIBRE') }} Libres
            </span>
            <span class="chip chip-ocupada">
              <span class="dot"></span>{{ contar('OCUPADA') }} Ocupadas
            </span>
            <span class="chip chip-reservada">
              <span class="dot"></span>{{ contar('RESERVADA') }} Reservadas
            </span>
          </div>
        </div>

        <div class="toolbar-right">
          <button class="btn btn-reset" (click)="resetLayout()">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Restablecer
          </button>
          <button class="btn btn-edit" [class.on]="editMode()" (click)="editMode.set(!editMode())">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
            {{ editMode() ? '✓ Guardado' : 'Editar plano' }}
          </button>
        </div>
      </div>

      <!-- Banner edición -->
      @if (editMode()) {
        <div class="edit-banner">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Modo edición activo — arrastra las mesas para reposicionarlas. Las posiciones se guardan automáticamente.
        </div>
      }

      <!-- Plano -->
      <div class="floor-wrap">
        <div class="floor-plan" #floorPlan
             (mousemove)="onMove($event)"
             (mouseup)="onUp()"
             (mouseleave)="onUp()">

          @if (!facade.mesas().length) {
            <div class="empty">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p>No hay mesas registradas</p>
            </div>
          }

          @for (m of mesasPos(); track m.id) {
            <div class="mesa-card"
                 [class]="'estado-' + m.estado"
                 [class.editable]="editMode()"
                 [class.dragging]="dragId() === m.id"
                 [style.left.px]="m.x"
                 [style.top.px]="m.y"
                 (mousedown)="onDown($event, m)">

              <div class="mesa-inner">
                <span class="estado-badge">
                  {{ m.estado === 'LIBRE' ? '✓' : m.estado === 'OCUPADA' ? '●' : '◆' }}
                </span>
                <div class="mesa-num">{{ m.numero }}</div>
                <div class="mesa-name">Mesa</div>
                <div class="mesa-cap">
                  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ m.capacidad }} pers.
                </div>

                @if (!editMode()) {
                  <div class="mesa-actions">
                    @if (m.estado !== 'LIBRE') {
                      <button class="act-btn act-libre" (click)="cambiar(m, 'LIBRE')">Liberar</button>
                    }
                    @if (m.estado === 'LIBRE') {
                      <button class="act-btn act-ocupar" (click)="cambiar(m, 'OCUPADA')">Ocupar</button>
                    }
                  </div>
                }
              </div>

              @if (editMode()) {
                <div class="drag-hint">✥ MOVER</div>
              }

            </div>
          }

        </div>
      </div>
    </div>
  `
})
export class MesasComponent implements OnInit {
  facade  = inject(MaestrosFacade);
  editMode = signal(false);
  dragId   = signal<number | null>(null);

  private _positions = signal<Record<number, { x: number; y: number }>>({});
  private _drag: DragState | null = null;

  @ViewChild('floorPlan') floorEl!: ElementRef<HTMLDivElement>;

  mesasPos = computed(() =>
    this.facade.mesas().map(m => ({
      ...m,
      x: this._positions()[m.id!]?.x ?? 0,
      y: this._positions()[m.id!]?.y ?? 0
    }))
  );

  constructor() {
    effect(() => {
      const mesas = this.facade.mesas();
      if (!mesas.length) return;
      const saved = this.load();
      this._positions.set(
        saved && Object.keys(saved).length ? saved : this.defaultLayout(mesas)
      );
    });
  }

  ngOnInit(): void { this.facade.loadMesas(); }

  contar(e: string): number { return this.facade.mesas().filter(m => m.estado === e).length; }

  cambiar(m: { id?: number }, estado: Mesa['estado']): void {
    this.facade.cambiarEstadoMesa(m.id!, estado);
  }

  // ── Drag ──
  onDown(ev: MouseEvent, m: { id?: number; x: number; y: number }): void {
    if (!this.editMode()) return;
    ev.preventDefault();
    this._drag = { mesaId: m.id!, startMouseX: ev.clientX, startMouseY: ev.clientY, startPosX: m.x, startPosY: m.y };
    this.dragId.set(m.id!);
  }

  onMove(ev: MouseEvent): void {
    if (!this._drag) return;
    ev.preventDefault();
    const el  = this.floorEl?.nativeElement;
    const maxX = el ? el.offsetWidth  - TABLE_W  : 800;
    const maxY = el ? el.offsetHeight - TABLE_H  : 500;
    const x = Math.max(10, Math.min(maxX, this._drag.startPosX + ev.clientX - this._drag.startMouseX));
    const y = Math.max(10, Math.min(maxY, this._drag.startPosY + ev.clientY - this._drag.startMouseY));
    this._positions.update(p => ({ ...p, [this._drag!.mesaId]: { x, y } }));
  }

  onUp(): void {
    if (!this._drag) return;
    this.save();
    this._drag = null;
    this.dragId.set(null);
  }

  resetLayout(): void {
    const layout = this.defaultLayout(this.facade.mesas());
    this._positions.set(layout);
    this.save();
  }

  private save(): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(this._positions())); }

  private load(): Record<number, { x: number; y: number }> | null {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  }

  private defaultLayout(mesas: Mesa[]): Record<number, { x: number; y: number }> {
    const cols = 4;
    return Object.fromEntries(
      mesas.map((m, i) => [m.id!, { x: 40 + (i % cols) * 160, y: 40 + Math.floor(i / cols) * 180 }])
    );
  }
}
