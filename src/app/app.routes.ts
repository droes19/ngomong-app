import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    loadChildren: () => import('./home/home.routes').then((m) => m.routes),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'home/chats',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth.page').then(m => m.AuthPage)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.routes').then(m => m.routes)
  },
  {
    path: 'test',
    loadComponent: () => import('./test/test.page').then( m => m.TestPage)
  }
];
