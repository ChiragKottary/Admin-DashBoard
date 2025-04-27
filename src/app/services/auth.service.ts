import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthResponse {
  email: string;
  roles: string[];
  token: string;
  userId: string;
}

export interface User {
  email: string;
  roles: string[];
  token: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  
  private readonly AUTH_ENDPOINT = 'https://localhost:7042/api/Auth/login';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.AUTH_ENDPOINT, { email, password })
      .pipe(
        tap((response: AuthResponse) => {
          const user: User = {
            email: response.email,
            roles: response.roles,
            token: response.token,
            userId: response.userId
          };
          this.setUserData(user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  getUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.userId || null;
  }

  private setUserData(user: User): void {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem(this.USER_KEY);
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.userSubject.next(user);
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
        this.logout();
      }
    }
  }
}
