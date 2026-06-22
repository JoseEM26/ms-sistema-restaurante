import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [],
  styles: [`
    :host { display:block; height:100%; overflow-y:auto; background:#f8fafc; }
    .page { padding:28px; }
    .page-title { font-size:22px; font-weight:800; color:#0f172a; margin:0 0 6px; }
    .page-sub   { font-size:14px; color:#64748b; margin:0 0 28px; }

    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }

    .card {
      background:#fff; border-radius:20px; padding:24px;
      border:1px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.05);
      display:flex; flex-direction:column; gap:0;
      transition:box-shadow .2s, transform .2s;
    }
    .card:hover { box-shadow:0 8px 24px rgba(0,0,0,.1); transform:translateY(-2px); }

    .card-icon { font-size:40px; margin-bottom:14px; }
    .card-title { font-size:16px; font-weight:800; color:#0f172a; margin:0 0 6px; }
    .card-desc  { font-size:13px; color:#64748b; margin:0 0 20px; flex:1; }

    .btn {
      display:flex; align-items:center; justify-content:center; gap:8px;
      padding:12px 20px; border:none; border-radius:12px; font-size:14px;
      font-weight:700; cursor:pointer; font-family:inherit;
      transition:all .15s; box-shadow:0 3px 10px rgba(0,0,0,.12);
    }
    .btn:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(0,0,0,.15); }
    .btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
    .btn-orange { background:linear-gradient(135deg,#f97316,#ea580c); color:#fff; }
    .btn-teal   { background:linear-gradient(135deg,#0d9488,#0f766e); color:#fff; }
    .btn-green  { background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff; }

    .spinner {
      width:16px; height:16px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite;
      display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    .error-banner {
      background:#fef2f2; border:1px solid #fecaca; border-radius:12px;
      padding:14px 18px; color:#dc2626; font-size:13px; font-weight:600;
      margin-bottom:20px; display:flex; align-items:center; gap:8px;
    }
  `],
  template: `
    <div class="page">
      <h1 class="page-title">Reportes</h1>
      <p class="page-sub">Genera y descarga reportes del restaurante en PDF o Excel</p>

      @if (errorMsg()) {
        <div class="error-banner">
          ⚠️ {{ errorMsg() }}
        </div>
      }

      <div class="grid">

        <!-- Reporte Ventas -->
        <div class="card">
          <div class="card-icon">📊</div>
          <p class="card-title">Reporte de Ventas</p>
          <p class="card-desc">Resumen de todas las ventas cerradas del mes actual en PDF.</p>
          <button class="btn btn-orange" [disabled]="loadingVentas()" (click)="descargarVentas()">
            @if (loadingVentas()) {
              <span class="spinner"></span> Generando...
            } @else {
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Descargar PDF
            }
          </button>
        </div>

        <!-- Reporte Pedidos -->
        <div class="card">
          <div class="card-icon">🧾</div>
          <p class="card-title">Reporte de Pedidos</p>
          <p class="card-desc">Listado de todos los pedidos del día de hoy en PDF.</p>
          <button class="btn btn-teal" [disabled]="loadingPedidos()" (click)="descargarPedidos()">
            @if (loadingPedidos()) {
              <span class="spinner"></span> Generando...
            } @else {
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Descargar PDF
            }
          </button>
        </div>

        <!-- Exportar Excel -->
        <div class="card">
          <div class="card-icon">📗</div>
          <p class="card-title">Exportar a Excel</p>
          <p class="card-desc">Exporta un resumen de ventas en formato .xlsx para análisis.</p>
          <button class="btn btn-green" (click)="exportarExcel()">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Exportar XLSX
          </button>
        </div>

      </div>
    </div>
  `
})
export class ReportesComponent {
  private http = inject(HttpClient);

  loadingVentas  = signal(false);
  loadingPedidos = signal(false);
  errorMsg       = signal('');

  descargarVentas(): void {
    this.errorMsg.set('');
    this.loadingVentas.set(true);
    this.http.get(`${environment.apiReportes}/ventas/pdf`, { responseType: 'blob' })
      .subscribe({
        next: blob => { this.descargarBlob(blob, 'reporte-ventas.pdf'); this.loadingVentas.set(false); },
        error: ()  => {
          this.loadingVentas.set(false);
          this.errorMsg.set('No se pudo generar el reporte de ventas. Verifica que el servidor esté disponible.');
        }
      });
  }

  descargarPedidos(): void {
    this.errorMsg.set('');
    this.loadingPedidos.set(true);
    this.http.get(`${environment.apiReportes}/pedidos/pdf`, { responseType: 'blob' })
      .subscribe({
        next: blob => { this.descargarBlob(blob, 'reporte-pedidos.pdf'); this.loadingPedidos.set(false); },
        error: ()  => {
          this.loadingPedidos.set(false);
          this.errorMsg.set('No se pudo generar el reporte de pedidos. Verifica que el servidor esté disponible.');
        }
      });
  }

  exportarExcel(): void {
    import('xlsx').then(XLSX => {
      const data = [{ Producto: 'Ceviche', Cantidad: 10, Total: 'S/. 350.00' }];
      const ws   = XLSX.utils.json_to_sheet(data);
      const wb   = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
      XLSX.writeFile(wb, 'ventas.xlsx');
    });
  }

  private descargarBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
