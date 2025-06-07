import { Routes } from '@angular/router';
import { otpGuard } from '../core/guard/otp.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login.page').then(m => m.LoginPage)
  },
  {
    path: ':type/:value',
    loadComponent: () => import('./otp/otp.page').then(m => m.OtpPage),
    canActivate: [otpGuard]
  },
];
