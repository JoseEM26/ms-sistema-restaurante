import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthFacade } from '../../../application/facades/auth.facade';

const TEST_USERS = [
  { username: 'admin',    role: 'Admin',    icon: '👑', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { username: 'cajero',   role: 'Cajero',   icon: '💰', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { username: 'mesero',   role: 'Mesero',   icon: '🍽️', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  { username: 'cocinero', role: 'Cocinero', icon: '👨‍🍳', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
];

const FEATURES = [
  'Gestión de pedidos en tiempo real',
  'Control de mesas y disponibilidad',
  'Reportes PDF automáticos',
  'Roles y permisos personalizados',
];

const STATS = [
  { value: '4',    label: 'Roles de usuario' },
  { value: '∞',    label: 'Pedidos por día'  },
  { value: '24/7', label: 'Disponibilidad'   },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    @keyframes spin  { to { transform: rotate(360deg); } }
    @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
    @keyframes fade  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

    .float-logo { animation: float 4s ease-in-out infinite; }
    .fade-in    { animation: fade .4s ease forwards; }
    .spinner    { animation: spin .7s linear infinite; }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
      color: #9ca3af; pointer-events: none; display: flex;
    }
    .field {
      width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px;
      padding: 11px 14px 11px 40px; font-size: 14px; color: #1e293b;
      background: #f9fafb; outline: none; transition: all .2s;
      box-sizing: border-box; font-family: Inter, sans-serif;
    }
    .field:focus { border-color: #f97316; background: #fff; box-shadow: 0 0 0 3px rgba(249,115,22,.12); }

    .submit-btn {
      width: 100%; padding: 13px; border: none; border-radius: 11px;
      font-size: 14px; font-weight: 700; color: #fff; cursor: pointer;
      transition: all .15s; display: flex; align-items: center;
      justify-content: center; gap: 8px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      box-shadow: 0 4px 16px rgba(249,115,22,.38);
      font-family: Inter, sans-serif;
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(249,115,22,.48); }
    .submit-btn:active:not(:disabled) { transform: none; }
    .submit-btn:disabled { opacity: .55; cursor: not-allowed; box-shadow: none; }

    .user-chip {
      display: flex; align-items: center; gap: 9px;
      padding: 10px 12px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid; transition: all .15s;
      background: none; font-family: Inter, sans-serif; text-align: left;
    }
    .user-chip:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,.09); }

    .dot-blink { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: blink 2s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }
  `],
  template: `
<div style="display:flex;min-height:100vh;font-family:'Inter',sans-serif">

  <!-- ══════ LEFT PANEL — Brand ══════ -->
  <div class="hidden lg:flex"
    style="width:54%;flex-direction:column;justify-content:space-between;padding:52px 56px;position:relative;overflow:hidden;background:linear-gradient(150deg,#0c1628 0%,#1e293b 55%,#0f172a 100%)">

    <!-- Fondo decorativo -->
    <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden">
      <div style="position:absolute;top:-100px;right:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.13),transparent 65%)"></div>
      <div style="position:absolute;bottom:-80px;left:-80px;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.08),transparent 65%)"></div>
      <div style="position:absolute;top:30%;right:10%;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.05),transparent 65%)"></div>
      <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(249,115,22,.055) 1px,transparent 1px);background-size:30px 30px"></div>
    </div>

    <!-- Logo -->
    <div style="position:relative;display:flex;align-items:center;gap:13px">
      <div class="float-logo"
        style="width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f97316,#ea580c);box-shadow:0 8px 28px rgba(249,115,22,.42)">
        <svg width="24" height="24" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
        </svg>
      </div>
      <div>
        <p style="font-size:19px;font-weight:800;color:#fff;letter-spacing:-.4px;margin:0">Restaurant<span style="color:#f97316">.</span></p>
        <p style="font-size:9.5px;color:#475569;letter-spacing:.1em;margin:0;text-transform:uppercase">Management System</p>
      </div>
    </div>

    <!-- Centro: headline + features -->
    <div style="position:relative" class="fade-in">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:5px 15px;border-radius:999px;background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.28);margin-bottom:26px">
        <div style="width:6px;height:6px;border-radius:50%;background:#f97316;box-shadow:0 0 8px #f97316"></div>
        <span style="color:#fb923c;font-size:10.5px;font-weight:700;letter-spacing:.08em">SISTEMA DE GESTIÓN</span>
      </div>

      <h1 style="font-size:42px;font-weight:900;color:#fff;line-height:1.1;letter-spacing:-1.2px;margin:0 0 18px">
        Tu restaurante,<br>
        <span style="color:#f97316;text-shadow:0 0 40px rgba(249,115,22,.4)">sin caos.</span>
      </h1>

      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 38px;max-width:360px">
        Gestiona pedidos, mesas, productos y reportes desde un solo lugar. Rápido, simple y elegante.
      </p>

      <div style="display:flex;flex-direction:column;gap:11px">
        @for (f of features; track f) {
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:22px;height:22px;border-radius:50%;background:rgba(249,115,22,.14);border:1px solid rgba(249,115,22,.32);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="11" height="11" fill="none" stroke="#f97316" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span style="color:#94a3b8;font-size:13.5px">{{ f }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Stats bottom -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;position:relative">
      @for (s of stats; track s.label) {
        <div style="text-align:center;padding:18px 10px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);transition:all .2s"
             onmouseenter="this.style.background='rgba(249,115,22,.06)';this.style.borderColor='rgba(249,115,22,.2)'"
             onmouseleave="this.style.background='rgba(255,255,255,.04)';this.style.borderColor='rgba(255,255,255,.07)'">
          <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-.5px">{{ s.value }}</div>
          <div style="font-size:10.5px;color:#475569;margin-top:3px">{{ s.label }}</div>
        </div>
      }
    </div>
  </div>

  <!-- ══════ RIGHT PANEL — Form ══════ -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 28px;background:#fff;overflow-y:auto">

    <!-- Mobile logo -->
    <div class="lg:hidden" style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f97316,#ea580c);box-shadow:0 6px 18px rgba(249,115,22,.35)">
        <svg width="20" height="20" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
        </svg>
      </div>
      <p style="font-size:20px;font-weight:800;color:#0f172a;margin:0">Restaurant<span style="color:#f97316">.</span></p>
    </div>

    <div style="width:100%;max-width:400px" class="fade-in">

      <!-- Heading -->
      <div style="margin-bottom:32px">
        <h2 style="font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-.6px;margin:0 0 6px">Bienvenido 👋</h2>
        <p style="color:#94a3b8;font-size:14px;margin:0">Ingresa tus credenciales para continuar</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <!-- Usuario -->
        <div style="margin-bottom:18px">
          <label style="display:block;font-size:11px;font-weight:700;color:#374151;margin-bottom:7px;letter-spacing:.06em">USUARIO</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </span>
            <input class="field" formControlName="username" type="text"
              placeholder="Ej: admin" autocomplete="username" />
          </div>
        </div>

        <!-- Contraseña -->
        <div style="margin-bottom:26px">
          <label style="display:block;font-size:11px;font-weight:700;color:#374151;margin-bottom:7px;letter-spacing:.06em">CONTRASEÑA</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </span>
            <input class="field" formControlName="password" type="password"
              placeholder="••••••••••" autocomplete="current-password" />
          </div>
        </div>

        <!-- Error -->
        @if (error()) {
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;margin-bottom:18px;display:flex;align-items:center;gap:9px">
            <svg width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span style="color:#dc2626;font-size:13px">{{ error() }}</span>
          </div>
        }

        <!-- Botón -->
        <button class="submit-btn" type="submit" [disabled]="loading() || form.invalid">
          @if (loading()) {
            <div class="spinner" style="width:16px;height:16px;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%"></div>
            Verificando...
          } @else {
            <svg width="16" height="16" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            Ingresar al sistema
          }
        </button>

      </form>

      <!-- Divider usuarios -->
      <div style="display:flex;align-items:center;gap:12px;margin:28px 0 16px">
        <div style="flex:1;height:1px;background:#f1f5f9"></div>
        <span style="font-size:10.5px;font-weight:700;color:#cbd5e1;letter-spacing:.06em;white-space:nowrap">USUARIOS DE PRUEBA</span>
        <div style="flex:1;height:1px;background:#f1f5f9"></div>
      </div>

      <!-- Grid usuarios -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px">
        @for (u of testUsers; track u.username) {
          <button class="user-chip"
            [style.background]="u.bg"
            [style.border-color]="u.border"
            (click)="fillUser(u.username)">
            <span style="font-size:20px;line-height:1">{{ u.icon }}</span>
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:700" [style.color]="u.color">{{ u.role }}</div>
              <div style="font-size:11px;color:#94a3b8;font-family:monospace">{{ u.username }}</div>
            </div>
          </button>
        }
      </div>

      <!-- Contraseña hint -->
      <div style="text-align:center;padding:9px 14px;border-radius:9px;background:#f8fafc;border:1px solid #f1f5f9">
        <span style="font-size:12px;color:#94a3b8">Contraseña: </span>
        <code style="font-size:13px;font-weight:700;color:#f97316;background:#fff7ed;padding:2px 9px;border-radius:5px;border:1px solid #fed7aa">123456789</code>
      </div>

    </div>

    <!-- Footer -->
    <p style="margin-top:36px;font-size:11px;color:#e2e8f0;text-align:center">
      Restaurant Manager &copy; 2024 — Sistema de Gestión
    </p>
  </div>

</div>
  `
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private facade = inject(AuthFacade);

  loading   = this.facade.loading;
  error     = this.facade.error;
  testUsers = TEST_USERS;
  features  = FEATURES;
  stats     = STATS;

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  fillUser(username: string): void {
    this.form.patchValue({ username, password: '123456789' });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.facade.login({ username: v.username!, password: v.password! });
  }
}
