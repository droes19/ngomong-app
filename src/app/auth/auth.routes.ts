import { Routes } from '@angular/router';
import { otpGuard } from '../core/guard/otp.guard';
import { authGuard } from '../core/guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth.page').then(m => m.AuthPage)
  },
  {
    path: ':type/:value',
    loadComponent: () => import('./otp/otp.page').then(m => m.OtpPage),
    canActivate: [otpGuard]
  },
  {
    path: 'user',
    loadComponent: () => import('./user-auth/user-auth.page').then(m => m.UserAuthPage),
    canActivate: [authGuard]
  },
];
