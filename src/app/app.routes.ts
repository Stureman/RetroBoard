import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/verify',
    loadComponent: () => import('./components/auth-verify/auth-verify.component').then(m => m.AuthVerifyComponent)
  },
  {
    path: 'board/:code',
    loadComponent: () => import('./components/board/board.component').then(m => m.BoardComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
