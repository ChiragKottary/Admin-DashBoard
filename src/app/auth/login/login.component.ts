import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading: boolean = false;
  loginError: string = '';
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    const { email, password } = this.loginForm.value;
    
    this.authService.login(email, password).subscribe({
      next: (response) => {
        // Successfully logged in
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        // Failed login
        this.isLoading = false;
        console.error('Login error:', error);
        this.loginError = error.error?.message || 'Invalid email or password. Please try again.';
      }
    });
  }
}
