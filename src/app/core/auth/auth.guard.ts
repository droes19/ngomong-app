import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const isAuthenticated = await authService.checkAuthentication();
  
  if (!isAuthenticated) {
    router.navigate(['/auth']);
    return false;
  }
  
  return true;
};
