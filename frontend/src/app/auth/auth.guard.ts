import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {

  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  let role: string | null = null;

  // Only access localStorage in browser
  if (isPlatformBrowser(platformId)) {
    role = localStorage.getItem('role');
  }

  if (!auth.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  const allowedRoles = route.data?.['roles'];

  if (allowedRoles && !allowedRoles.includes(role)) {

    if (role === 'Admin') {
      router.navigate(['/dashboard/admin']);
    }

    else if (role === 'Operator') {
      router.navigate(['/dashboard/operator']);
    }

    else if (role === 'Technician') {
      router.navigate(['/dashboard/technician']);
    }

    return false;
  }

  return true;
};