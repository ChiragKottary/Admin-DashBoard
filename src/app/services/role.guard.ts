import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // First check if user is logged in
    if (!this.authService.isLoggedIn()) {
      return this.router.createUrlTree(['/login']);
    }

    // Get required role from route data
    const requiredRole = route.data['role'] as string;
    
    // Check if user has the required role
    if (requiredRole && !this.authService.hasRole(requiredRole)) {
      // If user doesn't have the required role, redirect to dashboard
      return this.router.createUrlTree(['/dashboard']);
    }

    return true;
  }
}