import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'ventas/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'maestros',
    canActivate: [authGuard],
    loadChildren: () => import('./features/maestros/maestros.routes').then(m => m.MAESTROS_ROUTES)
  },
  {
    path: 'ventas',
    canActivate: [authGuard],
    loadChildren: () => import('./features/ventas/ventas.routes').then(m => m.VENTAS_ROUTES)
  },
  {
    path: 'reportes',
    canActivate: [authGuard],
    loadChildren: () => import('./features/reportes/reportes.routes').then(m => m.REPORTES_ROUTES)
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadChildren: () => import('./features/perfil/perfil.routes').then(m => m.PERFIL_ROUTES)
  },
  { path: '**', redirectTo: 'auth/login' }
];
