import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthFacade } from './features/auth/application/facades/auth.facade';

interface NavItem {
  path: string;
  label: string;
  icon: string;      // emoji de respaldo
  svgPath: string;   // path del SVG
  exact?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    :host {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--content-bg, #f8fafc);
    }

    /* ── Backdrop móvil ── */
    .backdrop {
      position: fixed; inset: 0;
      background: rgba(15,23,42,.45);
      backdrop-filter: blur(3px);
      z-index: 150;
      opacity: 0; pointer-events: none;
      transition: opacity .25s ease;
    }
    .backdrop.show { opacity: 1; pointer-events: all; }

    /* ══════════ SIDEBAR ══════════ */
    .sidebar {
      width: 260px;
      min-width: 260px;
      background: #fff;
      border-right: 1px solid #f0f2f5;
      box-shadow: 2px 0 16px rgba(0,0,0,.04);
      display: flex;
      flex-direction: column;
      height: 100vh;
      transition: width .25s cubic-bezier(.4,0,.2,1),
                  min-width .25s cubic-bezier(.4,0,.2,1);
      z-index: 200;
      overflow: hidden;
      flex-shrink: 0;
    }
    .sidebar.collapsed { width: 72px; min-width: 72px; }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed; left: 0; top: 0; bottom: 0;
        transform: translateX(-100%);
        box-shadow: none;
        width: 260px !important;
        min-width: 260px !important;
        transition: transform .25s cubic-bezier(.4,0,.2,1);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
        box-shadow: 8px 0 30px rgba(0,0,0,.12);
      }
    }

    /* ── Brand ── */
    .brand {
      height: 64px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
      border-bottom: 1px solid #f5f6f8;
      flex-shrink: 0;
    }

    .brand-icon {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(249,115,22,.35);
    }
    .brand-icon svg { width: 22px; height: 22px; }

    .brand-text {
      overflow: hidden;
      transition: opacity .2s ease, max-width .25s ease;
      max-width: 160px;
    }
    .brand-text h1 {
      font-size: 15px; font-weight: 800;
      color: #1e293b; margin: 0; line-height: 1.1;
      letter-spacing: -.3px;
    }
    .brand-text p {
      font-size: 10px; color: #94a3b8;
      margin: 2px 0 0; letter-spacing: .04em;
    }
    .sidebar.collapsed .brand-text { opacity: 0; max-width: 0; }

    /* ── Nav ── */
    .nav-scroll {
      flex: 1;
      overflow-y: auto; overflow-x: hidden;
      padding: 12px 8px;
    }

    .nav-group-label {
      font-size: 9.5px; font-weight: 700;
      letter-spacing: .1em; text-transform: uppercase;
      color: #c8d0dc;
      padding: 0 10px 6px;
      white-space: nowrap;
      transition: opacity .2s;
      margin-top: 8px;
    }
    .sidebar.collapsed .nav-group-label { opacity: 0; }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 8px 10px;
      border-radius: 10px;
      color: #64748b;
      font-size: 13.5px; font-weight: 500;
      text-decoration: none;
      transition: all .15s ease;
      margin-bottom: 2px;
      white-space: nowrap;
      position: relative;
      cursor: pointer;
    }
    .nav-item:hover { background: #fff7ed; color: #f97316; }

    .nav-item.active {
      background: linear-gradient(90deg,#fff7ed,rgba(249,115,22,.04));
      color: #f97316; font-weight: 600;
    }
    .nav-item.active::before {
      content: '';
      position: absolute; left: 0; top: 25%; bottom: 25%;
      width: 3px; border-radius: 0 3px 3px 0;
      background: #f97316;
    }

    /* Icono */
    .nav-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      background: #f1f5f9;
      transition: background .15s, color .15s;
    }
    .nav-icon svg { width: 17px; height: 17px; color: #94a3b8; transition: color .15s; }
    .nav-item:hover   .nav-icon { background: #ffedd5; }
    .nav-item:hover   .nav-icon svg { color: #f97316; }
    .nav-item.active  .nav-icon { background: #f97316; box-shadow: 0 3px 10px rgba(249,115,22,.35); }
    .nav-item.active  .nav-icon svg { color: #fff; }

    .nav-label-text {
      transition: opacity .2s ease, width .25s ease;
      overflow: hidden;
      white-space: nowrap;
    }
    .sidebar.collapsed .nav-label-text {
      opacity: 0;
      width: 0;
    }

    /* Estado colapsado: centro el icono */
    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 10px 0;
      gap: 0;
    }

    /* Tooltip colapsado */
    .sidebar.collapsed .nav-item:hover::after {
      content: attr(data-label);
      position: absolute;
      left: 68px;
      background: #1e293b;
      color: #fff;
      font-size: 12px; font-weight: 500;
      padding: 6px 12px;
      border-radius: 8px;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(0,0,0,.18);
      pointer-events: none;
      z-index: 9999;
    }

    .nav-divider { height: 1px; background: #f5f6f8; margin: 8px 8px; }

    /* Ocultar labels de grupo al colapsar */
    .sidebar.collapsed .nav-group-label {
      opacity: 0;
      height: 0;
      padding: 0;
      margin: 0;
      overflow: hidden;
    }

    /* ── Footer user ── */
    .sidebar-footer { padding: 10px 8px; border-top: 1px solid #f5f6f8; flex-shrink: 0; }

    .user-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #f1f3f5;
      overflow: hidden;
      transition: all .15s;
    }
    .user-row:hover { background: #fff7ed; border-color: #fed7aa; }

    .avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #fff; font-size: 13px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(249,115,22,.3);
    }

    .user-info {
      overflow: hidden; flex: 1;
      transition: opacity .2s ease, width .25s ease, max-width .25s ease;
      max-width: 200px;
    }
    .user-info strong { font-size: 13px; font-weight: 700; color: #1e293b; display: block; white-space: nowrap; }
    .user-info span   { font-size: 10.5px; color: #94a3b8; }
    .sidebar.collapsed .user-info { opacity: 0; max-width: 0; overflow: hidden; }
    .sidebar.collapsed .user-row  { justify-content: center; padding: 10px; }

    .logout-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 9px 10px;
      border-radius: 10px; background: none; border: none;
      cursor: pointer; color: #94a3b8;
      font-size: 13px; font-weight: 500;
      margin-top: 4px; transition: all .15s;
      white-space: nowrap; overflow: hidden;
    }
    .logout-btn:hover { background: #fef2f2; color: #ef4444; }
    .logout-btn span {
      transition: opacity .2s ease, width .25s ease;
      overflow: hidden; white-space: nowrap;
    }
    .sidebar.collapsed .logout-btn { justify-content: center; padding: 9px 0; }
    .sidebar.collapsed .logout-btn span { opacity: 0; width: 0; }

    /* ══════════ ÁREA PRINCIPAL ══════════ */
    .main {
      flex: 1;
      display: flex; flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Topbar ── */
    .topbar {
      height: 64px;
      background: #fff;
      border-bottom: 1px solid #f0f2f5;
      display: flex; align-items: center; gap: 12px;
      padding: 0 20px;
      flex-shrink: 0;
      box-shadow: 0 1px 0 #f0f2f5;
    }

    /* Botón colapsar — dentro del topbar */
    .collapse-btn {
      width: 36px; height: 36px;
      border-radius: 9px;
      background: #f8fafc;
      border: 1px solid #e8ecf0;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #64748b;
      flex-shrink: 0;
      transition: all .15s;
    }
    .collapse-btn:hover { background: #fff7ed; color: #f97316; border-color: #fed7aa; }
    .collapse-btn svg { width: 16px; height: 16px; transition: transform .25s ease; }
    .collapse-btn.rotated svg { transform: rotate(180deg); }
    @media (max-width: 768px) { .collapse-btn { display: none; } }

    /* Hamburger — solo mobile */
    .hamburger {
      width: 36px; height: 36px;
      border-radius: 9px; background: #f8fafc;
      border: 1px solid #e8ecf0;
      display: none; align-items: center; justify-content: center;
      cursor: pointer; color: #64748b; flex-shrink: 0;
      transition: all .15s;
    }
    .hamburger:hover { background: #fff7ed; color: #f97316; }
    @media (max-width: 768px) { .hamburger { display: flex; } }

    .topbar-title {
      flex: 1;
      font-size: 15px; font-weight: 700; color: #1e293b;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .status-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 999px;
      font-size: 11.5px; font-weight: 500; color: #16a34a;
      flex-shrink: 0;
    }
    .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22c55e;
      animation: blink 2s infinite;
    }
    @keyframes blink {
      0%,100% { opacity: 1; } 50% { opacity: .4; }
    }

    /* ── Contenido ── */
    .content { flex: 1; overflow-y: auto; overflow-x: hidden; }

    /* ── Auth ── */
    .auth-wrap {
      width: 100%; height: 100vh; overflow: auto;
      background: linear-gradient(135deg, #fff7ed 0%, #fff 50%);
    }

    /* Scrollbar */
    .nav-scroll::-webkit-scrollbar { width: 3px; }
    .nav-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 999px; }
  `],
  template: `
    @if (auth.isAuthenticated()) {

      <!-- Backdrop móvil -->
      <div class="backdrop" [class.show]="mobileOpen()" (click)="mobileOpen.set(false)"></div>

      <!-- SIDEBAR -->
      <aside class="sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">

        <!-- Brand -->
        <div class="brand">
          <div class="brand-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
          </div>
          <div class="brand-text">
            <h1>Restaurant</h1>
            <p>Management System</p>
          </div>
        </div>

        <!-- Nav principal -->
        <nav class="nav-scroll">

          <p class="nav-group-label">Principal</p>
          @for (item of mainNav; track item.path) {
            <a class="nav-item" [attr.data-label]="item.label"
               [routerLink]="item.path"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: item.exact ?? false}"
               (click)="mobileOpen.set(false)">
              <span class="nav-icon" [innerHTML]="safeIcon(item.svgPath)"></span>
              <span class="nav-label-text">{{ item.label }}</span>
            </a>
          }

          <div class="nav-divider"></div>
          <p class="nav-group-label">Catálogos</p>
          @for (item of catalogNav; track item.path) {
            <a class="nav-item" [attr.data-label]="item.label"
               [routerLink]="item.path"
               routerLinkActive="active"
               (click)="mobileOpen.set(false)">
              <span class="nav-icon" [innerHTML]="safeIcon(item.svgPath)"></span>
              <span class="nav-label-text">{{ item.label }}</span>
            </a>
          }

          <div class="nav-divider"></div>
          <p class="nav-group-label">Reportes</p>
          @for (item of reportNav; track item.path) {
            <a class="nav-item" [attr.data-label]="item.label"
               [routerLink]="item.path"
               routerLinkActive="active"
               (click)="mobileOpen.set(false)">
              <span class="nav-icon" [innerHTML]="safeIcon(item.svgPath)"></span>
              <span class="nav-label-text">{{ item.label }}</span>
            </a>
          }

        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
          <div class="user-row">
            <div class="avatar">{{ initials() }}</div>
            <div class="user-info">
              <strong>{{ auth.currentUser()?.username }}</strong>
              <span>{{ auth.currentUser()?.rol }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="auth.logout()">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>

      </aside>

      <!-- ÁREA PRINCIPAL -->
      <div class="main">

        <!-- Topbar -->
        <header class="topbar">

          <!-- Colapsar sidebar (desktop) -->
          <button class="collapse-btn" [class.rotated]="collapsed()"
                  (click)="collapsed.set(!collapsed())"
                  [title]="collapsed() ? 'Expandir' : 'Colapsar'">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>

          <!-- Hamburger (mobile) -->
          <button class="hamburger" (click)="mobileOpen.set(!mobileOpen())">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <span class="topbar-title">🍽️ Restaurant Manager</span>

          <div class="status-chip">
            <div class="dot"></div>
            En línea
          </div>
        </header>

        <!-- Contenido de las páginas -->
        <div class="content">
          <router-outlet />
        </div>

      </div>

    } @else {
      <div class="auth-wrap">
        <router-outlet />
      </div>
    }
  `
})
export class AppComponent {
  auth      = inject(AuthFacade);
  sanitizer = inject(DomSanitizer);

  collapsed  = signal(false);
  mobileOpen = signal(false);

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) this.mobileOpen.set(false);
  }

  initials = () => (this.auth.currentUser()?.username ?? '?').slice(0, 2).toUpperCase();

  // Sanitiza el SVG para que Angular no lo elimine
  safeIcon(svgPath: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        ${svgPath}
      </svg>`
    );
  }

  mainNav: NavItem[] = [
    {
      path: '/ventas/dashboard', label: 'Dashboard', icon: '🏠', exact: true,
      svgPath: `<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`
    },
    {
      path: '/ventas/pedidos', label: 'Pedidos', icon: '🧾',
      svgPath: `<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>`
    }
  ];

  catalogNav: NavItem[] = [
    {
      path: '/maestros/mesas', label: 'Mesas', icon: '🪑',
      svgPath: `<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>`
    },
    {
      path: '/maestros/productos', label: 'Productos', icon: '🍽️',
      svgPath: `<path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>`
    }
  ];

  reportNav: NavItem[] = [
    {
      path: '/reportes', label: 'Reportes PDF', icon: '📊',
      svgPath: `<path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`
    }
  ];
}
