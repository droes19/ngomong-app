import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../database';

export const authGuard: CanActivateFn = async (_route, _state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  const userAsync = await userService.getAll();
  if (userAsync.length === 0) {
    router.navigate(['/auth']);
    return false;
  }

  return true;
};
