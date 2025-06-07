import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';

export const otpGuard: CanActivateFn = (route, _state) => {
  const type = route.paramMap.get('type') || "";
  const value = route.paramMap.get('value') || "";
  const router = inject(Router);
  const authService = inject(AuthService);

  if (type !== 'email' || !value) {
    router.navigate(['/login']);
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) {
    router.navigate(['/login']);
    return false;
  }

  return authService.isAlreadyRequestOtp(type, value).pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
