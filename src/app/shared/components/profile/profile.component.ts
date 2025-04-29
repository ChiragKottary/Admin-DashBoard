import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ClickOutsideDirective],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  isProfileDropdownOpen = false;
  user: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  closeDropdown(): void {
    this.isProfileDropdownOpen = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.isProfileDropdownOpen = false;
  }
  
  navigateToSettings(): void {
    this.router.navigate(['/profile/settings']);
    this.isProfileDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.isProfileDropdownOpen = false;
  }
}
