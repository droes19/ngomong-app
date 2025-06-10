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
    loadChildren: () => import('./auth/auth.routes').then(m => m.routes)
  },
  {
    path: 'test',
    loadComponent: () => import('./test/test.page').then(m => m.TestPage)
  }
];
