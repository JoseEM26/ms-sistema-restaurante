import { Component, OnInit, inject, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { VentasFacade } from '../../../application/facades/ventas.facade';
import { MaestrosFacade } from '../../../../maestros/application/facades/maestros.facade';
import { KpiCardComponent } from '../../../../../shared/components/ui/kpi-card/kpi-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, BaseChartDirective, KpiCardComponent],
  styles: [`:host { display:block; height:100%; overflow-y:auto; background:#f8fafc; }`],
  template: `
      <div style="padding:24px;display:flex;flex-direction:column;gap:24px">

        <!-- Saludo -->
        <div>
          <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 4px">Buenas, {{ saludo() }} 👋</h1>
          <p style="font-size:14px;color:#64748b;margin:0;text-transform:capitalize">{{ hoy }}</p>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <app-kpi-card icon="🧾" label="Pedidos totales"
            [value]="ventasFacade.pedidos().length" bg="#fff7ed" />
          <app-kpi-card icon="⏳" label="Pedidos abiertos"
            [value]="ventasFacade.pedidosAbiertos().length" bg="#fef3c7" />
          <app-kpi-card icon="💰" label="Ingresos (cerrados)"
            prefix="S/." [value]="(ventasFacade.totalIngresos() | number:'1.2-2') ?? '0.00'" bg="#f0fdf4" />
          <app-kpi-card icon="🪑" label="Mesas libres"
            [value]="maestrosFacade.mesasLibres().length" bg="#eff6ff" />
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div class="card">
            <h3 class="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span class="text-lg">📊</span> Pedidos por estado
            </h3>
            <canvas baseChart
              [data]="doughnutData" [options]="doughnutOptions"
              type="doughnut" style="max-height:260px"></canvas>
          </div>

          <div class="card">
            <h3 class="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span class="text-lg">📈</span> Ingresos últimos 7 días
            </h3>
            <canvas baseChart
              [data]="barData" [options]="barOptions"
              type="bar" style="max-height:260px"></canvas>
          </div>

        </div>

        <!-- Estado mesas rápido -->
        <div class="card">
          <h3 class="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span class="text-lg">🪑</span> Estado de mesas
          </h3>
          <div class="flex flex-wrap gap-3">
            @for (mesa of maestrosFacade.mesas(); track mesa.id) {
              <div class="flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all cursor-pointer min-w-[72px]"
                   [class]="mesaClass(mesa.estado)">
                <span class="text-xl">🪑</span>
                <span class="text-xs font-bold mt-1">{{ mesa.numero }}</span>
                <span class="text-[10px] mt-0.5 opacity-70">{{ mesa.estado }}</span>
              </div>
            }
            @if (!maestrosFacade.mesas().length) {
              <p class="text-sm text-slate-400">Sin mesas registradas</p>
            }
          </div>
        </div>

      </div>
  `
})
export class DashboardComponent implements OnInit {
  ventasFacade   = inject(VentasFacade);
  maestrosFacade = inject(MaestrosFacade);

  hoy    = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });
  saludo = () => {
    const h = new Date().getHours();
    return h < 12 ? 'buenos días' : h < 18 ? 'buenas tardes' : 'buenas noches';
  };

  doughnutData: ChartData<'doughnut'> = {
    labels: ['Abierto', 'En proceso', 'Listo', 'Cerrado', 'Cancelado'],
    datasets: [{ data: [0,0,0,0,0],
      backgroundColor: ['#f97316','#3b82f6','#22c55e','#1e293b','#ef4444'],
      borderWidth: 3, borderColor: '#fff', hoverOffset: 6 }]
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } }
  };

  barData: ChartData<'bar'> = {
    labels: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
    datasets: [{ label: 'Ingresos S/.',
      data: [420,380,510,290,640,820,730],
      backgroundColor: '#f97316', borderRadius: 8, borderSkipped: false }]
  };

  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
  };

  constructor() {
    effect(() => {
      const pedidos = this.ventasFacade.pedidos();
      const estados = ['ABIERTO','EN_PROCESO','LISTO','CERRADO','CANCELADO'];
      this.doughnutData = { ...this.doughnutData,
        datasets: [{ ...this.doughnutData.datasets[0],
          data: estados.map(e => pedidos.filter(p => p.estado === e).length) }] };
    });
  }

  ngOnInit(): void {
    this.ventasFacade.loadPedidos();
    this.maestrosFacade.loadMesas();
  }

  mesaClass(estado: string): string {
    return {
      LIBRE:     'border-green-400  bg-green-50  text-green-700',
      OCUPADA:   'border-red-400    bg-red-50    text-red-700',
      RESERVADA: 'border-amber-400  bg-amber-50  text-amber-700'
    }[estado] ?? 'border-slate-200 bg-slate-50 text-slate-600';
  }
}
