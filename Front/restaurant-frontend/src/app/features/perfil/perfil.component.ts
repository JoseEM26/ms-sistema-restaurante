import { Component, inject, computed } from '@angular/core';
import { AuthFacade } from '../auth/application/facades/auth.facade';

const ROLE_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string;
  gradient: string; icon: string; desc: string;
}> = {
  ADMIN:    { label: 'Administrador', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', gradient: 'linear-gradient(135deg,#f97316,#ea580c)', icon: '👑', desc: 'Acceso completo al sistema' },
  CAJERO:   { label: 'Cajero',        color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', icon: '💰', desc: 'Gestión de ventas y pagos' },
  MESERO:   { label: 'Mesero',        color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', icon: '🍽️', desc: 'Atención de mesas y pedidos' },
  COCINERO: { label: 'Cocinero',      color: '#ef4444', bg: '#fef2f2', border: '#fecaca', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', icon: '👨‍🍳', desc: 'Gestión de cocina y pedidos' },
};

const PERMISSIONS: Record<string, string[]> = {
  ADMIN:    ['Dashboard completo', 'Gestión de pedidos', 'Catálogo de productos', 'Control de mesas', 'Reportes PDF', 'Administración'],
  CAJERO:   ['Ver pedidos', 'Procesar pagos', 'Ver reportes básicos', 'Ver mesas'],
  MESERO:   ['Crear pedidos', 'Ver mesas', 'Cambiar estado de pedidos'],
  COCINERO: ['Ver pedidos en cocina', 'Marcar pedidos listos', 'Ver mesas'],
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [],
  styles: [`
    @keyframes fade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
    :host { display:block; padding:28px 20px; overflow-y:auto; height:100%; }
    .wrap { max-width:680px; margin:0 auto; animation:fade .35s ease forwards; }
    .dot-active { width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;animation:blink 2s infinite; }
    .info-row { display:flex;flex-direction:column;gap:2px; }
    .info-label { font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.07em;text-transform:uppercase; }
    .info-value { font-size:14px;font-weight:600;color:#1e293b; }
    .card { background:#fff;border-radius:16px;padding:22px;border:1px solid #f1f5f9;box-shadow:0 1px 6px rgba(0,0,0,.04); }
    .icon-box { width:34px;height:34px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .perm-chip { padding:5px 13px;border-radius:8px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px; }
    .logout-btn {
      width:100%;padding:14px;border:none;border-radius:12px;
      background:#fef2f2;color:#dc2626;font-size:14px;font-weight:700;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      gap:9px;transition:all .15s;font-family:inherit;
    }
    .logout-btn:hover { background:#fee2e2;transform:translateY(-1px); }
  `],
  template: `
    <div class="wrap">

      <!-- Hero card -->
      <div style="border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);margin-bottom:20px;background:#fff">

        <!-- Banner -->
        <div [style.background]="cfg().gradient"
             style="height:96px;position:relative;overflow:hidden">
          <div style="position:absolute;inset:0;opacity:.15;background-image:radial-gradient(circle,rgba(255,255,255,.5) 1px,transparent 1px);background-size:18px 18px"></div>
          <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.08)"></div>
          <div style="position:absolute;bottom:-20px;left:40%;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.06)"></div>
        </div>

        <!-- Info -->
        <div style="padding:0 28px 28px;position:relative">
          <div [style.background]="cfg().gradient"
               style="width:82px;height:82px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:-41px;border:4px solid #fff;box-shadow:0 6px 20px rgba(0,0,0,.14);font-size:26px;font-weight:900;color:#fff">
            {{ initials() }}
          </div>

          <div style="margin-top:14px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;letter-spacing:-.5px">
                {{ username() }}
              </h1>
              <span [style.background]="cfg().bg" [style.color]="cfg().color" [style.border-color]="cfg().border"
                    style="padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;border:1.5px solid;display:inline-flex;align-items:center;gap:6px">
                {{ cfg().icon }} {{ cfg().label }}
              </span>
              <p style="color:#94a3b8;font-size:13px;margin:10px 0 0">{{ cfg().desc }}</p>
            </div>
            <div style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:#f0fdf4;border:1px solid #bbf7d0">
              <span class="dot-active"></span>
              <span style="font-size:12px;font-weight:600;color:#16a34a">Sesión activa</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Info grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">

        <div class="card">
          <div style="display:flex;align-items:center;gap:9px;margin-bottom:18px">
            <div class="icon-box">
              <svg width="16" height="16" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <span style="font-size:13px;font-weight:700;color:#1e293b">Cuenta</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="info-row">
              <span class="info-label">Usuario</span>
              <span class="info-value" style="font-family:monospace">{{ username() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Rol</span>
              <span class="info-value" [style.color]="cfg().color">{{ cfg().label }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span style="font-size:13px;font-weight:600;color:#22c55e;display:flex;align-items:center;gap:6px">
                <span class="dot-active"></span> Activo
              </span>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;gap:9px;margin-bottom:18px">
            <div class="icon-box">
              <svg width="16" height="16" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <span style="font-size:13px;font-weight:700;color:#1e293b">Sistema</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="info-row">
              <span class="info-label">Aplicación</span>
              <span class="info-value">Restaurant Manager</span>
            </div>
            <div class="info-row">
              <span class="info-label">Versión</span>
              <span class="info-value">v2.0.0</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tecnología</span>
              <span class="info-value">Angular + Spring Boot</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Permisos -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:18px">
          <div class="icon-box" [style.background]="cfg().bg">
            <svg width="16" height="16" fill="none" [attr.stroke]="cfg().color" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span style="font-size:13px;font-weight:700;color:#1e293b">Permisos del rol</span>
          <span [style.background]="cfg().bg" [style.color]="cfg().color"
                style="margin-left:auto;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700">
            {{ cfg().label }}
          </span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          @for (p of perms(); track p) {
            <span class="perm-chip" [style.background]="cfg().bg" [style.color]="cfg().color">
              <svg width="11" height="11" fill="none" [attr.stroke]="cfg().color" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              {{ p }}
            </span>
          }
        </div>
      </div>

      <!-- Cerrar sesión -->
      <button class="logout-btn" (click)="auth.logout()">
        <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Cerrar sesión
      </button>

    </div>
  `
})
export class PerfilComponent {
  auth = inject(AuthFacade);

  username = () => this.auth.currentUser()?.username ?? '—';
  rol      = () => (this.auth.currentUser()?.rol ?? 'ADMIN') as string;
  initials = () => this.username().slice(0, 2).toUpperCase();

  cfg   = computed(() => ROLE_CONFIG[this.rol()]  ?? ROLE_CONFIG['ADMIN']);
  perms = computed(() => PERMISSIONS[this.rol()]  ?? []);
}
