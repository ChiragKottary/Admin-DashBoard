import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastNotificationsComponent } from '../components/notifications/toast-notifications.component';
import { ConfirmationDialogComponent } from "../components/confirmation-dialog/confirmation-dialog.component";
import { ProfileComponent } from "../components/profile/profile.component";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    ToastNotificationsComponent, 
    ConfirmationDialogComponent,
    ProfileComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  userName: string = '';
  userEmail: string = '';
  isAdmin: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userEmail = user.email;
        this.isAdmin = user.roles.includes('Admin');
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}
